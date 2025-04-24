import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";

// Create the context
const SkillQuestContext = createContext();

export const useSkillQuest = () => {
  const context = useContext(SkillQuestContext);
  if (!context) {
    throw new Error('useSkillQuest must be used within a SkillQuestProvider');
  }
  return context;
};

export const SkillQuestProvider = ({ children }) => {
  const { walletProvider } = useAppKitProvider("eip155");
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Initialize provider and signer
  useEffect(() => {
    if (walletProvider) {
      const newProvider = new BrowserProvider(walletProvider);
      setProvider(newProvider);
      
      newProvider.getSigner().then((newSigner) => {
        setSigner(newSigner);
        setUserAddress(newSigner.address);
        setIsConnected(true);
      }).catch((err) => {
        console.error('Error getting signer:', err);
      });
    } else {
      setProvider(null);
      setSigner(null);
      setUserAddress('');
      setIsConnected(false);
    }
  }, [walletProvider]);

  // Context value
  const value = {
    isConnected,
    userAddress,
    provider,
    signer,
  };

  return (
    <SkillQuestContext.Provider value={value}>
      {children}
    </SkillQuestContext.Provider>
  );
};

export default SkillQuestContext; 