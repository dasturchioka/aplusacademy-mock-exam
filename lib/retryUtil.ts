/**
 * Retry utility for network requests with exponential backoff
 */

export interface RetryOptions {
	maxRetries?: number;
	initialDelay?: number;
	maxDelay?: number;
	backoffMultiplier?: number;
	onRetry?: (attempt: number, error: any) => void;
}

const defaultOptions: Required<RetryOptions> = {
	maxRetries: 5, // Increased to 5 attempts for maximum reliability
	initialDelay: 1000, // 1 second
	maxDelay: 10000, // 10 seconds
	backoffMultiplier: 2,
	onRetry: () => {},
};

/**
 * Retry an async function with exponential backoff
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries fail
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	let lastError: any;

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			const result = await fn();
			
			// Success on first try
			if (attempt === 0) {
				console.log(`✅ Operation completed successfully on first attempt`);
			} else {
				console.log(`✅ Operation completed successfully after ${attempt} retry attempt(s)`);
			}
			
			return result;
		} catch (error) {
			lastError = error;

			// If this was the last attempt, throw the error
			if (attempt === opts.maxRetries) {
				console.error(`❌ All ${opts.maxRetries} retry attempts exhausted. Final error:`, error);
				break;
			}

			// Calculate delay with exponential backoff
			const delay = Math.min(
				opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
				opts.maxDelay
			);

			console.warn(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${delay}ms... (${attempt + 1}/${opts.maxRetries} attempts)`, error);
			opts.onRetry(attempt + 1, error);

			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Check if an error is retryable (network errors, 5xx server errors, timeouts)
 */
export function isRetryableError(error: any): boolean {
	// Network errors
	if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
		return true;
	}

	// Axios-specific network errors
	if (error.message && (
		error.message.includes('Network Error') ||
		error.message.includes('timeout') ||
		error.message.includes('ECONNREFUSED')
	)) {
		return true;
	}

	// HTTP 5xx server errors
	if (error.response?.status >= 500 && error.response?.status < 600) {
		return true;
	}

	// 429 Too Many Requests
	if (error.response?.status === 429) {
		return true;
	}

	return false;
}



