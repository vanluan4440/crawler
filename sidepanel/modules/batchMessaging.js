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
                active: false // All tabs open in background, stay on current tab
            });
            batchState.openedTabIds.push(tab.id);
            
            // Small delay between tab creations to avoid overwhelming the browser
            await sleep(300);
        }
        
        console.log(`✅ All ${currentBatch.length} tabs opened in background`);
        console.log(`Current tab remains active, ready to send messages`);


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

    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        // Check if message template is filled
        const messageTemplate = document.getElementById('messageTemplate')?.value?.trim();
        sendMessageBtn.disabled = batchState.openedTabIds.length === 0 || state.isProcessing || !messageTemplate;
        sendMessageBtn.textContent = state.isProcessing ? 
            '⏳ Sending messages...' : 
            '📨 Type & Send Message (Step 2)';
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
 * Type message and send on all opened tabs
 * Step 2: Find textbox, type message, and send
 * Uses Chrome Debugger API to bypass Facebook's event blocking
 */
export async function typeAndSendMessageOnAllTabs() {
    if (batchState.openedTabIds.length === 0) {
        showMessage('No tabs are currently open. Open a batch first.', 'error');
        return;
    }

    if (batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    // Get message template from UI
    const messageTemplate = document.getElementById('messageTemplate')?.value?.trim();
    
    if (!messageTemplate) {
        showMessage('Please enter a message template first!', 'error');
        return;
    }

    batchState.isProcessing = true;
    updateBatchUI();

    try {
        let successCount = 0;
        let failCount = 0;

        showMessage(`Sending message to ${batchState.openedTabIds.length} tabs (using debugger API)...`, 'success');

        for (let i = 0; i < batchState.openedTabIds.length; i++) {
            const tabId = batchState.openedTabIds[i];
            
            try {
                console.log(`Tab ${i + 1}: Finding input box coordinates...`);
                
                // Step 1: Execute script to find input box and get coordinates
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: findInputBoxCoordinates
                });

                if (!results || !results[0] || !results[0].result) {
                    failCount++;
                    console.log(`Tab ${i + 1}: ❌ Failed to find input box`);
                    continue;
                }

                const { success, inputX, inputY, error } = results[0].result;
                
                if (!success) {
                    failCount++;
                    console.log(`Tab ${i + 1}: ❌ ${error}`);
                    continue;
                }

                console.log(`Tab ${i + 1}: Found input at (${inputX}, ${inputY})`);

                // Step 2: Send message to background to use debugger API
                let response;
                try {
                    response = await chrome.runtime.sendMessage({
                        action: 'sendMessageViaDebugger',
                        tabId: tabId,  // Pass tabId explicitly
                        inputX: inputX,
                        inputY: inputY,
                        messageText: messageTemplate
                    });
                    console.log(`Tab ${i + 1}: Received response from background:`, response);
                } catch (sendError) {
                    failCount++;
                    console.error(`Tab ${i + 1}: ❌ Failed to send message to background:`, sendError);
                    continue;
                }

                if (response && response.success) {
                    successCount++;
                    console.log(`Tab ${i + 1}: ✅ Message sent successfully via debugger`);
                } else {
                    failCount++;
                    const errorMsg = response?.error || 'Unknown error';
                    const errorDetails = response?.errorDetails || '';
                    console.error(`Tab ${i + 1}: ❌ Failed - ${errorMsg}`);
                    if (errorDetails) {
                        console.error(`Tab ${i + 1}: Error details - ${errorDetails}`);
                    }
                }

                // Delay between tabs to avoid being flagged as spam
                await sleep(2500);

            } catch (error) {
                failCount++;
                console.error(`Tab ${i + 1}: ❌ Exception in loop:`, error);
                console.error(`Tab ${i + 1}: Error stack:`, error.stack);
            }
        }

        // Show summary
        if (successCount > 0) {
            showMessage(
                `✅ Sent message to ${successCount}/${batchState.openedTabIds.length} tabs` +
                (failCount > 0 ? ` (${failCount} failed)` : ''),
                'success'
            );
        } else {
            showMessage(`❌ Failed to send message to all tabs. Check console for details.`, 'error');
        }

    } catch (error) {
        console.error('Error sending messages:', error);
        showMessage('Failed to send messages: ' + error.message, 'error');
    } finally {
        batchState.isProcessing = false;
        updateBatchUI();
    }
}

