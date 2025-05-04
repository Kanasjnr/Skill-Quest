import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import useSignerOrProvider from './useSignerOrProvider';

const useContract = (address, abi) => {
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const { signer, provider, readOnlyProvider } = useSignerOrProvider();

  useEffect(() => {
    const initializeContract = async () => {
      if (!address || !abi) {
        console.log("[DEBUG] No contract address or ABI provided");
        return;
      }

      try {
        console.log("[DEBUG] Initializing contract with address:", address);
        console.log("[DEBUG] Available providers:", { 
          hasSigner: !!signer, 
          hasProvider: !!provider, 
          hasReadOnlyProvider: !!readOnlyProvider 
        });

        // Use readOnlyProvider if signer is not available
        const contractProvider = signer || provider || readOnlyProvider;
        
        if (!contractProvider) {
          console.log("[DEBUG] No provider available for contract initialization");
          setError("No provider available");
          return;
        }

        console.log("[DEBUG] Using provider:", contractProvider.constructor.name);
        const contractInstance = new Contract(address, abi, contractProvider);
        console.log("[DEBUG] Contract instance created");
        setContract(contractInstance);
        setError(null);
      } catch (err) {
        console.error("[DEBUG] Error initializing contract:", err);
        setError(err.message);
      }
    };

    initializeContract();
  }, [address, abi, signer, provider, readOnlyProvider]);

  return { contract, error };
};

export default useContract;