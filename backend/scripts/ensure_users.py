from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User, UserRole
from app.core.auth import get_password_hash

"""
Ensure required accounts exist with correct roles and passwords:
- admin@eventify.com (Admin)
- mohxnova@mo.com (Organizer)
- jack@eventify.com (Organizer)

Passwords are set to provided defaults if user does not exist.
Existing users are NOT modified (to preserve data) unless --reset-password is added (not implemented here to be safe).
"""

def ensure_user(session: Session, email: str, full_name: str, role: UserRole, password: str) -> User:
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        return user
    user = User(
        email=email,
        full_name=full_name,
        role=role,
        hashed_password=get_password_hash(password),
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def main():
    with Session(engine) as session:
        admin = ensure_user(session, "admin@eventify.com", "Admin User", UserRole.ADMIN, "admin123")
        mohx = ensure_user(session, "mohxnova@mo.com", "Mohx Nova", UserRole.ORGANIZER, "mohx123")
        jack = ensure_user(session, "jack@eventify.com", "Jack", UserRole.ORGANIZER, "jack123")
        print(f"Ensured users exist: admin={admin.id}, mohx={mohx.id}, jack={jack.id}")


if __name__ == "__main__":
    main()
