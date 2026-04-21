# Welcome to HarmonyForge! 🎵

Hi @dgeni2,

You've been added as a collaborator to the HarmonyForge project. Here's everything you need to get started:

---

## 🚀 Quick Start

### 1. Accept the GitHub Invitation
Check your email or visit: https://github.com/salt-family/harmonyforge/invitations

### 2. Clone the Repository
```bash
git clone https://github.com/salt-family/harmonyforge.git
cd harmonyforge
```

### 3. Set Up the Frontend
```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local if you need any API keys

# Run the development server
npm run dev
```

Open http://localhost:3000 to see the app running locally.

---

## 💻 Development Workflow

### Create Your Feature Branch
```bash
# Always work on a feature branch
git checkout -b dgeni2/your-feature-name

# Example:
git checkout -b dgeni2/improve-chord-detection
```

### Make Changes and Test
```bash
# Run tests
npm test

# Run linter
npm run lint

# Check the app
npm run dev
```

### Push Your Changes
```bash
git add .
git commit -m "feat: your feature description"
git push -u origin dgeni2/your-feature-name
```

### Create a Pull Request
```bash
# Via GitHub CLI (if installed)
gh pr create --title "Your feature title" --body "Description of changes"

# Or visit:
# https://github.com/salt-family/harmonyforge/compare
```

---

## 🌐 Automatic Deployments

When you push your branch, Vercel automatically creates a **preview deployment**:
- Your preview URL: `https://harmonyforge-git-dgeni2-your-feature-sjp10.vercel.app`
- You'll see the URL in your Pull Request
- Share this URL to demo your changes before merging

When your PR is merged to `main`:
- Production automatically updates: https://harmonyforge.vercel.app

**All deployments are FREE** on the Hobby plan!

---

## 📚 Important Documentation

- **Collaboration Guide**: `docs/COLLABORATING.md`
- **Project Overview**: `README.md`
- **Implementation Plan**: `docs/IMPLEMENTATION_PLAN.md`
- **Architecture Decisions**: `docs/adr/`
- **Progress Log**: `docs/progress.md`

---

## 🏗️ Project Structure

```
harmonyforge/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities
│   │   └── server/       # Server-side code (engine, logic)
│   ├── public/           # Static assets
│   └── package.json
├── docs/                 # Project documentation
└── README.md
```

---

## 🎯 What HarmonyForge Does

> Upload a melody, get rule-based harmonies you can **edit**, **hear**, and **ask questions about** — with a transparent engine, not a black-box model.

### Key Features:
- **Logic Core**: Parse files, infer chords, solve SATB voicings
- **Tactile Sandbox**: Upload, edit in RiffScore, play & export
- **Theory Inspector**: Explain notes, chat, optional OpenAI integration

---

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start           # Run production build
npm test            # Run tests
npm run lint        # Check code style
npm run type-check  # TypeScript validation

# Makefile commands (from repo root)
make dev            # Start development environment
make test           # Run tests
make lint           # Run linter
```

---

## 🤝 Collaboration Tips

1. **Small PRs**: Easier to review, faster to merge
2. **Descriptive commits**: Use conventional commits (feat:, fix:, docs:, chore:)
3. **Test locally**: Run `npm run build` before pushing
4. **Ask questions**: Comment on PRs or reach out to the team
5. **Check CI**: All PRs must pass TypeScript, ESLint, and build checks

---

## 🔗 Quick Links

- **Repository**: https://github.com/salt-family/harmonyforge
- **Production**: https://harmonyforge.vercel.app
- **Vercel Dashboard**: https://vercel.com/sjp10-9620s-projects/harmonyforge

---

## 📞 Need Help?

- Check `docs/COLLABORATING.md` for detailed workflows
- Comment on issues or PRs
- Reach out to @spatel54 (Shiv) for any questions

Happy coding! 🎶

---

*Note: If you want access to view Vercel deployment logs, let me know and I can send a Vercel team invitation to your email.*
