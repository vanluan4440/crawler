/**
 * CSV Upload Module
 * Handles CSV file upload and parsing for batch tab opening
 */

import { showMessage, showLoadedPagesPreview } from './ui.js';
import { batchState, updateBatchUI } from './batchState.js';

/**
 * Parse CSV content and extract page URLs
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} Array of page objects {title, url}
 */
function parseCSV(csvContent) {
    if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
    }
    
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const pages = [];
    
    // Skip header line (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
    
        const regex = /"([^"]*(?:""[^"]*)*)"/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(line)) !== null) {
            matches.push(match[1].replace(/""/g, '"'));
        }
        
        if (matches.length >= 3) {
            const order = matches[0];
            const title = matches[1];
            const url = matches[2];
            
            if (url && url.includes('facebook.com')) {
                pages.push({
                    order: order,
                    title: title,
                    url: url
                });
            }
        }
    }
    
    return pages;
}

/**
 * Handle CSV file upload
 * @param {File} file - The uploaded CSV file
 */
export async function handleCSVUpload(file) {
    if (!file) {
        showMessage('Please select a CSV file', 'error');
        return;
    }
    
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('Please upload a CSV file', 'error');
        return;
    }
    
    try {
        const content = await readFileContent(file);
        const pages = parseCSV(content);
        
        if (pages.length === 0) {
            showMessage('No valid Facebook URLs found in CSV file', 'error');
            return;
        }
        
        // Load pages into batch state
        batchState.allPages = pages;
        batchState.currentBatchIndex = 0;
        batchState.openedTabIds = [];
        batchState.isProcessing = false;
        
        updateBatchUI();
        
        showLoadedPagesPreview(pages);
        
        showMessage(
            `✅ Loaded ${pages.length} pages from CSV. Ready to open batches!`,
            'success'
        );
        
        document.getElementById('openBatchBtn').disabled = false;
        document.getElementById('resetBatchBtn').disabled = false;
        document.getElementById('closeBatchBtn').disabled = false;
            
        const progressElement = document.getElementById('batchProgress');
        if (progressElement) {
            progressElement.textContent = `Loaded: 0/${pages.length} pages processed`;
        }
        
    } catch (error) {
        console.error('Error processing CSV file:', error);
        showMessage('Failed to process CSV file: ' + error.message, 'error');
    }
}

/**
 * Read file content as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} File content
 */
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = (e) => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Trigger file input click
 */
export function triggerFileUpload() {
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

