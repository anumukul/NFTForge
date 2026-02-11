export interface RarityTier {
  name: string;
  probability: bigint;
  maxSupply: bigint;
  currentSupply: bigint;
  specialAttribute: string;
}

export interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: { trait_type: string; value: string | number }[];
}

export interface NFTToken {
  tokenId: bigint;
  tokenURI: string;
  rarity?: RarityTier;
  rarityName?: string;
  isStaked?: boolean;
  stakingDuration?: number;
  metadata?: TokenMetadata;
}

export interface ContractStats {
  totalSupply: bigint;
  remainingSupply: bigint;
  totalRarityTiers: bigint;
  isRevealed: boolean;
  isStakingEnabled: boolean;
  isWhitelistPhaseActive: boolean;
  isAuctionActive: boolean;
}

export interface AuctionStatus {
  isActive: boolean;
  currentPrice: bigint;
  timeRemaining: bigint;
}
