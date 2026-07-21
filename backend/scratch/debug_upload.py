import os
import sys
# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

# Query an admin user to authenticate
db = SessionLocal()
admin = db.query(User).filter(User.role == "Admin").first()
if not admin:
    admin = db.query(User).first()
db.close()

if admin:
    print(f"Using user: {admin.email} (Role: {admin.role})")
    # Mock authentication token or dependency
    from app.api.dependencies.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: admin
    
    from io import BytesIO
    file_payload = {"file": ("test.txt", BytesIO(b"Calibration test data."), "text/plain")}
    form_data = {"document_name": "Test Calibration", "category": "SOP"}
    
    res = client.post("/api/documents/upload", files=file_payload, data=form_data)
    print("STATUS CODE:", res.status_code)
    print("RESPONSE JSON:", res.json())
else:
    print("No users found to test with.")
