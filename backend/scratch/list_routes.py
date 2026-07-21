import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.main import app

print('=== API ROUTES ===')
for r in app.routes:
    if hasattr(r, 'path') and hasattr(r, 'methods'):
        print(f'  {list(r.methods)} {r.path}')
