# Modules Documentation

Cấu trúc modules được tổ chức theo chức năng để code dễ maintain và scale.

## 📁 Cấu trúc

```
modules/
├── state.js        # Global state management
├── ui.js           # UI helpers và display functions
├── navigation.js   # URL navigation và Facebook search
├── scroll.js       # Auto-scroll infinite scroll
├── extraction.js   # Data extraction (links, images, metadata)
├── export.js       # Export JSON và CSV
└── facebook.js     # Facebook-specific data extraction
```

## 📋 Chi tiết từng module

### state.js

Quản lý state toàn cục của application.

**Exports:**

- `state` - Global state object
- `setCurrentPageUrl(url)` - Set URL hiện tại
- `setExtractedData(data)` - Update extracted data
- `setCurrentScrollTabId(tabId)` - Set tab đang scroll
- `getState()` - Lấy toàn bộ state
- `resetExtractedData()` - Reset data về rỗng

---

### ui.js

Xử lý tất cả UI operations.

**Exports:**

- `showMessage(message, type)` - Hiển thị message trong footer
- `highlightCard(cardId)` - Highlight action card được chọn
- `updateStats()` - Update statistics display
- `loadCurrentPageInfo()` - Load và hiển thị thông tin page hiện tại

---

### navigation.js

Xử lý navigation và Facebook search.

**Exports:**

- `navigateToUrl()` - Navigate tới URL/Facebook search

**Features:**

- Auto-add `https://www.facebook.com/search/pages?q=` prefix
- URL validation
- Tự động trigger auto-scroll nếu enabled

---

### scroll.js

Quản lý infinite scroll functionality.

**Exports:**

- `autoScrollAfterLoad(tabId)` - Bắt đầu auto-scroll sau khi page load
- `stopScroll()` - Dừng scroll giữa chừng

**Internal Functions:**

- `checkScrollCompletion(tabId)` - Monitor scroll progress
- `onScrollComplete(tabId, reason)` - Handle scroll completion
- `infiniteScrollToBottom()` - Script inject vào page để scroll

**Features:**

- Smart detection khi reach bottom (3 lần height không đổi)
- Max 100 scroll attempts
- Timeout 5 phút
- Real-time status updates

---

### extraction.js

Extract data từ web pages.

**Exports:**

- `extractLinks()` - Extract tất cả links
- `extractImages()` - Extract tất cả images
- `extractMetadata()` - Extract SEO metadata
- `fullCrawl()` - Extract tất cả data cùng lúc

**Data Structure:**

```javascript
{
  links: [{url: string, text: string}],
  images: [{src: string, alt: string, width: number, height: number}],
  metadata: {title, description, keywords, author, ogTitle, ogImage}
}
```

---

### export.js

Export data ra file.

**Exports:**

- `exportToJson()` - Export data dạng JSON
- `exportToCsv()` - Export data dạng CSV

**Internal:**

- `escapeCSV(text)` - Escape CSV special characters

---

### facebook.js

Extract và export Facebook-specific data (pages, pages, etc).

**Exports:**

- `extractAndExportFacebookpages()` - Extract pages từ Facebook search và export CSV
- `getGroupCount()` - Lấy số lượng pages hiện tại (cho preview)

**Features:**

- Smart parsing của Facebook DOM structure
- Filter duplicate pages
- Remove irrelevant links (feed, discover)
- Export với format CSV đẹp (No, Group Name, Group URL)
- Validation Facebook URL

**CSV Format:**

```csv
No,Group Name,Group URL
1,"JavaScript Developers","https://facebook.com/pages/12345"
2,"Web Development","https://facebook.com/pages/67890"
```

---

## 🔄 Data Flow

```
User Action (sidepanel.js)
    ↓
Module Function Call
    ↓
Chrome API Interaction
    ↓
State Update (state.js)
    ↓
UI Update (ui.js)
```

## 🎯 Import Usage

```javascript
// Main file (sidepanel.js)
import { loadCurrentPageInfo } from "./modules/ui.js";
import { navigateToUrl } from "./modules/navigation.js";
import { stopScroll } from "./modules/scroll.js";
import { extractLinks, extractImages } from "./modules/extraction.js";
import { exportToJson, exportToCsv } from "./modules/export.js";
```

## 🛠️ Thêm chức năng mới

1. **Tạo module mới**: `modules/feature.js`
2. **Export functions**: Sử dụng ES6 `export`
3. **Import vào main**: Thêm vào `sidepanel.js`
4. **Setup event listener**: Trong `setupEventListeners()`

## 📝 Best Practices

- ✅ Mỗi module có 1 responsibility rõ ràng
- ✅ Export only public API
- ✅ Document parameters và return values
- ✅ Handle errors gracefully
- ✅ Use async/await cho Chrome APIs
- ✅ Keep state centralized trong state.js
