# DeFi Scout 🧭

**Explore and analyze Uniswap V3 liquidity pools.** Browse the top 1,000 pools by TVL, filter by multiple criteria, dig into historical charts, and simulate LP strategies before committing capital.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)

**🔗 [Live Demo](https://defiscout.netlify.app)**

![demo](./public/demo.gif)

---

## ✨ Features

### Pool Explorer

- Responsive table with key metrics: APY, TVL, 24h Volume, platform, and 14-day sparklines
- **Global sorting** — clicking a column header sorts the full 1,000-pool dataset, not just the current page
- **Client-side filtering** by token/pair name, platform (multi-select), minimum TVL, minimum volume, and risk level
- Filter state lives in the URL, so searches are shareable and survive a refresh
- Paginated 40 pools/page with ellipsis controls that reset automatically on filter or sort change
- Star any pool to save it to your watchlist

### Pool Detail & Analytics

Click any pool to get a full breakdown:

- **KPI cards** — current TVL, 24h volume, and 7-day average APY
- **30-day TVL/Volume chart** from TheGraph historical snapshots
- **Hourly price chart** (last 7 days) with the user's LP range overlaid as a reference band
- **Liquidity distribution chart** — on-chain tick data rendered as a bar chart, showing where liquidity is concentrated relative to the current price and the user's selected range
- Links to Etherscan and DexScreener

### Range Calculator

Built on top of the pool detail data:

- Input capital, min/max price range, and an assumed entry price
- The calculator simulates fee accrual by replaying the last 168 hourly snapshots against the given range, estimating what portion of pool fees the position would have captured
- **IL Projection** — models HODL vs LP outcomes under a user-defined future price scenario, accounting for impermanent loss and projected fee earnings
- Preset range buttons (±5%, ±10%, ±20%) and tick-aligned increment/decrement controls
- Price range auto-initializes from the pool's on-chain liquidity distribution (inferred from tick data)
- Token pair can be flipped; range inputs invert automatically
- One-click link to open the configured position directly on Uniswap

### Watchlist

- Firebase Auth (Google) for sign-in
- Starred pools persisted to Firestore per user
- Watchlist page reuses the same table and sparkline infrastructure as the main explorer

---

## 🛠 Tech Stack

| Technology             | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| **TypeScript**         | Full codebase type safety                      |
| **Vite + React**       | Build tool + UI framework                      |
| **React Router 6.4+**  | Routing with data loaders                      |
| **TanStack Table v8**  | Headless table with manual sorting             |
| **Recharts**           | Declarative chart library                      |
| **Tailwind + DaisyUI** | Utility-first CSS + component primitives       |
| **TheGraph**           | GraphQL subgraphs for Uniswap V3 on-chain data |
| **Firebase**           | Google Auth + Firestore watchlist persistence  |
| **Vitest**             | Unit tests for the calculation pipeline        |

---

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/dalonsodev/defi-scout.git
cd defi-scout

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Add your TheGraph API key and Firebase config to .env

# 4. Start the dev server
npm run dev
```

Other useful commands:

```bash
npm test          # Run unit tests (Vitest)
npm run typecheck # TypeScript type check (no emit)
npm run build     # Production build
```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── common/              # Shared UI primitives (Dropdown, PaginationControls, etc.)
│   ├── layout/              # App shell (Layout, Navbar, BackgroundVisuals)
│   ├── pools/               # Pool explorer (PoolTable, PoolFilters, PoolsContent)
│   │   ├── cells/           # Custom cell renderers (SparklineCell)
│   │   └── utils/           # filterPools, sortPools
│   └── pool-detail/
│       ├── charts/          # LiquidityChart, PriceChart, TVLVolumeChart
│       └── calculator/      # RangeCalculator and all simulation logic
│           ├── hooks/       # usePoolHourlyData, useProjectionCalculator
│           ├── pipeline/    # Pure calculation steps (fees, composition, validation)
│           └── utils/       # Math helpers (IL, ticks, token ratios)
├── constants/               # Shared constants (chartColors)
├── context/                 # AuthContext (Firebase session)
├── data/                    # platformIcons (auto-generated)
├── hooks/                   # Shared custom hooks (see hooks/README.md)
├── loaders/                 # React Router data loaders
│   └── utils/               # formatPoolData, formatPoolHistory, formatHourlyData
├── pages/                   # Route-level components (Pools, Watchlist)
├── services/                # theGraphClient (all GraphQL queries)
├── utils/                   # Formatters, URL state helpers, misc utilities
├── router.tsx
└── main.tsx
```

---

## 🏗️ Architecture Notes

### Why TheGraph for everything?

All data — pool list, sparklines, historical charts, hourly prices, and tick distribution — comes from TheGraph's Uniswap V3 subgraph. The original plan used DeFiLlama for the pool list and its `/chart/:poolId` endpoint for sparklines, but the rate limits on that endpoint were aggressive enough to make the sparkline UX unreliable. Moving everything to TheGraph meant a single GraphQL client, one API key to manage, and batch queries that fetch 40 sparklines in one round trip instead of 40 sequential REST calls.

### Why client-side filtering and sorting?

TheGraph's pool queries don't support arbitrary filter combinations or multi-column sorting server-side. Loading the top 1,000 pools once and handling everything in-browser keeps the UI instant after the initial fetch — filter latency is a `useMemo` call, not a network round trip.

### Why manual sorting in TanStack Table?

`manualSorting: true` tells TanStack not to sort the data it receives. Sorting happens before pagination, so the order reflects the full 1,000-pool dataset rather than just the 40 visible rows.

### Why URL state for filters?

Storing filter state in search params means the browser back button works as expected, filtered views are bookmarkable and shareable, and there's no extra state management layer on top of React Router.

### Sparklines: batch query + session cache

IntersectionObserver tracks which rows are in the viewport. When new pools become visible, `useSparklines` fires a single batched GraphQL query for all uncached pool IDs. Results are stored in a ref-based session cache, so scrolling back up never re-fetches. Page 2+ shows an "Upgrade to Pro" placeholder (freemium gate — the batch query cost scales with volume).

### Range calculator simulation

The calculator doesn't call any API at runtime. It replays the last 168 hourly snapshots (fetched once on page load) against the user's price range, computing what share of pool liquidity the position would have represented each hour and scaling the fee output accordingly. IL projection uses the standard Uniswap V2/V3 formula and assumes fees accrue linearly — accurate enough for ±20% price moves over typical rebalancing windows.

> See [`src/docs/FEE_CALCULATION.md`](./src/docs/FEE_CALCULATION.md) for the full mathematical breakdown of the liquidity-based fee simulation.

### Hex colors in charts

SVG `fill` and `stroke` attributes don't resolve CSS custom properties like `hsl(var(--primary))`. Colors are defined as hex constants so charts stay consistent with the DaisyUI theme without runtime resolution issues.

---

## 📬 Contact

Built by **David Alonso**
[GitHub](https://github.com/dalonsodev) · [masdavidalonso@gmail.com](mailto:masdavidalonso@gmail.com)
