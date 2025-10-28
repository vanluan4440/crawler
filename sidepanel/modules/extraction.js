/**
 * Extraction Module
 * Handles data extraction from web pages
 */

import { state } from './state.js';
import { showMessage, updateStats } from './ui.js';

/**
 * Extract all links from current page
 */
export async function extractLinks() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
            const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
                url: a.href,
                text: a.textContent.trim() || '(no text)'
            }));
            return links;
        }
    }, (results) => {
        if (results && results[0]) {
            state.extractedData.links = results[0].result;
            updateStats();
            showMessage('Links extracted successfully!');
        }
    });
}

/**
 * Extract all images from current page
 */
export async function extractImages() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
            const images = Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt || '(no alt)',
                width: img.naturalWidth,
                height: img.naturalHeight
            }));
            return images;
        }
    }, (results) => {
        if (results && results[0]) {
            state.extractedData.images = results[0].result;
            updateStats();
            showMessage('Images extracted successfully!');
        }
    });
}

/**
 * Extract metadata from current page
 */
export async function extractMetadata() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
            const getMeta = (name) => {
                const meta = document.querySelector(`meta[name="${name}"]`) ||
                    document.querySelector(`meta[property="${name}"]`);
                return meta ? meta.content : '';
            };

            return {
                title: document.title,
                description: getMeta('description') || getMeta('og:description'),
                keywords: getMeta('keywords'),
                author: getMeta('author'),
                ogTitle: getMeta('og:title'),
                ogImage: getMeta('og:image')
            };
        }
    }, (results) => {
        if (results && results[0]) {
            state.extractedData.metadata = results[0].result;
            updateStats();
            showMessage('Metadata extracted successfully!');
        }
    });
}

/**
 * Perform full crawl (extract all data)
 */
export async function fullCrawl() {
    await extractLinks();
    await extractImages();
    await extractMetadata();
    showMessage('Full crawl completed!');
}

