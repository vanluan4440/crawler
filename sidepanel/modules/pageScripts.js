/**
 * Page Scripts Module
 * Contains scripts that run in page context (injected via chrome.scripting.executeScript)
 */

/**
 * Script that runs in page context to find and click "Nhắn tin" button
 * Conditions:
 * 1. Must be a button (role="button")
 * 2. Must contain text "Nhắn tin" or "Message"
 */
export function findAndClickMessageButtonScript() {
    try {
        const allButtons = document.querySelectorAll('[role="button"]');
        let messageButton = null;

        for (const button of allButtons) {
            const text = button.textContent || button.innerText || '';
            if (text.includes('Nhắn tin') || text.includes('Message')) {
                messageButton = button;
                break;
            }
        }

        if (!messageButton) {
            return { success: false };
        }

        messageButton.click();
        return { success: true };

    } catch (error) {
        return { success: false };
    }
}

/**
 * Find input box coordinates for debugger API
 * This script runs in page context to locate the message input box
 * and return its center coordinates for mouse click simulation
 */
export function findInputBoxCoordinates() {
    try {
        const allTextboxes = document.querySelectorAll('[role="textbox"]');
        let messageTextbox = null;
        
        for (const textbox of allTextboxes) {
            const ariaLabel = textbox.getAttribute('aria-label') || '';
            if (ariaLabel.includes('Tin nhắn') || ariaLabel.includes('Message')) {
                messageTextbox = textbox;
                break;
            }
        }
        
        if (!messageTextbox) {
            const contentEditables = document.querySelectorAll('[contenteditable="true"]');
            for (const elem of contentEditables) {
                const ariaLabel = elem.getAttribute('aria-label') || '';
                if (ariaLabel.includes('Tin nhắn') || ariaLabel.includes('Message')) {
                    messageTextbox = elem;
                    break;
                }
            }
        }
        
        if (!messageTextbox) {
            return { success: false };
        }
        
        try {
            window.focus();
        } catch (e) {}
        
        messageTextbox.scrollIntoView({
            behavior: 'instant',
            block: 'center',
            inline: 'center'
        });
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const rect = messageTextbox.getBoundingClientRect();
                const inputX = rect.left + (rect.width / 2);
                const inputY = rect.top + (rect.height / 2);
                
                resolve({
                    success: true,
                    inputX: Math.round(inputX),
                    inputY: Math.round(inputY)
                });
            // WAIT TIME: Wait for textbox to be fully rendered before getting coordinates
            // Recommended: 1200ms (reduce to 800ms if textbox renders quickly)
            }, 1200);
        });
        
    } catch (error) {
        return { success: false };
    }
}

/**
 * Extract group data from Facebook search results
 * This function runs in the page context
 */
export function extractGroupDataScript() {
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
                    results.push({
                        title: title.trim(),
                        url: href
                    });
                    seenUrls.add(href);
                }
            }
        }
    });

    return { success: true, data: results };
}

