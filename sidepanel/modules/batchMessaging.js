/**
 * Batch Messaging Module - Main Orchestrator
 * Coordinates batch messaging workflow and data loading
 */

import { showMessage, showLoadedPagesPreview } from './ui.js';
import { batchState, updateBatchUI, resetBatchState } from './batchState.js';
import { openNextBatch, closeCurrentBatchTabs, resetBatchProcess, sleep } from './batchCore.js';
import { clickMessageButtonOnAllTabs, typeAndSendMessageOnAllTabs } from './messageActions.js';
import { extractGroupDataScript } from './pageScripts.js';

/**
 * Initialize batch messaging with crawled pages data
 * @param {Array} pages - Array of page objects {title, url}
 */
export function initBatchMessaging(pages) {
    if (!pages || pages.length === 0) {
        showMessage('No pages available. Please crawl pages first.', 'error');
        return false;
    }

    // Filter only valid Facebook page URLs
    const validPages = pages.filter(page => {
        const validUrl = page.url.match(/^https:\/\/www\.facebook\.com\/[A-Za-z0-9.\-_]+$/);
        return validUrl;
    });

    if (validPages.length === 0) {
        showMessage('No valid Facebook pages found.', 'error');
        return false;
    }

    batchState.allPages = validPages;
    batchState.currentBatchIndex = 0;
    batchState.isProcessing = false;
    batchState.openedTabIds = [];

    updateBatchUI();
    
    showLoadedPagesPreview(validPages);
    
    showMessage(`Initialized with ${validPages.length} pages ready to process`, 'success');
    return true;
}

/**
 * Auto send messages to all pages
 * Opens 5 tabs → click message → send → close → repeat
 */
export async function sendToAllPages() {
    try {
        const messageTemplate = document.getElementById('messageTemplate')?.value?.trim();
        if (!messageTemplate) {
            showMessage('Please enter a message template first', 'error');
            return;
        }

        if (batchState.allPages.length === 0) {
            showMessage('No pages loaded. Please load pages first.', 'error');
            return;
        }

        // Reset batch to start from beginning
        resetBatchState();

        const totalPages = batchState.allPages.length;
        const totalBatches = Math.ceil(totalPages / batchState.batchSize);
        let processedPages = 0;

        for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
            const batchNumber = batchNum + 1;

            // Open tabs and wait for them to load (waitForAllTabsToLoad is called inside openNextBatch)
            await openNextBatch(true);
            
            // WAIT TIME: Additional buffer after all tabs loaded to ensure Facebook page is fully interactive
            // Recommended: 5000ms (increase to 6000-7000ms if pages are slow to load)
            await sleep(5000);

            if (batchState.openedTabIds.length === 0) {
                continue;
            }

            await clickMessageButtonOnAllTabs(true);
            
            // WAIT TIME: Wait for chatbox to appear after clicking "Nhắn tin" button on all tabs
            // Recommended: 12000ms (reduce to 8000ms if chatbox opens quickly, increase to 15000ms if slow)
            await sleep(12000);

            await typeAndSendMessageOnAllTabs(true);
            
            // WAIT TIME: Wait for all messages to be sent successfully before closing tabs
            // Recommended: 10000ms (reduce to 8000ms if messages send quickly, increase to 12000ms if slow)
            await sleep(10000);

            await closeCurrentBatchTabs();
            
            processedPages += batchState.batchSize;
            if (processedPages > totalPages) processedPages = totalPages;
            
            if (batchNum < totalBatches - 1) {
                // WAIT TIME: Delay between batches to avoid rate limiting
                // Recommended: 5000ms (increase to 7000ms if Facebook blocks you)
                await sleep(5000);
            }
        }
        
        showMessage(`✅ Auto send completed! Messages sent to ${processedPages} pages`, 'success');

    } catch (error) {
        console.error('Auto send error:', error);
        showMessage('Auto send failed: ' + error.message, 'error');
        batchState.isProcessing = false;
    }
}

/**
 * Load batch from CSV export data
 * This function extracts group data from current page and initializes batch
 */
export async function loadBatchFromCurrentPage() {
    try {
        showMessage('Loading pages from current tab...', 'success');

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
            showMessage('No active tab found', 'error');
            return;
        }

        const tabId = tabs[0].id;
        const currentUrl = tabs[0].url;

        if (!currentUrl.includes('facebook.com')) {
            showMessage('Please navigate to Facebook search results first', 'error');
            return;
        }

        // Execute extraction script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: extractGroupDataScript
        });

        if (!results || !results[0] || !results[0].result) {
            showMessage('Failed to extract page data', 'error');
            return;
        }

        const { success, data, error } = results[0].result;

        if (!success) {
            showMessage(`Extraction error: ${error}`, 'error');
            return;
        }

        if (data.length === 0) {
            showMessage('No pages found. Make sure you scrolled to load all results.', 'error');
            return;
        }

        // Initialize batch with extracted data
        initBatchMessaging(data);

    } catch (error) {
        console.error('Error loading batch data:', error);
        showMessage('Failed to load batch data: ' + error.message, 'error');
    }
}

// Re-export functions that are used externally
export { openNextBatch, closeCurrentBatchTabs, resetBatchProcess, clickMessageButtonOnAllTabs, typeAndSendMessageOnAllTabs };
