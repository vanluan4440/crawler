# Debugging Guide - Chrome Debugger API

## 🐛 Vấn đề đã fix

### Root Cause

**Problem**: `sender.tab.id` là `undefined` khi gọi từ sidepanel

**Explanation**:

- Sidepanel không phải là tab → `sender.tab` = `undefined`
- Background script cần `tabId` để attach debugger
- Solution: Pass `tabId` qua message payload

### Fixed Files

1. **`background/background.js`**:

   - Get `tabId` from `request.tabId` thay vì `sender.tab.id`
   - Add validation check

2. **`sidepanel/modules/batchMessaging.js`**:
   - Pass `tabId` explicitly trong message
   - Add better error handling và logging

## 🔍 How to Debug

### Step 1: Open Browser Console

**For Background Script Logs**:

1. Go to `chrome://extensions`
2. Find "Web Crawler DevTools"
3. Click "service worker" or "Inspect views: service worker"
4. Console tab will show `[Debugger]` logs

**For Content Script Logs**:

1. Open DevTools on the Facebook tab (F12)
2. Go to Console tab
3. Logs will show `Tab X:` messages

### Step 2: Expected Console Output

#### ✅ Successful Flow

**Background Script Console** (`chrome://extensions` → service worker):

```
[Debugger] Starting handleDebuggerMessage for tab 12345
[Debugger] Coordinates: (450, 680)
[Debugger] Message length: 45 chars
[Debugger] Attaching to tab 12345...
[Debugger] Detached any existing debugger
[Debugger] Attached to tab 12345 successfully
[Debugger] Clicking at (450, 680) to focus input...
[Debugger] Inserting text: "Xin chào! Tôi muốn hợp tác..."
[Debugger] Pressing Enter to send...
[Debugger] Detached from tab 12345
```

**Content Script Console** (Facebook tab F12):

```
Tab 1: Finding input box coordinates...
Finding message input box...
Found 3 textboxes
Checking textbox with aria-label: Tin nhắn
✅ Found message textbox
✅ Input box found at (450, 680)
   Rect: left=350, top=650, width=200, height=60
Tab 1: Found input at (450, 680)
Tab 1: Received response from background: {success: true, message: "..."}
Tab 1: ✅ Message sent successfully via debugger
```

#### ❌ Common Errors

**Error 1: "No tabId provided"**

```
Tab 1: ❌ Failed - No tabId provided
```

**Cause**: tabId not passed in message
**Solution**: Check batchMessaging.js passes `tabId: tabId`

---

**Error 2: "Cannot attach to this target"**

```
[Debugger] Attach failed: {message: "Cannot attach to this target"}
```

**Cause**: DevTools đang mở trên tab đó
**Solution**:

- Close DevTools trên target tab
- Script sẽ auto-detach trước khi attach mới

---

**Error 3: "Message textbox not found"**

```
Tab 1: ❌ Message textbox not found. Make sure chat dialog is open.
```

**Cause**: Chat dialog chưa mở
**Solution**: Click "💬 Click 'Nhắn tin' Button" trước

---

**Error 4: "Coordinates out of bounds"**

```
[Debugger] Error: Coordinates (1500, 2000) out of viewport bounds
```

**Cause**: Element bị scroll ra ngoài viewport
**Solution**: Already handled with fallback to contenteditable selector

## 🔧 Testing Checklist

### Before Testing:

- [ ] Extension loaded in `chrome://extensions`
- [ ] Background service worker is active
- [ ] Facebook is logged in
- [ ] Search results page is loaded

### Step-by-Step Test:

1. **Load Pages**

   ```
   ✅ Click "📥 Load Pages from Current Tab"
   Expected: "Initialized with X pages ready to process"
   ```

2. **Enter Message Template**

   ```
   ✅ Type message in textarea
   Expected: Send button enables
   ```

3. **Open Batch**

   ```
   ✅ Click "🚀 Open Next Batch (5 tabs)"
   Expected: 5 new tabs open with Facebook pages
   Expected Console: "Opened batch 1/X (5 tabs)"
   ```

4. **Click "Nhắn tin" Buttons**

   ```
   ✅ Click "💬 Click 'Nhắn tin' Button (Step 1)"
   Expected: Chat dialogs open on all 5 tabs
   Expected Console: "✅ Clicked message button on 5/5 tabs"
   ```

5. **Send Messages** (THE CRITICAL STEP)

   ```
   ✅ Click "📨 Type & Send Message (Step 2)"

   Check Background Console:
   Expected: See "[Debugger] Starting handleDebuggerMessage..." for each tab

   Check Content Console (each tab):
   Expected: See "Tab X: ✅ Message sent successfully via debugger"

   Check Facebook UI:
   Expected: Messages appear in chat dialogs
   ```

