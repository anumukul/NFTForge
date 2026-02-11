# NFT Forge

NFT Forge is a full-stack NFT collection project: an ERC721 smart contract with rarity tiers, whitelist and Dutch auction minting, staking, and a Next.js frontend to mint, view, and manage tokens.

**Contract (Sepolia):** `0x438CD632201b5bE27d8753B806fE0D96216b2B17`

---

## What's in the repo

- **contracts/** — Solidity ERC721 contract (OpenZeppelin). Max supply 1000, 10 mints per transaction. Four rarity tiers (Common, Rare, Epic, Legendary) with weighted random assignment, whitelist phase, linear Dutch auction, and in-contract staking. Royalties (EIP-2981), pause, and emergency stop.
- **scripts/** — Hardhat deploy script. Deploys the NFT contract with configurable name, symbol, base URI, contract URI, hidden metadata URI, royalty recipient, and withdraw address.
- **frontend/** — Next.js app (App Router, TypeScript, Tailwind, shadcn/ui). Wallet connection via RainbowKit/Wagmi, pages for home, mint (public/whitelist/auction), my NFTs, staking, collection, auction, stats, and an owner-only admin dashboard.

---

## Quick start

**Contract (Hardhat)**

```bash
npm install
cp .env.example .env   # set PRIVATE_KEY, INFURA_PROJECT_ID, etc.
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID, NEXT_PUBLIC_CHAIN_ID
npm run dev
```

Open http://localhost:3000, connect a wallet on the same network as the contract, and use Mint / My NFTs / Staking / Admin as needed.

---

## Contract overview

- **Minting:** Public single/batch mint, whitelist mint (when phase is active), and Dutch auction mint (price decreases over time; excess ETH refunded).
- **Rarity:** Each mint is assigned a tier at random (Common 60%, Rare 25%, Epic 12%, Legendary 3%) with per-tier supply caps.
- **Staking:** Token owners can stake/unstake; staked tokens cannot be transferred until unstaked. Toggle controlled by admin.
- **Admin:** Owner can pause, set emergency stop, reveal metadata, manage whitelist and auction, withdraw funds, and grant roles (e.g. minter, admin).

The frontend reads from and writes to this contract; set `NEXT_PUBLIC_CONTRACT_ADDRESS` to your deployed instance.

---

## Deploying the frontend

The frontend is set up for Vercel. Use **Root Directory** `frontend`, and add the same env vars as in `.env.local` in the Vercel project (e.g. `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID`). `npm run build` and `npm run lint` both pass from the `frontend` directory.

---

## License

MIT.
