from sqlalchemy.orm import Session
from backend.models import User

def get_or_create_user(github_user, db: Session) -> User:
    user = db.query(User).filter(User.github_user_id == github_user.id).first()
    if user:
        return user
    
    user = User(
        github_user_id=github_user.id,
        github_login=github_user.login,
        avatar_url=github_user.avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user