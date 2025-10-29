/**
 * Batch Messaging Module
 * Handles opening Facebook pages in batches and managing messaging workflow
 */

import { showMessage } from './ui.js';

// State management for batch processing
const batchState = {
    allPages: [],           // All crawled pages
    currentBatchIndex: 0,   // Current batch number
    batchSize: 5,           // Number of tabs to open per batch
    isProcessing: false,    // Whether currently processing
    openedTabIds: []        // Track opened tab IDs for current batch
};

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
    showMessage(`Initialized with ${validPages.length} pages ready to process`, 'success');
    return true;
}

/**
 * Open next batch of 5 tabs
 */
export async function openNextBatch() {
    if (batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    if (batchState.currentBatchIndex >= batchState.allPages.length) {
        showMessage('All pages have been processed!', 'success');
        return;
    }

    batchState.isProcessing = true;
    updateBatchUI();

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
                active: i === 0 // Only first tab is active
            });
            batchState.openedTabIds.push(tab.id);
            
            // Small delay between tab creations to avoid overwhelming the browser
            await sleep(300);
        }

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
        batchState.isProcessing = false;
        updateBatchUI();
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
                // Tab might already be closed by user
                console.log('Tab already closed:', tabId);
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

/**
 * Get current batch state information
 */
export function getBatchState() {
    const totalPages = batchState.allPages.length;
    const processedPages = batchState.currentBatchIndex;
    const remainingPages = totalPages - processedPages;
    const currentBatchNumber = Math.floor(batchState.currentBatchIndex / batchState.batchSize) + 1;
    const totalBatches = Math.ceil(totalPages / batchState.batchSize);
    const isComplete = processedPages >= totalPages;

    return {
        totalPages,
        processedPages,
        remainingPages,
        currentBatchNumber: isComplete ? totalBatches : currentBatchNumber,
        totalBatches,
        isComplete,
        isProcessing: batchState.isProcessing,
        hasData: totalPages > 0
    };
}

/**
 * Update batch UI elements
 */
function updateBatchUI() {
    const state = getBatchState();
    
    // Update progress display
    const progressElement = document.getElementById('batchProgress');
    if (progressElement) {
        if (state.hasData) {
            progressElement.textContent = 
                `Batch ${state.currentBatchNumber}/${state.totalBatches} | ` +
                `Pages: ${state.processedPages}/${state.totalPages}`;
        } else {
            progressElement.textContent = 'No data loaded';
        }
    }

    // Update button states
    const openBatchBtn = document.getElementById('openBatchBtn');
    const clickMessageBtn = document.getElementById('clickMessageBtn');
    const resetBatchBtn = document.getElementById('resetBatchBtn');
    const closeBatchBtn = document.getElementById('closeBatchBtn');

    if (openBatchBtn) {
        openBatchBtn.disabled = !state.hasData || state.isComplete || state.isProcessing;
        if (state.isComplete) {
            openBatchBtn.textContent = '✅ All batches completed';
        } else {
            openBatchBtn.textContent = state.isProcessing ? 
                '⏳ Opening tabs...' : 
                `🚀 Open Next Batch (5 tabs)`;
        }
    }

    if (clickMessageBtn) {
        clickMessageBtn.disabled = batchState.openedTabIds.length === 0 || state.isProcessing;
        clickMessageBtn.textContent = state.isProcessing ? 
            '⏳ Clicking buttons...' : 
            '💬 Click "Nhắn tin" Button (Step 1)';
    }

    if (resetBatchBtn) {
        resetBatchBtn.disabled = !state.hasData;
    }

    if (closeBatchBtn) {
        closeBatchBtn.disabled = batchState.openedTabIds.length === 0;
    }
}

/**
 * Helper function to sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Click "Nhắn tin" button on all opened tabs
 * Step 1: Find and click the message button
 */
