let currentPageUrl = '';
let extractedData = {
    links: [],
    images: [],
    metadata: {}
};

document.addEventListener('DOMContentLoaded', async function () {
    await loadCurrentPageInfo();
    setupEventListeners();
});

async function loadCurrentPageInfo() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        currentPageUrl = tabs[0].url;
        document.getElementById('currentUrl').textContent = currentPageUrl;

        const pageStatus = document.getElementById('pageStatus');

        if (currentPageUrl.startsWith('chrome://') ||
            currentPageUrl.startsWith('chrome-extension://') ||
            currentPageUrl.startsWith('edge://')) {
            pageStatus.textContent = 'Not Available';
            pageStatus.style.color = '#ef4444';
        } else if (currentPageUrl.startsWith('file://')) {
            pageStatus.textContent = 'File Page';
            pageStatus.style.color = '#f59e0b';
        } else {
            pageStatus.textContent = 'Ready';
            pageStatus.style.color = '#10b981';
        }
    }
}

function setupEventListeners() {
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

    document.getElementById('exportJsonBtn').addEventListener('click', exportToJson);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
}

function highlightCard(cardId) {
    document.querySelectorAll('.action-card').forEach(card => {
        card.classList.remove('active');
    });
    document.getElementById(cardId).classList.add('active');
}

async function extractLinks() {
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
            extractedData.links = results[0].result;
            updateStats();
            showMessage('Links extracted successfully!');
        }
    });
}

async function extractImages() {
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
            extractedData.images = results[0].result;
            updateStats();
            showMessage('Images extracted successfully!');
        }
    });
}

async function extractMetadata() {
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
            extractedData.metadata = results[0].result;
            updateStats();
            showMessage('Metadata extracted successfully!');
        }
    });
}

async function fullCrawl() {
    extractLinks();
    extractImages();
    extractMetadata();
    showMessage('Full crawl completed!');
}

function updateStats() {
    document.getElementById('linksCount').textContent = extractedData.links.length;
    document.getElementById('imagesCount').textContent = extractedData.images.length;
    document.getElementById('metaCount').textContent = extractedData.metadata.title ? 1 : 0;
}

function exportToJson() {
    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `crawl-data-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showMessage('JSON exported!');
}

function exportToCsv() {
    let csv = 'Type,URL,Text,Additional\n';

    extractedData.links.forEach(link => {
        csv += `Link,"${escapeCSV(link.url)}","${escapeCSV(link.text)}"\n`;
    });

    extractedData.images.forEach(img => {
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

function escapeCSV(text) {
    return String(text).replace(/"/g, '""');
}

function showMessage(message) {
    const footer = document.querySelector('.sidepanel-footer p');
    const originalText = footer.textContent;
    footer.textContent = message;
    footer.style.color = '#10b981';

    setTimeout(() => {
        footer.textContent = originalText;
        footer.style.color = '#94a3b8';
    }, 3000);
}

