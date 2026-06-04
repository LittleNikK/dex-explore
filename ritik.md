# MSWAP: Technical Architecture & System Reference

MSWAP is a decentralized exchange (DEX) interface and liquidity dashboard running on the **MST Testnet Blockchain** (Chain ID: `91562037`). It leverages concentrated liquidity pools based on the Uniswap V3 design, optimized for high performance, real-time tracking, and visual excellence.

---

## 1. Smart Contracts Layer

The smart contract suite is written in **Solidity** and managed using **Foundry** and **Hardhat**. It interfaces directly with Uniswap V3 periphery and core protocols deployed on the MST Network.

### Key Contracts (`contracts/src/`)
* **`WMST.sol`**: An ERC20-compliant Wrapped Native MST token contract (WETH9-style wrapper) enabling native MST to be treated as an ERC20 token for liquidity provision and swap routing.
* **`TestToken.sol`**: Custom ERC20 token contracts (such as mockup USDC) deployed for local and testnet token supply.
* **`LPStateStorage.sol`**: Tracks position metadata. It stores references to active concentrated liquidity coordinates:
  - `lpLiquidity`: Total amount of liquidity in the pool.
  - `lpAmount0` and `lpAmount1`: Token reserves in the pool.
  - `poolAddress`: The exact address of the pool.
* **`testingexecutor.sol`**: A comprehensive testing orchestrator contract that automates swap execution routes and handles test liquidity operations, exposing state keys like `activeTokenId`.
* **Importers/Wrappers**:
  - `UniswapV3FactoryImporter.sol`
  - `SwapRouterImporter.sol`
  - `NonfungiblePositionManagerImporter.sol`
  - `QuoterV2Importer.sol`

### How They Work Together
Uniswap V3 pools manage concentrated liquidity. Users supply token pairs within specific price ticks. The `NonfungiblePositionManager` represents these positions as unique ERC721 NFTs. The `SwapRouter` queries quotes via `QuoterV2` and executes exact-input or exact-output trades.

---

## 2. Backend Stack

The backend is a high-speed event monitoring and order routing server built with **Node.js** and **TypeScript**.

### Technological Stack
* **Runtime**: Node.js & TypeScript
* **HTTP Framework**: Express.js
* **Database ORM**: Prisma (interfacing with PostgreSQL/MySQL)
* **Web3 Integration**: Viem
* **Cache & Pub/Sub Channel**: Redis (`ioredis`)
* **Process Manager**: PM2

### Key Services & Modules (`backend/src/`)
1. **Express REST Server (`index.ts` & `routes/`)**:
   - `/api/tokens`: Lists active trading tokens with details.
   - `/api/pools`: Returns concentrated liquidity pool states.
   - `/api/pools/transactions`: Serves historical pool trade records.
   - `/api/quote`: Uses the **Smart Order Router (SOR)** to calculate optimal paths and output sizes for token swaps.
2. **Viem Event Listener (`events/listener.ts`)**:
   - Subscribes to the Uniswap V3 pool `Swap` events on-chain using a WebSocket RPC connection (`WS_RPC_URL`).
   - Immediately publishes any captured swap logs to the Redis `prices` pub/sub channel.
3. **WebSocket Pub/Sub Server (`ws/server.ts`)**:
   - Starts a WebSocket server at `ws://localhost:3001/ws/prices`.
   - Subscribes to the Redis `prices` channel and instantly fans out swap event notifications to all connected frontend clients.

---

## 3. Frontend Stack

The frontend is a premium, visual-first decentralized application (DApp) that delivers a real-time trading experience.

### Technological Stack
* **Framework**: React.js with TypeScript, bundled using **Vite**.
* **Web3 Connectivity**: **Wagmi** & **Viem** (wallet connection, contract read/write simulation, network switching).
* **State Management**: **Zustand** (swap settings, token states, portfolio caching).
* **Data Fetching & Cache**: **TanStack React Query** (polling and cache invalidation).
* **Styling**: Tailwind CSS + Custom Vanilla CSS.
* **Animations**:
  - **Three.js / WebGL shaders**: Custom fluid simulations.
  - **GSAP**: Magnetic button hover pulls.
  - **Framer Motion**: Smooth 3D card tilt triggers, modal animations.

---

## 4. Key Integrations Done

### 1. Real-time WebSocket Price Streams
We wired a customized `usePriceWs` React hook inside the frontend to connect to the backend WebSocket stream. The moment an on-chain swap event is broadcast:
- The **Swap Dashboard** (`SwapWidget.tsx`) refetches native balances, ERC20 balances, and quotes.
- The **Explore Page** (`ExplorePage.tsx`) invalidates cached tokens, pools, and transaction charts.
- The **Portfolio Page** (`use-wallet-portfolio.ts`) invalidates the portfolio hook, instantly updating net worth and asset allocations.

### 2. GraphQL Subgraph Query Client
We developed `subgraph.service.ts` to fetch transaction logs directly from Graph indexer nodes at `VITE_SUBGRAPH_URL` using GraphQL queries, parsing swap payloads into standardized, high-performance UI logs.

### 3. Smart RPC Fallbacks
If the local GraphQL subgraph node is down or unconfigured, the frontend automatically falls back:
- **Wallet Indexing**: Falls back to direct RPC block querying via Viem (`publicClient.getLogs`), parsing `Transfer` and `Approval` event logs from ERC20 contracts in parallel to reconstruct historical swap logs.
- **Explore Tab**: Falls back to simulated mock transactions to ensure zero UI downtime.

### 4. Concentrated Reserves Calculations
We integrated exact Uniswap V3 mathematical calculations (`src/utils/uniswap-math.ts`) to compute user-level token reserves on-chain. By using the pool's `slot0` (active square root price ratio `sqrtPriceX96`) and the position's `tickLower` and `tickUpper`, the frontend calculates precise USDC and WMST reserve values.

### 5. Premium UI Design upgrades
- **Aurora Background**: Implemented a responsive WebGL fluid noise shader with dynamic glow color scaling.
- **Volumetric Liquidity Lines**: Programmed thicker neon fluid cables with soft volumetric glow elements on the backdrop canvas.
- **Micro-Animations**: Added custom confetti physics particle explosions and GSAP magnetic button pulls on the Swap widget.
- **Header Upgrades**: Standardized the `MSWAP` brand header name, integrated custom vector logos, and enlarged header typography sizes across the application for optimized legibility.
