import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const resetWalletState = () => {
        setWalletAddress(null);
        setProvider(null);
        setSigner(null);
        setIsConnected(false);
    };

    useEffect(() => {
        const checkWalletConnection = async () => {
            if (window.ethereum) {
                try {
                    const web3Provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await web3Provider.listAccounts();
                    if (accounts.length > 0) {
                        const account = accounts[0];
                        setWalletAddress(account);
                        setProvider(web3Provider);
                        setSigner(web3Provider.getSigner());
                        setIsConnected(true);
                    } else {
                        resetWalletState();
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                    resetWalletState();
                }
            } else {
                console.warn('No Ethereum provider found. Install MetaMask.');
            }
        };

        checkWalletConnection();

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                const newSigner = await newProvider.getSigner();
                setWalletAddress(accounts[0]);
                setProvider(newProvider);
                setSigner(newSigner);
                setIsConnected(true);
            } else {
                resetWalletState();
            }
        };

        const handleChainChanged = async () => {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const newSigner = await newProvider.getSigner();
            const newAddress = await newSigner.getAddress();
            setProvider(newProvider);
            setSigner(newSigner);
            setWalletAddress(newAddress);
            setIsConnected(true);
        };

        // Add event listeners if Ethereum is available
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        // Clean up the event listeners if Ethereum is available
        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await web3Provider.send('eth_requestAccounts', []);
                if (accounts.length > 0) {
                    const account = accounts[0];
                    setWalletAddress(account);
                    setProvider(web3Provider);
                    setSigner(web3Provider.getSigner());
                    setIsConnected(true);
                } else {
                    resetWalletState();
                }
            } catch (error) {
                resetWalletState();
            }
        } else {
            // Dismiss any existing toast with the same content before showing a new one
            toast.dismiss();
    
            toast.dark(
                <>
                    MetaMask is not installed. Please install it to use this feature.{' '}
                    <br />🦊 <a 
                        href="https://metamask.io/download.html" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: '#fff', textDecoration: 'underline' }}
                    >
                        Download MetaMask
                    </a>
                </>, 
                { autoClose: false, closeOnClick: false }
            );
        }
    };    

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                provider,
                signer,
                isConnected,
                connectWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
