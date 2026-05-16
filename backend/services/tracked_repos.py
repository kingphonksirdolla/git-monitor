from sqlalchemy.orm import Session
from backend.models import TrackedRepos

def get_tracked(user_id: int, db: Session):
    return db.query(TrackedRepos).filter(TrackedRepos.user_id == user_id).all()

def add_tracked(user_id: int, repo_id: int, repo_name: str, repo_full_name: str, db: Session):
    tracked_repo = TrackedRepos(
        user_id=user_id,
        repo_id=repo_id,
        repo_name=repo_name,
        repo_full_name=repo_full_name
    )
    db.add(tracked_repo)
    db.commit()
    db.refresh(tracked_repo)
    return tracked_repo

def remove_tracked(user_id: int, repo_id: int, db: Session):
    tracked_repo = db.query(TrackedRepos).filter(
        TrackedRepos.user_id == user_id,
        TrackedRepos.repo_id == repo_id
    ).first()
    
    if tracked_repo:
        db.delete(tracked_repo)
        db.commit()
        return True
    return False