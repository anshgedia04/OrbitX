// lib/crypto.ts
// Handles End-to-End Encryption using the native Web Crypto API

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generates an ECDH key pair for the user
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
}

/**
 * Exports a key to a JSON Web Key (JWK) format string
 */
export async function exportKey(key: CryptoKey): Promise<string> {
    const jwk = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(jwk);
}

/**
 * Imports a public key from a JWK string
 */
export async function importPublicKey(jwkStr: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkStr);
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        []
    );
}

/**
 * Imports a private key from a JWK string
 */
export async function importPrivateKey(jwkStr: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkStr);
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
}

/**
 * Derives a shared AES-GCM secret using my private key and their public key
 */
export async function deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<CryptoKey> {
    return window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a plaintext message
 */
export async function encryptMessage(
    text: string,
    sharedSecret: CryptoKey
): Promise<{ encryptedContent: string; iv: string }> {
    const enc = new TextEncoder();
    const encodedText = enc.encode(text);
    
    // Generate a unique Initialization Vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv as any,
        },
        sharedSecret,
        encodedText
    );
    
    return {
        encryptedContent: bufferToBase64(ciphertext),
        iv: bufferToBase64(iv.buffer),
    };
}

/**
 * Decrypts a ciphertext message
 */
export async function decryptMessage(
    encryptedContentBase64: string,
    ivBase64: string,
    sharedSecret: CryptoKey
): Promise<string> {
    const ciphertext = base64ToBuffer(encryptedContentBase64);
    const iv = base64ToBuffer(ivBase64);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(iv) as any,
        },
        sharedSecret,
        ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
}
