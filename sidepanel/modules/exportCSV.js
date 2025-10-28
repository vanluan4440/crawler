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
        console.error("Không tìm thấy container [role='feed']!");
        return { success: false, data: [], error: 'Container not found' };
    }

    // 2. Find ALL <a> tags inside the container
    let allLinks = feedContainer.querySelectorAll('a');
    
    let results = [];
    let seenUrls = new Set(); // Filter duplicates

    // 3. Filter out links that are actually groups
    allLinks.forEach(link => {
        let href = link.href;
        
        // Check if this is a group link
        if (href && href.includes('/groups/')) {
            
            // Get title from text inside <a> tag
            let title = link.innerText;
            
            // Filter out junk: remove "feed", "discover" links and links without title
            if (title && title.trim() !== "" && 
                !href.includes('/feed/') && 
                !href.includes('/discover/')) {
                
                // Filter duplicates (because 1 group can have 2 links: image and title)
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

    console.log(`Found ${results.length} groups`);
    console.table(results);
    
    return { success: true, data: results };
}

/**
 * Extract Facebook groups and export to CSV
 */
export async function extractAndExportFacebookGroups() {
    try {
        // Get current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
            showMessage('No active tab found', 'error');
            return;
        }

        const tabId = tabs[0].id;
        const currentUrl = tabs[0].url;

        // Validate that we're on Facebook
        if (!currentUrl.includes('facebook.com')) {
            showMessage('Please navigate to Facebook first', 'error');
            return;
        }

        showMessage('Extracting Facebook groups...', 'success');

        // Execute extraction script in page context
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
            showMessage('No groups found. Make sure you scrolled to load all results.', 'error');
            return;
        }

        // Export to CSV
        exportGroupsToCSV(data);
        showMessage(`Successfully exported ${data.length} groups!`, 'success');

    } catch (error) {
        console.error('Error extracting Facebook groups:', error);
        showMessage('Failed to extract groups: ' + error.message, 'error');
    }
}

/**
 * Export groups data to CSV file
 * @param {Array} groups - Array of group objects {title, url}
 */
function exportGroupsToCSV(groups) {
    // CSV Header
    let csv = 'No,Group Name,Group URL\n';
    
    // CSV Data rows
    groups.forEach((group, index) => {
        const no = index + 1;
        const title = escapeCSV(group.title);
        const url = escapeCSV(group.url);
        csv += `${no},"${title}","${url}"\n`;
    });
    
    // Create blob and download
    const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `facebook-groups-${Date.now()}.csv`;
    link.click();
    
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
                
                const links = feedContainer.querySelectorAll('a[href*="/groups/"]');
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

