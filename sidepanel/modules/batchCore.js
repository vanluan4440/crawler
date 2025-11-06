/**
 * Batch Core Operations Module
 * Handles core batch operations: open, close, reset, wait for tabs
 */

import { showMessage } from './ui.js';
import { batchState, updateBatchUI, getBatchState } from './batchState.js';

/**
 * Helper function to sleep for specified milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for all tabs to finish loading
 * @param {Array} tabIds - Array of tab IDs to wait for
 * @param {number} timeout - Maximum wait time in milliseconds (default: 30000)
 */
export async function waitForAllTabsToLoad(tabIds, timeout = 30000) {
    const startTime = Date.now();
    const checkInterval = 500;
    
    while (Date.now() - startTime < timeout) {
        try {
            const loadingStates = await Promise.all(
                tabIds.map(async (tabId) => {
                    try {
                        const tab = await chrome.tabs.get(tabId);
                        return tab.status === 'complete';
                    } catch (e) {
                        return true;
                    }
                })
            );
            
            // Check if all tabs are loaded
            if (loadingStates.every(loaded => loaded)) {
                // WAIT TIME: Extra buffer after tabs report 'complete' to ensure DOM is fully rendered
                // Recommended: 3000ms (can reduce to 2000ms if pages load fast)
                await sleep(3000);
                return true;
            }
        } catch (e) {
            console.error('Error checking tab status:', e);
        }
        
        await sleep(checkInterval);
    }
    
    // Timeout reached, proceed anyway
    console.warn('Tab loading timeout reached, proceeding...');
    return false;
}

/**
 * Open next batch of 5 tabs
 * @param {boolean} skipProcessingCheck - Skip isProcessing check for auto mode
 */
export async function openNextBatch(skipProcessingCheck = false) {
    if (!skipProcessingCheck && batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    if (batchState.currentBatchIndex >= batchState.allPages.length) {
        showMessage('All pages have been processed!', 'success');
        return;
    }

    if (!skipProcessingCheck) {
        batchState.isProcessing = true;
        updateBatchUI();
    }

    try {
        // Calculate batch range
        const startIndex = batchState.currentBatchIndex;
        const endIndex = Math.min(startIndex + batchState.batchSize, batchState.allPages.length);
        const currentBatch = batchState.allPages.slice(startIndex, endIndex);

        // Close previously opened tabs if any
        if (batchState.openedTabIds.length > 0) {
            await closeCurrentBatchTabs();
        }

        // Open new tabs for current batch
        batchState.openedTabIds = [];
        
        for (let i = 0; i < currentBatch.length; i++) {
            const page = currentBatch[i];
            const tab = await chrome.tabs.create({
                url: page.url,
                active: false
            });
            batchState.openedTabIds.push(tab.id);
            
            // WAIT TIME: Delay between opening each tab to avoid overwhelming the browser
            // Recommended: 800ms (can reduce to 500ms for faster machines)
            await sleep(800);
        }

        // WAIT TIME: Auto-detect when all tabs finish loading (max 30 seconds timeout)
        // This is handled by waitForAllTabsToLoad() function
        // To adjust timeout, modify the timeout parameter in waitForAllTabsToLoad()
        showMessage('Waiting for all tabs to load...', 'success');
        await waitForAllTabsToLoad(batchState.openedTabIds);
        showMessage('All tabs loaded successfully', 'success');

        // Update index for next batch
        batchState.currentBatchIndex = endIndex;

        const batchNumber = Math.floor(startIndex / batchState.batchSize) + 1;
        const totalBatches = Math.ceil(batchState.allPages.length / batchState.batchSize);
        
        showMessage(
            `Opened batch ${batchNumber}/${totalBatches} (${currentBatch.length} tabs). ` +
            `Progress: ${endIndex}/${batchState.allPages.length} pages`,
            'success'
        );

    } catch (error) {
        console.error('Error opening batch:', error);
        showMessage('Failed to open batch: ' + error.message, 'error');
    } finally {
        if (!skipProcessingCheck) {
            batchState.isProcessing = false;
            updateBatchUI();
        }
    }
}

/**
 * Close all tabs from current batch
 */
export async function closeCurrentBatchTabs() {
    if (batchState.openedTabIds.length === 0) {
        return;
    }

    try {
        for (const tabId of batchState.openedTabIds) {
            try {
                await chrome.tabs.remove(tabId);
            } catch (e) {
                // Tab already closed by user
            }
        }
        batchState.openedTabIds = [];
        showMessage('Closed current batch tabs', 'success');
    } catch (error) {
        console.error('Error closing tabs:', error);
    }
}

/**
 * Reset batch processing to start from beginning
 */
export function resetBatchProcess() {
    batchState.currentBatchIndex = 0;
    batchState.isProcessing = false;
    closeCurrentBatchTabs();
    updateBatchUI();
    showMessage('Reset batch process. Ready to start from beginning.', 'success');
}

