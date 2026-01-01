// MCP Server Configuration

/**
 * API Key Manager for load balancing across multiple Gemini API keys
 */
class GeminiKeyManager {
  private keys: string[] = [];
  private currentIndex = 0;
  private usageCounts: Map<number, number> = new Map();

  constructor() {
    // Load all available API keys
    const keyNames = [
      "GEMINI_API_KEY",
      "GEMINI_API_KEY_2",
      "GEMINI_API_KEY_3",
      "GEMINI_API_KEY_4",
    ];
    for (const keyName of keyNames) {
      const key = process.env[keyName];
      if (key && key.length > 0) {
        if (key.startsWith("YOUR_")) {
          console.warn(
            `[MCP Config] ⚠️  Skipping default placeholder key: ${keyName}`
          );
          continue;
        }
        this.keys.push(key);
        this.usageCounts.set(this.keys.length - 1, 0);
        console.log(
          `[MCP Config] ✅ Loaded key: ${keyName} (${key.substring(
            0,
            4
          )}...${key.substring(key.length - 4)})`
        );
      }
    }

    if (this.keys.length > 0) {
      console.log(
        `[MCP Config] 🚀 Ready with ${this.keys.length} valid Gemini API key(s)`
      );
    } else {
      console.error("[MCP Config] ❌ No valid Gemini API keys found!");
    }
  }

  /**
   * Get next API key using round-robin rotation
   */
  getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error("No Gemini API keys configured");
    }

    const key = this.keys[this.currentIndex];
    this.usageCounts.set(
      this.currentIndex,
      (this.usageCounts.get(this.currentIndex) || 0) + 1
    );
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Get primary (first) API key
   */
  getPrimaryKey(): string {
    if (this.keys.length === 0) {
      throw new Error("No Gemini API keys configured");
    }
    return this.keys[0];
  }

  /**
   * Get specific key for a purpose (0=meeting, 1=budget, 2=fallback)
   */
  getKeyForPurpose(purpose: "meeting" | "budget" | "fallback"): string {
    const purposeMap = { meeting: 0, budget: 1, fallback: 2 };
    const index = Math.min(purposeMap[purpose] || 0, this.keys.length - 1);
    return this.keys[index] || this.getPrimaryKey();
  }

  hasKeys(): boolean {
    return this.keys.length > 0;
  }

  getKeyCount(): number {
    return this.keys.length;
  }
}

// Singleton instance
let keyManagerInstance: GeminiKeyManager | null = null;

export function getGeminiKeyManager(): GeminiKeyManager {
  if (!keyManagerInstance) {
    keyManagerInstance = new GeminiKeyManager();
  }
  return keyManagerInstance;
}

// Server configuration
export const config = {
  port: process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001,
  host: process.env.MCP_SERVER_HOST || "localhost",
  nodeEnv: process.env.NODE_ENV || "development",

  // API key access functions
  getGeminiApiKey: (): string => getGeminiKeyManager().getNextKey(),
  getGeminiApiKeyForMeeting: (): string =>
    getGeminiKeyManager().getKeyForPurpose("meeting"),
  getGeminiApiKeyForBudget: (): string =>
    getGeminiKeyManager().getKeyForPurpose("budget"),
  hasGeminiApiKeys: (): boolean => getGeminiKeyManager().hasKeys(),
  getGeminiKeyCount: (): number => getGeminiKeyManager().getKeyCount(),
};
