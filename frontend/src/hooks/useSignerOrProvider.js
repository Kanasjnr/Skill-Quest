import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useEffect, useMemo, useState } from "react";
import readOnlyProvider from "../Constants/readOnlyProvider";
import { toast } from "react-toastify";

const PHAROS_DEVNET_CHAIN_ID = 50002;

const useSignerOrProvider = () => {
  const [signer, updateSigner] = useState();
  const { walletProvider } = useAppKitProvider("eip155");

  const provider = useMemo(
    () => (walletProvider ? new BrowserProvider(walletProvider) : null),
    [walletProvider]
  );

  useEffect(() => {
    const setupSigner = async () => {
      if (!provider) {
        console.log("No provider available");
        updateSigner(null);
        return;
      }

      try {
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        console.log("Current network chainId:", chainId);

        if (chainId !== PHAROS_DEVNET_CHAIN_ID) {
          console.log("Wrong network, expected Pharos Devnet");
          toast.error("Please switch to Pharos Devnet network");
          updateSigner(null);
          return;
        }

        const newSigner = await provider.getSigner();
        if (!newSigner) {
          console.log("No signer available from provider");
          updateSigner(null);
          return;
        }

        if (newSigner.address === signer?.address) {
          console.log("Signer address unchanged");
          return;
        }

        console.log("New signer set with address:", newSigner.address);
        updateSigner(newSigner);
      } catch (error) {
        console.error("Error setting up signer:", error);
        updateSigner(null);
      }
    };

    setupSigner();
  }, [provider, signer]);

  // Listen for network changes
  useEffect(() => {
    if (!provider) return;

    const handleNetworkChange = async () => {
      try {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        if (chainId !== PHAROS_DEVNET_CHAIN_ID) {
          toast.error("Please switch to Pharos Devnet network");
          updateSigner(null);
        } else {
          // Refresh signer when switching back to correct network
          const newSigner = await provider.getSigner();
          updateSigner(newSigner);
        }
      } catch (error) {
        console.error("Error handling network change:", error);
      }
    };

    provider.on("network", handleNetworkChange);

    return () => {
      provider.off("network", handleNetworkChange);
    };
  }, [provider]);

  return { signer, provider, readOnlyProvider };
};

export default useSignerOrProvider;