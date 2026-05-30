"""
Teste end-to-end do webhook do Stripe (modo de teste).

Cria um profissional fake no Mongo + um customer/subscription reais no Stripe
(test mode) e simula os eventos enviados pelo Stripe contra o endpoint
/api/webhook/stripe do preview, validando se o status no banco é atualizado.

Uso: python -m pytest backend/tests/test_stripe_webhook.py -s
ou:   python backend/tests/test_stripe_webhook.py
"""
import os
import sys
import asyncio
import uuid
import json
import requests
import stripe
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
PRICE_MONTHLY = os.environ["STRIPE_PRICE_ID_MONTHLY"]

# URL externa do backend (preview)
with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "frontend", ".env")) as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.strip().split("=", 1)[1]
WEBHOOK_URL = f"{BACKEND_URL}/api/webhook/stripe"

mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo[os.environ["DB_NAME"]]


def post_event(etype, obj):
    payload = {"type": etype, "data": {"object": obj}}
    r = requests.post(WEBHOOK_URL, data=json.dumps(payload, default=str),
                      headers={"Content-Type": "application/json"}, timeout=30)
    print(f"  POST {etype} -> {r.status_code} {r.text}")
    return r


async def get_prof(prof_id):
    return await db.professionals.find_one({"id": prof_id}, {"_id": 0})


async def main():
    prof_id = f"test-{uuid.uuid4()}"
    email = f"webhook_{uuid.uuid4().hex[:8]}@example.com"
    print(f"BACKEND: {BACKEND_URL}")
    print(f"Criando profissional de teste {prof_id} ({email}) com status=pending")
    await db.professionals.insert_one({
        "id": prof_id, "name": "Teste Webhook", "email": email,
        "password_hash": "x", "type": "professional", "role": "user",
        "status": "pending", "subscription_status": None,
    })

    cust = stripe.Customer.create(email=email, name="Teste Webhook",
                                  metadata={"professional_id": prof_id})
    sub = stripe.Subscription.create(
        customer=cust.id, items=[{"price": PRICE_MONTHLY}],
        trial_period_days=31,
        metadata={"professional_id": prof_id, "plan": "monthly"},
    )
    sub_d = sub.to_dict()
    print(f"Stripe customer={cust.id} sub={sub.id} status={sub_d['status']}")

    results = []

    # 1) checkout.session.completed (trial -> trialing)
    print("\n[1] checkout.session.completed")
    post_event("checkout.session.completed", {
        "id": "cs_test_123", "customer": cust.id, "subscription": sub.id,
        "client_reference_id": prof_id,
        "metadata": {"professional_id": prof_id, "plan": "monthly"},
    })
    await asyncio.sleep(1)
    p = await get_prof(prof_id)
    ok = p.get("status") == "active" and p.get("subscription_status") == "trialing" \
        and p.get("stripe_customer_id") == cust.id and p.get("subscription_plan") == "monthly" \
        and p.get("current_period_end")
    print(f"  DB -> status={p.get('status')} sub_status={p.get('subscription_status')} "
          f"plan={p.get('subscription_plan')} cpe={p.get('current_period_end')} customer={p.get('stripe_customer_id')}")
    results.append(("checkout.session.completed -> active/trialing", ok))

    # 2) customer.subscription.updated simulando trial->active
    print("\n[2] customer.subscription.updated (active)")
    active_obj = dict(sub_d)
    active_obj["status"] = "active"
    post_event("customer.subscription.updated", active_obj)
    await asyncio.sleep(1)
    p = await get_prof(prof_id)
    ok2 = p.get("status") == "active" and p.get("subscription_status") == "active"
    print(f"  DB -> status={p.get('status')} sub_status={p.get('subscription_status')}")
    results.append(("subscription.updated -> active", ok2))

    # 3) invoice.payment_failed -> blocked
    print("\n[3] invoice.payment_failed")
    post_event("invoice.payment_failed", {"customer": cust.id, "metadata": {"professional_id": prof_id}})
    await asyncio.sleep(1)
    p = await get_prof(prof_id)
    ok3 = p.get("status") == "blocked" and p.get("subscription_status") == "past_due"
    print(f"  DB -> status={p.get('status')} sub_status={p.get('subscription_status')}")
    results.append(("invoice.payment_failed -> blocked", ok3))

    # 4) customer.subscription.deleted -> suspended
    print("\n[4] customer.subscription.deleted (canceled)")
    canceled_obj = dict(sub_d)
    canceled_obj["status"] = "canceled"
    post_event("customer.subscription.deleted", canceled_obj)
    await asyncio.sleep(1)
    p = await get_prof(prof_id)
    ok4 = p.get("status") == "suspended" and p.get("subscription_status") == "canceled"
    print(f"  DB -> status={p.get('status')} sub_status={p.get('subscription_status')}")
    results.append(("subscription.deleted -> suspended", ok4))

    # cleanup
    print("\nLimpando...")
    try:
        stripe.Subscription.cancel(sub.id)
    except Exception:
        pass
    stripe.Customer.delete(cust.id)
    await db.professionals.delete_one({"id": prof_id})

    print("\n===== RESULTADO =====")
    all_ok = True
    for name, ok in results:
        print(f"  {'PASS' if ok else 'FAIL'} - {name}")
        all_ok = all_ok and ok
    print("=====================")
    assert all_ok, "Algum teste do webhook falhou"
    print("TODOS OS TESTES PASSARAM ✅")


if __name__ == "__main__":
    asyncio.run(main())
