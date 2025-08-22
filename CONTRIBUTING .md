# Contributing to CodeDesk ⚡

Thank you for considering contributing to CodeDesk!
We’re building a full-stack web application to help developers and learners stay organized, track progress, and master coding platforms effectively.

CodeDesk brings together the best resources, educators, and structured question sheets in one clean and interactive interface.

Your contributions — whether big or small — make this project better for everyone. 

## 📚 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Monorepo Structure](#-monorepo-structure)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

##  💼 Code of Conduct
By participating in this project, you are expected to uphold our **Code of Conduct**.  
Please report unacceptable behavior to the project maintainers.

## 🗂 Monorepo Structure

| Directory  | Description |
|------------|-------------|
| `backend/` | **Node.js + Express** REST API with **Supabase** integration |
| `client/`  | **React + Vite + Tailwind CSS** frontend |

##  🛠 Getting Started

### Fork and Clone the Repository
1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
   git clone https://github.com/YOUR-USERNAME/CodeDesk.git
   cd CodeDesk
```
3. Add the upstream repository:
```bash
    git remote add upstream https://github.com/your-username/CodeDesk.git
```
4. Create a branch for your work:
```bash
    git checkout -b feature/your-feature-name
```

### Setting up the Development Environment
1. Install dependencies for both frontend and backend:
```bash
# For backend
cd backend
npm install

# For frontend
cd client
npm install
```

## 👨‍💻 Development Process

### Branch Naming Conventions
- `feature/*` - For new features
- `fix/*` - For bug fixes
- `docs/*` - For documentation changes
- `refactor/*` - For code refactoring
- `test/*` - For adding or modifying tests

Example: `feature/user-authentication`

## 📝Commit Guidelines

### Commit Message Format
```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools 

```
Example:

1. feat(auth): implement JWT authentication

2. Add JWT token generation

3. Implement token verification middleware

4. Add refresh token functionality

Closes #123
```

##  🔄 Pull Request Process

### Before Creating a PR
1. Sync your fork with the upstream repository:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. Ensure your feature branch is up-to-date:
   ```bash
   git checkout your-feature-branch
   git rebase main
   ```
3. Run all tests locally and fix any issues
4. Review your changes and clean up your commits

### Creating the Pull Request
1. Push your changes to your fork:
   ```bash
   git push origin your-feature-branch
   ```
2. Go to GitHub and create a new Pull Request
3. Fill out the PR template completely
4. Link any related issues using keywords (Fixes #123, Closes #456)
5. Request review from relevant team members

### PR Requirements
1. Update the README.md with details of changes if applicable
2. Update documentation in the `/docs` directory if needed
3. Ensure all tests pass and add new tests for new features
4. Include screenshots or GIFs for UI changes
5. PR title must follow the commit message format:
   ```
   type(scope): brief description
   ```
   Example: `feat(auth): implement Google Auth login`

### Review Process
1. Automated checks must pass:
   - Linting
   - Unit tests
   - Integration tests
   - Build verification
2. At least one maintainer must review and approve
3. Address all review comments and update PR
4. Maintain a constructive dialogue during review

### After PR Approval
1. Squash commits if requested by reviewer
2. Ensure branch is up-to-date with main
3. Wait for final confirmation to merge


## 📝 PR Template

## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works




## 📏Coding Standards

### Backend (Node.js + Express)

- Use ES6+ features
- Keep controllers, routes, and services modular


- Follow **async/await** pattern, avoid callbacks
- Add JSDoc comments for functions

- Use **environment variables** for secrets

### Frontend (React + Vite + Tailwind)

- Follow React hooks best practices

- Keep components modular & reusable

- Use Tailwind utility classes where possible

- Maximum line length: 100 characters

- Indentation: 2 spaces

### Testing

- Write unit tests for new features
- Maintain test coverage above 80%
- Use meaningful test descriptions
- Prefer Jest and React Testing Library



##  🐞 Reporting Issues

### Bug Reports
When reporting bugs, include:
- Detailed description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, etc.)

### Feature Requests
   When requesting features:
- Clearly describe the feature
- Explain the use case
- Provide examples if possible
- List potential benefits

## ❓ Questions or Need Help?
Feel free to:
- Open an issue with your question
- Join our community discussions
- Reach out to maintainer

Thank you for contributing to CodeDesk! ⚡
