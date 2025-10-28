/**
 * State Management Module
 * Manages global application state
 */

export const state = {
    currentPageUrl: '',
    extractedData: {
        links: [],
        images: [],
        metadata: {}
    },
    currentScrollTabId: null
};

export function setCurrentPageUrl(url) {
    state.currentPageUrl = url;
}

export function setExtractedData(data) {
    state.extractedData = { ...state.extractedData, ...data };
}

export function setCurrentScrollTabId(tabId) {
    state.currentScrollTabId = tabId;
}

export function getState() {
    return state;
}

export function resetExtractedData() {
    state.extractedData = {
        links: [],
        images: [],
        metadata: {}
    };
}

