# Deployment Workflow & Version Management

## Overview

strideOS uses a two-branch deployment strategy with automated versioning and continuous deployment through Vercel.

- **`dev` branch**: Development environment with automatic patch version bumping
- **`main` branch**: Production environment with controlled version releases

## Branch Strategy

### Development Branch (`dev`)
- **URL**: dev.yourdomain.com (Vercel preview deployment)
- **Purpose**: Active development, team testing, feature integration
- **Version Format**: `{major}.{minor}.{patch}-{commit}` (e.g., `0.1.5-abc1234`)
- **Auto-versioning**: Patch version auto-increments on every push

### Production Branch (`main`)
- **URL**: yourdomain.com (Vercel production deployment)
- **Purpose**: Stable, production-ready releases
- **Version Format**: `{major}.{minor}.{patch}` (e.g., `1.0.0`)
- **Auto-versioning**: Version bumps based on PR merge type

## Version Management

### Version Display Locations
- Login screen (bottom footer)
- User dropdown menu (bottom item)
- Powered by `/src/lib/version.ts`

### Version Numbering Scheme

Following semantic versioning (semver):
- **Major** (1.0.0): Breaking changes, major feature releases
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, minor improvements

### Current Version Status
- **Beta Phase**: Starting at `0.1.0`
- **Production Release**: Will move to `1.0.0` when fully stable

## Development Workflow

### Daily Development Process

1. **Create feature branch from dev**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Merge to dev branch**
   ```bash
   git checkout dev
   git merge feature/your-feature
   git push origin dev
   ```

4. **Automatic processes**
   - GitHub Action increments patch version (0.1.0 → 0.1.1)
   - Vercel deploys to dev.yourdomain.com
   - Version displays as `0.1.1-abc1234`

### Feature Branch Conventions

Use descriptive branch names:
- `feature/user-authentication`
- `fix/login-validation`
- `refactor/api-structure`
- `docs/update-readme`

## Production Release Process

### Creating a Production Release

1. **Ensure dev branch is stable**
   - All tests passing
   - Team has reviewed on dev environment
   - No critical bugs

2. **Create Pull Request from dev to main**
   ```bash
   # From GitHub UI or CLI
   gh pr create --base main --head dev --title "feat: release title"
   ```

3. **PR Title Conventions** (determines version bump)
   - `feat:` → Minor version bump (0.1.0 → 0.2.0)
   - `fix:` → Patch version bump (0.1.0 → 0.1.1)
   - `BREAKING:` → Major version bump (0.1.0 → 1.0.0)

4. **Merge PR**
   - Review changes
   - Approve PR
   - Merge to main

5. **Automatic processes**
   - GitHub Action bumps version based on PR title
   - Vercel deploys to production
   - Version displays as clean number (e.g., `0.2.0`)

### Production Hotfix Process

For urgent production fixes:

1. **Create hotfix branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug
   ```

2. **Fix and test locally**
   ```bash
   # Make fixes
   git add .
   git commit -m "fix: resolve critical bug"
   ```

3. **Create PR to main**
   ```bash
   gh pr create --base main --title "fix: critical bug"
   ```

4. **After merge, sync to dev**
   ```bash
   git checkout dev
   git merge main
   git push origin dev
   ```

## Vercel Configuration

### Project Structure
- **Production**: main branch → yourdomain.com
- **Development**: dev branch → dev.yourdomain.com
- **Preview**: Pull requests → temporary URLs

### Environment Variables
Vercel automatically provides:
- `NEXT_PUBLIC_VERCEL_ENV`: 'production', 'preview', or 'development'
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`: Current commit hash
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF`: Current branch name

### Special Configuration

The project includes `vercel.json` for Tailwind CSS v4 compatibility:
```json
{
  "installCommand": "npm ci && npm install --no-save --platform=linux --arch=x64 lightningcss @tailwindcss/oxide-linux-x64-gnu",
  "buildCommand": "npm run build"
}
```

## GitHub Actions

### Dev Version Bump (`.github/workflows/dev-version-bump.yml`)
- **Trigger**: Push to dev branch
- **Action**: Increments patch version
- **Result**: Automatic version progression in dev

### Production Version Bump (`.github/workflows/version-bump.yml`)
- **Trigger**: PR merged to main
- **Action**: Bumps version based on PR title/labels
- **Result**: Controlled version releases in production

## Version History Tracking

### Checking Current Version
```bash
# Local version
npm run dev
# Check login screen or run: node -p "require('./package.json').version"

# Dev environment
# Visit: dev.yourdomain.com/login

# Production environment
# Visit: yourdomain.com/login
```

### Version Commit Messages
- Dev: `chore: bump dev version to 0.1.5 [skip ci]`
- Prod: `chore: bump version to 0.2.0 [skip ci]`

## Troubleshooting

### Common Issues

1. **Version not updating on dev**
   - Check GitHub Actions tab for workflow status
   - Ensure `[skip ci]` is in automated commit messages

2. **Vercel build failures**
   - Check for Tailwind CSS/Lightning CSS issues
   - Verify vercel.json configuration

3. **Version conflicts**
   - Pull latest changes before pushing
   - Resolve package.json conflicts manually

### Rollback Procedure

If a production deployment needs rollback:

1. **Revert in Vercel Dashboard**
   - Go to project deployments
   - Select previous stable deployment
   - Promote to production

2. **Fix in code**
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```

## Best Practices

1. **Always test on dev first**
   - Never push directly to main
   - Let changes bake on dev for team review

2. **Use meaningful commit messages**
   - Follow conventional commits format
   - Include context in PR descriptions

3. **Monitor deployments**
   - Check Vercel dashboard after pushes
   - Verify version numbers update correctly

4. **Regular sync between branches**
   - Keep dev updated with main after releases
   - Resolve conflicts promptly

## Quick Reference

### Commands Cheat Sheet

```bash
# Daily development
git checkout dev
git pull origin dev
# ... make changes ...
git add .
git commit -m "feat: description"
git push origin dev

# Create production release
gh pr create --base main --head dev --title "feat: release v0.2.0"

# Check current version
node -p "require('./package.json').version"

# Manual version bump (if needed)
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

### Version Format Examples

| Environment | Version Display | Example |
|------------|----------------|---------|
| Local Dev | `{version}-local` | `0.1.0-local` |
| Dev Deploy | `{version}-{commit}` | `0.1.5-abc1234` |
| Production | `{version}` | `0.2.0` |

---

*Last updated: January 2025*
*Version management implemented in Feature 17.2.8*