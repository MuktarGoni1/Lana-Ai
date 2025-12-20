/**
 * Error handling utility with page reload functionality
 * Implements robust error recovery with max retry attempts
 */

interface ErrorState {
  reloadAttempts: number;
  lastError: string | null;
  timestamp: number;
}

const ERROR_STATE_KEY = 'lana_error_state';
const MAX_RELOAD_ATTEMPTS = 3;

/**
 * Get current error state from sessionStorage
 */
function getErrorState(): ErrorState | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    
    const state = sessionStorage.getItem(ERROR_STATE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (e) {
    console.warn('[ErrorHandler] Failed to get error state:', e);
    return null;
  }
}

/**
 * Set error state in sessionStorage
 */
function setErrorState(state: ErrorState): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(ERROR_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[ErrorHandler] Failed to set error state:', e);
  }
}

/**
 * Clear error state from sessionStorage
 */
function clearErrorState(): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(ERROR_STATE_KEY);
  } catch (e) {
    console.warn('[ErrorHandler] Failed to clear error state:', e);
  }
}

/**
 * Handle error with reload logic
 * @param error - The error that occurred
 * @param customMessage - Custom message to display to user
 */
export function handleErrorWithReload(error: unknown, customMessage?: string): void {
  console.error('[ErrorHandler] Error occurred:', error);
  
  // Get current error state
  let errorState = getErrorState();
  
  // Initialize error state if not exists
  if (!errorState) {
    errorState = {
      reloadAttempts: 0,
      lastError: null,
      timestamp: Date.now()
    };
  }
  
  // Increment reload attempts
  errorState.reloadAttempts += 1;
  errorState.lastError = error instanceof Error ? error.message : String(error);
  errorState.timestamp = Date.now();
  
  // Update error state
  setErrorState(errorState);
  
  // If we've exceeded max attempts, show recovery options
  if (errorState.reloadAttempts >= MAX_RELOAD_ATTEMPTS) {
    handleMaxRetriesReached(customMessage);
    return;
  }
  
  // Show loading message and reload page
  showLoadingMessage(customMessage);
  
  // Reload current page after a short delay
  setTimeout(() => {
    try {
      window.location.reload();
    } catch (reloadError) {
      console.error('[ErrorHandler] Failed to reload page:', reloadError);
      // Fallback to manual refresh message
      showManualRefreshMessage(customMessage);
    }
  }, 2000);
}

/**
 * Handle case when max retry attempts are reached
 */
function handleMaxRetriesReached(customMessage?: string): void {
  // Clear error state
  clearErrorState();
  
  // Create recovery UI
  const recoveryContainer = document.createElement('div');
  recoveryContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  `;
  
  recoveryContainer.innerHTML = `
    <div style="background: #333; padding: 30px; border-radius: 10px; max-width: 500px;">
      <h2 style="margin-top: 0;">Still Having Issues</h2>
      <p>${customMessage || 'We\'re having trouble processing your request after multiple attempts.'}</p>
      <p>Please contact support or try refreshing the page manually.</p>
      <div style="margin: 20px 0;">
        <button id="manual-refresh-btn" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        ">Refresh Page</button>
        <button id="contact-support-btn" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        ">Contact Support</button>
      </div>
      <p style="font-size: 14px; opacity: 0.8;">Support: support@lanamind.com</p>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(recoveryContainer);
  
  // Add event listeners
  const refreshBtn = recoveryContainer.querySelector('#manual-refresh-btn');
  const contactBtn = recoveryContainer.querySelector('#contact-support-btn');
  
  refreshBtn?.addEventListener('click', () => {
    try {
      window.location.reload();
    } catch (e) {
      console.error('[ErrorHandler] Manual refresh failed:', e);
    }
  });
  
  contactBtn?.addEventListener('click', () => {
    try {
      window.open('mailto:support@lanamind.com', '_blank');
    } catch (e) {
      console.error('[ErrorHandler] Failed to open email client:', e);
      // Fallback: copy email to clipboard or show alert
      alert('Please contact support@lanamind.com for assistance.');
    }
  });
}

/**
 * Show loading message during reload
 */
function showLoadingMessage(customMessage?: string): void {
  // Create loading overlay
  const overlay = document.createElement('div');
  overlay.id = 'error-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
  `;
  
  overlay.innerHTML = `
    <div style="
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 20px;
    "></div>
    <p style="font-size: 18px; margin: 0;">${customMessage || 'Processing your request, please wait...'}</p>
    <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.8;">Attempt ${getErrorState()?.reloadAttempts || 1} of ${MAX_RELOAD_ATTEMPTS}</p>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  
  // Add to DOM
  document.body.appendChild(overlay);
}

/**
 * Show manual refresh message as fallback
 */
function showManualRefreshMessage(customMessage?: string): void {
  // Remove any existing overlay
  const existingOverlay = document.getElementById('error-loading-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create manual refresh message
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  message.innerHTML = `
    <strong>Auto-refresh failed</strong>
    <p>${customMessage || 'Please manually refresh the page to continue.'}</p>
    <button onclick="window.location.reload()" style="
      background: white;
      color: #dc3545;
      border: none;
      padding: 8px 16px;
      border-radius: 3px;
      cursor: pointer;
      margin-top: 10px;
    ">Refresh Now</button>
  `;
  
  // Add to DOM
  document.body.appendChild(message);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }, 10000);
}

/**
 * Reset error handler state
 * Call this when page loads successfully
 */
export function resetErrorHandler(): void {
  clearErrorState();
}
