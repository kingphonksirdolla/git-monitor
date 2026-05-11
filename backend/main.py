import os
from collections import defaultdict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from github import Github
from typing import Optional

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def branch_changes_applied(repo, target_branch, source_branch):
    comparison = repo.compare(target_branch, source_branch)
    return comparison.ahead_by == 0


def determine_status(repo, branch_names):
    main_branch = repo.default_branch
    has_develop = "develop" in branch_names
    develop_ahead_of_main = has_develop and not branch_changes_applied(
        repo, main_branch, "develop"
    )
    work_branches = [
        name for name in branch_names if name.startswith(("feature/", "bugfix/"))
    ]

    if not work_branches:
        if develop_ahead_of_main:
            return "Желтый"
        return "Зеленый"

    has_changes_only_in_develop = False

    for branch_name in work_branches:
        if branch_changes_applied(repo, main_branch, branch_name):
            continue

        if has_develop and branch_changes_applied(repo, "develop", branch_name):
            has_changes_only_in_develop = True
            continue

        return "Красный"

    if has_changes_only_in_develop or develop_ahead_of_main:
        return "Желтый"

    return "Зеленый"


@app.get("/api/projects")
def get_projects(x_github_token: Optional[str] = Header(None)):
    token = x_github_token
    #  or os.getenv("GITHUB_TOKEN")
    if not token:
        raise HTTPException(status_code=401, detail="токен не найден")

    github = Github(token)
    user = github.get_user()
    repos = user.get_repos(sort="updated", direction="desc")

    projects = []
    for repo in repos:
        branches = list(repo.get_branches())
        branch_names = [branch.name for branch in branches]

        categorized_branches = defaultdict(list)
        for name in branch_names:
            if name.startswith("feature/"):
                categorized_branches["features"].append(name)
            elif name.startswith("bugfix/"):
                categorized_branches["bugfixes"].append(name)
            else:
                categorized_branches["other"].append(name)

        projects.append(
            {
                "name": repo.name,
                "status": determine_status(repo, branch_names),
                "branches": dict(categorized_branches),
            }
        )

    return {
        "projects": projects,
        "username": user.login,
        "avatar" : user.avatar_url,
    }