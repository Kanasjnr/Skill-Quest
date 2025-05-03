import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "hardhat-coverage";
import * as dotenv from "dotenv";

dotenv.config();

// Get private key from environment variables for security
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Check if private key is available
if (!PRIVATE_KEY) {
  console.warn("Warning: PRIVATE_KEY not found in .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true, // IR-based code generator enabled
    },
  },
  networks: {
    pharosDevnet: {
      url: "https://devnet.dplabs-internal.com",
      chainId: 50002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 5000000,
      gasPrice: 10000000000, 
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
  sourcify: {
    enabled: false,
  },
};

export default config;