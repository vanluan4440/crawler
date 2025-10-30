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
      // WAIT TIME: Wait after detaching debugger to ensure clean state
      // Recommended: 500ms (reduce to 300ms for faster operation)
      await sleep(500);
    } catch (e) {}
    
    // WAIT TIME: Buffer time before attaching debugger
    // Recommended: 400ms (reduce to 200ms for faster operation)
    await sleep(400);
    
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

    // WAIT TIME: Wait after attaching debugger to ensure it's ready
    // Recommended: 500ms (reduce to 300ms for faster operation, increase to 700ms if debugger fails)
    await sleep(500);

    // Click to focus input
    await sendDebuggerCommand(tabId, 'Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: inputX,
      y: inputY,
      button: 'left',
      clickCount: 1
    });

    // WAIT TIME: Delay between mouse press and release to simulate natural click
    // Recommended: 150ms (reduce to 50ms for faster operation)
    await sleep(150);

    await sendDebuggerCommand(tabId, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: inputX,
      y: inputY,
      button: 'left',
      clickCount: 1
    });

    // WAIT TIME: Wait for input field to be focused after click
    // Recommended: 1500ms (reduce to 1000ms if focus is fast, increase to 2000ms if slow)
    await sleep(1500);

    // Insert text
    await sendDebuggerCommand(tabId, 'Input.insertText', {
      text: messageText
    });

    // WAIT TIME: Wait for text to be fully inserted into input field
    // Recommended: 2000ms (reduce to 1500ms if text inserts quickly, increase to 2500ms if slow)
    await sleep(2000);

    // Detach debugger
    await new Promise((resolve) => {
      chrome.debugger.detach({ tabId }, () => resolve());
    });

    // WAIT TIME: Wait after detaching debugger before clicking send button
    // Recommended: 1200ms (reduce to 800ms for faster operation, increase to 1500ms if send button not found)
    await sleep(1200);

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

    // WAIT TIME: Wait after clicking send button to ensure message is sent
    // Recommended: 1500ms (reduce to 1000ms if message sends quickly, increase to 2000ms if slow)
    await sleep(1500);

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
