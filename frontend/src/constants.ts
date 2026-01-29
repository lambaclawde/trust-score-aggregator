/**
 * Application constants.
 */

// Contract addresses
export const CONTRACTS = {
  IDENTITY_REGISTRY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  REPUTATION_REGISTRY: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  // Oracle address will be added after deployment
  ORACLE: '',
} as const

// Chain configuration
export const CHAINS = {
  MAINNET: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io',
  },
} as const

// API configuration
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  RATE_LIMITS: {
    FREE: 100,
    BASIC: 10000,
    PREMIUM: 100000,
  },
} as const

// Scoring parameters
export const SCORING = {
  HALF_LIFE_DAYS: 90,
  MAX_SCORE: 100,
  MIN_SCORE: 0,
  THRESHOLDS: {
    EXCELLENT: 80,
    GOOD: 60,
    NEUTRAL: 40,
    POOR: 20,
  },
} as const

// Oracle pricing
export const PRICING = {
  QUERY_FEE_ETH: 0.001,
  API_TIERS: {
    FREE: { price: 0, requests: 100 },
    BASIC: { price: 29, requests: 10000 },
    PREMIUM: { price: 199, requests: 100000 },
  },
} as const

// Links
export const LINKS = {
  GITHUB: 'https://github.com/lambaclawde/trust-score-aggregator',
  DOCS: '/docs',
  ERC8004_SPEC: 'https://eips.ethereum.org/EIPS/eip-8004',
} as const
