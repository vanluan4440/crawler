/**
 * Scroll Module
 * Handles infinite scrolling functionality
 */

import { state, setCurrentScrollTabId } from './state.js';
import { showMessage } from './ui.js';

/**
 * Start auto-scroll after page loads
 * @param {number} tabId - Tab ID to scroll
 */
export function autoScrollAfterLoad(tabId) {
    const listener = (updatedTabId, changeInfo, tab) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
            // Remove listener after page loads
            chrome.tabs.onUpdated.removeListener(listener);
            
            // Show scroll status
            const scrollStatus = document.getElementById('scrollStatus');
            const scrollMessage = document.getElementById('scrollMessage');
            scrollStatus.style.display = 'flex';
            scrollMessage.textContent = 'Starting auto-scroll...';
            
            // Wait a bit for content to render, then start infinite scroll
            setTimeout(() => {
                scrollMessage.textContent = 'Auto-scrolling... (loading more results)';
                
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: infiniteScrollToBottom
                }).then(() => {
                    console.log('Started infinite scroll');
                    
                    // Monitor scroll completion
                    checkScrollCompletion(tabId);
                }).catch(err => {
                    console.error('Failed to start infinite scroll:', err);
                    scrollStatus.style.display = 'none';
                    showMessage('Failed to start auto-scroll', 'error');
                });
            }, 2000); // Wait 2 seconds for initial content to load
        }
    };
    
    chrome.tabs.onUpdated.addListener(listener);
}

/**
 * Check scroll completion status
 * @param {number} tabId - Tab ID to monitor
 */
function checkScrollCompletion(tabId) {
    let checkCount = 0;
    const maxChecks = 150; // 150 checks * 2 seconds = 5 minutes max
    
    // Check every 2 seconds if scroll is complete
    const checkInterval = setInterval(async () => {
        checkCount++;
        
        if (state.currentScrollTabId !== tabId) {
            // Scroll was stopped manually
            clearInterval(checkInterval);
            document.getElementById('scrollStatus').style.display = 'none';
            return;
        }
        
        // Check if we've exceeded max time
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            onScrollComplete(tabId, 'timeout');
            return;
        }
        
        // Check if scroll is completed by querying the page
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        completed: window.scrollCompleted || false,
                        stopped: window.stopInfiniteScroll || false
                    };
                }
            });
            
            if (results && results[0] && results[0].result) {
                const { completed, stopped } = results[0].result;
                
                if (completed) {
                    clearInterval(checkInterval);
                    onScrollComplete(tabId, 'completed');
                } else if (stopped) {
                    clearInterval(checkInterval);
                    onScrollComplete(tabId, 'stopped');
                }
            }
        } catch (error) {
            // Tab might be closed or navigated away
            console.error('Error checking scroll status:', error);
            clearInterval(checkInterval);
            onScrollComplete(tabId, 'error');
        }
    }, 2000);
}

/**
 * Handle scroll completion
 * @param {number} tabId - Tab ID
 * @param {string} reason - Reason for completion ('completed', 'stopped', 'timeout', 'error')
 */
function onScrollComplete(tabId, reason) {
    if (state.currentScrollTabId !== tabId) return;
    
    const scrollStatus = document.getElementById('scrollStatus');
    const scrollMessage = document.getElementById('scrollMessage');
    const scrollIcon = document.querySelector('.scroll-icon');
    const stopBtn = document.getElementById('stopScrollBtn');
    
    // Add completed class to stop animations
    scrollStatus.classList.add('completed');
    
    // Hide stop button when completed
    stopBtn.style.display = 'none';
    
    // Update status based on reason
    switch (reason) {
        case 'completed':
            scrollIcon.textContent = '✅';
            scrollMessage.textContent = 'Scroll completed! Reached the end.';
            showMessage('Auto-scroll completed!', 'success');
            break;
        case 'stopped':
            scrollIcon.textContent = '⏹️';
            scrollMessage.textContent = 'Scroll stopped by user.';
            break;
        case 'timeout':
            scrollIcon.textContent = '⏰';
            scrollMessage.textContent = 'Scroll timeout (5 min limit).';
            showMessage('Auto-scroll timeout reached', 'error');
            break;
        case 'error':
            scrollIcon.textContent = '❌';
            scrollMessage.textContent = 'Scroll error or page closed.';
            break;
    }
    
    // Hide status after 3 seconds
    setTimeout(() => {
        scrollStatus.style.display = 'none';
        scrollStatus.classList.remove('completed');
        stopBtn.style.display = 'block'; // Reset for next time
        setCurrentScrollTabId(null);
    }, 3000);
}

/**
 * Stop scrolling
 */
export function stopScroll() {
    if (state.currentScrollTabId) {
        const tabId = state.currentScrollTabId;
        
        // Inject script to stop scrolling
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                window.stopInfiniteScroll = true;
            }
        }).catch(err => {
            console.error('Failed to stop scroll:', err);
        });
        
        // Show stopped status
        onScrollComplete(tabId, 'stopped');
        showMessage('Auto-scroll stopped', 'success');
    }
}

/**
 * This function runs in the page context
 * Performs infinite scroll until reaching the bottom
 */
function infiniteScrollToBottom() {
    // Initialize stop flag
    window.stopInfiniteScroll = false;
    
    let scrollAttempts = 0;
    let maxAttempts = 100; // Maximum scroll attempts to prevent infinite loop
    let lastHeight = 0;
    let sameHeightCount = 0;
    let scrollDelay = 1000; // Delay between scrolls (ms)
    
    console.log('🚀 Starting infinite scroll...');
    
    function scrollStep() {
        // Check if stop was requested
        if (window.stopInfiniteScroll) {
            console.log('🛑 Scroll stopped by user. Total scrolls:', scrollAttempts);
            return;
        }
        
        // Get current scroll height
        const currentHeight = document.documentElement.scrollHeight;
        
        // Check if height hasn't changed
        if (currentHeight === lastHeight) {
            sameHeightCount++;
            console.log(`📊 Height unchanged: ${sameHeightCount}/3`);
            
            // If height hasn't changed for 3 consecutive attempts, we're done
            if (sameHeightCount >= 3) {
                console.log('✅ Reached the end! Total scrolls:', scrollAttempts);
                window.scrollCompleted = true;
                return;
            }
        } else {
            sameHeightCount = 0; // Reset counter if height changed
            console.log(`📈 New content loaded! Height: ${currentHeight}px`);
        }
        
        lastHeight = currentHeight;
        scrollAttempts++;
        
        // Stop if we've exceeded max attempts
        if (scrollAttempts >= maxAttempts) {
            console.log('⚠️ Max scroll attempts reached:', maxAttempts);
            window.scrollCompleted = true;
            return;
        }
        
        // Scroll down
        window.scrollTo({
            top: currentHeight,
            behavior: 'smooth'
        });
        
        console.log(`⬇️ Scroll #${scrollAttempts} - Position: ${window.scrollY}px / ${currentHeight}px`);
        
        // Continue scrolling after delay
        setTimeout(scrollStep, scrollDelay);
    }
    
    // Start the scroll loop
    scrollStep();
}

