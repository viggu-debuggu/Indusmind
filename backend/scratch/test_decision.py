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

# Test List Decision Recommendations
print('\n=== DECISION RECOMMENDATIONS LIST ===')
r = httpx.get(f'{base}/api/decision-recommendations', headers=headers)
print(f'List Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Recommendations count: {len(items)}')
    for item in items:
        print(f'- {item["title"]} | Priority: {item["priority"]} | Risk: {item["risk_score"]}% | Fail Prob: {item["failure_probability"]}% | Conf: {item["confidence_score"]}%')
        print(f'  Status: {item["status"]} | Cost: ${item["estimated_cost"]} | Downtime: {item["estimated_downtime"]} hrs')
        for ev in item["evidence"]:
            print(f'    * Evidence [{ev["evidence_type"]}] {ev["source_name"]}: {ev["summary"]}')
else:
    print(r.text)

# Test Stats
print('\n=== DECISION RECOMMENDATIONS STATS ===')
r = httpx.get(f'{base}/api/decision-recommendations/stats', headers=headers)
print(f'Stats Status: {r.status_code}')
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print(r.text)

# Test Copilot Chat Intercept
print('\n=== COPILOT INTERCEPT: What should I do next? ===')
r = httpx.post(f'{base}/api/ai/ask', headers=headers, json={'question': 'What should I do next?'})
print(f'Copilot Intercept Status: {r.status_code}')
if r.status_code == 200:
    print(r.json()["answer"])
else:
    print(r.text)

# Test Copilot Chat Intercept: Highest business risk
print('\n=== COPILOT INTERCEPT: What equipment has highest business risk? ===')
r = httpx.post(f'{base}/api/ai/ask', headers=headers, json={'question': 'What equipment has highest business risk?'})
print(f'Copilot Intercept Status: {r.status_code}')
if r.status_code == 200:
    print(r.json()["answer"])
else:
    print(r.text)
