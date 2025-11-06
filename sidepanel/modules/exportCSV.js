/**
 * Facebook Module
 * Handles Facebook-specific data extraction and export
 */

import { showMessage } from './ui.js';

/**
 * Extract group data from Facebook search results
 * This function runs in the page context
 */
function extractGroupDataScript() {
    // 1. Select main container with [role="feed"]
    let feedContainer = document.querySelector('div[role="feed"]');

    if (!feedContainer) {
        console.error("Not found container [role='feed']!");
        return { success: false, data: [], error: 'Container not found' };
    }

    // 2. Find ALL <a> tags inside the container
    let allLinks = feedContainer.querySelectorAll('a');

    let results = [];
    let seenUrls = new Set(); // Filter duplicates

    // 3. Filter out links that are actually groups
    allLinks.forEach(link => {
        let href = link.href;
        if (href && href.includes('https://www.facebook.com/')) {

            let title = link.innerText;

            if (title && title.trim() !== "" &&
                !href.includes('/feed/') &&
                !href.includes('/discover/') &&
                !href.includes('/groups/') &&
                !href.includes('/search/')) {

                // Filter duplicates (if 1 group can have 2 links: image and title)
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
    console.table(results);

    return { success: true, data: results };
}

/**
 * Extract Facebook pages and export to CSV
 */
export async function extractAndExportFacebookPages() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
            showMessage('No active tab found', 'error');
            return;
        }

        const tabId = tabs[0].id;
        const currentUrl = tabs[0].url;

        if (!currentUrl.includes('facebook.com')) {
            showMessage('Please navigate to Facebook first', 'error');
            return;
        }

        showMessage('Extracting Facebook pages...', 'success');

        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: extractGroupDataScript
        });

        if (!results || !results[0] || !results[0].result) {
            showMessage('Failed to extract group data', 'error');
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

        exportPagesToCSV(data);
        showMessage(`Successfully exported ${data.length} pages!`, 'success');

    } catch (error) {
        console.error('Error extracting Facebook pages:', error);
        showMessage('Failed to extract pages: ' + error.message, 'error');
    }
}

/**
 * Export pages data to Excel-compatible file
 * @param {Array} pages - Array of page objects {title, url}
 */
function exportPagesToCSV(pages) {
    // Use comma as separator and wrap fields in quotes for Excel compatibility
    // Add UTF-8 BOM to help Excel on Windows/Mac, but use CSV MIME type (not Excel) for better Mac compatibility
    let csv = '\uFEFF';
    csv += '"No","Page Name","Page URL"\r\n';

    let exportIndex = 1;
    pages.forEach((page) => {
        // Only export URLs of the form https://www.facebook.com/USERNAME
        const validUrl = page.url.match(/^https:\/\/www\.facebook\.com\/[A-Za-z0-9.\-_]+$/);
        if (validUrl) {
            const title = escapeCSV(page.title);
            // Avoid Excel formulas, just output as URL string for Mac compatibility
            const url = escapeCSV(page.url);
            csv += `"${exportIndex}","${title}","${url}"\r\n`;
            exportIndex++;
        }
    });

    // Use 'text/csv' instead of Excel MIME type for best Mac Excel import compatibility
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `facebook-pages-${Date.now()}.csv`;
    document.body.appendChild(link); // Required for Safari support
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Escape CSV special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeCSV(text) {
    return String(text).replace(/"/g, '""');
}

/**
 * Get current group count from page (for preview)
 */
export async function getGroupCount() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) return 0;

        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const feedContainer = document.querySelector('div[role="feed"]');
                if (!feedContainer) return 0;

                const links = feedContainer.querySelectorAll('a[href*="https://www.facebook.com/"]');
                const seenUrls = new Set();

                links.forEach(link => {
                    if (link.href &&
                        link.innerText.trim() !== "" &&
                        !link.href.includes('/feed/') &&
                        !link.href.includes('/discover/')) {
                        seenUrls.add(link.href);
                    }
                });

                return seenUrls.size;
            }
        });

        return results && results[0] ? results[0].result : 0;
    } catch (error) {
        console.error('Error getting group count:', error);
        return 0;
    }
}

