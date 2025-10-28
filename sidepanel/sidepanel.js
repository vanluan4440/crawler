/**
 * Main Sidepanel Script
 * Orchestrates all modules and sets up event listeners
 */

import { navigateToUrl } from './modules/navigation.js';
import { stopScroll } from './modules/scroll.js';
import { extractAndExportFacebookGroups } from './modules/exportCSV.js';

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
    document.getElementById('exportCsvBtn').addEventListener('click', extractAndExportFacebookGroups);
    
    document.getElementById('goToUrlBtn').addEventListener('click', navigateToUrl);
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateToUrl();
        }
    });
    
    document.getElementById('stopScrollBtn').addEventListener('click', stopScroll);
}
