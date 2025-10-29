/**
 * Main Sidepanel Script
 * Orchestrates all modules and sets up event listeners
 */

import { navigateToUrl } from './modules/navigation.js';
import { stopScroll } from './modules/scroll.js';
import { extractAndExportFacebookPages } from './modules/exportCSV.js';
import { 
    loadBatchFromCurrentPage, 
    openNextBatch, 
    closeCurrentBatchTabs, 
    resetBatchProcess,
    clickMessageButtonOnAllTabs,
    typeAndSendMessageOnAllTabs
} from './modules/batchMessaging.js';

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    document.getElementById('exportCsvBtn').addEventListener('click', extractAndExportFacebookPages);

    document.getElementById('goToUrlBtn').addEventListener('click', navigateToUrl);
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateToUrl();
        }
    });

    document.getElementById('stopScrollBtn').addEventListener('click', stopScroll);

    // Batch messaging event listeners
    document.getElementById('loadBatchBtn').addEventListener('click', loadBatchFromCurrentPage);
    document.getElementById('openBatchBtn').addEventListener('click', openNextBatch);
    document.getElementById('clickMessageBtn').addEventListener('click', clickMessageButtonOnAllTabs);
    document.getElementById('sendMessageBtn').addEventListener('click', typeAndSendMessageOnAllTabs);
    document.getElementById('closeBatchBtn').addEventListener('click', closeCurrentBatchTabs);
    document.getElementById('resetBatchBtn').addEventListener('click', resetBatchProcess);

    // Update send button state when message template changes
    const messageTemplate = document.getElementById('messageTemplate');
    if (messageTemplate) {
        messageTemplate.addEventListener('input', () => {
            // Trigger UI update by calling a dummy function
            const sendBtn = document.getElementById('sendMessageBtn');
            if (sendBtn) {
                const hasContent = messageTemplate.value.trim().length > 0;
                const hasOpenTabs = document.getElementById('batchProgress')?.textContent !== 'No data loaded';
                sendBtn.disabled = !hasContent || !hasOpenTabs;
            }
        });
    }
}
