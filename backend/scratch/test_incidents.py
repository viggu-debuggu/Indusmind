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

# Test Incidents List
print('\n=== INCIDENTS LIST ===')
r = httpx.get(f'{base}/api/incidents', headers=headers)
print(f'List Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Incidents count: {len(items)}')
    for item in items:
        print(f'- [{item["severity"]}] {item["incident_name"]} ({item["category"]}) - Status: {item["status"]}')
else:
    print(r.text)

# Test Incidents Stats
print('\n=== INCIDENTS STATS ===')
r = httpx.get(f'{base}/api/incidents/stats', headers=headers)
print(f'Stats Status: {r.status_code}')
if r.status_code == 200:
    print(r.json())
else:
    print(r.text)
