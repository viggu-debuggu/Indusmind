import sys
sys.stdout.reconfigure(encoding='utf-8')

# Import all models to register them
from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
from app.models.workspace import Workspace
from app.models.user import User, RefreshToken
from app.models.document import Document
from app.models.equipment import Equipment, SensorReading
from app.database.session import SessionLocal

db = SessionLocal()

print('=== DATABASE STATE ===')
print()
users = db.query(User).all()
print(f'Users ({len(users)} total):')
for u in users:
    print(f'  id={u.id} | email={u.email} | role={u.role} | active={u.is_active}')

orgs = db.query(Organization).all()
print(f'\nOrganizations ({len(orgs)} total):')
for o in orgs:
    print(f'  id={o.id} | name={o.name}')

docs = db.query(Document).all()
print(f'\nDocuments ({len(docs)} total):')
for d in docs[:5]:
    print(f'  id={d.id} | filename={d.filename} | status={d.status}')

equip = db.query(Equipment).all()
print(f'\nEquipment ({len(equip)} total):')
for e in equip[:3]:
    print(f'  id={e.id} | tag={e.asset_tag} | status={e.status} | health={e.health_score}')

db.close()
print('\n=== CHECK COMPLETE ===')
