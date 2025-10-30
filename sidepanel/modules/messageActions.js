/**
 * Message Actions Module
 * Handles message-related operations: clicking message button and sending messages
 */

import { showMessage } from './ui.js';
import { batchState, updateBatchUI } from './batchState.js';
import { sleep } from './batchCore.js';
import { findAndClickMessageButtonScript, findInputBoxCoordinates } from './pageScripts.js';

/**
 * Click "Nhắn tin" button on all opened tabs
 * Step 1: Find and click the message button
 * @param {boolean} skipProcessingCheck - Skip isProcessing check for auto mode
 */
export async function clickMessageButtonOnAllTabs(skipProcessingCheck = false) {
    if (batchState.openedTabIds.length === 0) {
        showMessage('No tabs are currently open. Open a batch first.', 'error');
        return;
    }

    if (!skipProcessingCheck && batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    if (!skipProcessingCheck) {
        batchState.isProcessing = true;
        updateBatchUI();
    }

    try {
        let successCount = 0;
        let failCount = 0;

        showMessage(`Finding "Nhắn tin" button on ${batchState.openedTabIds.length} tabs...`, 'success');

        for (let i = 0; i < batchState.openedTabIds.length; i++) {
            const tabId = batchState.openedTabIds[i];
            
            try {
                // Execute script to find and click message button
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: findAndClickMessageButtonScript
                });

                if (results && results[0] && results[0].result) {
                    const { success } = results[0].result;
                    if (success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } else {
                    failCount++;
                }

                // WAIT TIME: Delay between clicking "Nhắn tin" button on each tab
                // Recommended: 1200ms (reduce to 800ms for faster operation, increase to 1500ms if chatbox fails to load)
                await sleep(1200);

            } catch (error) {
                failCount++;
                console.error(`Tab ${i + 1} error:`, error.message);
            }
        }

        // Show summary
        if (successCount > 0) {
            showMessage(
                `✅ Clicked message button on ${successCount}/${batchState.openedTabIds.length} tabs` +
                (failCount > 0 ? ` (${failCount} failed)` : ''),
                'success'
            );
        } else {
            showMessage(`❌ Failed to click button on all tabs. Check console for details.`, 'error');
        }

    } catch (error) {
        console.error('Error clicking message buttons:', error);
        showMessage('Failed to click message buttons: ' + error.message, 'error');
    } finally {
        if (!skipProcessingCheck) {
            batchState.isProcessing = false;
            updateBatchUI();
        }
    }
}

/**
 * Type and send message to all opened tabs
 * Step 2: Find textbox, type message, and send
 * Uses Chrome Debugger API to bypass Facebook's event blocking
 * @param {boolean} skipProcessingCheck - Skip isProcessing check for auto mode
 */
export async function typeAndSendMessageOnAllTabs(skipProcessingCheck = false) {
    if (batchState.openedTabIds.length === 0) {
        showMessage('No tabs are currently open. Open a batch first.', 'error');
        return;
    }

    if (!skipProcessingCheck && batchState.isProcessing) {
        showMessage('Please wait, currently processing...', 'error');
        return;
    }

    // Get message template from UI
    const messageTemplate = document.getElementById('messageTemplate')?.value?.trim();
    
    if (!messageTemplate) {
        showMessage('Please enter a message template first!', 'error');
        return;
    }

    if (!skipProcessingCheck) {
        batchState.isProcessing = true;
        updateBatchUI();
    }

    try {
        let successCount = 0;
        let failCount = 0;

        showMessage(`Sending message to ${batchState.openedTabIds.length} tabs (using debugger API)...`, 'success');

        for (let i = 0; i < batchState.openedTabIds.length; i++) {
            const tabId = batchState.openedTabIds[i];
            
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: findInputBoxCoordinates
                });

                if (!results || !results[0] || !results[0].result) {
                    failCount++;
                    continue;
                }

                const { success, inputX, inputY } = results[0].result;
                
                if (!success) {
                    failCount++;
                    continue;
                }

                let response;
                try {
                    response = await chrome.runtime.sendMessage({
                        action: 'sendMessageViaDebugger',
                        tabId: tabId,
                        inputX: inputX,
                        inputY: inputY,
                        messageText: messageTemplate
                    });
                } catch (sendError) {
                    failCount++;
                    console.error(`Tab ${i + 1} send error:`, sendError);
                    continue;
                }

                if (response && response.success) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`Tab ${i + 1} failed:`, response?.error);
                }

                // WAIT TIME: Delay between sending messages to each tab
                // Recommended: 4000ms (reduce to 3000ms for faster operation, increase to 5000ms if injection fails)
                if (i < batchState.openedTabIds.length - 1) {
                    await sleep(4000);
                }

            } catch (error) {
                failCount++;
                console.error(`Tab ${i + 1} error:`, error);
            }
        }

        // Show summary
        if (successCount > 0) {
            showMessage(
                `✅ Sent message to ${successCount}/${batchState.openedTabIds.length} tabs` +
                (failCount > 0 ? ` (${failCount} failed)` : ''),
                'success'
            );
        } else {
            showMessage(`❌ Failed to send message to all tabs. Check console for details.`, 'error');
        }

    } catch (error) {
        console.error('Error sending messages:', error);
        showMessage('Failed to send messages: ' + error.message, 'error');
    } finally {
        if (!skipProcessingCheck) {
            batchState.isProcessing = false;
            updateBatchUI();
        }
    }
}

