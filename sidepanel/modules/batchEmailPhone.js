/**
 * Batch Email & Phone Collection Module
 * Handles batch collection of email and phone from Facebook pages
 */

import { showMessage } from './ui.js';

/**
 * Content script to scan email, phone, and address from Facebook page
 * This runs in the page context
 */
function scanContactInfoScript() {
    console.log("Scanning for email, phone numbers, and address...");

    const emails = [];
    const phones = [];
    let address = '';

    try {
        const allUl = document.querySelectorAll('ul');

        if (allUl.length >= 2) {
            const targetUl = allUl[1];
            const allSpan = targetUl.querySelectorAll('span');

            const phoneRegex = /(?:0|\+84)[\d .-]{8,20}[\d]/g;
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

            const addressKeywords = [
                'Đường', 'Street', 'Phường', 'Ward', 'Quận', 'District',
                'Huyện', 'Thành Phố', 'City', 'Province', 'Tỉnh', 'Vietnam'
            ];

            for (let item of allSpan) {
                const text = item.innerText.trim();

                if (!text || text.length === 0) continue;

                const emailMatch = text.match(emailRegex);
                if (emailMatch) {
                    emails.push(...emailMatch);
                }

                const phoneMatch = text.match(phoneRegex);
                if (phoneMatch) {
                    phones.push(...phoneMatch);
                }

                if (!address) {
                    const hasAddressKeywords = addressKeywords.some(keyword =>
                        text.includes(keyword)
                    );

                    if (hasAddressKeywords && text.length > 30 && text.length < 300) {
                        const hasCommas = text.includes(',');
                        const hasNumbers = /\d/.test(text);

                        if (hasCommas && hasNumbers) {
                            address = text;
                        }
                    }
                }
            }

            const uniqueEmails = [...new Set(emails)];
            const uniquePhones = [...new Set(phones)];

            console.log("Found emails:", uniqueEmails);
            console.log("Found phones:", uniquePhones);
            console.log("Found address:", address);

            return {
                emails: uniqueEmails,
                phones: uniquePhones,
                address: address
            };
        } else {
            console.log("Target ul element not found, falling back to page scan");
        }
    } catch (e) {
        console.error("Error scanning from ul structure:", e);
    }

    const pageText = document.body.innerText;

    const phoneRegex = /(?:0|\+84)[\d .-]{8,20}[\d]/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const foundEmails = pageText.match(emailRegex) || [];
    const foundPhones = pageText.match(phoneRegex) || [];

    const uniqueEmails = [...new Set(foundEmails)];
    const uniquePhones = [...new Set(foundPhones)];

    console.log("Fallback: Found emails:", uniqueEmails);
    console.log("Fallback: Found phones:", uniquePhones);

    return {
        emails: uniqueEmails,
        phones: uniquePhones,
        address: address
    };
}

/**
 * Extract pages from current search results
 */
async function extractPagesFromCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
        throw new Error('No active tab found');
    }

    const tabId = tabs[0].id;
    const currentUrl = tabs[0].url;

    if (!currentUrl.includes('facebook.com')) {
        throw new Error('Please navigate to Facebook search results first');
    }

    const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            const feedContainer = document.querySelector('div[role="feed"]');
            if (!feedContainer) {
                return { success: false, data: [], error: 'Container not found' };
            }

            const allLinks = feedContainer.querySelectorAll('a');
            const results = [];
            const seenUrls = new Set();

            allLinks.forEach(link => {
                const href = link.href;
                if (href && href.includes('https://www.facebook.com/')) {
                    const title = link.innerText;

                    if (title && title.trim() !== "" &&
                        !href.includes('/feed/') &&
                        !href.includes('/discover/') &&
                        !href.includes('/groups/') &&
                        !href.includes('/search/')) {

                        if (!seenUrls.has(href)) {
                            // Only keep valid page URLs
                            const validUrl = href.match(/^https:\/\/www\.facebook\.com\/[A-Za-z0-9.\-_]+$/);
                            if (validUrl) {
                                results.push({
                                    title: title.trim(),
                                    url: href
                                });
                                seenUrls.add(href);
                            }
                        }
                    }
                }
            });

            return { success: true, data: results };
        }
    });

    if (!results || !results[0] || !results[0].result) {
        throw new Error('Failed to extract page data');
    }

    const { success, data, error } = results[0].result;

    if (!success) {
        throw new Error(`Extraction error: ${error}`);
    }

    if (data.length === 0) {
        throw new Error('No pages found. Make sure you scrolled to load all results.');
    }

    return data;
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update progress UI
 */
function updateProgress(current, total, message) {
    const statusElement = document.getElementById('contactCollectionStatus');
    const messageElement = document.getElementById('contactMessage');
    const progressFillElement = document.getElementById('contactProgressFill');

    if (statusElement) {
        statusElement.style.display = 'block';
    }

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (progressFillElement) {
        const percentage = (current / total) * 100;
        progressFillElement.style.width = `${percentage}%`;
    }
}

/**
 * Mark progress as completed
 */
