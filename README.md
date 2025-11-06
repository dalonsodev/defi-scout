# Defi Scout 🧭

**Find the best DeFi yields** across pools. Browse APY/TVL, filter by chain/risk, save favorites, and track performance with animated charts.

![demo](./public/demo.gif)

---

## Features

- **Pool Explorer:** Responsive grid with cards including DeFi relevant metrics (APY, TVL, chain)
- **Smart Filters:** Chain, risk level, APY range (`useSearchParams`)
- **Watchlist:** Save pools with ⭐ (Firebase Auth + Firestore)
- **Multi-timeframe Chart:** 7/30/90/180d APY history (Recharts, animated)
- **PWA + Dark Mode:** Installable, mobile-first, DaisyUI

---

## Tech Stack

| Tech               | Use       |
|--------------------|-----------|
| Vite + React       | Core      |
| Tailwind + DaisyUI | UI (dark) |
| Recharts           | Charts    |
| React Router       | Routing   |
| Firebase           | Auth + DB |

---

## Project Structure

src/
├── loaders/
│   ├── poolsLoader.js
│   └── watchlistLoader.js
├── router.jsx
├── layout/
│   ├── Layout.jsx
│   └── Navbar.jsx
├── pages/
│   ├── Pools.jsx
│   └── Watchlist.jsx
├── App.jsx
├── index.css
└── main.jsx

---

## 🏗️ Setup and Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/dalonsodev/defi-scout.git
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Run the development server:**
    ```bash
    npm start
    ```

---

## Development Process

- [x] 0. Main Deps install + initial configuration
- [x] 1. Skeleton + dark theme + basic routing
- [] 2. 20 mock pools + filters
- [] 3. Firebase + watchlist
- [] 4. Animated chart + PWA
- [] 5. Deploy + launch

---

## 📬 Contact

For questions or feedback, reach out at **masdavidalonso@gmail.com**.  
A live demo will be available at **https://** once deployed.