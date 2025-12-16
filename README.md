# DeFi Scout 🧭

**Find the best DeFi yields** across 8,000+ liquidity pools. Browse APY/TVL data, filter by multiple criteria, and discover high-yield opportunities with global sorting and real-time sparklines.

![demo](./public/demo.gif)

---

## ✨ Features

### Core Functionality
- **Pool Explorer:** Responsive table with key metrics (APY, TVL, Volume, Chain, Platform, Risk)
- **Pool Detail Pages:** Click any pool to view:
  - 30-day historical charts (TVL/Volume, Price, Fees/APY)
  - Token composition breakdown with interactive PieChart
  - Current price display with toggle between token pairs
  - Contract addresses with Explorer links (temporary hardcoded Etherscan for now)
- **Global Column Sorting:** Click headers to sort entire dataset (8k+ pools), not just visible rows
- **Real-time Filtering:** Instant client-side filters by coin/pair, platform, TVL, volume, and risk level
- **Smart Pagination:** Navigate 40 items/page with ellipsis controls and auto-reset on filter/sort changes

### Performance & UX
- **⚡ Sub-second loads:** Fetches and transforms 8k pools in <1s (deferred loading with React Router)
- **Rate-limited Sparklines:** Token bucket algorithm (80 tokens, 1.2/s refill) with circuit breaker
  - Lazy-loaded via IntersectionObserver (200px viewport threshold)
  - Freemium model: Pages 1-3 load instantly, rate-limit fallback shows "Upgrade to Pro"
  - Request queue with concurrency limiting (10 parallel max)
- **Dynamic Platform List:** Auto-generates dropdown from API data with proper branding (43 platforms)
- **Platform Icons:** Automated build script tests icon availability (~10s regeneration)
- **Historical Data:** TheGraph API integration for 30-day pool snapshots

### Design
- **Dark-mode first:** DaisyUI theme with custom 450px mobile breakpoint
- **Sticky columns:** First column persists on horizontal scroll with shadow effect
- **Responsive hiding:** Intelligently collapses columns on mobile (pool → apy → tvl → vol → platform icon)
- **Interactive Charts:** Recharts-powered visualizations with context-aware tooltips
- **Optimized Date Formatting:** Rotated labels ("Dec 22" at 45°) prevent overlap

### 🚧 Coming Soon
- **Range Calculator:** Based on historical data of the pool and desired APY
- **Enhanced Charts:** 1/7/30/90 day toggles for improved control and granularity
- **Watchlist** with Firebase Auth + Firestore persistence
- **PWA capabilities** for offline browsing

---

## 🛠 Tech Stack

| Technology            | Purpose                          |
|-----------------------|----------------------------------|
| **Vite + React**      | Build tool + UI framework        |
| **React Router 6.4+** | Routing with loaders/defer       |
| **TanStack Table v8** | Headless table (manual sorting)  |
| **Recharts**          | Declarative data visualization   |
| **Tailwind + DaisyUI**| Utility-first CSS + components   |
| **The Graph**         | Decentralized GraphQL (subgraphs)|
| **Firebase**          | Auth + Firestore *(planned)*     |
| **DeFiLlama API**     | Real-time pool yield data        |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── common/                  # Reusable UI components
│   │   ├── Dropdown.jsx
│   │   ├── MiniSparkline.jsx
│   │   ├── PaginationControls.jsx
│   │   └── PlatformIcon.jsx
│   ├── pools/                   # Pool explorer components
│   │   ├── PoolsContent.jsx     # Filters + pagination logic
│   │   ├── PoolTable.jsx        # TanStack Table integration
│   │   └── PoolFilters.jsx      # Filter controls UI
│   ├── pool-detail/             # Pool detail page components
│   │   ├── PoolDetail.jsx       # Main detail page
│   │   ├── TokenInfoBlock.jsx   # Token composition + toggle
│   │   ├── PoolCharts.jsx       # Charts container (grid)
│   │   ├── TVLVolumeChart.jsx   # TVL/Volume/Ratio chart
│   │   ├── PriceChart.jsx       # Token price chart (synced toggle)
│   │   ├── FeesApyChart.jsx     # Fees/APY dual-axis chart
│   │   ├── CustomTooltip.jsx    # Generic chart tooltip
│   │   └── CustomPriceTooltip.jsx # Price-specific tooltip
│   └── layout/
│       ├── Layout.jsx
│       └── Navbar.jsx
├── data/
│   └── platformIcons.js         # Auto-generated icon mappings
├── hooks/
│   ├── useBreakpoint.js         # Custom 450px breakpoint
│   ├── useDebounce.js           # Search input optimization
│   ├── useIntersection.js       # Lazy-load visible rows
│   ├── usePoolFilters.js        # Filter state management
│   ├── useRequestQueue.js       # Token bucket rate limiter
│   └── useSparklines.js         # Sparkline data fetching
├── loaders/
│   ├── poolsLoader.js           # React Router data loader (main table)
│   └── poolDetailLoader.js      # Pool detail page loader (TheGraph)
├── pages/
│   ├── Pools.jsx
│   └── Watchlist.jsx            # (Coming soon)
├── scripts/
│   └── testPlatformIcons.js     # Icon availability checker
├── services/
│   └── theGraphClient.js        # GraphQL client for Uniswap V3 data
├── utils/
│   ├── chartColors.js           # Centralized color palette (hex values)
│   ├── filterPools.js           # Client-side filter logic
│   ├── sortPools.js             # Global sorting with type detection
│   ├── formatPoolData.js        # Main table data transformation
│   ├── formatPoolHistory.js     # TheGraph data transformation + APY calc
│   ├── formatCompactCurrency.js # Chart axis formatters ($1.2M)
│   └── formatters.js            # Number/string formatters
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