function markProgressCompleted() {
    const statusElement = document.getElementById('contactCollectionStatus');
    const iconElement = document.querySelector('.contact-icon');

    if (statusElement) {
        statusElement.classList.add('completed');
    }

    if (iconElement) {
        iconElement.textContent = '✅';
    }
}

/**
 * Hide progress UI
 */
function hideProgress() {
    setTimeout(() => {
        const statusElement = document.getElementById('contactCollectionStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
            statusElement.classList.remove('completed');
        }
    }, 3000);
}

/**
 * Main function: Collect emails and phones from all pages in batches
 */
export async function collectContactInfoAndExport() {
    try {
        showMessage('Starting contact info collection...', 'success');

        // Step 1: Extract pages from current search results
        const pages = await extractPagesFromCurrentTab();
        console.log(`Found ${pages.length} pages to process`);

        showMessage(`Found ${pages.length} pages. Opening in batches...`, 'success');

        // Step 2: Process pages in batches of 5
        const batchSize = 5;
        const totalBatches = Math.ceil(pages.length / batchSize);
        const pagesWithContact = [];

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, pages.length);
            const currentBatch = pages.slice(startIndex, endIndex);

            const batchNumber = batchIndex + 1;
            updateProgress(
                startIndex,
                pages.length,
                `Processing batch ${batchNumber}/${totalBatches} (${currentBatch.length} pages)...`
            );

            console.log(`\n=== Batch ${batchNumber}/${totalBatches} ===`);

            // Open tabs for current batch
            const tabIds = [];
            for (const page of currentBatch) {
                const tab = await chrome.tabs.create({
                    url: page.url,
                    active: false
                });
                tabIds.push(tab.id);
                await sleep(800); // Delay between opening tabs
            }

            console.log(`Opened ${tabIds.length} tabs, waiting for pages to load...`);

            // Wait for all tabs to load completely
            // IMPORTANT: Long wait time to ensure Facebook's lazy loading completes
            await sleep(15000); // 15 seconds - adjust if needed

            console.log('Pages loaded, scanning for contact info...');

            // Scan contact info from each tab
            for (let i = 0; i < tabIds.length; i++) {
                const tabId = tabIds[i];
                const page = currentBatch[i];

                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: scanContactInfoScript
                    });

                    if (results && results[0] && results[0].result) {
                        const { emails, phones, address } = results[0].result;

                        pagesWithContact.push({
                            order: pagesWithContact.length + 1,
                            title: page.title,
                            url: page.url,
                            email: emails.length > 0 ? emails[0] : '',
                            phone1: phones.length > 0 ? phones[0] : '',
                            phone2: phones.length > 1 ? phones[1] : '',
                            address: address || ''
                        });

                        console.log(`✓ ${page.title}: ${emails.length} emails, ${phones.length} phones, address: ${address ? 'Yes' : 'No'}`);
                    }
                } catch (error) {
                    console.error(`Error scanning tab ${tabId}:`, error);
                    // Add page with empty contact info
                    pagesWithContact.push({
                        order: pagesWithContact.length + 1,
                        title: page.title,
                        url: page.url,
                        email: '',
                        phone1: '',
                        phone2: '',
                        address: ''
                    });
                }
            }

            // Close all tabs in current batch
            for (const tabId of tabIds) {
                try {
                    await chrome.tabs.remove(tabId);
                } catch (e) {
                    // Tab already closed
                }
            }

            console.log(`Batch ${batchNumber} completed, tabs closed`);

            // Wait before next batch to avoid rate limiting
            if (batchIndex < totalBatches - 1) {
                await sleep(3000);
            }
        }

        // Step 3: Export to CSV
        updateProgress(pages.length, pages.length, 'Exporting to CSV...');
        exportContactInfoToCSV(pagesWithContact);

        markProgressCompleted();
        updateProgress(pages.length, pages.length, `✅ Completed! Exported ${pagesWithContact.length} pages with contact info`);
        showMessage(`✅ Successfully exported ${pagesWithContact.length} pages with contact info!`, 'success');

        hideProgress();

    } catch (error) {
        console.error('Error collecting contact info:', error);
        showMessage('Failed to collect contact info: ' + error.message, 'error');

        const statusElement = document.getElementById('contactCollectionStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }
}

/**
 * Export pages with contact info to CSV
 * @param {Array} pages - Array of page objects with contact info
 */
function exportContactInfoToCSV(pages) {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '"No","Page Name","Page URL","Email","Phone 1","Phone 2","Address"\r\n';

    pages.forEach((page) => {
        csv += `"${page.order}",`;
        csv += `"${escapeCSV(page.title)}",`;
        csv += `"${escapeCSV(page.url)}",`;
        csv += `"${escapeCSV(page.email)}",`;
        csv += `"${escapeCSV(page.phone1)}",`;
        csv += `"${escapeCSV(page.phone2)}",`;
        csv += `"${escapeCSV(page.address)}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `facebook-pages-full-info-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Escape CSV special characters
 */
function escapeCSV(text) {
    if (!text) return '';
    return String(text).replace(/"/g, '""');
}

