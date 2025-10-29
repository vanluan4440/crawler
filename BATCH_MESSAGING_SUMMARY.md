# Batch Messaging Feature - Tóm tắt

## 🎯 Mục đích

Tính năng này giúp bạn mở các fanpage đã crawl được theo batch (5 links/lần), giúp quản lý và thực hiện các thao tác một cách có tổ chức.

## 📁 Files đã tạo/sửa đổi

### Tạo mới:

- **`sidepanel/modules/batchMessaging.js`** - Module chính xử lý logic batch
- **`sidepanel/modules/BATCH_MESSAGING_GUIDE.md`** - Hướng dẫn sử dụng chi tiết

### Chỉnh sửa:

- **`sidepanel/sidepanel.html`** - Thêm UI section mới
- **`sidepanel/sidepanel.js`** - Import và kết nối event listeners
- **`sidepanel/sidepanel.css`** - Styling cho batch section

## 🚀 Cách sử dụng (Quick Start)

```
1. Search & crawl fanpages như bình thường
2. Click "📥 Load Pages from Current Tab"
3. Click "🚀 Open Next Batch (5 tabs)" → Mở 5 tabs đầu tiên
4. [Thực hiện công việc của bạn với 5 tabs này]
5. Click "🚀 Open Next Batch (5 tabs)" → Đóng 5 tabs cũ, mở 5 tabs mới
6. Lặp lại cho đến hết
```

## 🎨 UI Components

### Section: Batch Messaging (màu xanh lá)

**Buttons:**

- 📥 **Load Pages from Current Tab** - Load danh sách từ Facebook
- 🚀 **Open Next Batch (5 tabs)** - Mở 5 tabs tiếp theo
- ❌ **Close Current Batch** - Đóng 5 tabs hiện tại
- 🔄 **Reset Process** - Reset về đầu

**Progress Display:**

- `Batch X/Y | Pages: A/B`
- Hiển thị tiến độ real-time

## 🔧 Technical Details

### Module: batchMessaging.js

**State Management:**

```javascript
batchState = {
  allPages: [], // Tất cả pages đã crawl
  currentBatchIndex: 0, // Index hiện tại
  batchSize: 5, // 5 tabs/batch
  isProcessing: false, // Đang xử lý
  openedTabIds: [], // IDs của tabs đang mở
};
```

**Main Functions:**

- `loadBatchFromCurrentPage()` - Extract và load pages
- `openNextBatch()` - Mở 5 tabs tiếp theo
- `closeCurrentBatchTabs()` - Đóng tabs hiện tại
- `resetBatchProcess()` - Reset lại từ đầu
- `getBatchState()` - Lấy thông tin progress

**Features:**

- ✅ Tự động đóng batch cũ khi mở batch mới
- ✅ Delay 300ms giữa các tab để tránh lag browser
- ✅ Validate URLs (chỉ chấp nhận valid Facebook page URLs)
- ✅ Real-time progress tracking
- ✅ Auto-disable buttons khi không phù hợp
- ✅ Error handling & user-friendly messages

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  1. User searches & scrolls Facebook               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  2. Click "Load Pages from Current Tab"            │
│     → Extract all page URLs from feed              │
│     → Initialize batchState with pages             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  3. Click "Open Next Batch"                        │
│     → Close previous batch tabs (if any)           │
│     → Open 5 new tabs (pages 1-5)                  │
│     → Update progress: Batch 1/X | Pages: 5/Y      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  4. User works with 5 opened tabs                  │
│     [TODO: Implement auto-messaging here]          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  5. Click "Open Next Batch" again                  │
│     → Close tabs 1-5                               │
│     → Open tabs 6-10                               │
│     → Update progress: Batch 2/X | Pages: 10/Y     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  6. Repeat until all batches completed             │
│     → Button shows "✅ All batches completed"      │
└─────────────────────────────────────────────────────┘
```

## 🎯 Next Steps - Các tính năng cần implement tiếp

### 1. Auto-send Message (Ưu tiên cao)

- [ ] Tạo UI input template tin nhắn
- [ ] Script inject vào mỗi tab để click "Message" button
- [ ] Điền tin nhắn vào form
- [ ] Click Send
- [ ] Delay giữa các tin nhắn (tránh spam)

### 2. Message Template Variables

- [ ] `{page_name}` - Tên fanpage
- [ ] `{page_url}` - URL fanpage
- [ ] `{index}` - Số thứ tự

### 3. Progress Tracking

- [ ] Lưu trạng thái: sent/failed/pending
- [ ] Export report ra CSV
- [ ] Hiển thị statistics

### 4. Error Handling

- [ ] Skip pages không gửi được tin nhắn
- [ ] Retry logic
- [ ] Log failed pages

### 5. Advanced Features

- [ ] Tùy chỉnh batch size (5, 10, 20...)
- [ ] Pause/Resume
- [ ] Schedule sending (gửi vào giờ cụ thể)

## 💡 Gợi ý Implementation - Auto Message

Để implement tính năng tự động gửi tin nhắn, bạn có thể:

```javascript
// Trong batchMessaging.js, thêm function:

export async function sendMessageToOpenedTabs(message) {
  for (const tabId of batchState.openedTabIds) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: sendMessageScript,
        args: [message],
      });
      await sleep(3000); // Delay 3s giữa các tin nhắn
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }
}

// Script inject vào page để gửi tin nhắn
function sendMessageScript(message) {
  // 1. Tìm nút "Message"
  const messageBtn = document.querySelector('[aria-label="Message"]');
  if (!messageBtn) return { success: false };

  // 2. Click nút
  messageBtn.click();

  // 3. Đợi dialog mở
  setTimeout(() => {
    // 4. Tìm textarea
    const textarea = document.querySelector('[contenteditable="true"]');
    if (!textarea) return;

    // 5. Điền tin nhắn
    textarea.textContent = message;

    // 6. Trigger event
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // 7. Tìm nút Send
    setTimeout(() => {
      const sendBtn = document.querySelector('[aria-label="Send"]');
      if (sendBtn) sendBtn.click();
    }, 500);
  }, 1000);

  return { success: true };
}
```

## 📝 Notes

- Module này chỉ mới xử lý việc **mở tabs theo batch**
- Logic **gửi tin nhắn** cần được implement riêng
- Facebook có thể thay đổi DOM structure, cần maintain scripts
- Nên test với số lượng nhỏ trước khi chạy hàng loạt
- Respect Facebook's rate limits để tránh bị ban

## 🐛 Known Issues

Không có issues nào được phát hiện trong quá trình development.

## ✅ Testing Checklist

- [x] Load pages successfully
- [x] Open 5 tabs per batch
- [x] Progress tracking works
- [x] Close batch tabs works
- [x] Reset process works
- [x] Handles edge cases (last batch < 5 pages)
- [x] UI updates correctly
- [x] No linter errors
- [ ] Auto-send message (chưa implement)

---

**Created**: October 29, 2025
**Status**: ✅ Core functionality completed, ready for messaging implementation
