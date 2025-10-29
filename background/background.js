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

  // Handle message sending via debugger API
  if (request.action === 'sendMessageViaDebugger') {
    // Get tabId from request instead of sender.tab (sidepanel doesn't have tab)
    const tabId = request.tabId;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tabId provided' });
      return true;
    }
    
    handleDebuggerMessage(request, tabId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  return true;
});

/**
 * Handle sending message via Chrome Debugger API
 * This bypasses Facebook's event blocking by using low-level input simulation
 */
async function handleDebuggerMessage(request, tabId) {
  const { inputX, inputY, messageText } = request;
  
  try {
    // Detach any existing debugger
    try {
      await new Promise(resolve => {
        chrome.debugger.detach({ tabId }, () => resolve());
      });
    } catch (e) {}
    
    await sleep(100);
    
    // Attach debugger
    await new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });

    await sleep(200);

    // Click to focus input
    await sendDebuggerCommand(tabId, 'Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: inputX,
      y: inputY,
      button: 'left',
      clickCount: 1
    });

    await sleep(50);

    await sendDebuggerCommand(tabId, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: inputX,
      y: inputY,
      button: 'left',
      clickCount: 1
    });

    await sleep(1000);

    // Insert text
    await sendDebuggerCommand(tabId, 'Input.insertText', {
      text: messageText
    });

    await sleep(1200);

    // Detach debugger
    await new Promise((resolve) => {
      chrome.debugger.detach({ tabId }, () => resolve());
    });

    await sleep(500);

    // Find and click send button
    const clickResult = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const sendButton = document.querySelector('div[role="button"][aria-label="Press enter to send"]') ||
                          document.querySelector('div[role="button"][aria-label="Nhấn Enter để gửi"]');
        
        if (sendButton) {
          sendButton.click();
          return { success: true };
        }
        return { success: false };
      }
    });

    const clickSuccess = clickResult?.[0]?.result?.success;
    
    if (!clickSuccess) {
      return { success: false, error: 'Send button not found' };
    }

    return { success: true };

  } catch (error) {
    console.error('Debugger error:', error);
    
    try {
      await new Promise(resolve => {
        chrome.debugger.detach({ tabId }, () => resolve());
      });
    } catch (e) {}

    return { success: false, error: error.message };
  }
}

/**
 * Send command to debugger
 */
function sendDebuggerCommand(tabId, method, params) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url);
  }
});
