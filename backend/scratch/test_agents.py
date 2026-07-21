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

# Test List Stats
print('\n=== AGENT CENTER STATS ===')
r = httpx.get(f'{base}/api/agents/stats', headers=headers)
print(f'Stats Status: {r.status_code}')
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print(r.text)

# Test Timeline activity
print('\n=== AGENT TIMELINE ACTIVITY ===')
r = httpx.get(f'{base}/api/agents/activity', headers=headers)
print(f'Activity Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Activity logs count: {len(items)}')
    for item in items:
        print(f'- {item["agents_used"]} | Conf: {item["confidence"]}% | Dur: {item["duration"]}s')
        print(f'  Steps: {item["reasoning_steps"]}')
else:
    print(r.text)

# Test Collaboration Outcomes
print('\n=== AGENT COLLABORATIONS ===')
r = httpx.get(f'{base}/api/agents/collaboration', headers=headers)
print(f'Collaboration Status: {r.status_code}')
if r.status_code == 200:
    items = r.json()
    print(f'Collaborations count: {len(items)}')
    for item in items:
        print(f'- {item["collaboration_type"]} | Initiator: {item["initiator"]} | Collaborators: {item["collaborators"]}')
        print(f'  Outcome: {item["outcome"]}')
        print(f'  Downtime saved: {item["downtime_saved_estimate"]} hrs | Cost saved: ${item["cost_saved_estimate"]}')
else:
    print(r.text)

# Test Copilot ask multi-agent
print('\n=== COPILOT AGENTS RESOLVE: What is the maintenance strategy for PUMP-P102? ===')
r = httpx.post(f'{base}/api/ai/ask', headers=headers, json={'question': 'What is the maintenance strategy for PUMP-P102?'})
print(f'Copilot Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(data["answer"])
    print(f'Participating Agents: {data["participating_agents"]}')
    print(f'Reasoning Steps: {data["reasoning_steps"]}')
else:
    print(r.text)
