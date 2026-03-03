# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **메가커피 단체 주문** (Mega Coffee Group Ordering) web application - a real-time collaborative coffee ordering system built with vanilla JavaScript and Firebase.

- **Live URL**: https://coffeeorder-94399.web.app/
- **Backend**: Firebase Realtime Database
- **Hosting**: Firebase Hosting
- **Version Format**: 1.YY.M.Count (e.g., 1.26.2.25)

## Architecture

### Frontend
- Vanilla JavaScript SPA (no frameworks)
- Firebase SDK loaded via CDN
- Mobile-first responsive design
- UTF-8 encoding (Korean language support)

### Key Files
- `index.html` - Main ordering interface with real-time cart
- `admin.html` - Name management (add/remove orderers)
- `menu-admin.html` - Menu database management
- `history.html` - Purchase history tracking
- `js/app.js` - Main application logic (~1500 lines)
- `js/firebase-config.js` - Firebase configuration
- `js/menu-data.js` - Fallback menu data (158 items)
- `js/version.js` - Build version info (auto-updated)

### Firebase Database Structure
```
orders/     - Active orders {name, drinks[], timestamp}
names/      - Registered orderer names
menu/       - Menu items {name, category, visible}
favorites/  - User favorites
history/    - Purchase history records
```

## Build & Deploy Commands

### Development
```bash
# Local server (Python 3)
python -m http.server 8000

# Or Node.js
npx http-server -p 8000
```

### Build & Deploy (via build.js)
```bash
# Regular commit (no version bump, no deploy)
node build.js "feat : feature description"

# Deploy to production (version bump + Firebase deploy)
node build.js "deploy : description"
# or
node build.js "feat : description" --deploy

# Documentation only (no version bump)
node build.js "docs : description"
```

### Manual Firebase Deploy
```bash
firebase login
firebase deploy
```

## Commit Message Format

Prefix pattern: `Prefix : CommitLog`

- `feat` - Feature addition/improvement (triggers version bump on deploy)
- `fix` - Bug fix (triggers version bump on deploy)
- `style` - Design changes (no functional change)
- `docs` - Documentation only (excluded from version bump)
- `deploy` - Production deployment (2-stage commit: feature + deploy)

## Key Application Logic

### Order Flow
1. User selects name from dropdown (or enters custom)
2. Selects menu category and drinks
3. ICE/HOT temperature selection
4. "Add to cart" adds to Firebase real-time cart
5. Cart visible to all users in real-time

### Multi-Order Mode
- Checkbox "여러 개 주문하기" enables selecting multiple drinks
- Temporary cart (`tempCart` array) accumulates items
- + button adds to temp cart and checks the checkbox
- "주문 담기" commits temp cart to Firebase

### Limits
- 20 drinks per person
- 100 drinks total
- Auto-clear at midnight (configurable in `startMidnightClearTimer`)

### ICE Only Logic
Centralized in `checkIsIceOnly(menuName, category)`:
- Categories: '에이드&주스', '스무디&프라페' are always ICE only
- '티' category with '아이스' in name
- Specific names: '메가리카노', '할메가커피', '왕메가헛개리카노', '왕메가카페라떼', '딸기라떼', '오레오초코'

## VS Code Configuration

UTF-8 encoding enforced via `.vscode/settings.json`:
```json
{
  "files.encoding": "utf8bom",
  "files.autoGuessEncoding": false
}
```

## Security Notes

- Firebase API key is public (standard for Firebase web apps)
- Database rules should enforce validation server-side
- Admin pages (admin.html, menu-admin.html) require authentication
