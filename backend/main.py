import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from github import Github
from sqlalchemy.orm import Session

from backend.db import SessionLocal
from backend.models import TrackedRepos, User
from backend.services.auth import get_or_create_user
from backend.services.tracked_repos import get_tracked, add_tracked, remove_tracked
from backend.services.git_service import get_repo_status

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_github_user(token: str = Header(...)):
    try:
        g = Github(token)
        return g.get_user()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid GitHub token")

def get_current_user(
    github_user=Depends(get_github_user),
    db: Session = Depends(get_db)
) -> User:
    return get_or_create_user(github_user, db)

@app.get("/user")
def read_user(user: User = Depends(get_current_user)):
    return {"id": user.id, "login": user.github_login, "avatar_url": user.avatar_url}

@app.get("/repos/available")
def read_repos(github_user=Depends(get_github_user)):
    return [{"id": r.id, "name": r.name, "full_name": r.full_name} for r in github_user.get_repos()]

@app.get("/repos/tracked")
def read_tracked(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_tracked(user.id, db)

@app.put("/repos/tracked/{repo_id}")
def track_repo(repo_id: int, repo_name: str, repo_full_name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return add_tracked(user.id, repo_id, repo_name, repo_full_name, db)

@app.delete("/repos/tracked/{repo_id}")
def untrack_repo(repo_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ok = remove_tracked(user.id, repo_id, db)
    if not ok:
        raise HTTPException(status_code=404, detail="Tracked repository not found")
    return {"detail": "Repository untracked successfully"}

@app.get("/repos/status")
def read_status(token: str = Header(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repos = get_tracked(user.id, db)
    return [
        {"repo": r.repo_full_name, **get_repo_status(token, r.repo_full_name)}
        for r in repos
    ]