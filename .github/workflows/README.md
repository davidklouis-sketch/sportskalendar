# CI/CD Pipeline Documentation

## 🚀 Overview

This repository uses GitHub Actions for continuous integration and deployment with comprehensive testing, building, and deployment workflows.

## 📋 Workflows

### 1. **CI/CD Pipeline v2** (`ci-cd.yml`)
**Main deployment pipeline** - Runs on pushes to `main` branch and pull requests.

**Jobs:**
- **Test**: Unit tests, linting, builds, and coverage
- **Build & Push**: Docker image building and pushing to GitHub Container Registry
- **Deploy**: Automatic deployment to production server

**Features:**
- ✅ Frontend unit tests with coverage
- ✅ ESLint code quality checks
- ✅ Storybook build verification
- ✅ Docker image building
- ✅ Automatic deployment to production
- ✅ Environment variable injection
- ✅ Database migration support

### 2. **Pull Request Checks** (`pr-checks.yml`)
**Comprehensive PR validation** - Runs on all pull requests.

**Jobs:**
- **Frontend Checks**: TypeScript, ESLint, unit tests, builds
- **Backend Checks**: TypeScript compilation, build verification
- **Security Scan**: Trivy vulnerability scanning
- **Dependency Review**: Security audit of dependencies

**Features:**
- ✅ TypeScript type checking
- ✅ Code quality linting
- ✅ Unit test execution with coverage
- ✅ Build verification
- ✅ Security vulnerability scanning
- ✅ Dependency security audit
- ✅ Test result artifacts
- ✅ Coverage reporting in PR comments

### 3. **Storybook Deploy** (`storybook-deploy.yml`)
**Storybook documentation deployment** - Runs on pushes and PRs affecting frontend.

**Features:**
- ✅ Automatic Storybook build
- ✅ GitHub Pages deployment (main branch)
- ✅ Chromatic visual testing (PRs)
- ✅ Component documentation

### 4. **Test on Commit** (`test-on-commit.yml`)
**Fast feedback loop** - Runs on every commit to main/develop branches.

**Jobs:**
- **Quick Tests**: Fast validation (TypeScript, linting, basic tests)
- **Integration Tests**: Full test suite with coverage (PRs only)

**Features:**
- ✅ Fast TypeScript compilation checks
- ✅ Quick linting validation
- ✅ Basic unit test execution
- ✅ Build verification
- ✅ Full coverage reporting (PRs)

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Vitest with Testing Library
- **Component Tests**: React component testing
- **Hook Tests**: Custom hook testing
- **Coverage**: V8 coverage reporting
- **Visual Testing**: Storybook stories

### Backend Testing
- **TypeScript**: Compilation checks
- **Build**: Production build verification

### Security Testing
- **Dependency Audit**: Automated security scanning
- **Vulnerability Scan**: Trivy container scanning
- **Code Quality**: ESLint with security rules

## 📊 Coverage & Quality

### Coverage Reports
- **Codecov Integration**: Automatic coverage upload
- **PR Comments**: Coverage diff in pull requests
- **Thresholds**: Configurable coverage requirements

### Quality Gates
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Security**: Vulnerability scanning
- **Build**: Production build verification

## 🚀 Deployment

### Production Deployment
- **Automatic**: On push to `main` branch
- **Docker**: Containerized deployment
- **Environment**: Production environment variables
- **Database**: Automatic migrations
- **SSL**: Traefik SSL termination

### Staging Deployment
- **Storybook**: GitHub Pages deployment
- **Visual Testing**: Chromatic integration
- **Component Docs**: Automatic documentation

## 🔧 Configuration

### Environment Variables
```bash
# Required for deployment
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEWS_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_USE_SSL=true

# Optional for enhanced features
CHROMATIC_PROJECT_TOKEN=...
```

### Secrets Setup
1. Go to repository Settings → Secrets and variables → Actions
2. Add required secrets for deployment
3. Configure environment-specific variables

## 📈 Monitoring

### Build Status
- **Green**: All tests pass, deployment successful
- **Yellow**: Tests pass, deployment in progress
- **Red**: Tests fail or deployment failed

### Coverage Tracking
- **Codecov Dashboard**: Track coverage trends
- **PR Comments**: See coverage changes
- **Quality Gates**: Prevent coverage regression

## 🛠️ Local Development

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# With coverage
npm run test:coverage

# With UI
npm run test:ui

# Storybook
npm run storybook
```

### Pre-commit Checks
```bash
# TypeScript check
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests Failing**
   - Check TypeScript errors: `npx tsc --noEmit`
   - Verify dependencies: `npm ci`
   - Check test files syntax

2. **Build Failing**
   - Verify environment variables
   - Check Docker configuration
   - Review build logs

3. **Deployment Issues**
   - Check server connectivity
   - Verify secrets configuration
   - Review deployment logs

### Getting Help
- Check workflow logs in GitHub Actions
- Review error messages in PR checks
- Consult this documentation
- Check component stories in Storybook

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Testing Framework](https://vitest.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Testing Library](https://testing-library.com/)
- [Codecov Coverage](https://codecov.io/)