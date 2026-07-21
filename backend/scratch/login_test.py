import sys, httpx, json
sys.stdout.reconfigure(encoding='utf-8')

r = httpx.post(
    'http://localhost:8000/api/auth/login',
    json={'email': 'admin@indusmind.com', 'password': 'Admin@2024!'},
    timeout=10
)
print(f'Status: {r.status_code}')
data = r.json()
print(f'Keys: {list(data.keys())}')
print(f'Response: {json.dumps(data, indent=2)[:500]}')
