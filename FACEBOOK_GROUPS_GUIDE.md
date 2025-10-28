# Facebook pages Export Guide

Hướng dẫn chi tiết cách export danh sách Facebook pages ra CSV.

## 🎯 Tính năng

Extension cho phép bạn:

- Tìm kiếm pages trên Facebook
- Tự động scroll load tất cả kết quả
- Extract thông tin pages (tên, URL)
- Export ra file CSV đẹp

## 📋 Quy trình sử dụng

### Bước 1: Tìm kiếm pages trên Facebook

1. Mở extension Side Panel
2. Nhập keyword muốn tìm (ví dụ: "javascript", "web development")
3. Bấm nút **"🚀 Go"**
4. Extension sẽ tự động mở trang:
   ```
   https://www.facebook.com/search/pages?q=<keyword>
   ```

### Bước 2: Auto-scroll (tự động)

- Nếu checkbox **"Auto-scroll infinitely after search"** được bật:

  - Extension tự động scroll xuống cuối
  - Load tất cả pages có thể
  - Hiển thị status: "Auto-scrolling... (loading more results)"
  - Khi xong: "✅ Scroll completed! Reached the end."

- Hoặc bạn có thể scroll thủ công nếu tắt checkbox

### Bước 3: Export to CSV

1. Sau khi scroll xong (hoặc load đủ pages)
2. Bấm nút **"📊 Export Facebook pages"**
3. Extension sẽ:
   - Parse DOM để tìm tất cả pages trong `[role="feed"]`
   - Filter ra pages hợp lệ
   - Loại bỏ duplicate
   - Export ra CSV

### Bước 4: Nhận file CSV

File CSV sẽ tự động download với format:

```csv
No,Group Name,Group URL
1,"JavaScript Developers Vietnam","https://www.facebook.com/pages/123456789"
2,"Web Development Tips","https://www.facebook.com/pages/987654321"
3,"React & Node.js Community","https://www.facebook.com/pages/456789123"
```

## 🔍 Cách hoạt động (Technical)

### DOM Parsing Logic

```javascript
// 1. Tìm container chính
div[role="feed"]

// 2. Tìm tất cả links bên trong
feedContainer.querySelectorAll('a')

// 3. Filter ra group links
href.includes('/pages/')

// 4. Loại bỏ rác
- href không chứa '/feed/'
- href không chứa '/discover/'
- title không rỗng
- loại duplicate URLs
```

### Smart Filtering

Extension tự động:

- ✅ Lọc duplicate (cùng URL)
- ✅ Loại bỏ system links (feed, discover)
- ✅ Loại bỏ empty titles
- ✅ Trim whitespace

## 📊 CSV Format

### Columns:

1. **No** - Số thứ tự (1, 2, 3...)
2. **Group Name** - Tên group
3. **Group URL** - Link đầy đủ tới group

### CSV Encoding:

- UTF-8 với BOM
- Special characters được escape đúng chuẩn
- Compatible với Excel, Google Sheets

## 💡 Tips & Best Practices

### Để có kết quả tốt nhất:

1. **Đợi scroll hoàn thành**

   - Nếu dừng sớm → thiếu pages
   - Nếu đợi xong → đầy đủ nhất

2. **Check console logs**

   - Mở DevTools (F12) → Console
   - Xem: "Đã tìm thấy X pages"
   - Verify số lượng trước khi export

3. **Tìm kiếm hiệu quả**

   - Dùng keyword cụ thể
   - Tiếng Việt có dấu hoặc không dấu đều được
   - Kết hợp nhiều từ khóa

4. **Xử lý file CSV**
   - Mở bằng Excel: Chọn "UTF-8" encoding
   - Google Sheets: Import tự động nhận diện
   - Excel có thể cần "Data → From Text/CSV"

## 🐛 Troubleshooting

### "No pages found"

**Nguyên nhân:**

- Chưa scroll đủ
- Không phải trang search pages
- DOM structure thay đổi

**Giải pháp:**

- Đảm bảo URL có dạng: `facebook.com/search/pages?q=...`
- Scroll xuống để load pages
- Check console logs để debug

### "Container not found"

**Nguyên nhân:**

- Facebook thay đổi DOM structure
- Trang chưa load xong

**Giải pháp:**

- Refresh trang và thử lại
- Đợi trang load hoàn toàn
- Check trong DevTools có `div[role="feed"]` không

### CSV có ký tự lạ

**Nguyên nhân:**

- Encoding không đúng

**Giải pháp:**

- Mở CSV với Excel → chọn UTF-8
- Hoặc dùng Google Sheets (auto-detect)

## 📝 Example Workflow

```
1. Open Side Panel
2. Enter keyword: "react vietnam"
3. Click "Go"
4. Wait for auto-scroll to complete
5. See: "✅ Scroll completed! Reached the end."
6. Click "Export Facebook pages"
7. See message: "Successfully exported 45 pages!"
8. Open CSV file: facebook-pages-1234567890.csv
9. Import to Excel/Sheets for analysis
```

## 🎨 CSV Usage Ideas

Sau khi có file CSV, bạn có thể:

- 📊 **Analyze** - Thống kê, phân loại pages
- 📧 **Outreach** - Contact admin để promote
- 🔗 **Share** - Chia sẻ list với team
- 📈 **Track** - Theo dõi pages theo thời gian
- 🤖 **Automate** - Feed vào tools khác

## 🔄 Updates & Maintenance

### Nếu Facebook thay đổi cấu trúc:

File cần update: `sidepanel/modules/facebook.js`

Hàm cần kiểm tra:

- `extractGroupDataScript()` - DOM selectors
- Filter logic - `/pages/` pattern

## 📞 Support

Nếu gặp vấn đề:

1. Check console logs (F12 → Console)
2. Verify Facebook URL structure
3. Try reload extension
4. Check `facebook.js` code

---

**Version:** 1.0.0  
**Last Updated:** 2025
