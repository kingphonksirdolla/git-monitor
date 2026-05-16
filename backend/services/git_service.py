from github import Github, GithubException

def get_repo_status(github_token: str, repo_full_name: str):
    g = Github(github_token)
    
    try:
        repo = g.get_repo(repo_full_name)
    except GithubException:
        return {"status": "error", "message": "Repository not found or access denied"}
    
    try:
        main = repo.get_branch("main")
    except GithubException:
        return {"status": "error", "message": "Branch 'main' not found"}
    
    try:
        develop = repo.get_branch("develop")
    except GithubException:
        return {"status": "error", "message": "Branch 'develop' not found"}
    
    comparison = repo.compare("main", "develop")
    if comparison.ahead_by == 0:
        return {"status": "stable"}
    return {"status": "development"}
    
    