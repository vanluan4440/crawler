/**
 * Main Sidepanel Script
 * Orchestrates all modules and sets up event listeners
 */

import { loadCurrentPageInfo, highlightCard } from './modules/ui.js';
import { navigateToUrl } from './modules/navigation.js';
import { stopScroll } from './modules/scroll.js';
import { extractLinks, extractImages, extractMetadata, fullCrawl } from './modules/extraction.js';
import { extractAndExportFacebookGroups } from './modules/exportCSV.js';

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async function () {
    await loadCurrentPageInfo();
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Extraction actions
    document.getElementById('extractLinksCard').addEventListener('click', () => {
        highlightCard('extractLinksCard');
        extractLinks();
    });

    document.getElementById('extractImagesCard').addEventListener('click', () => {
        highlightCard('extractImagesCard');
        extractImages();
    });

    document.getElementById('extractMetaCard').addEventListener('click', () => {
        highlightCard('extractMetaCard');
        extractMetadata();
    });

    document.getElementById('fullCrawlCard').addEventListener('click', () => {
        highlightCard('fullCrawlCard');
        fullCrawl();
    });

    // Export CSV (Facebook Groups)
    document.getElementById('exportCsvBtn').addEventListener('click', extractAndExportFacebookGroups);
    
    // URL navigation
    document.getElementById('goToUrlBtn').addEventListener('click', navigateToUrl);
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateToUrl();
        }
    });
    
    // Scroll control
    document.getElementById('stopScrollBtn').addEventListener('click', stopScroll);
}
