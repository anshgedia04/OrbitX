import { useState, useEffect, useCallback } from 'react';
import { 
    generateKeyPair, 
    exportKey, 
    importPrivateKey, 
    importPublicKey, 
    deriveSharedSecret 
} from '@/lib/crypto';

export function useE2EE(userId?: string) {
    const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    // In-memory cache for shared secrets with friends
    const [sharedSecrets, setSharedSecrets] = useState<Record<string, CryptoKey>>({});

    useEffect(() => {
        async function initKeys() {
            if (!userId) return;
            try {
                const storageKey = `orbitx_e2ee_priv_${userId}`;
                const pubStorageKey = `orbitx_e2ee_pub_${userId}`;
                const storedPriv = localStorage.getItem(storageKey);
                const storedPub = localStorage.getItem(pubStorageKey);
                
                if (storedPriv && storedPub) {
                    const key = await importPrivateKey(storedPriv);
                    setPrivateKey(key);
                    setIsReady(true);
                    
                    // Re-sync public key to server just in case a different browser overwrote it
                    fetch('/api/chat/keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicKey: storedPub })
                    }).catch(console.error);
                } else {
                    // Generate new key pair for this device
                    const keyPair = await generateKeyPair();
                    
                    const exportedPriv = await exportKey(keyPair.privateKey);
                    const exportedPub = await exportKey(keyPair.publicKey);
                    
                    const storageKey = `orbitx_e2ee_priv_${userId}`;
                    const pubStorageKey = `orbitx_e2ee_pub_${userId}`;
                    localStorage.setItem(storageKey, exportedPriv);
                    localStorage.setItem(pubStorageKey, exportedPub);
                    
                    // Upload public key to server
                    await fetch('/api/chat/keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicKey: exportedPub })
                    });
                    
                    setPrivateKey(keyPair.privateKey);
                    setIsReady(true);
                }
            } catch (err) {
                console.error('Failed to initialize E2EE keys:', err);
            }
        }
        initKeys();
    }, [userId]);

    const getSharedSecret = useCallback(async (friendId: string): Promise<CryptoKey | null> => {
        if (!privateKey) return null;
        
        // Return from cache if we already derived it
        if (sharedSecrets[friendId]) {
            return sharedSecrets[friendId];
        }

        try {
            // Fetch friend's public key
            const res = await fetch(`/api/chat/keys?friendId=${friendId}`);
            if (!res.ok) throw new Error('Failed to fetch friend public key');
            
            const { publicKey: friendPubStr } = await res.json();
            if (!friendPubStr) {
                console.warn(`Friend ${friendId} has not set up E2EE yet.`);
                return null; // Cannot chat until they log in and generate keys
            }

            const friendPubKey = await importPublicKey(friendPubStr);
            const secret = await deriveSharedSecret(privateKey, friendPubKey);
            
            setSharedSecrets(prev => ({ ...prev, [friendId]: secret }));
            return secret;
        } catch (err) {
            console.error('Failed to derive shared secret:', err);
            return null;
        }
    }, [privateKey, sharedSecrets]);

    return { isReady, getSharedSecret };
}
