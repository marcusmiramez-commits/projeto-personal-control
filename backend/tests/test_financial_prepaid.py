"""
Testa o cálculo de "valor a pagar" (expected_amount) do relatório financeiro
para alunos pré-pagos, conforme regra:
- saldo > 0  -> expected_amount = 0
- saldo <= 0 -> expected_amount = (nº de presenças no mês) × class_value

Uso: python backend/tests/test_financial_prepaid.py
"""
import os
import uuid
import requests
from dotenv import load_dotenv

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE, ".env"))
with open(os.path.join(BASE, "..", "frontend", ".env")) as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.strip().split("=", 1)[1]
API = f"{BACKEND_URL}/api"
MONTH = "2026-09"


def make_student(H, balance):
    r = requests.post(f"{API}/students", headers=H, json={
        "name": f"Prepago {uuid.uuid4().hex[:5]}", "phone": "11999990000",
        "contract_type": "prepaid", "class_value": 50.0, "class_balance": balance
    }, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def mark(H, sid, n):
    for i in range(n):
        d = f"{MONTH}-{str(i + 1).zfill(2)}"
        requests.post(f"{API}/attendance", headers=H, json={"student_id": sid, "date": d, "present": True}, timeout=30)


def main():
    email = f"fintest_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register/professional", json={
        "name": "Fin Test", "email": email, "password": "mudar123", "phone": "11999999999"
    }, timeout=30)
    assert r.status_code == 200, r.text
    H = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Caso positivo: saldo 10, 3 presenças -> saldo 7 (>0) -> expected 0
    s_pos = make_student(H, 10); mark(H, s_pos, 3)
    # Caso zero: saldo 8, 8 presenças -> saldo 0 -> expected 8*50 = 400
    s_zero = make_student(H, 8); mark(H, s_zero, 8)
    # Caso negativo: saldo 0, 5 presenças -> saldo -5 -> expected 5*50 = 250
    s_neg = make_student(H, 0); mark(H, s_neg, 5)

    rep = requests.get(f"{API}/financial/report?month={MONTH}", headers=H, timeout=30).json()
    by_id = {s["student_id"]: s for s in rep["students"]}

    checks = [
        ("saldo positivo -> expected 0", by_id[s_pos]["expected_amount"], 0),
        ("saldo zero (8 presencas) -> expected 400", by_id[s_zero]["expected_amount"], 400),
        ("saldo negativo (5 presencas) -> expected 250", by_id[s_neg]["expected_amount"], 250),
    ]

    print("\n===== RESULTADO FINANCEIRO PRE-PAGO =====")
    all_ok = True
    for name, got, exp in checks:
        ok = float(got) == float(exp)
        print(f"  {'PASS' if ok else 'FAIL'} - {name} (got={got}, exp={exp})")
        all_ok = all_ok and ok

    # cleanup
    for sid in (s_pos, s_zero, s_neg):
        requests.delete(f"{API}/students/{sid}", headers=H, timeout=30)

    assert all_ok, "Algum teste financeiro pré-pago falhou"
    print("TODOS OS TESTES FINANCEIROS PASSARAM ✅")


if __name__ == "__main__":
    main()
