# ShreeHR - HR Management System

A comprehensive HR management system built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Update DATABASE_URL in .env

# Set up database
pnpm db:push
pnpm db:seed

# Run development server
pnpm dev
```

## 🧪 Testing

**IMPORTANT**: All features must pass automated tests before being marked as "done".

### Quick Test Commands

```bash
# Run all tests
pnpm test:all

# Run E2E tests only
pnpm test:e2e

# Debug with UI
pnpm test:e2e:ui

# Test specific feature
pnpm test:e2e navigation
```

### Windows Users

Use the PowerShell test runner:

```powershell
# Run all tests
.\run-tests.ps1

# Run navigation tests
.\run-tests.ps1 navigation

# Open UI mode for debugging
.\run-tests.ps1 ui
```

### Test Documentation

- 📋 [Testing Checklist](TESTING_CHECKLIST.md) - **Read this before marking anything "done"**
- 📖 [Testing Guide](docs/testing-guide.md) - Complete testing documentation
- 📊 [Testing Plan](testing-framework-plan.md) - Architecture and decisions

## 📁 Project Structure

```
shreehr/
├── src/                    # Application source code
├── e2e/                    # End-to-end tests
│   ├── fixtures/           # Test fixtures and setup
│   ├── pages/              # Page objects
│   ├── setup/              # Test data setup
│   └── *.spec.ts           # Test specifications
├── prisma/                 # Database schema and migrations
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Styling**: Tailwind CSS
- **AI Integration**: Anthropic Claude

## 👥 User Roles

- **Super Admin**: Full system access
- **Admin**: Administrative functions
- **HR Manager**: HR operations
- **Payroll Manager**: Payroll operations
- **Employee**: Self-service portal

## 🔒 Security

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control (RBAC)
- Environment variable validation

## 📝 Development Workflow

1. **Before starting work**: Run tests to know baseline
2. **During development**: Write tests for new features
3. **Before committing**: Run all tests
4. **Before marking "done"**: All tests must pass

## 🚨 Important Notes

- **No feature is complete without tests**
- **Use `pnpm test:e2e:ui` for debugging**
- **Check TESTING_CHECKLIST.md before pushing**
- **Take screenshots of passing tests for evidence**

## 📄 License

Proprietary - All rights reserved