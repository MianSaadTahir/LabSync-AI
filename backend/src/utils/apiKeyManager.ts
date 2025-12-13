/**
 * Gemini API Key Manager
 * Provides load balancing, round-robin rotation, and fallback for multiple API keys
 */

interface ApiKeyStats {
    key: string;
    usageCount: number;
    lastUsed: Date | null;
    errorCount: number;
    isAvailable: boolean;
}

class GeminiApiKeyManager {
    private keys: ApiKeyStats[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.loadKeys();
    }

    /**
     * Load API keys from environment variables
     */
    private loadKeys(): void {
        const keyNames = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'];

        for (const keyName of keyNames) {
            const key = process.env[keyName];
            if (key && key.length > 0 && !key.startsWith('YOUR_')) {
                this.keys.push({
                    key,
                    usageCount: 0,
                    lastUsed: null,
                    errorCount: 0,
                    isAvailable: true,
                });
            }
        }

        if (this.keys.length === 0) {
            console.warn('[GeminiApiKeyManager] No valid Gemini API keys found in environment');
        } else {
            console.log(`[GeminiApiKeyManager] Loaded ${this.keys.length} API key(s) for load balancing`);
        }
    }

    /**
     * Get the next available API key using round-robin rotation
     */
    getNextKey(): string {
        if (this.keys.length === 0) {
            throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY in your .env file.');
        }

        // Find next available key using round-robin
        const startIndex = this.currentIndex;
        let attempts = 0;

        while (attempts < this.keys.length) {
            const keyStats = this.keys[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            attempts++;

            if (keyStats.isAvailable) {
                keyStats.usageCount++;
                keyStats.lastUsed = new Date();
                return keyStats.key;
            }
        }

        // If all keys are unavailable, reset availability and try first key
        this.resetAllKeys();
        const firstAvailable = this.keys[0];
        firstAvailable.usageCount++;
        firstAvailable.lastUsed = new Date();
        return firstAvailable.key;
    }

    /**
     * Get the primary API key (first valid key)
     */
    getPrimaryKey(): string {
        if (this.keys.length === 0) {
            throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY in your .env file.');
        }
        return this.keys[0].key;
    }

    /**
     * Get a specific key by purpose
     */
    getKeyByPurpose(purpose: 'meeting' | 'budget' | 'fallback'): string {
        const purposeMap: Record<string, number> = {
            meeting: 0,
            budget: 1,
            fallback: 2,
        };

        const index = purposeMap[purpose] || 0;
        const key = this.keys[Math.min(index, this.keys.length - 1)];

        if (!key) {
            throw new Error('No Gemini API keys configured.');
        }

        key.usageCount++;
        key.lastUsed = new Date();
        return key.key;
    }

    /**
     * Mark a key as having an error (for temporary exclusion)
     */
    reportError(key: string): void {
        const keyStats = this.keys.find(k => k.key === key);
        if (keyStats) {
            keyStats.errorCount++;
            // Mark unavailable after 3 consecutive errors
            if (keyStats.errorCount >= 3) {
                keyStats.isAvailable = false;
                console.warn(`[GeminiApiKeyManager] Key temporarily disabled after ${keyStats.errorCount} errors`);
            }
        }
    }

    /**
     * Mark a key as successful (reset error count)
     */
    reportSuccess(key: string): void {
        const keyStats = this.keys.find(k => k.key === key);
        if (keyStats) {
            keyStats.errorCount = 0;
            keyStats.isAvailable = true;
        }
    }

    /**
     * Reset all keys to available status
     */
    private resetAllKeys(): void {
        for (const keyStats of this.keys) {
            keyStats.isAvailable = true;
            keyStats.errorCount = 0;
        }
        console.log('[GeminiApiKeyManager] All keys reset to available');
    }

    /**
     * Get statistics about key usage
     */
    getStats(): object {
        return {
            totalKeys: this.keys.length,
            availableKeys: this.keys.filter(k => k.isAvailable).length,
            keys: this.keys.map((k, i) => ({
                index: i + 1,
                usageCount: k.usageCount,
                errorCount: k.errorCount,
                isAvailable: k.isAvailable,
                lastUsed: k.lastUsed?.toISOString() || 'never',
            })),
        };
    }

    /**
     * Check if at least one key is available
     */
    hasAvailableKey(): boolean {
        return this.keys.length > 0 && this.keys.some(k => k.isAvailable);
    }
}

// Singleton instance
let managerInstance: GeminiApiKeyManager | null = null;

export function getGeminiApiKeyManager(): GeminiApiKeyManager {
    if (!managerInstance) {
        managerInstance = new GeminiApiKeyManager();
    }
    return managerInstance;
}

// Convenience exports
export function getNextGeminiApiKey(): string {
    return getGeminiApiKeyManager().getNextKey();
}

export function getPrimaryGeminiApiKey(): string {
    return getGeminiApiKeyManager().getPrimaryKey();
}

export function getGeminiApiKeyForMeeting(): string {
    return getGeminiApiKeyManager().getKeyByPurpose('meeting');
}

export function getGeminiApiKeyForBudget(): string {
    return getGeminiApiKeyManager().getKeyByPurpose('budget');
}

export function reportGeminiApiKeyError(key: string): void {
    getGeminiApiKeyManager().reportError(key);
}

export function reportGeminiApiKeySuccess(key: string): void {
    getGeminiApiKeyManager().reportSuccess(key);
}

export default getGeminiApiKeyManager;
