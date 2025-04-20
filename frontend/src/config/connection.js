import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// 1. Get projectId from environment variables
const projectId = import.meta.env.VITE_APP_APPKIT_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not configured in environment variables');
}

const pharosDevnet = defineChain({
  id: 50002,
  caipNetworkId: "eip155:50002",
  chainNamespace: "eip155",
  name: "Pharos Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "PPT",
    symbol: "PPT",
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_APP_PHAROS_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Pharos Scan",
      url: import.meta.env.VITE_APP_PHAROS_EXPLORER_URL,
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
  networks: [pharosDevnet],
  metadata,
  projectId,
  allowUnsupportedChain: false,
  allWallets: "SHOW",
  defaultNetwork: pharosDevnet,
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