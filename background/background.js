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
  
  console.log(`[Debugger] Starting handleDebuggerMessage for tab ${tabId}`);
  console.log(`[Debugger] Coordinates: (${inputX}, ${inputY})`);
  console.log(`[Debugger] Message length: ${messageText?.length || 0} chars`);
  
  try {
    console.log(`[Debugger] Attaching to tab ${tabId}...`);
    
    // Try to detach first in case already attached
    try {
      await new Promise(resolve => {
        chrome.debugger.detach({ tabId }, () => {
          resolve();
        });
      });
      console.log(`[Debugger] Detached any existing debugger`);
    } catch (e) {
      // Ignore detach errors
    }
    
    await sleep(100);
    
    // Attach debugger to tab
    await new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
          console.error(`[Debugger] Attach failed:`, chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log(`[Debugger] Attached to tab ${tabId} successfully`);
          resolve();
        }
      });
    });

    // Small delay to ensure debugger is ready
    await sleep(200);

    // Step 1: Click to focus the input (simulate mouse press + release)
    console.log(`[Debugger] Clicking at (${inputX}, ${inputY}) to focus input...`);
    
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

    // Step 2: Insert text using Input.insertText (fast and efficient)
    console.log(`[Debugger] Inserting text: "${messageText.substring(0, 50)}..."`);
    
    await sendDebuggerCommand(tabId, 'Input.insertText', {
      text: messageText
    });

    await sleep(1200); // Wait for text to be inserted

    // Detach debugger before finding send button
    await new Promise((resolve) => {
      chrome.debugger.detach({ tabId }, () => {
        console.log(`[Debugger] Detached from tab ${tabId}`);
        resolve();
      });
    });

    await sleep(500);

    // Step 3: Find and click Send button
    console.log(`[Debugger] Finding and clicking Send button...`);
    
    const clickResult = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Find send button with aria-label matching both English and Vietnamese
        const sendButton = document.querySelector('div[role="button"][aria-label="Press enter to send"]') ||
                          document.querySelector('div[role="button"][aria-label="Nhấn Enter để gửi"]');
        
        if (sendButton) {
          console.log('Found send button, clicking...');
          sendButton.click();
          return { success: true, message: 'Send button clicked' };
        } else {
          console.error('Send button not found');
          return { success: false, error: 'Send button not found' };
        }
      }
    });

    const clickSuccess = clickResult?.[0]?.result?.success;
    
    if (!clickSuccess) {
      return {
        success: false,
        error: 'Failed to click send button',
        errorDetails: clickResult?.[0]?.result?.error || 'Button not found'
      };
    }

    return {
      success: true,
      message: 'Message sent successfully'
    };

  } catch (error) {
    console.error(`[Debugger] Error in handleDebuggerMessage:`, error);
    console.error(`[Debugger] Error stack:`, error.stack);
    
    // Make sure to detach on error
    try {
      await new Promise(resolve => {
        chrome.debugger.detach({ tabId }, () => {
          console.log(`[Debugger] Detached after error`);
          resolve();
        });
      });
    } catch (e) {
      console.error(`[Debugger] Detach error:`, e);
    }

    return {
      success: false,
      error: error.message || 'Unknown error in debugger handler',
      errorDetails: error.toString()
    };
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
