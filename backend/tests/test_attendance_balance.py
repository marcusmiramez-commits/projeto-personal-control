"""
Testa o débito/estorno do saldo de aulas (class_balance) de alunos pré-pagos
ao marcar/desmarcar presença, via API real (preview).

Uso: python backend/tests/test_attendance_balance.py
"""
import os
import sys
import asyncio
import uuid
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE, ".env"))

with open(os.path.join(BASE, "..", "frontend", ".env")) as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.strip().split("=", 1)[1]
API = f"{BACKEND_URL}/api"

mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo[os.environ["DB_NAME"]]


async def get_balance(student_id):
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    return s.get("class_balance")


async def main():
    # cria profissional + token
    email = f"baltest_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register/professional", json={
        "name": "Bal Test", "email": email, "password": "mudar123", "phone": "11999999999"
    }, timeout=30)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    H = {"Authorization": f"Bearer {token}"}

    # cria aluno pré-pago com saldo 2
    r = requests.post(f"{API}/students", headers=H, json={
        "name": "Aluno Prepago", "phone": "11988887777",
        "contract_type": "prepaid", "class_value": 50.0, "class_balance": 2
    }, timeout=30)
    assert r.status_code in (200, 201), r.text
    sid = r.json()["id"]
    print(f"Aluno {sid} saldo inicial=", await get_balance(sid))

    results = []
    d1 = "2026-02-10"
    d2 = "2026-02-11"
    d3 = "2026-02-12"

    # 1) marca presença d1 -> debita (2 -> 1)
    requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d1, "present": True}, timeout=30)
    b = await get_balance(sid); results.append(("presente d1 -> 1", b == 1)); print("  presente d1 ->", b)

    # 2) converte d1 em ausência -> estorna (1 -> 2)
    requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d1, "present": False}, timeout=30)
    b = await get_balance(sid); results.append(("ausente d1 (estorno) -> 2", b == 2)); print("  ausente d1 ->", b)

    # 3) volta a presente d1 -> debita (2 -> 1)
    requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d1, "present": True}, timeout=30)
    b = await get_balance(sid); results.append(("presente d1 de novo -> 1", b == 1)); print("  presente d1 again ->", b)

    # 4) presença d2 -> (1 -> 0)
    requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d2, "present": True}, timeout=30)
    b = await get_balance(sid); results.append(("presente d2 -> 0", b == 0)); print("  presente d2 ->", b)

    # 5) presença d3 com saldo 0 -> pode ficar negativo (0 -> -1)
    requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d3, "present": True}, timeout=30)
    b = await get_balance(sid); results.append(("presente d3 -> -1 (negativo)", b == -1)); print("  presente d3 ->", b)

    # 6) exclui presença d3 -> estorna (-1 -> 0)
    requests.delete(f"{API}/attendance/{sid}/{d3}", headers=H, timeout=30)
    b = await get_balance(sid); results.append(("delete d3 (estorno) -> 0", b == 0)); print("  delete d3 ->", b)

    # cleanup
    requests.delete(f"{API}/students/{sid}", headers=H, timeout=30)
    await db.professionals.delete_one({"email": email})
    await db.attendances.delete_many({"student_id": sid})

    print("\n===== RESULTADO =====")
    all_ok = True
    for name, ok in results:
        print(f"  {'PASS' if ok else 'FAIL'} - {name}")
        all_ok = all_ok and ok
    assert all_ok, "Algum teste de saldo falhou"
    print("TODOS OS TESTES DE SALDO PASSARAM ✅")


if __name__ == "__main__":
    asyncio.run(main())
