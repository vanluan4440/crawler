# Batch Messaging Modules

This directory contains modular components for the batch messaging feature.

## 📁 File Structure

### Core Modules

#### 1. **`batchMessaging.js`** - Main Orchestrator

- **Purpose**: Main entry point that coordinates the entire batch messaging workflow
- **Key Functions**:
  - `initBatchMessaging(pages)` - Initialize with page data
  - `sendToAllPages()` - Main auto-send workflow
  - `loadBatchFromCurrentPage()` - Extract and load pages from current tab
- **Dependencies**: Uses all other batch modules
- **Lines**: ~200 (reduced from 771)

#### 2. **`batchState.js`** - State Management

- **Purpose**: Manages batch state and UI updates
- **Key Functions**:
  - `batchState` - Global state object
  - `getBatchState()` - Get current state info
  - `updateBatchUI()` - Update all UI elements
  - `resetBatchState()` - Reset state to initial values
- **Dependencies**: None (pure state management)
- **Lines**: ~130

#### 3. **`batchCore.js`** - Core Operations

- **Purpose**: Core batch operations (open, close, wait for tabs)
- **Key Functions**:
  - `openNextBatch(skipProcessingCheck)` - Open next batch of 5 tabs
  - `closeCurrentBatchTabs()` - Close all tabs in current batch
  - `resetBatchProcess()` - Reset and start over
  - `waitForAllTabsToLoad(tabIds, timeout)` - Wait for tabs to load
  - `sleep(ms)` - Helper sleep function
- **Dependencies**: `ui.js`, `batchState.js`
- **Lines**: ~175

#### 4. **`messageActions.js`** - Message Operations

- **Purpose**: Handle message-related actions (click button, send message)
- **Key Functions**:
  - `clickMessageButtonOnAllTabs(skipProcessingCheck)` - Click "Nhắn tin" on all tabs
  - `typeAndSendMessageOnAllTabs(skipProcessingCheck)` - Send messages via debugger API
- **Dependencies**: `ui.js`, `batchState.js`, `batchCore.js`, `pageScripts.js`
- **Lines**: ~210

#### 5. **`pageScripts.js`** - Page Context Scripts

- **Purpose**: Scripts that run in page context (injected via chrome.scripting.executeScript)
- **Key Functions**:
  - `findAndClickMessageButtonScript()` - Find and click "Nhắn tin" button
  - `findInputBoxCoordinates()` - Get input box coordinates for debugger
  - `extractGroupDataScript()` - Extract page data from Facebook search
- **Dependencies**: None (runs in page context)
- **Lines**: ~145

### Other Modules

- **`ui.js`** - UI helpers (showMessage, etc.)
- **`state.js`** - Global app state
- **`scroll.js`** - Auto-scroll functionality
- **`navigation.js`** - Navigation helpers
- **`extraction.js`** - Data extraction
- **`export.js`** - Export functionality
- **`exportCSV.js`** - CSV export

## 🔄 Module Flow

```
User Action
    ↓
batchMessaging.js (Main Orchestrator)
    ↓
    ├→ batchState.js (Get/Update State & UI)
    ↓
    ├→ batchCore.js (Open/Close/Wait Tabs)
    ↓
    ├→ messageActions.js (Click Button/Send Message)
    │       ↓
    │       └→ pageScripts.js (Inject Scripts)
    ↓
    └→ Result
```

## 📝 Wait Time Configuration

All wait times are commented with `// WAIT TIME:` prefix for easy modification.

**In `batchCore.js`:**

- Between opening tabs: 500ms
- After all tabs loaded: 2000ms

**In `batchMessaging.js`:**

- After tabs open: 3000ms
- After click buttons: 8000ms
- After send messages: 8000ms
- Between batches: 3000ms

**In `messageActions.js`:**

- Between clicking buttons: 1200ms
- Between sending messages: 4000ms

**In `pageScripts.js`:**

- Before getting coordinates: 800ms

**In `background.js`:**

- Debugger operations: 400-2000ms (see comments)

## 🔧 Modifying the Code

### To change batch size:

Edit `batchState.js`:

```javascript
batchSize: 5; // Change to 3, 10, etc.
```

### To adjust wait times:

Search for `// WAIT TIME:` in any file and modify the value.

### To add new batch operations:

Add to `batchCore.js` and export from `batchMessaging.js`.

### To add new message actions:

Add to `messageActions.js` and export from `batchMessaging.js`.

### To add new page scripts:

Add to `pageScripts.js` and import in `messageActions.js`.

## ✅ Benefits of Modular Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Easy to Maintain**: Find and fix bugs faster
3. **Reusability**: Import only what you need
4. **Testability**: Test individual modules in isolation
5. **Readability**: Smaller files, easier to understand
6. **Scalability**: Add new features without bloating existing files

## 🚀 Usage Example

```javascript
// In sidepanel.js or other files
import {
  initBatchMessaging,
  sendToAllPages,
  loadBatchFromCurrentPage,
  openNextBatch,
  closeCurrentBatchTabs,
  resetBatchProcess,
  clickMessageButtonOnAllTabs,
  typeAndSendMessageOnAllTabs,
} from "./modules/batchMessaging.js";

// Load pages
await loadBatchFromCurrentPage();

// Auto send to all
await sendToAllPages();

// Or manual control
await openNextBatch();
await clickMessageButtonOnAllTabs();
await typeAndSendMessageOnAllTabs();
```
