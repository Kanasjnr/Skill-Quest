import { ethers } from "ethers";

const readOnlyProvider = new ethers.JsonRpcProvider(
  "https://testnet.dplabs-internal.com"
);

export default readOnlyProvider;