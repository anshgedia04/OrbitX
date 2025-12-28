// Simple in-memory blacklist
// Note: This will not work across multiple server instances or serverless functions reliably.
// For production, use Redis or a database.
export const tokenBlacklist = new Set<string>();

export function addToBlacklist(token: string) {
    tokenBlacklist.add(token);
}

export function isBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
}
