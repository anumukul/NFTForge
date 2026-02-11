# NFT Forge Frontend

Production-ready Next.js frontend for the NFT Forge ERC721 contract. Supports minting (public, whitelist, Dutch auction), staking, rarity tiers, and full admin controls.

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript** (strict)
- **Wagmi v2** + **RainbowKit** + **Viem** for Web3
- **Tailwind CSS** + **shadcn/ui** + **Framer Motion**
- **TanStack Query** (React Query) + **Zustand**
- **React Hot Toast** + **date-fns**

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` – from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` – your deployed NFT contract address
   - `NEXT_PUBLIC_CHAIN_ID` – e.g. `11155111` (Sepolia) or `1` (Mainnet)
   - `NEXT_PUBLIC_ALCHEMY_API_KEY` (optional) – for better RPC

3. **Run development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – run ESLint

## Contract ABI

The app uses the ABI in `lib/abi.json`. It is generated from the Hardhat project’s compiled contract. To refresh it after contract changes:

```bash
# From the repo root (NFTForge)
npx hardhat compile
node -e "const a = require('./artifacts/contracts/NFTContract.sol/NFTContract.json'); require('fs').writeFileSync('./frontend/lib/abi.json', JSON.stringify(a.abi, null, 2));"
```

## Pages

- **/** – Home: hero, supply, rarity tiers, recent mints, FAQ
- **/mint** – Public, whitelist, and auction mint tabs
- **/my-nfts** – Owned NFTs grid with detail modal, stake/unstake
- **/staking** – Unstaked vs staked lists, stake/unstake actions
- **/collection** – All minted NFTs, paginated, rarity distribution
- **/auction** – Dutch auction status, current price, countdown, mint
- **/stats** – Supply, rarity stats, staking/auction state
- **/admin** – Owner-only: mint, whitelist phase, auction, reveal, emergency, withdraw

## Features

- Wallet connect (RainbowKit) with network indicator
- Public mint (single + batch up to 10)
- Whitelist mint with phase and remaining mints
- Dutch auction mint with live price and countdown
- Staking: stake/unstake per token
- Rarity tiers (Common, Rare, Epic, Legendary) with supply and odds
- Token metadata and images (IPFS-friendly)
- Admin: owner mint, reveal, pause, emergency stop, withdraw, whitelist phase, start/end auction

## Notes

- Ensure the contract is deployed and `NEXT_PUBLIC_CONTRACT_ADDRESS` points to it on the correct chain.
- For “My NFTs”, ownership is resolved by scanning token IDs up to a limit (300); for very large collections consider an indexer or subgraph.
