import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.database.session import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f'Total users in DB: {len(users)}')
for u in users:
    print(f'  email={u.email} | role={u.role} | is_active={u.is_active} | org_id={getattr(u, "organization_id", "N/A")}')
db.close()
