/**
 * UI Module
 * Handles all UI-related operations
 */

import { state } from './state.js';

/**
 * Show message in footer
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
export function showMessage(message, type = 'success') {
    const footer = document.querySelector('.sidepanel-footer p');
    const originalText = footer.textContent;
    footer.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        footer.style.color = '#ef4444';
    } else {
        footer.style.color = '#10b981';
    }

    setTimeout(() => {
        footer.textContent = originalText;
        footer.style.color = '#94a3b8';
    }, 3000);
}

/**
 * Highlight active action card
 * @param {string} cardId - ID of card to highlight
 */
export function highlightCard(cardId) {
    document.querySelectorAll('.action-card').forEach(card => {
        card.classList.remove('active');
    });
    document.getElementById(cardId).classList.add('active');
}

/**
 * Update statistics display
 */
export function updateStats() {
    document.getElementById('linksCount').textContent = state.extractedData.links.length;
    document.getElementById('imagesCount').textContent = state.extractedData.images.length;
    document.getElementById('metaCount').textContent = state.extractedData.metadata.title ? 1 : 0;
}

/**
 * Load and display current page information
 */
export async function loadCurrentPageInfo() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        state.currentPageUrl = tabs[0].url;
        document.getElementById('currentUrl').textContent = state.currentPageUrl;

        const pageStatus = document.getElementById('pageStatus');

        if (state.currentPageUrl.startsWith('chrome://') ||
            state.currentPageUrl.startsWith('chrome-extension://') ||
            state.currentPageUrl.startsWith('edge://')) {
            pageStatus.textContent = 'Not Available';
            pageStatus.style.color = '#ef4444';
        } else if (state.currentPageUrl.startsWith('file://')) {
            pageStatus.textContent = 'File Page';
            pageStatus.style.color = '#f59e0b';
        } else {
            pageStatus.textContent = 'Ready';
            pageStatus.style.color = '#10b981';
        }
    }
}

/**
 * Show loaded pages preview with auto-hide after 3 seconds
 * @param {Array} pages - Array of page objects {order, title, url}
 */
export function showLoadedPagesPreview(pages) {
    const previewElement = document.getElementById('loadedPagesPreview');
    const messageElement = document.getElementById('loadedPagesMessage');
    
    if (!previewElement || !messageElement) {
        console.warn('Loaded pages preview elements not found');
        return;
    }
    
    // Set message with number of pages loaded
    messageElement.textContent = `${pages.length} pages loaded successfully!`;
    
    previewElement.style.display = 'flex';
    
    setTimeout(() => {
        previewElement.style.display = 'none';
    }, 4000);
}

