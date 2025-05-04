import { ethers } from "ethers";

const readOnlyProvider = new ethers.JsonRpcProvider(
  import.meta.env.VITE_APP_PHAROS_RPC_URL
);

export default readOnlyProvider;