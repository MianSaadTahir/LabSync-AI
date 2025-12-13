/**
 * Utility functions for Telegram webhook setup
 */

interface TelegramWebhookInfo {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    allowed_updates?: string[];
  };
  description?: string;
  error_code?: number;
}

/**
 * Extracts the webhook URL from TELEGRAM_WEBHOOK_URL environment variable
 * Supports two formats:
 * 1. Full Telegram API URL: https://api.telegram.org/bot{TOKEN}/setWebhook?url={WEBHOOK_URL}
 * 2. Direct webhook URL: https://your-domain.com/api/webhook/telegram
 * Returns the actual webhook URL that will receive Telegram updates
 */
export function extractWebhookUrl(): string | null {
  const webhookUrlEnv = process.env.TELEGRAM_WEBHOOK_URL;
  
  if (!webhookUrlEnv) {
    return null;
  }

  try {
    const url = new URL(webhookUrlEnv);
    
    // Check if it's a Telegram API URL (contains 'api.telegram.org')
    if (url.hostname.includes('api.telegram.org')) {
      // Extract the 'url' query parameter
      const webhookUrlParam = url.searchParams.get('url');
      if (webhookUrlParam) {
        return webhookUrlParam;
      }
    } else {
      // It's already a direct webhook URL
      return webhookUrlEnv;
    }
    
    return null;
  } catch (error) {
    // If URL parsing fails, it might be a malformed URL or invalid format
    console.error('[Telegram Webhook] Failed to parse webhook URL:', error);
    return null;
  }
}

/**
 * Registers the webhook URL with Telegram Bot API using YOUR bot token
 * This ensures the webhook is registered for YOUR bot, not someone else's
 * Includes automatic retry logic with exponential backoff
 */
