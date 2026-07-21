from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notification Center"])


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists recent active notifications for the current active employee."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )


@router.post("/{id}/read")
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks a notification item as read/acknowledged."""
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
        
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read."}


@router.post("")
def trigger_test_notification(
    title: str,
    message: str,
    notification_type: str, # AI Alert, Compliance, Approval, Telemetry, System
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers an operations alert for testing notifications center alerts."""
    notif = Notification(
        user_id=current_user.id,
        title=title,
        message=message,
        notification_type=notification_type
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
