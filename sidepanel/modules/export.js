/**
 * Export Module
 * Handles data export to JSON and CSV formats
 */

import { state } from './state.js';
import { showMessage } from './ui.js';

/**
 * Export data to JSON file
 */
export function exportToJson() {
    const dataStr = JSON.stringify(state.extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `crawl-data-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showMessage('JSON exported!');
}

/**
 * Export data to CSV file
 */
export function exportToCsv() {
    let csv = 'Type,URL,Text,Additional\n';

    state.extractedData.links.forEach(link => {
        csv += `Link,"${escapeCSV(link.url)}","${escapeCSV(link.text)}"\n`;
    });

    state.extractedData.images.forEach(img => {
        csv += `Image,"${escapeCSV(img.src)}","${escapeCSV(img.alt)}","${img.width}x${img.height}"\n`;
    });

    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `crawl-data-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    showMessage('CSV exported!');
}

/**
 * Escape CSV special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeCSV(text) {
    return String(text).replace(/"/g, '""');
}

