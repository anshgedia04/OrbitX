import { useState, useEffect, useCallback, useRef } from 'react';
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

    // Use a ref for the cache so updates don't cause re-renders.
    // Cache key = `${friendId}::${first20charsOfPubKey}` — auto-invalidates when the
    // friend regenerates their key pair (e.g. clears localStorage or uses a new device).
    const secretCache = useRef<Record<string, CryptoKey>>({});

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
                    
                    // Re-sync public key to server (in case another device overwrote it)
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
        
        try {
            // Always fetch the current public key from the server.
            // This is a small request and ensures we always have the latest key.
            // If the friend regenerated their keys, we re-derive the shared secret automatically.
            const res = await fetch(`/api/chat/keys?friendId=${friendId}`);
            if (!res.ok) return null;
            
            const { publicKey: friendPubStr } = await res.json();
            if (!friendPubStr) {
                console.warn(`Friend ${friendId} has not set up E2EE yet.`);
                return null;
            }

            // Cache key includes a fingerprint of the public key.
            // If the friend's key changes, this produces a different key → cache miss → re-derive.
            const fingerprint = friendPubStr.slice(20, 60);
            const cacheKey = `${friendId}::${fingerprint}`;
            
            if (secretCache.current[cacheKey]) {
                return secretCache.current[cacheKey];
            }

            const friendPubKey = await importPublicKey(friendPubStr);
            const secret = await deriveSharedSecret(privateKey, friendPubKey);
            
            secretCache.current[cacheKey] = secret;
            return secret;
        } catch (err) {
            console.error('Failed to derive shared secret:', err);
            return null;
        }
    }, [privateKey]);

    // Clear secret cache when switching friends (component stays mounted)
    const clearSecretCache = useCallback(() => {
        secretCache.current = {};
    }, []);

    return { isReady, getSharedSecret, clearSecretCache };
}
