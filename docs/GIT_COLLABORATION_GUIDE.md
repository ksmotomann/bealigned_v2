# Git Collaboration Guide for BeAligned

## Branch Strategy

### Main Branches
- **`main`** - Production-ready code (protected)
- **`develop`** - Integration branch for features
- **`staging`** - Pre-production testing (optional)

### Feature Branches
- **Format**: `feature/description-of-feature`
- **Example**: `feature/user-authentication`, `feature/email-notifications`

### Bug Fix Branches
- **Format**: `fix/description-of-bug`
- **Example**: `fix/login-error`, `fix/email-validation`

### Hotfix Branches (urgent production fixes)
- **Format**: `hotfix/description`
- **Example**: `hotfix/critical-auth-bug`

## Workflow Overview

```
main
  ↑
  develop
    ↑
    feature/new-feature
```

1. Create feature branch from `develop`
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request to `develop`
5. Code review and testing
6. Merge to `develop`
7. Periodically merge `develop` to `main` for releases

## Step-by-Step Collaboration Process

### For the Other Developer

#### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/[your-username]/bealigned-lite.git
cd bealigned-lite

# Add upstream (if forked)
git remote add upstream https://github.com/[original-repo]/bealigned-lite.git

# Create develop branch if it doesn't exist
git checkout -b develop
git push origin develop
```

#### 2. Starting New Work
```bash
# Always start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: add new feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

#### 3. Creating a Pull Request
1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Set base branch: `develop`
4. Set compare branch: `feature/your-feature-name`
5. Fill in PR template (see below)
6. Request review from team members
7. Link any related issues

### For You (Repository Owner)

#### 1. Setting Up Branch Protection
Go to GitHub → Settings → Branches → Add rule:

**For `main` branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Require review from CODEOWNERS

**For `develop` branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass

#### 2. Reviewing Pull Requests
```bash
# Fetch the PR locally for testing
git fetch origin pull/[PR-NUMBER]/head:pr-[PR-NUMBER]
git checkout pr-[PR-NUMBER]

# Test the changes
npm install
npm start
# Run tests if available

# If approved, merge via GitHub UI
```

## Commit Message Convention

Use conventional commits for clear history:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

Examples:
```
feat: add email notification system
fix: resolve login redirect issue
docs: update API documentation
refactor: simplify auth middleware
```

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Updated documentation
- [ ] No console.logs or debugging code
- [ ] No hardcoded values
```

## Code Review Guidelines

### For Reviewers
1. Check for:
   - Code quality and readability
   - Potential bugs or edge cases
   - Security vulnerabilities
   - Performance issues
   - Proper error handling
   - Test coverage

2. Provide constructive feedback
3. Approve or request changes
4. Test locally if needed

### For Authors
1. Respond to all comments
2. Make requested changes
3. Push updates to same branch
4. Request re-review when ready

## Handling Conflicts

```bash
# Update your feature branch with latest develop
git checkout develop
git pull origin develop
git checkout feature/your-feature
git merge develop

# Resolve conflicts
# Edit conflicted files
git add .
git commit -m "resolve merge conflicts"
git push origin feature/your-feature
```

## Environment Variables

### For Collaborators
1. Never commit `.env` files
2. Use `.env.example` as reference
3. Request necessary API keys securely
4. Update `.env.example` when adding new variables

### Sharing Secrets Securely
- Use encrypted messaging (Signal, WhatsApp)
- Use password managers with sharing features
- Use GitHub Secrets for CI/CD
- Never share in PR comments or issues

## Best Practices

### Do's
✅ Pull latest changes before starting work
✅ Keep commits small and focused
✅ Write descriptive commit messages
✅ Test before pushing
✅ Update documentation
✅ Communicate in PR comments
✅ Keep feature branches short-lived

### Don'ts
❌ Commit directly to main or develop
❌ Force push to shared branches
❌ Commit sensitive data
❌ Leave console.logs in production code
❌ Merge without review
❌ Work on multiple features in one branch

## Quick Commands Reference

```bash
# Update local repository
git fetch --all
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature

# Stage and commit
git add .
git commit -m "feat: description"

# Push changes
git push origin feature/new-feature

# Update feature branch with develop
git checkout develop
git pull origin develop
git checkout feature/new-feature
git merge develop

# Delete local branch after merge
git branch -d feature/new-feature

# Delete remote branch
git push origin --delete feature/new-feature

# See branch history
git log --oneline --graph --all

# Stash changes temporarily
git stash
git stash pop
```

## Setting Up GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        cd ../backend
        npm ci
    
    - name: Run linting
      run: |
        cd frontend
        npm run lint
        cd ../backend
        npm run lint
    
    - name: Run tests
      run: |
        cd frontend
        npm test
        cd ../backend
        npm test
```

## Communication

### GitHub Issues
- Use for bug reports and feature requests
- Add labels (bug, enhancement, documentation)
- Assign to relevant developer
- Link PRs to issues

### PR Comments
- Discuss implementation details
- Ask questions
- Provide code review feedback
- Document decisions

### External Communication
- Slack/Discord for real-time discussion
- Weekly sync meetings
- Document decisions in GitHub

## Release Process

1. Merge all approved PRs to `develop`
2. Create PR from `develop` to `main`
3. Tag release with version number
4. Deploy to production
5. Create release notes

## Emergency Procedures

### Reverting a Bad Merge
```bash
git checkout main
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Hotfix Process
```bash
# Create from main for production fix
git checkout main
git checkout -b hotfix/critical-fix
# Make fixes
git commit -m "hotfix: description"
git push origin hotfix/critical-fix
# Create PR to main AND develop
```

## Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Pull Request Documentation](https://docs.github.com/en/pull-requests)