export async function registerTelegramWebhook(maxRetries: number = 3): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = extractWebhookUrl();

  if (!botToken) {
    console.warn('[Telegram Webhook] TELEGRAM_BOT_TOKEN not found in environment variables');
    console.warn('   Make sure you set your bot token in the .env file');
    return false;
  }

  if (!webhookUrl) {
    console.warn('[Telegram Webhook] Webhook URL not found. Set TELEGRAM_WEBHOOK_URL environment variable.');
    console.warn('   Format: https://your-ngrok-url.ngrok-free.dev/api/webhook/telegram');
    return false;
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const fullUrl = `${telegramApiUrl}?url=${encodeURIComponent(webhookUrl)}`;
  
  console.log(`[Telegram Webhook] Registering webhook for your bot...`);
  console.log(`   Using bot token: ${botToken.substring(0, 10)}...`);
  console.log(`   Webhook URL: ${webhookUrl}`);
  console.log(`   Telegram API URL: ${telegramApiUrl}`);
  console.log(`   Max retries: ${maxRetries}`);
  
  // Quick connectivity test first
  try {
    const testController = new AbortController();
    const testTimeout = setTimeout(() => testController.abort(), 5000);
    const testResponse = await fetch('https://api.telegram.org', { 
      method: 'HEAD',
      signal: testController.signal
    });
    clearTimeout(testTimeout);
    console.log(`   ✅ Connectivity test passed (status: ${testResponse.status})`);
  } catch (testError) {
    console.warn(`   ⚠️  Connectivity test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
    console.warn(`   This may indicate network/firewall issues, but will still attempt webhook registration`);
  }

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 2), 10000); // Exponential backoff, max 10s
        console.log(`[Telegram Webhook] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Create AbortController for timeout (increased to 30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP error! Status: ${response.status}`);
          console.error(`   Response: ${errorText}`);
          
          // Don't retry on 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            console.error(`   Client error detected, not retrying`);
            return false;
          }
          
          // Retry on 5xx errors (server errors)
          if (attempt < maxRetries) {
            console.log(`   Server error, will retry...`);
            continue;
          }
          return false;
        }

        const data = await response.json() as { ok: boolean; result?: boolean; description?: string; error_code?: number };

        if (data.ok) {
          // Check if webhook is already set (result: true with description)
          if (data.result === true && data.description?.toLowerCase().includes('already set')) {
            if (attempt > 1) {
              console.log(`✅ Telegram webhook already registered (verified on attempt ${attempt})`);
            } else {
              console.log(`✅ Telegram webhook is already registered for YOUR bot`);
            }
            console.log(`   Bot token: ${botToken.substring(0, 10)}...`);
            console.log(`   Webhook URL: ${webhookUrl}`);
            console.log(`   Description: ${data.description}`);
            console.log(`   Telegram will send updates to your webhook endpoint`);
            return true;
          }
          
          // New webhook registration successful
          if (attempt > 1) {
            console.log(`✅ Telegram webhook registered successfully on attempt ${attempt}`);
          } else {
            console.log(`✅ Telegram webhook registered successfully for YOUR bot`);
          }
          console.log(`   Bot token: ${botToken.substring(0, 10)}...`);
          console.log(`   Webhook URL: ${webhookUrl}`);
          if (data.description) {
            console.log(`   Description: ${data.description}`);
          }
          console.log(`   Telegram will now send updates to your webhook endpoint`);
          return true;
        } else {
          console.error(`❌ Failed to register Telegram webhook:`, data.description || 'Unknown error');
          if (data.error_code) {
            console.error(`   Error code: ${data.error_code}`);
          }
          
          // Don't retry on certain error codes
          if (data.error_code === 401 || data.error_code === 400) {
            console.error(`   Invalid request, not retrying`);
            return false;
          }
          
          // Retry on other errors
          if (attempt < maxRetries) {
            console.log(`   Will retry...`);
            continue;
          }
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(`❌ Request timeout: Telegram API did not respond within 30 seconds`);
          if (attempt < maxRetries) {
            console.log(`   Will retry...`);
            continue;
          }
          console.error(`   All retry attempts exhausted`);
        } else {
          // Network errors - retry with detailed error info
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          const errorName = fetchError instanceof Error ? fetchError.name : 'Unknown';
          const errorCause = fetchError instanceof Error && 'cause' in fetchError ? fetchError.cause : null;
          
          console.error(`❌ Network error (attempt ${attempt}/${maxRetries}): ${errorMessage}`);
          console.error(`   Error type: ${errorName}`);
          
          // Provide more specific error details
          if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
            console.error(`   DNS resolution failed - cannot resolve api.telegram.org`);
            console.error(`   Check your internet connection and DNS settings`);
          } else if (errorMessage.includes('ECONNREFUSED')) {
            console.error(`   Connection refused - Telegram API may be down or blocked`);
          } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
            console.error(`   Connection timeout - network may be slow or unstable`);
          } else if (errorMessage.includes('CERT') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
            console.error(`   SSL/TLS certificate error - check system certificates`);
          } else if (errorCause) {
            console.error(`   Error cause:`, errorCause);
          }
          
          if (attempt < maxRetries) {
            console.log(`   Will retry...`);
            continue;
          } else {
            console.error(`   All retry attempts exhausted`);
            console.error(`\n💡 Troubleshooting tips:`);
            console.error(`   1. Check your internet connection`);
            console.error(`   2. Verify Telegram API is accessible: https://api.telegram.org`);
            console.error(`   3. Check if firewall/proxy is blocking the request`);
            console.error(`   4. Try manually registering: ${fullUrl}`);
            console.error(`   5. Check DNS resolution: nslookup api.telegram.org\n`);
          }
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Unknown';
      
      console.error(`❌ Error registering Telegram webhook (attempt ${attempt}/${maxRetries}):`, errorMessage);
      console.error(`   Error type: ${errorName}`);
      
      if (attempt < maxRetries) {
        console.log(`   Will retry...`);
        continue;
      }
      
      // Provide helpful troubleshooting tips on final failure
      if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        console.error(`\n💡 Troubleshooting tips:`);
        console.error(`   1. Check your internet connection`);
        console.error(`   2. Verify Telegram API is accessible: https://api.telegram.org`);
        console.error(`   3. Check if firewall/proxy is blocking the request`);
        console.error(`   4. Try manually registering: ${fullUrl}\n`);
      }
      
      return false;
    }
  }

  return false;
}

/**
 * Gets the current webhook info for your bot
 * Useful for debugging and verifying webhook setup
 */
export async function getTelegramWebhookInfo(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('[Telegram Webhook] TELEGRAM_BOT_TOKEN not found');
    return;
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(telegramApiUrl);
    const data = await response.json() as TelegramWebhookInfo;

    if (data.ok && data.result) {
      console.log('\n📋 Current Telegram Webhook Info:');
      console.log(`   URL: ${data.result.url || 'Not set'}`);
      console.log(`   Pending updates: ${data.result.pending_update_count || 0}`);
      if (data.result.last_error_message) {
        console.log(`   ⚠️  Last error: ${data.result.last_error_message}`);
        if (data.result.last_error_date) {
          const errorDate = new Date(data.result.last_error_date * 1000);
          console.log(`   Error date: ${errorDate.toLocaleString()}`);
        }
      }
      console.log('');
    } else {
      console.error('Failed to get webhook info:', data.description);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting webhook info:`, errorMessage);
  }
}