/**
 * Find input box coordinates for debugger API
 * This script runs in page context to locate the message input box
 * and return its center coordinates for mouse click simulation
 */
function findInputBoxCoordinates() {
    try {
        console.log('Finding message input box...');
        
        // Find textbox with aria-label "Tin nhắn" or "Message"
        const allTextboxes = document.querySelectorAll('[role="textbox"]');
        console.log(`Found ${allTextboxes.length} textboxes`);
        
        let messageTextbox = null;
        
        for (const textbox of allTextboxes) {
            const ariaLabel = textbox.getAttribute('aria-label') || '';
            console.log('Checking textbox with aria-label:', ariaLabel);
            
            if (ariaLabel.includes('Tin nhắn') || ariaLabel.includes('Message')) {
                messageTextbox = textbox;
                console.log('✅ Found message textbox');
                break;
            }
        }
        
        if (!messageTextbox) {
            // Try alternative selectors for contenteditable
            const contentEditables = document.querySelectorAll('[contenteditable="true"]');
            console.log(`Found ${contentEditables.length} contenteditable elements`);
            
            for (const elem of contentEditables) {
                const ariaLabel = elem.getAttribute('aria-label') || '';
                if (ariaLabel.includes('Tin nhắn') || ariaLabel.includes('Message')) {
                    messageTextbox = elem;
                    console.log('✅ Found message textbox (contenteditable)');
                    break;
                }
            }
        }
        
        if (!messageTextbox) {
            return {
                success: false,
                error: 'Message textbox not found. Make sure chat dialog is open.'
            };
        }
        
        // IMPORTANT: Focus the window first (especially for active tabs)
        try {
            window.focus();
            console.log('Window focused');
        } catch (e) {
            console.log('Could not focus window:', e);
        }
        
        // IMPORTANT: Scroll element into view to ensure it's visible
        // This is especially important for active tabs
        console.log('Scrolling element into view...');
        messageTextbox.scrollIntoView({
            behavior: 'instant',
            block: 'center',
            inline: 'center'
        });
        
        // Small delay to let scroll complete
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Return a promise to allow async delay
        return new Promise((resolve) => {
            setTimeout(() => {
                // Get bounding rectangle AFTER scrolling
                const rect = messageTextbox.getBoundingClientRect();
                
                // Calculate center coordinates (relative to viewport)
                const inputX = rect.left + (rect.width / 2);
                const inputY = rect.top + (rect.height / 2);
                
                console.log(`✅ Input box found at (${inputX}, ${inputY})`);
                console.log(`   Rect: left=${rect.left}, top=${rect.top}, width=${rect.width}, height=${rect.height}`);
                
                // Verify coordinates are valid (within viewport)
                const isValid = inputX > 0 && inputY > 0 && 
                               inputX < window.innerWidth && 
                               inputY < window.innerHeight;
                
                if (!isValid) {
                    console.warn('⚠️ Coordinates might be out of viewport bounds');
                    console.log(`   Viewport: ${window.innerWidth}x${window.innerHeight}`);
                }
                
                resolve({
                    success: true,
                    inputX: Math.round(inputX),
                    inputY: Math.round(inputY),
                    rect: {
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height
                    },
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                });
            }, 300); // Wait 300ms after scroll
        });
        
    } catch (error) {
        console.error('Error finding input box:', error);
        return {
            success: false,
            error: error.message
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