4. **Regenerate platform icons (optional):**
   ```bash
   node scripts/testPlatformIcons.js
   ```

---

## 🏗️ Architecture Decisions

### Why Client-Side Filtering/Sorting?
DeFiLlama's `/pools` API returns a static snapshot without server-side pagination or sorting parameters. To provide real-time filtering without rate limits, all transformations happen client-side:
```
API (8k pools) → Filter → Sort → Paginate (40 items) → Render
```

### Why TheGraph for Historical Data?
DeFiLlama's `/chart/:poolId` endpoint has aggressive rate limits. TheGraph provides:
- Decentralized infrastructure (no single point of failure)
- GraphQL flexibility (query only needed fields)
- 30-day history in single request (reduces API calls)
- Free tier sufficient for portfolio project scale

### Why Token Bucket for Sparklines?
The `/chart/:poolId` endpoint has undocumented rate limits. Token bucket allows:
- Controlled burst capacity (80 initial requests)
- Sustained throughput (1.2 req/s)
- Circuit breaker on 429 errors (fail-fast, no retry storms)

### Why Manual Sorting in TanStack Table?
Sorting before pagination ensures global ordering across all 8k pools, not just the 40 visible rows. Configured with `manualSorting: true` to prevent double-sorting.

### Why Recharts over D3?
- **Declarative API:** Faster development (3 charts in 2h vs D3's 6h+)
- **React-native:** Built for React (no imperative DOM manipulation)
- **Trade-off:** Less flexibility for custom interactions (acceptable for MVP)

### Why Hex Colors in Charts?
SVG `fill` and `stroke` attributes don't support CSS variables like `hsl(var(--primary))`. Hex values ensure consistent theming across charts.

---

## 🚀 Development Roadmap

- [x] **Phase 0:** Project setup + dependencies
- [x] **Phase 1:** Dark theme + routing skeleton
- [x] **Phase 2:** API integration (DeFiLlama) + data transformation
- [x] **Phase 3:** Filtering system + responsive table UI
- [x] **Phase 4:** Client-side pagination (40 items/page)
- [x] **Phase 5:** Global column sorting with custom comparators
- [x] **Phase 6:** Sticky first column + mobile breakpoint (450px)
- [x] **Phase 7:** Rate-limited sparklines with lazy loading
- [x] **Phase 8:** Pool detail pages (TheGraph + 3 interactive charts)
- [ ] **Phase 9:** Range calculator (based on historical data of the pool and desired APY)
- [ ] **Phase 10:** Firebase auth + watchlist functionality
- [ ] **Phase 11:** PWA configuration + deployment

---

## 📊 Performance Metrics

- **Initial load:** <1s for 8k pools (deferred fetch)
- **Filter latency:** ~50ms (client-side with useMemo)
- **Sort time:** ~80ms for 8k items (O(n log n))
- **Sparkline coverage:** 95% of use cases (pages 1-4 instant, rest throttled)
- **Chart render:** ~100ms for 30 data points (Recharts optimization)
- **Detail page load:** ~300ms (TheGraph query + data transformation)

---

## 📬 Contact

Built by **David Alonso** | [masdavidalonso@gmail.com](mailto:masdavidalonso@gmail.com)  
Live demo: *Coming soon at https://*