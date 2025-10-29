# Auto-Click "Nhắn tin" Button Feature

## 🎯 Mục đích

Tính năng tự động tìm và click nút "Nhắn tin" (hoặc "Message") trên tất cả các tabs đã mở trong batch hiện tại.

## ✅ Đã implement - Step 1

### Chức năng hiện tại:

- ✅ Tìm button với `role="button"`
- ✅ Kiểm tra button có chứa text "Nhắn tin" hoặc "Message"
- ✅ Click vào button đó
- ✅ Xử lý lần lượt trên 5 tabs đã mở
- ✅ Hiển thị kết quả: X/5 tabs thành công
- ✅ Delay 500ms giữa các tabs

## 🎨 UI

### Button mới: "💬 Click 'Nhắn tin' Button (Step 1)"

- **Màu**: Gradient hồng (#ec4899 → #db2777)
- **Vị trí**: Dưới nút "Open Next Batch"
- **Enable khi**: Có tabs đang mở
- **Disable khi**: Không có tabs hoặc đang processing

## 🔧 Technical Implementation

### Function chính: `clickMessageButtonOnAllTabs()`

**Logic:**

```javascript
1. Check có tabs đang mở không
2. Loop qua từng tab trong batchState.openedTabIds
3. Inject script vào mỗi tab để:
   - Tìm tất cả elements với role="button"
   - Filter button có chứa text "Nhắn tin" hoặc "Message"
   - Click button đầu tiên tìm được
4. Delay 500ms giữa các tabs
5. Hiển thị tổng kết: successCount/totalTabs
```

### Script inject: `findAndClickMessageButtonScript()`

**Điều kiện tìm button:**

1. ✅ Element phải có `role="button"`
2. ✅ TextContent phải chứa "Nhắn tin" HOẶC "Message"

**Return value:**

```javascript
{
    success: true/false,
    message: 'Button clicked successfully' hoặc error message,
    buttonText: 'Nhắn tin' // Text của button đã click
}
```

## 🚀 Workflow sử dụng

### Current workflow (Step 1 completed):

```
1. Load pages → Click "📥 Load Pages from Current Tab"
2. Open batch → Click "🚀 Open Next Batch (5 tabs)"
3. Click message buttons → Click "💬 Click 'Nhắn tin' Button (Step 1)"
   ✅ Result: Mở dialog/popup nhắn tin trên 5 tabs
4. [NEXT STEPS - Chờ user cung cấp dữ kiện]
```

## 📊 Example Output

### Console logs:

```
Finding "Nhắn tin" button on 5 tabs...
Tab 1: Successfully clicked "Nhắn tin" button
Tab 2: Successfully clicked "Message" button
Tab 3: Successfully clicked "Nhắn tin" button
Tab 4: Failed - Button with "Nhắn tin" or "Message" not found
Tab 5: Successfully clicked "Nhắn tin" button
```

### User notification:

```
✅ Clicked message button on 4/5 tabs (1 failed)
```

## 🎯 Next Steps - Chờ user cung cấp dữ kiện

User sẽ cung cấp tiếp:

- [ ] **Step 2**: Làm gì sau khi dialog nhắn tin mở?
- [ ] **Step 3**: Tìm và điền text vào textarea?
- [ ] **Step 4**: Click nút Send?
- [ ] **Step 5**: Handle errors và retry?

## 🔍 Code Locations

### Files modified:

1. **`sidepanel/modules/batchMessaging.js`**

   - Added: `clickMessageButtonOnAllTabs()` - Main function
   - Added: `findAndClickMessageButtonScript()` - Inject script
   - Modified: `updateBatchUI()` - Handle new button state

2. **`sidepanel/sidepanel.html`**

   - Added: Button "💬 Click 'Nhắn tin' Button (Step 1)"
   - Modified: Help text to reflect new workflow

3. **`sidepanel/sidepanel.js`**

   - Added: Import `clickMessageButtonOnAllTabs`
   - Added: Event listener for button

4. **`sidepanel/sidepanel.css`**
   - Added: `.btn-message` style (pink gradient)

## 🎨 Button States

```
State 1: No tabs open
  → disabled, text: "💬 Click 'Nhắn tin' Button (Step 1)"

State 2: Tabs open, ready to click
  → enabled, text: "💬 Click 'Nhắn tin' Button (Step 1)"

State 3: Processing (clicking buttons)
  → disabled, text: "⏳ Clicking buttons..."

State 4: Completed
  → enabled again, ready for re-click if needed
```

## 🐛 Error Handling

### Handled cases:

- ✅ No tabs open → Show error message
- ✅ Button not found on page → Log and count as failure
- ✅ Script injection fails → Catch error and continue
- ✅ Tab closed during process → Catch error and continue

### Console logging:

- Logs số lượng buttons tìm được
- Logs khi tìm thấy message button
- Logs kết quả mỗi tab
- Logs errors nếu có

## 📝 Testing Checklist

- [x] Button appears in UI
- [x] Button disabled when no tabs
- [x] Button enabled when tabs are open
- [x] Click button successfully finds "Nhắn tin"
- [x] Click button successfully finds "Message" (English)
- [x] Shows correct success/fail count
- [x] Delay 500ms between tabs works
- [x] UI updates correctly during processing
- [x] No linter errors

## 💡 Example Usage

```javascript
// User workflow:
1. Search "coffee shop" on Facebook
2. Auto-scroll to load results
3. Click "Load Pages" → Loaded 23 pages
4. Click "Open Next Batch" → Opens pages 1-5 in tabs
5. Click "Click 'Nhắn tin' Button" → ✅ Clicked on 5/5 tabs
   → Dialog nhắn tin mở trên cả 5 tabs
6. [Wait for next steps to implement...]
```

## 🔄 Current Limitations

- ⚠️ Chỉ tìm button đầu tiên matching criteria
- ⚠️ Không handle trường hợp page chưa load xong
- ⚠️ Không retry nếu fail
- ⚠️ Chưa có chức năng gửi tin nhắn (Step 2+)

## 📌 Notes for Next Implementation

Khi user cung cấp dữ kiện tiếp theo, có thể cần:

### Possible Step 2: Wait for dialog to open

```javascript
// Sau khi click button, có thể cần đợi dialog mở
await sleep(1000); // Wait for animation
```

### Possible Step 3: Find textarea

```javascript
// Tìm textarea trong dialog
const textarea = document.querySelector('[contenteditable="true"]');
// hoặc
const textarea = document.querySelector("textarea");
// hoặc có thể là attribute khác
```

### Possible Step 4: Type message

```javascript
// Điền nội dung tin nhắn
textarea.textContent = "Xin chào...";
// Trigger events để Facebook nhận biết
textarea.dispatchEvent(new Event("input", { bubbles: true }));
```

### Possible Step 5: Click Send button

```javascript
// Tìm nút Send
const sendBtn = document.querySelector('[aria-label="Send"]');
// hoặc text "Gửi"
sendBtn.click();
```

---

**Status**: ✅ Step 1 completed - Ready for Step 2
**Waiting for**: User to provide next requirements/dữ kiện
**Date**: October 29, 2025
