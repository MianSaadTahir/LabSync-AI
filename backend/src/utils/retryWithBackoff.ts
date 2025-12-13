/**
 * Retry a function with exponential backoff
 * Handles quota limits and respects Retry-After headers
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a retryable error (503, 429, network errors)
      const isRetryable = 
        error?.status === 503 || 
        error?.status === 429 ||
        error?.statusText === 'Service Unavailable' ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('quota') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT';
      
      // Check if it's a quota exceeded error (don't retry immediately, wait longer)
      const isQuotaExceeded = 
        error?.status === 429 && 
        (error?.message?.includes('quota') || error?.message?.includes('Quota exceeded'));
      
      if (!isRetryable || attempt === maxRetries) {
        // If quota exceeded, provide helpful message
        if (isQuotaExceeded) {
          const retryAfterMatch = error?.message?.match(/retry in ([\d.]+)s/i);
          const retryAfter = retryAfterMatch ? parseFloat(retryAfterMatch[1]) * 1000 : null;
          
          if (retryAfter) {
            console.warn(
              `[Quota] API quota exceeded. Please wait ${Math.round(retryAfter / 1000)}s or upgrade your plan.`
            );
          } else {
            console.warn(
              `[Quota] API quota exceeded. Free tier limit: 20 requests/day. Please wait or upgrade your plan.`
            );
          }
        }
        throw error;
      }
      
      // For quota errors, use longer delays
      let delay: number;
      if (isQuotaExceeded) {
        // Extract retry delay from error message if available
        const retryAfterMatch = error?.message?.match(/retry in ([\d.]+)s/i);
        if (retryAfterMatch) {
          delay = parseFloat(retryAfterMatch[1]) * 1000;
          // Cap at 5 minutes for quota errors
          delay = Math.min(delay, 300000);
        } else {
          // Default to 60 seconds for quota errors
          delay = 60000;
        }
      } else {
        // Calculate delay with exponential backoff for other errors
        delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        delay = delay + jitter;
      }
      
      const delaySeconds = Math.round(delay / 1000);
      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${delaySeconds}s...`,
        isQuotaExceeded ? '(Quota limit - waiting longer)' : error.message.substring(0, 100)
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

