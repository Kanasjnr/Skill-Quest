import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// 1. Get projectId from environment variables
const projectId = import.meta.env.VITE_APP_APPKIT_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not configured in environment variables');
}

const pharosTestnet = defineChain({
  id: 688688,
  caipNetworkId: "eip155:688688",
  chainNamespace: "eip155",
  name: "Pharos Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "PHRS",
    symbol: "PHRS",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.dplabs-internal.com"],
      webSocket: ["wss://testnet.dplabs-internal.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Pharos Explorer",
      url: "https://testnet.pharosscan.xyz",
    },
  },
  contracts: {
    // Add the contracts here
  },
});

// 3. Create a metadata object - optional
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 4. Create a AppKit instance
export const appkit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [pharosTestnet],
  metadata,
  projectId,
  allowUnsupportedChain: false,
  allWallets: "SHOW",
  defaultNetwork: pharosTestnet,
  enableEIP6963: true,
  themeVariables: {
    '--w3m-color-mix': '#1c1917',
    '--w3m-color-mix-strength': 40,
    "--wcm-accent-color": "#4CAF50",
  },
  themeMode: "dark",
  features: {
    analytics: false,
    allWallets: true,
    email: false,
    socials: [],
    recommendedWallets: false,
    walletImages: false,
  },
});