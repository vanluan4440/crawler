chrome.runtime.onInstalled.addListener(() => {
  console.log('Web Crawler DevTools Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'crawlData') {
    sendResponse({
      status: 'success',
      message: 'Crawl data received',
      timestamp: Date.now()
    });
  }

  if (request.action === 'exportData') {
    sendResponse({
      status: 'success',
      message: 'Export initiated'
    });
  }

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url);
  }
});
