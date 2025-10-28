/**
 * Navigation Module
 * Handles URL navigation and Facebook search
 */

import { state, setCurrentScrollTabId } from './state.js';
import { showMessage } from './ui.js';
import { autoScrollAfterLoad } from './scroll.js';

/**
 * Navigate to URL (Facebook search)
 */
export async function navigateToUrl() {
    const urlInput = document.getElementById('urlInput');
    let baseUrl = 'https://www.facebook.com/search/groups?q=';
    let fullUrl = urlInput.value.trim();
    
    if (!fullUrl) {
        showMessage('Please enter a search keyword', 'error');
        return;
    }
    
    // Add baseUrl if not a full URL
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = baseUrl + encodeURIComponent(fullUrl);
    }
    
    // Validate URL
    try {
        new URL(fullUrl);
    } catch (e) {
        showMessage('Invalid URL format', 'error');
        return;
    }
    
    // Navigate to URL
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            const tabId = tabs[0].id;
            await chrome.tabs.update(tabId, { url: fullUrl });
            showMessage('Searching Facebook...', 'success');
            urlInput.value = '';
            
            // Check if auto-scroll is enabled
            const autoScrollEnabled = document.getElementById('autoScrollEnabled').checked;
            if (autoScrollEnabled) {
                setCurrentScrollTabId(tabId);
                autoScrollAfterLoad(tabId);
            }
        }
    } catch (error) {
        showMessage('Failed to navigate: ' + error.message, 'error');
    }
}

