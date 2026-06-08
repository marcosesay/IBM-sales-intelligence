# Contributing to Sales Intelligence Briefing Tool

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/sales-intelligence-briefing.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "Add: description of your changes"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager
- IBM watsonx.ai API credentials

### Installation
```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### Running Locally
```bash
# Terminal 1: Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
pnpm run dev

# Terminal 2: Frontend
cd frontend
pnpm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Commit Messages

Use clear, descriptive commit messages:
- `Add: new feature description`
- `Fix: bug description`
- `Update: what was updated`
- `Refactor: what was refactored`
- `Docs: documentation changes`

## Pull Request Process

1. Update README.md if needed
2. Ensure all tests pass
3. Update documentation for new features
4. Request review from maintainers
5. Address review feedback promptly

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)

## Feature Requests

We welcome feature requests! Please:
- Check if the feature already exists
- Describe the use case clearly
- Explain why it would be valuable
- Consider implementation complexity

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! 🎉