export async function clickMessageButtonOnAllTabs() {
    if (batchState.openedTabIds.length === 0) {
        showMessage('No tabs are currently open. Open a batch first.', 'error');
        return;
    }

    if (batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    batchState.isProcessing = true;
    updateBatchUI();

    try {
        let successCount = 0;
        let failCount = 0;

        showMessage(`Finding "Nhắn tin" button on ${batchState.openedTabIds.length} tabs...`, 'success');

        for (let i = 0; i < batchState.openedTabIds.length; i++) {
            const tabId = batchState.openedTabIds[i];
            
            try {
                // Execute script to find and click message button
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: findAndClickMessageButtonScript
                });

                if (results && results[0] && results[0].result) {
                    const { success, message, buttonText } = results[0].result;
                    
                    if (success) {
                        successCount++;
                        console.log(`Tab ${i + 1}: Successfully clicked "${buttonText}" button`);
                    } else {
                        failCount++;
                        console.log(`Tab ${i + 1}: Failed - ${message}`);
                    }
                } else {
                    failCount++;
                    console.log(`Tab ${i + 1}: No result returned`);
                }

                // Small delay between tabs
                await sleep(500);

            } catch (error) {
                failCount++;
                console.error(`Tab ${i + 1}: Error - ${error.message}`);
            }
        }

        // Show summary
        if (successCount > 0) {
            showMessage(
                `✅ Clicked message button on ${successCount}/${batchState.openedTabIds.length} tabs` +
                (failCount > 0 ? ` (${failCount} failed)` : ''),
                'success'
            );
        } else {
            showMessage(`❌ Failed to click button on all tabs. Check console for details.`, 'error');
        }

    } catch (error) {
        console.error('Error clicking message buttons:', error);
        showMessage('Failed to click message buttons: ' + error.message, 'error');
    } finally {
        batchState.isProcessing = false;
        updateBatchUI();
    }
}

/**
 * Script that runs in page context to find and click "Nhắn tin" button
 * Conditions:
 * 1. Must be a button (role="button")
 * 2. Must contain text "Nhắn tin" or "Message"
 */
function findAndClickMessageButtonScript() {
    try {
        // Find all buttons on the page
        const allButtons = document.querySelectorAll('[role="button"]');
        
        console.log(`Found ${allButtons.length} buttons with role="button"`);

        // Search for button containing "Nhắn tin" or "Message"
        let messageButton = null;
        let buttonText = '';

        for (const button of allButtons) {
            const text = button.textContent || button.innerText || '';
            
            // Check if button contains "Nhắn tin" or "Message"
            if (text.includes('Nhắn tin') || text.includes('Message')) {
                messageButton = button;
                buttonText = text.trim();
                console.log('Found message button:', buttonText);
                break;
            }
        }

        if (!messageButton) {
            console.error('Message button not found');
            return {
                success: false,
                message: 'Button with "Nhắn tin" or "Message" not found',
                buttonText: null
            };
        }

        // Click the button
        messageButton.click();
        console.log('Clicked message button successfully');

        return {
            success: true,
            message: 'Button clicked successfully',
            buttonText: buttonText
        };

    } catch (error) {
        console.error('Error in findAndClickMessageButtonScript:', error);
        return {
            success: false,
            message: error.message,
            buttonText: null
        };
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

/**
 * Extract group data from Facebook search results
 * This function runs in the page context
 */
function extractGroupDataScript() {
    let feedContainer = document.querySelector('div[role="feed"]');

    if (!feedContainer) {
        console.error("Not found container [role='feed']!");
        return { success: false, data: [], error: 'Container not found' };
    }

    let allLinks = feedContainer.querySelectorAll('a');
    let results = [];
    let seenUrls = new Set();

    allLinks.forEach(link => {
        let href = link.href;
        if (href && href.includes('https://www.facebook.com/')) {
            let title = link.innerText;

            if (title && title.trim() !== "" &&
                !href.includes('/feed/') &&
                !href.includes('/discover/') &&
                !href.includes('/groups/') &&
                !href.includes('/search/')) {

                if (!seenUrls.has(href)) {
                    results.push({
                        title: title.trim(),
                        url: href
                    });
                    seenUrls.add(href);
                }
            }
        }
    });

    console.log(`Found ${results.length} pages`);
    return { success: true, data: results };
}

