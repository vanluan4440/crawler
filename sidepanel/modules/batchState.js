/**
 * Batch State Management Module
 * Manages state for batch messaging operations
 */

// State management for batch processing
export const batchState = {
    allPages: [],           // All crawled pages
    currentBatchIndex: 0,   // Current batch number
    batchSize: 5,           // Number of tabs to open per batch
    isProcessing: false,    // Whether currently processing
    openedTabIds: []        // Track opened tab IDs for current batch
};

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
export function updateBatchUI() {
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
    const sendToAllPagesBtn = document.getElementById('sendToAllPagesBtn');
    const openBatchBtn = document.getElementById('openBatchBtn');
    const clickMessageBtn = document.getElementById('clickMessageBtn');
    const resetBatchBtn = document.getElementById('resetBatchBtn');
    const closeBatchBtn = document.getElementById('closeBatchBtn');

    // Auto send button
    if (sendToAllPagesBtn) {
        const messageTemplate = document.getElementById('messageTemplate')?.value?.trim();
        const canSend = state.hasData && messageTemplate && !state.isProcessing;
        
        sendToAllPagesBtn.disabled = !canSend;
        
        if (state.isProcessing) {
            sendToAllPagesBtn.textContent = '⏳ Sending...';
        } else if (state.hasData) {
            sendToAllPagesBtn.textContent = `🚀 Send to All Pages (${state.totalPages} pages)`;
        } else {
            sendToAllPagesBtn.textContent = '🚀 Send to All Pages (Auto)';
        }
    }

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
 * Reset batch state to initial values
 */
export function resetBatchState() {
    batchState.currentBatchIndex = 0;
    batchState.isProcessing = false;
    batchState.openedTabIds = [];
}

