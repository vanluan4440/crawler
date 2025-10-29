# Step 2: Type & Send Message Feature

## 🎯 Mục đích

Tự động điền template message vào chatbox và gửi tin nhắn trên tất cả các tabs đã mở trong batch hiện tại.

## ✅ Đã implement - Step 2 Complete

### Chức năng hiện tại:

- ✅ Thêm textarea để user nhập message template
- ✅ Tìm textbox với `role="textbox"` và `aria-label="Tin nhắn"` hoặc `"Message"`
- ✅ Focus vào textbox
- ✅ Điền message template vào textbox
- ✅ Trigger input events để Facebook nhận biết
- ✅ Tìm nút Send với `aria-label="Nhấn Enter để gửi"` hoặc `"Press enter to send"`
- ✅ Click nút Send hoặc dùng phím Enter (fallback)
- ✅ Delay 2 giây giữa các tabs (tránh spam)
- ✅ Hiển thị kết quả: X/5 tabs sent successfully

## 🎨 UI Components

### 1. Message Template Textarea

- **Label**: "📝 Message Template:"
- **Placeholder**: "Enter your message template here..."
- **Style**: Border xanh lá (#10b981), matching với batch section
- **Rows**: 4 (có thể resize)
- **Validation**: Nút Send chỉ enable khi có nội dung

### 2. Send Message Button

- **Text**: "📨 Type & Send Message (Step 2)"
- **Màu**: Gradient cyan (#06b6d4 → #0891b2)
- **Enable khi**:
  - Có tabs đang mở
  - Message template không rỗng
  - Không đang processing
- **Processing text**: "⏳ Sending messages..."

## 🔧 Technical Implementation

### Function chính: `typeAndSendMessageOnAllTabs()`

**Logic:**

```javascript
1. Check có tabs đang mở không
2. Check message template có nội dung không
3. Loop qua từng tab trong batchState.openedTabIds
4. Inject script vào mỗi tab để:
   Step 1: Tìm textbox (role="textbox", aria-label="Tin nhắn/Message")
   Step 2: Focus và điền message
   Step 3: Trigger input events
   Step 4: Wait 1s cho Facebook process
   Step 5: Tìm send button (aria-label="Nhấn Enter để gửi/Press enter to send")
   Step 6: Click button HOẶC press Enter (fallback)
5. Delay 2s giữa các tabs
6. Hiển thị tổng kết: successCount/totalTabs
```

### Script inject: `typeAndSendMessageScript(messageTemplate)`

**Parameters:**

- `messageTemplate` (string): Nội dung tin nhắn từ UI

**Steps trong script:**

#### Step 1: Find Textbox

```javascript
// Tìm tất cả textbox với role="textbox"
const allTextboxes = document.querySelectorAll('[role="textbox"]');

// Filter theo aria-label
for (const textbox of allTextboxes) {
  const ariaLabel = textbox.getAttribute("aria-label") || "";
  if (ariaLabel.includes("Tin nhắn") || ariaLabel.includes("Message")) {
    messageTextbox = textbox;
    break;
  }
}
```

#### Step 2: Type Message

```javascript
// Focus textbox
messageTextbox.focus();
messageTextbox.click();

// Điền text (multiple methods cho compatibility)
messageTextbox.textContent = messageTemplate;
messageTextbox.innerText = messageTemplate;
messageTextbox.innerHTML = messageTemplate;

// Trigger events
const inputEvent = new Event("input", { bubbles: true, cancelable: true });
messageTextbox.dispatchEvent(inputEvent);

const changeEvent = new Event("change", { bubbles: true });
messageTextbox.dispatchEvent(changeEvent);
```

#### Step 3: Wait & Find Send Button

```javascript
setTimeout(() => {
  // Tìm send button
  const allButtons = document.querySelectorAll('[role="button"]');

  for (const button of allButtons) {
    const ariaLabel = button.getAttribute("aria-label") || "";
    if (
      ariaLabel.includes("Nhấn Enter để gửi") ||
      ariaLabel.includes("Press enter to send") ||
      ariaLabel.includes("Press Enter to send")
    ) {
      sendButton = button;
      break;
    }
  }
}, 1000); // Wait 1s
```

#### Step 4: Send (Click or Enter)

```javascript
if (sendButton) {
  // Method 1: Click button
  sendButton.click();
} else {
  // Method 2: Press Enter (fallback)
  const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  messageTextbox.dispatchEvent(enterEvent);
}
```

**Return value:**

```javascript
{
    success: true/false,
    step: 'Find textbox' | 'Type message' | 'Find send button' | 'Complete',
    message: 'Success message' hoặc error details
}
```

## 🚀 Complete Workflow

### Full workflow (Step 1 + Step 2):

```
1. Search & scroll Facebook pages
2. Click "📥 Load Pages from Current Tab" → Load 23 pages
3. Enter message template in textarea
   Example: "Xin chào! Tôi muốn hợp tác với fanpage của bạn."
4. Click "🚀 Open Next Batch (5 tabs)" → Opens pages 1-5
5. Click "💬 Click 'Nhắn tin' Button (Step 1)" → Opens chat dialogs
6. Click "📨 Type & Send Message (Step 2)" → Sends messages
   ✅ Result: Sent message to 5/5 tabs
7. Click "🚀 Open Next Batch" → Opens pages 6-10
8. Repeat steps 5-6 until done
```

## 📊 Example Output

### Console logs:

```
Sending message to 5 tabs...
Tab 1:
  Step 1: Finding textbox...
  Found 3 textboxes
  ✅ Found message textbox with aria-label: Tin nhắn
  Step 2: Focusing textbox and typing message...
  ✅ Message typed successfully
  Step 3: Finding send button...
  Found 25 buttons
  ✅ Found send button with aria-label: Nhấn Enter để gửi
  Step 4: Clicking send button...
  ✅ Send button clicked successfully
Tab 1: ✅ Message sent successfully

[... similar for tabs 2-5 ...]

✅ Sent message to 5/5 tabs
```

### User notification:

```
✅ Sent message to 5/5 tabs
or
✅ Sent message to 4/5 tabs (1 failed)
```

## 🎨 UI States

### Send Button States:

```
State 1: No tabs open OR no message template
  → disabled, text: "📨 Type & Send Message (Step 2)"

State 2: Ready (tabs open + message template filled)
  → enabled, text: "📨 Type & Send Message (Step 2)"

State 3: Processing (sending messages)
  → disabled, text: "⏳ Sending messages..."

State 4: Completed
  → enabled again, ready for next batch
```

### Message Template Input:

- Real-time validation
- Updates send button state on input
- Preserves content between batches

## 🐛 Error Handling

### Handled cases:

- ✅ No tabs open → Show error message
- ✅ Empty message template → Show error message
- ✅ Textbox not found → Log step and fail gracefully
- ✅ Send button not found → Fallback to Enter key
- ✅ Script injection fails → Catch error and continue to next tab
- ✅ Tab closed during process → Catch error and continue

### Console logging:

- Logs số lượng textboxes tìm được
- Logs aria-label của từng textbox
- Logs từng step của process
- Logs kết quả mỗi tab với step fail (nếu có)
- Logs errors chi tiết

## ⏱️ Timing & Delays

- **500ms**: Delay giữa Step 1 tabs (click "Nhắn tin")
- **1000ms**: Wait cho Facebook enable send button (trong script)
- **2000ms**: Delay giữa Step 2 tabs (send message) - tránh spam flag

## 🔄 Retry Logic

**Current**: Không có auto-retry

**Fallback methods:**

1. **Type message**: 3 methods (textContent, innerText, innerHTML)
2. **Trigger events**: input + change events
3. **Send**: Click button hoặc Enter key

## 💡 Example Message Templates

### Template 1: Hợp tác

```
Xin chào! Tôi là [Tên] từ [Công ty].
Tôi rất thích nội dung của fanpage bạn và muốn thảo luận về cơ hội hợp tác.
Bạn có thể cho tôi thông tin liên hệ được không?
```

### Template 2: Quảng cáo

```
Chào bạn!
Tôi đại diện cho [Brand].
Chúng tôi có chương trình hợp tác dành cho các fanpage như của bạn.
Bạn có quan tâm tìm hiểu thêm không?
```

### Template 3: Giới thiệu dịch vụ

```
Hi! Tôi chuyên cung cấp [Dịch vụ].
Fanpage của bạn rất phù hợp với đối tượng khách hàng của chúng tôi.
Cho phép tôi chia sẻ thêm thông tin nhé!
```

## 📝 Testing Checklist

- [x] Textarea appears in UI
- [x] Send button appears in UI
- [x] Send button disabled when no template
- [x] Send button disabled when no tabs
- [x] Send button enabled when both conditions met
- [x] Find textbox successfully
- [x] Type message successfully
- [x] Trigger events work
- [x] Find send button successfully
- [x] Click send button works
- [x] Enter key fallback works
- [x] Delay 2s between tabs works
- [x] Shows correct success/fail count
- [x] UI updates correctly during processing
- [x] No linter errors

## 🔧 Files Modified

### 1. `sidepanel/sidepanel.html`

- Added: Message template textarea
- Added: Send message button
- Updated: Help text

### 2. `sidepanel/sidepanel.js`

- Added: Import `typeAndSendMessageOnAllTabs`
- Added: Event listener for send button
- Added: Input event listener to update button state

### 3. `sidepanel/sidepanel.css`

- Added: `.message-template-section` - Container style
- Added: `.template-label` - Label style
- Added: `.message-template-input` - Textarea style
- Added: `.btn-send` - Send button style (cyan gradient)

### 4. `sidepanel/modules/batchMessaging.js`

- Added: `typeAndSendMessageOnAllTabs()` - Main function
- Added: `typeAndSendMessageScript()` - Inject script
- Modified: `updateBatchUI()` - Handle send button state

## 🔮 Future Enhancements

### Possible improvements:

1. **Variable substitution in templates**

   ```javascript
   Template: "Xin chào {page_name}!"
   → "Xin chào Coffee Shop ABC!"
   ```

2. **Multiple templates**

   - Dropdown to select from saved templates
   - A/B testing different messages

3. **Retry failed tabs**

   - Auto-retry button
   - Manual select failed tabs

4. **Progress bar**

   - Visual progress during sending
   - ETA calculation

5. **Send statistics**

   - Track sent/failed/pending
   - Export report

6. **Smart delays**

   - Random delays (1.5s - 3s)
   - Avoid detection patterns

7. **Message preview**
   - Preview before sending
   - Character count

## 🚨 Important Notes

### Facebook Rate Limits:

- **Current delay**: 2s giữa messages
- **Recommendation**: Không gửi quá 50 messages/hour
- **Risk**: Gửi quá nhanh có thể bị Facebook flag spam

### Best Practices:

- ✅ Test với 1-2 tabs trước
- ✅ Sử dụng message template nhẹ nhàng, không spam
- ✅ Tôn trọng privacy của người nhận
- ✅ Không gửi tin nhắn quá dài
- ✅ Check spelling trước khi send
- ❌ Không sử dụng cho spam
- ❌ Không gửi links lạ
- ❌ Không gửi cùng lúc nhiều batch

### Compliance:

- Tuân thủ Facebook Community Standards
- Không vi phạm chính sách spam
- Chỉ dùng cho mục đích hợp pháp
- Respect user consent

## 🎉 Status

**✅ Step 2 COMPLETED - Full auto-messaging workflow implemented!**

### Current capabilities:

1. ✅ Load pages from Facebook search
2. ✅ Open in batches of 5
3. ✅ Click "Nhắn tin" buttons
4. ✅ Type custom message
5. ✅ Send message
6. ✅ Process multiple batches
7. ✅ Error handling & retry fallbacks
8. ✅ User-friendly UI & feedback

### Ready for production use! 🚀

---

**Created**: October 29, 2025
**Status**: ✅ Fully functional - ready to use
**Next**: Optional enhancements based on user feedback
