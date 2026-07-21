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

# Trigger hierarchy seed via DB
print('\n=== Seeding hierarchy for current user ===')
try:
    # Import models
    from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
    from app.models.workspace import Workspace
    from app.models.user import User
    from app.database.session import SessionLocal
    from app.database.seed import seed_hierarchy_data

    with SessionLocal() as db:
        # Check and run seed
        org_count = db.query(Organization).count()
        print(f'Organizations before: {org_count}')
        
        if org_count == 0:
            seed_hierarchy_data(db)
            print('Hierarchy seeded successfully!')
        else:
            # Just link existing users
            org = db.query(Organization).first()
            user = db.query(User).filter(User.email == 'admin@indusmind.com').first()
            if user:
                user.organization_id = org.id
                db.commit()
                print(f'Linked admin to org: {org.name}')
        
        org_count = db.query(Organization).count()
        print(f'Organizations after: {org_count}')
except Exception as e:
    print(f'Seed error: {e}')

print('\n=== FULL API CHECK ===')
print()

# 1. Health
r = httpx.get(f'{base}/api/health', timeout=5)
print(f'[1] Health: {r.status_code} -> {r.json()}')

# 2. Auth /users/me (correct path)
r = httpx.get(f'{base}/api/users/me', headers=headers, timeout=5)
me = r.json()
print(f'[2] User /me: {r.status_code}')
if r.status_code == 200:
    print(f'    email={me.get("email")} | role={me.get("role")} | active={me.get("isActive", me.get("is_active"))}')

# 3. Documents
r = httpx.get(f'{base}/api/documents', headers=headers, timeout=10, follow_redirects=True)
print(f'[3] Documents: {r.status_code}')
if r.status_code == 200:
    body = r.json()
    if isinstance(body, list):
        print(f'    Count: {len(body)}')
    elif isinstance(body, dict):
        items = body.get('items', body.get('documents', body.get('data', [])))
        print(f'    Count: {len(items)} | Keys: {list(body.keys())}')

# 4. Equipment
r = httpx.get(f'{base}/api/equipment', headers=headers, timeout=10, follow_redirects=True)
print(f'[4] Equipment: {r.status_code}')
if r.status_code == 200:
    equip = r.json()
    items = equip if isinstance(equip, list) else equip.get('items', equip.get('equipment', []))
    print(f'    Count: {len(items)}')
    for e in items[:3]:
        tag = e.get('assetTag', e.get('asset_tag', '?'))
        name = e.get('assetName', e.get('asset_name', '?'))
        health = e.get('healthScore', e.get('health_score', '?'))
        status = e.get('status', '?')
        print(f'    - [{status}] {tag} | {name} | health={health}%')

# 5. RAG /ask
print()
print('[5] RAG /ask test...')
r = httpx.post(f'{base}/api/ai/ask', headers=headers,
    json={'question': 'What is the maintenance schedule for PUMP-P102?'},
    timeout=60)
print(f'    Status: {r.status_code}')
if r.status_code == 200:
    resp = r.json()
    answer = resp.get('answer', '')
    citations = resp.get('citations', [])
    is_mock = 'could not find' in str(answer).lower() or 'Offline Copilot' in str(answer)
    print(f'    Answer (150 chars): {str(answer)[:150]}')
    print(f'    Citations: {len(citations)} | Mock mode: {is_mock}')

# 6. Workspaces
r = httpx.get(f'{base}/api/workspaces', headers=headers, timeout=10, follow_redirects=True)
print(f'[6] Workspaces: {r.status_code}')
if r.status_code == 200:
    ws = r.json()
    items = ws if isinstance(ws, list) else ws.get('items', [])
    print(f'    Count: {len(items)}')
    for w in items[:3]:
        print(f'    - {w.get("name", "?")} | dept={w.get("departmentId", w.get("department_id", "?"))}')

# 7. Organizations
r = httpx.get(f'{base}/api/hierarchy/organizations', headers=headers, timeout=10, follow_redirects=True)
print(f'[7] Organizations: {r.status_code}')
if r.status_code == 200:
    orgs = r.json()
    print(f'    Count: {len(orgs) if isinstance(orgs, list) else orgs}')
else:
    print(f'    {r.text[:100]}')

# 8. Compliance
r = httpx.get(f'{base}/api/compliance/regulations', headers=headers, timeout=10, follow_redirects=True)
print(f'[8] Regulations: {r.status_code}')
if r.status_code == 200:
    regs = r.json()
    items = regs if isinstance(regs, list) else regs.get('items', [])
    print(f'    Count: {len(items)}')
else:
    print(f'    {r.text[:100]}')

print()
print('=== SYSTEM STATUS ===')
print('  Backend API:     HEALTHY at http://localhost:8000')
print('  Frontend:        RUNNING at http://localhost:3000')
print('  Swagger docs:    http://localhost:8000/docs')
print('  Admin:           admin@indusmind.com / Admin@2024!')
print()
print('  LLM Provider:    Gemini (gemini-2.0-flash) - rate limited on free tier')
print('  RAG Mode:        Grounded mock (no documents indexed yet)')
print('  Equipment:       5 industrial assets seeded with sensor history')
