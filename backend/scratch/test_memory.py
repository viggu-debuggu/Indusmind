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

# Test List Expert Knowledge
print('\n=== TRIBAL KNOWLEDGE LIST ===')
r = httpx.get(f'{base}/api/expert-knowledge', headers=headers)
print(f'List Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Entries count: {len(items)}')
    for item in items:
        print(f'- {item["title"]} | Category: {item["category"]} | Author: {item["author"]} | Conf: {item["confidence_score"]}% | Status: {item["verification_status"]}')
        print(f'  AI Keywords: {item["ai_keywords"]}')
        print(f'  AI Entities: {item["ai_entities"]}')
else:
    print(r.text)

# Test Stats
print('\n=== TRIBAL KNOWLEDGE STATS ===')
r = httpx.get(f'{base}/api/expert-knowledge/stats', headers=headers)
print(f'Stats Status: {r.status_code}')
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print(r.text)

# Test single recommendations
if r.status_code == 200 and len(items) > 0:
    first_uuid = items[0]["uuid"]
    print(f'\n=== AI RECOMMENDATIONS FOR UUID: {first_uuid} ===')
    r = httpx.get(f'{base}/api/expert-knowledge/{first_uuid}/recommendations', headers=headers)
    print(f'Recommendations Status: {r.status_code}')
    if r.status_code == 200:
        print(json.dumps(r.json(), indent=2))
    else:
        print(r.text)
