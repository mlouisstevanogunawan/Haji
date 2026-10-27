import hashlib, json, re, sys, urllib.request, urllib.error

SK = re.search(r"^MIDTRANS_SERVER_KEY=(.+)$", open(".env.local").read(), re.M).group(1).strip()
BASE = "http://localhost:3111/api/midtrans/webhook"


def sign(order_id, status_code, gross):
    return hashlib.sha512(f"{order_id}{status_code}{gross}{SK}".encode()).hexdigest()


def post(body, tag):
    req = urllib.request.Request(
        BASE,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            code, out = r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        code, out = e.code, json.loads(e.read())
    print(f"--- {tag}: HTTP {code}")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return code, out


case = sys.argv[1]

if case == "missing":
    post({"order_id": "TEST-NOFIELDS"}, "payload tanpa field wajib")
elif case == "badsig":
    o, g = "TEST-BADSIG-001", "50000"
    post({"order_id": o, "status_code": "200", "gross_amount": g,
          "transaction_status": "settlement", "payment_type": "gopay",
          "transaction_id": "t-badsig", "signature_key": "deadbeef"}, "signature salah")
elif case == "nosig":
    post({"order_id": "TEST-NOSIG-001", "status_code": "200", "gross_amount": "50000",
          "transaction_status": "settlement", "payment_type": "gopay",
          "transaction_id": "t-nosig"}, "tanpa signature_key")
elif case == "pending-orphan":
    o, g = "INV-TIDAKADA-9999-TX000001", "1000000"
    post({"order_id": o, "status_code": "201", "gross_amount": g, "fraud_status": "accept",
          "transaction_status": "pending", "payment_type": "gopay",
          "transaction_id": "smoke-pending-orphan",
          "signature_key": sign(o, "201", g)}, "pending, invoice tidak ada")
elif case == "settle":
    inv, gross, seq = sys.argv[2], sys.argv[3], sys.argv[4]
    o = f"{inv}-TX{seq}"
    post({"order_id": o, "status_code": "200", "gross_amount": gross,
          "fraud_status": "accept", "transaction_status": "settlement",
          "payment_type": "gopay", "transaction_id": f"smoke-settle-{seq}",
          "signature_key": sign(o, "200", gross)}, f"settlement {inv} gross={gross}")
elif case == "capture-challenge":
    inv, gross, seq = sys.argv[2], sys.argv[3], sys.argv[4]
    o = f"{inv}-TX{seq}"
    post({"order_id": o, "status_code": "200", "gross_amount": gross,
          "fraud_status": "challenge", "transaction_status": "capture",
          "payment_type": "credit_card", "transaction_id": f"smoke-capture-{seq}",
          "signature_key": sign(o, "200", gross)}, f"capture+challenge {inv}")
