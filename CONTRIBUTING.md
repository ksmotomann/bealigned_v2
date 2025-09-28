# Contributing to BeAligned

Thank you for your interest in contributing to BeAligned! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

1. **Fork the repository** (if you're not a direct collaborator)
2. **Clone your fork**:
   ```bash
   git clone https://github.com/[your-username]/bealigned-lite.git
   cd bealigned-lite
   ```

3. **Set up the development environment**:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

4. **Create `.env` files** based on `.env.example`

5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. **Always branch from `develop`** (not `main`)
2. **Keep your branch up to date**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-feature
   git merge develop
   ```

3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit with meaningful messages** using conventional commits
6. **Push to your branch** and create a Pull Request

## Coding Standards

### JavaScript/TypeScript
- Use ES6+ features
- Prefer functional components in React
- Use TypeScript types/interfaces
- Handle errors appropriately
- Add comments for complex logic

### Styling
- Use Tailwind CSS classes
- Follow existing component patterns
- Ensure responsive design
- Test on multiple screen sizes

### Best Practices
- ✅ Write clean, readable code
- ✅ Follow DRY (Don't Repeat Yourself)
- ✅ Keep functions small and focused
- ✅ Use meaningful variable/function names
- ✅ Remove console.logs before committing
- ✅ Never commit sensitive data

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
```

## Pull Request Process

1. **Fill out the PR template** completely
2. **Link related issues** using keywords (Closes #123)
3. **Ensure CI checks pass**
4. **Request review** from maintainers
5. **Address review feedback** promptly
6. **Keep PR focused** - one feature/fix per PR

## Testing

Before submitting a PR:

1. **Test locally**:
   ```bash
   # Frontend
   cd frontend
   npm start
   # Test your changes in the browser
   
   # Backend
   cd backend
   npm start
   # Test API endpoints
   ```

2. **Run linting** (if available):
   ```bash
   npm run lint
   ```

3. **Check for build errors**:
   ```bash
   npm run build
   ```

## Project Structure

```
bealigned-lite/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── contexts/   # React contexts
├── backend/            # Express server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── middleware/ # Express middleware
├── supabase/          # Supabase Edge Functions
│   └── functions/     # Deno-based functions
└── docs/              # Documentation
```

## Environment Variables

- Never commit `.env` files
- Update `.env.example` when adding new variables
- Document any new variables in the PR description
- Request necessary API keys from maintainers

## Database Changes

When making database changes:

1. Create migration files in `/backend/migrations/`
2. Name migrations descriptively with timestamps
3. Test migrations on a fresh database
4. Document rollback procedures
5. Note breaking changes in PR

## Need Help?

- Check existing issues and PRs
- Ask questions in PR comments
- Review the documentation in `/docs`
- Contact maintainers for sensitive issues

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Project documentation
- Release notes (for significant contributions)

Thank you for contributing to BeAligned! 🎉