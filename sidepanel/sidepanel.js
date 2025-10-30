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
    typeAndSendMessageOnAllTabs,
    sendToAllPages
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
    
    // Auto send button - main feature
    document.getElementById('sendToAllPagesBtn').addEventListener('click', sendToAllPages);
    
    // Manual controls (for testing)
    document.getElementById('openBatchBtn').addEventListener('click', openNextBatch);
    document.getElementById('clickMessageBtn').addEventListener('click', clickMessageButtonOnAllTabs);
    document.getElementById('sendMessageBtn').addEventListener('click', typeAndSendMessageOnAllTabs);
    document.getElementById('closeBatchBtn').addEventListener('click', closeCurrentBatchTabs);
    document.getElementById('resetBatchBtn').addEventListener('click', resetBatchProcess);

    // Update button states when message template changes
    const messageTemplate = document.getElementById('messageTemplate');
    if (messageTemplate) {
        messageTemplate.addEventListener('input', () => {
            const hasContent = messageTemplate.value.trim().length > 0;
            const hasData = document.getElementById('batchProgress')?.textContent !== 'No data loaded';
            
            // Update auto send button
            const autoSendBtn = document.getElementById('sendToAllPagesBtn');
            if (autoSendBtn) {
                autoSendBtn.disabled = !hasContent || !hasData;
            }
            
            // Update manual send button
            const sendBtn = document.getElementById('sendMessageBtn');
            if (sendBtn) {
                const hasOpenTabs = document.getElementById('batchProgress')?.textContent !== 'No data loaded';
                sendBtn.disabled = !hasContent || !hasOpenTabs;
            }
        });
    }
}
