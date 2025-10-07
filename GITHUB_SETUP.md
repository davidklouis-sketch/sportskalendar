# GitHub Setup Anleitung

## 1. GitHub Repository erstellen

1. Gehe zu https://github.com
2. Klicke auf "New repository"
3. Repository-Name: `sportskalendar`
4. Beschreibung: `Moderne Sport-Event-Verwaltung mit Live-Scores und Kalender-Integration`
5. Wähle "Public" oder "Private"
6. **WICHTIG**: Lass "Initialize this repository with a README" **UNCHECKED**
7. Klicke "Create repository"

## 2. Lokales Repository mit GitHub verbinden

```bash
# Remote origin hinzufügen (ersetze USERNAME mit deinem GitHub-Username)
git remote add origin https://github.com/USERNAME/sportskalendar.git

# Ersten Push durchführen
git push -u origin main
```

## 3. GitHub Pages für Frontend (Optional)

1. Gehe zu Repository Settings
2. Scrolle zu "Pages"
3. Source: "Deploy from a branch"
4. Branch: "main" / "root"
5. Folder: "/frontend/dist"
6. Klicke "Save"

## 4. GitHub Actions für CI/CD (Optional)

Erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/dist
```

## 5. Environment Variables für GitHub Actions

1. Gehe zu Repository Settings
2. Scrolle zu "Secrets and variables" > "Actions"
3. Füge folgende Secrets hinzu:
   - `FOOTBALL_DATA_KEY`: Dein football-data.org API Key
   - `API_FOOTBALL_KEY`: Dein API-Football Key (optional)
   - `JWT_SECRET`: Ein starker JWT Secret

## 6. Repository-Badges hinzufügen

Füge am Anfang der README.md hinzu:

```markdown
![GitHub last commit](https://img.shields.io/github/last-commit/USERNAME/sportskalendar)
![GitHub issues](https://img.shields.io/github/issues/USERNAME/sportskalendar)
![GitHub pull requests](https://img.shields.io/github/issues-pr/USERNAME/sportskalendar)
![GitHub stars](https://img.shields.io/github/stars/USERNAME/sportskalendar)
![GitHub forks](https://img.shields.io/github/forks/USERNAME/sportskalendar)
```

## 7. Topics/Tags hinzufügen

Füge folgende Topics zu deinem Repository hinzu:
- `sports`
- `calendar`
- `react`
- `nodejs`
- `typescript`
- `football`
- `f1`
- `nfl`
- `live-scores`
- `docker`
- `api`

## 8. Repository-Description

**Short Description:**
```
Moderne Sport-Event-Verwaltung mit Live-Scores, Kalender-Integration und Community-Features
```

**Website:**
```
https://USERNAME.github.io/sportskalendar
```

## 9. Contributing Guidelines

Erstelle `CONTRIBUTING.md`:

```markdown
# Contributing to SportsKalender

## Getting Started
1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup
See README.md for detailed setup instructions.

## Code Style
- Use TypeScript
- Follow existing code patterns
- Add tests for new features
- Update documentation
```

## 10. Issue Templates

Erstelle `.github/ISSUE_TEMPLATE/bug_report.md` und `.github/ISSUE_TEMPLATE/feature_request.md` für bessere Issue-Verwaltung.

## Fertig! 🎉

Dein Repository ist jetzt bereit für:
- ✅ Open Source Collaboration
- ✅ GitHub Pages Deployment
- ✅ CI/CD mit GitHub Actions
- ✅ Issue Tracking
- ✅ Pull Request Management
- ✅ Community Contributions







