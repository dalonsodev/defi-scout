# Defi Scout 🧭

**Find the best DeFi yields** across liquidity pools. Browse APY/TVL data, filter by multiple criteria, and discover high-yield opportunities in real-time.

![demo](./public/demo.gif)

---

## ✨ Features

- **Real-time Pool Data:** Fetches 18k+ pools from DeFiLlama API with optimized loading (~1s)
- **Advanced Filtering:** Search by coin/pair, platform, TVL, volume, and risk level
- **Smart UX:** Instant client-side filtering with responsive table/cards layout
- **Dynamic Platform List:** Dropdown auto-generates from available data
- **Sortable Columns:** Click headers to sort by any metric
- **Mobile-First:** Responsive design with card view for smaller screens

### 🚧 In Progress
- Pagination for large datasets
- Watchlist with Firebase Auth
- APY history charts (7/30/90d)
- PWA capabilities

---

## 🛠 Tech Stack

| Tech                   | Purpose              |
|------------------------|----------------------|
| **Vite + React**       | Build tool + UI      |
| **React Router 6**     | Routing + loaders    |
| **TanStack Table**     | Table management     |
| **Tailwind + DaisyUI** | Styling + components |
| **Firebase**           | Auth + Firestore (planned) |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Dropdown.jsx
│   │   └── MiniSparkline.jsx
│   ├── pools/           # Pool feature components
│   │   ├── PoolsContent.jsx
│   │   ├── PoolTable.jsx
│   │   ├── PoolCards.jsx
│   │   └── PoolFilters.jsx
│   └── layout/
│       ├── Layout.jsx
│       └── Navbar.jsx
├── hooks/
│   ├── useDebounce.js
│   └── usePoolFilters.js
├── loaders/
│   ├── poolsLoader.js
│   └── watchlistLoader.js
├── pages/
│   ├── Pools.jsx
│   └── Watchlist.jsx
├── utils/
│   ├── filterPools.js
│   └── riskBadge.js
├── router.jsx
└── main.jsx
```

---

## 🏗️ Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dalonsodev/defi-scout.git
   cd defi-scout
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Development Roadmap

- [x] Initial setup + routing + dark theme
- [x] DeFiLlama API integration
- [x] Optimized data loading (defer + streaming)
- [x] Advanced filter system (5+ criteria)
- [x] Responsive table with sorting
- [x] Feature-based architecture
- [ ] Pagination for 18k+ pools
- [ ] Lazy-loaded sparkline charts
- [ ] PoolDetails page for each pool (table row or card)
- [ ] Firebase authentication
- [ ] Watchlist functionality
- [ ] PWA + offline support
- [ ] Production deployment

---

## 📬 Contact

For questions or feedback, reach out at **masdavidalonso@gmail.com**.  
A live demo will be available at **https://** once deployed.