6. **Verify Success**
   ```
   ✅ Extension shows: "✅ Sent message to 5/5 tabs"
   ✅ Facebook shows sent messages
   ```

## 🚨 Debugging Specific Errors

### If you see "Unknown error"

1. **Check Background Console First**:

   ```
   chrome://extensions → service worker → Console
   ```

   Look for `[Debugger] Error:` messages

2. **Check if tabId is correct**:

   ```javascript
   // Should see this in background console:
   [Debugger] Starting handleDebuggerMessage for tab 12345

   // tabId should be a number, not undefined
   ```

3. **Check coordinates**:

   ```javascript
   // Should see valid coordinates:
   [Debugger] Coordinates: (450, 680)

   // Not:
   [Debugger] Coordinates: (undefined, undefined)  // ❌ BAD
   ```

4. **Check message text**:

   ```javascript
   // Should see message length:
   [Debugger] Message length: 45 chars

   // Not:
   [Debugger] Message length: 0 chars  // ❌ BAD (empty template)
   ```

### If debugger won't attach

1. **Close DevTools** on target tabs
2. **Try manual detach**:

   ```javascript
   // In background console:
   chrome.debugger.detach({ tabId: 12345 });
   ```

3. **Check tab is Facebook**:
   - Only Facebook tabs should be in the batch
   - Check URL starts with `https://www.facebook.com/`

### If message not typed

1. **Check coordinates are valid**:

   - Should be within viewport (0-1920 for x, 0-1080 for y typically)
   - Not negative or extremely large

2. **Check dialog is open**:

   - Manually verify chat dialog is visible
   - Try clicking "Nhắn tin" again

3. **Increase delays**:
   - Edit `background.js` and increase sleep times
   - Change `await sleep(300)` to `await sleep(1000)`

## 📊 Log Analysis

### Good Logs Pattern:

```
✅ Pattern for successful message send:

Background:
  [Debugger] Starting... → Attaching... → Attached → Clicking...
  → Inserting text... → Pressing Enter... → Detached

Content:
  Finding input box... → Found at (x, y) → Received response
  → ✅ Message sent successfully
```

### Bad Logs Pattern:

```
❌ Pattern for failed message:

Background:
  [Debugger] Starting... → [Debugger] Error: ...

Content:
  Finding input box... → ❌ Failed - [error message]
```

## 🔍 Advanced Debugging

### Enable Verbose Logging

Add to background.js (temporary):

```javascript
// At top of handleDebuggerMessage:
console.log("[DEBUG] Full request object:", JSON.stringify(request));
console.log("[DEBUG] Current tab state:", await chrome.tabs.get(tabId));
```

### Check Debugger Attachment Manually

In background console:

```javascript
// Test attach
chrome.debugger.attach({ tabId: 12345 }, "1.3", (result) => {
  console.log("Manual attach result:", result);
  console.log("Last error:", chrome.runtime.lastError);
});
```

### Monitor Debugger Events

Add listener in background.js:

```javascript
chrome.debugger.onDetach.addListener((source, reason) => {
  console.log("[Debugger] Detached:", source, "Reason:", reason);
});

chrome.debugger.onEvent.addListener((source, method, params) => {
  console.log("[Debugger] Event:", method, params);
});
```

## 📝 Common Solutions Summary

| Error                          | Solution                                     |
| ------------------------------ | -------------------------------------------- |
| "Unknown error"                | Check background console for details         |
| "No tabId provided"            | Reload extension, clear cache                |
| "Cannot attach to this target" | Close DevTools on target tab                 |
| "Textbox not found"            | Make sure chat dialog is open (Step 1 first) |
| "Coordinates out of bounds"    | Dialog might be closed, retry Step 1         |
| Empty message sent             | Check template textarea has content          |
| All tabs fail                  | Check debugger permission granted            |

## ✅ Final Verification

After fixes, you should see:

1. ✅ Background console shows `[Debugger] Attached...` for each tab
2. ✅ Content console shows `Tab X: ✅ Message sent successfully`
3. ✅ Facebook UI shows messages in chat dialogs
4. ✅ Extension shows "✅ Sent message to X/Y tabs"

## 🎯 Next Steps if Still Failing

1. **Copy full console logs** from both background and content
2. **Check manifest.json** has `"debugger"` permission
3. **Reload extension** completely
4. **Try with single tab first** (easier to debug)
5. **Check Facebook language** (VN or EN affects selectors)

---

**Updated**: October 29, 2025
**Status**: Ready for testing with improved logging
