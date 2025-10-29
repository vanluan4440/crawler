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
    clickMessageButtonOnAllTabs
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
    document.getElementById('closeBatchBtn').addEventListener('click', closeCurrentBatchTabs);
    document.getElementById('resetBatchBtn').addEventListener('click', resetBatchProcess);
}
