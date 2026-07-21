import sys, json, httpx
sys.stdout.reconfigure(encoding='utf-8')

base = 'http://localhost:8000'

# Login
r = httpx.post(f'{base}/api/auth/login',
    json={'email': 'admin@indusmind.com', 'password': 'Admin@2024!'},
    timeout=10)
data = r.json()
token = data.get('accessToken', '')
headers = {'Authorization': f'Bearer {token}'}
print(f'Login: {r.status_code} | Token: {bool(token)}')

# Test Audit Logs List
print('\n=== AUDIT LOGS ===')
r = httpx.get(f'{base}/api/audit/logs', headers=headers)
print(f'Audit Logs Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Logs count: {len(items)}')
    for item in items[:10]:
        print(f'- [{item["created_at"]}] Action: {item["action"]} | User: {item["user"]["email"] if item["user"] else "System"} | Type: {item["resource_type"]} | ID: {item["resource_id"]}')
else:
    print(r.text)
