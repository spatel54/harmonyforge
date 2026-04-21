# Collaboration Guide

## Quick Start for New Contributors

### 1. Get Access
- GitHub: Request write access to `salt-family/harmonyforge`
- Vercel: Ask for invite to view deployments (optional)

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/salt-family/harmonyforge.git
cd harmonyforge

# Install dependencies
cd frontend
npm install

# Copy environment variables
cp .env.example .env.local
# Add any necessary API keys

# Run locally
npm run dev
# Open http://localhost:3000
```

### 3. Create Your Branch
```bash
# Always work on a feature branch
git checkout -b your-name/feature-description

# Example:
git checkout -b alice/add-chord-detection
```

### 4. Make Changes and Test
```bash
# Run tests
npm test

# Run linter
npm run lint

# Check types
npm run type-check
```

### 5. Push Your Branch
```bash
# Commit your changes
git add .
git commit -m "feat: add chord detection algorithm"

# Push to GitHub
git push -u origin your-name/feature-description
```

### 6. Automatic Preview Deployment
Once you push, Vercel automatically creates a preview deployment:
- Check the GitHub PR for the preview URL
- Example: `https://harmonyforge-git-your-branch.vercel.app`
- Share this URL for testing before merging

### 7. Create Pull Request
```bash
# Via GitHub CLI
gh pr create --title "Add chord detection" --body "Description of changes"

# Or via GitHub UI at:
# https://github.com/salt-family/harmonyforge/compare
```

### 8. Review and Merge
- Team reviews your PR
- Once approved, merge to `main`
- Production automatically deploys to https://harmonyforge.vercel.app

---

## Deployment Info

### Vercel Configuration
- **Root Directory**: `frontend/`
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install`
- **Dev Command**: `npm run dev`

### Environment Variables
Required in Vercel dashboard and `.env.local`:
```bash
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_value
```

### Branch Deployments
- `main` → Production: https://harmonyforge.vercel.app
- Other branches → Preview: `https://harmonyforge-git-{branch}.vercel.app`

---

## Common Tasks

### Sync with Latest Main
```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

### Fix Merge Conflicts
```bash
# If rebase has conflicts
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git rebase --continue
```

### Update Dependencies
```bash
cd frontend
npm install
npm run build  # Ensure build still works
```

### Run Production Build Locally
```bash
cd frontend
npm run build
npm start
```

---

## CI/CD Checks

All PRs must pass:
- ✓ TypeScript compilation
- ✓ ESLint (no errors)
- ✓ Tests pass
- ✓ Build succeeds
- ✓ Vercel preview deployment succeeds

---

## Getting Help

- Review docs: `docs/README.md`
- Check implementation plan: `docs/IMPLEMENTATION_PLAN.md`
- Architecture decisions: `docs/adr/`
- Ask in PR comments or team chat

---

## Best Practices

1. **Small, focused PRs** - Easier to review
2. **Descriptive commit messages** - Use conventional commits (feat:, fix:, docs:, etc.)
3. **Test your changes** - Run locally before pushing
4. **Update docs** - If you change behavior, update relevant docs
5. **Share preview URLs** - Makes it easy for team to test
