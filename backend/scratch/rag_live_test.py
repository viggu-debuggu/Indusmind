import sys, json, httpx
sys.stdout.reconfigure(encoding='utf-8')

base = 'http://localhost:8000'

# Login fresh after role update
r = httpx.post(f'{base}/api/auth/login',
    json={'email': 'admin@indusmind.com', 'password': 'Admin@2024!'},
    timeout=10)
data = r.json()
token = data.get('accessToken', '')
headers = {'Authorization': f'Bearer {token}'}
user = data.get('user', {})
print(f'Logged in as: {user.get("email")} | role={user.get("role")}')

# Test RAG with question about gas turbine
print('\n=== RAG Test: Gas Turbine Query ===')
r = httpx.post(f'{base}/api/ai/ask', headers=headers,
    json={'question': 'Tell me about the gas turbine unit at Power Generation Block B'},
    timeout=60)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    resp = r.json()
    print(f'Answer:\n{resp.get("answer", "")}')
    print(f'\nCitations: {len(resp.get("citations", []))}')
    for c in resp.get('citations', []):
        print(f'  - {c}')
    print(f'Documents used: {resp.get("documents_used", [])}')
    print(f'Session UUID: {resp.get("session_uuid")}')
else:
    print(f'Error: {r.text[:300]}')

# Test semantic search
print('\n=== Semantic Search: turbine ===')
r = httpx.post(f'{base}/api/ai/search', headers=headers,
    json={'query': 'gas turbine power generation thermal', 'top_k': 3},
    timeout=30)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    results = r.json()
    chunks = results.get('results', [])
    print(f'Results: {len(chunks)}')
    for chunk in chunks[:3]:
        print(f'  - score={chunk.get("score", "?")} | {str(chunk.get("text", ""))[:80]}')
else:
    print(f'Error: {r.text[:200]}')
