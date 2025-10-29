# Batch Messaging Guide

## Tổng quan

Module Batch Messaging cho phép bạn mở các fanpage Facebook đã crawl được theo từng batch (mỗi batch 5 tabs), giúp bạn có thể thực hiện các thao tác như gửi tin nhắn một cách có tổ chức.

## Cách sử dụng

### Bước 1: Crawl danh sách fanpage

1. Nhập từ khóa tìm kiếm vào ô "Input Search Keyword"
2. Click nút "🚀 Go"
3. Đợi auto-scroll load hết kết quả (đến khi thấy "✅ Scroll completed!")

### Bước 2: Load dữ liệu vào Batch Messaging

1. Click nút **"📥 Load Pages from Current Tab"**
2. Hệ thống sẽ extract tất cả fanpage URLs từ trang hiện tại
3. Thông báo hiển thị số lượng pages đã load
4. Progress bar hiển thị: `Batch 1/X | Pages: 0/Y`

### Bước 3: Mở batch đầu tiên

1. Click nút **"🚀 Open Next Batch (5 tabs)"**
2. Hệ thống sẽ mở 5 tabs mới, mỗi tab là 1 fanpage
3. Tab đầu tiên sẽ được focus, các tab còn lại mở ở background
4. Progress bar cập nhật: `Batch 1/X | Pages: 5/Y`

### Bước 4: Xử lý 5 fanpage vừa mở

**Đây là nơi bạn thực hiện công việc của mình:**

- Gửi tin nhắn cho từng fanpage
- Copy thông tin cần thiết
- Hoặc bất kỳ thao tác nào bạn muốn

> ⚠️ **Lưu ý**: Module chỉ mở tabs, bạn cần tự implement logic gửi tin nhắn.

### Bước 5: Tiếp tục với batch tiếp theo

Sau khi xử lý xong 5 tabs hiện tại, bạn có 2 lựa chọn:

#### Option A: Đóng batch hiện tại và mở batch mới

1. Click **"❌ Close Current Batch"** - Đóng 5 tabs hiện tại
2. Click **"🚀 Open Next Batch (5 tabs)"** - Mở 5 tabs tiếp theo

#### Option B: Mở batch mới (tabs cũ vẫn mở)

1. Chỉ cần click **"🚀 Open Next Batch (5 tabs)"**
2. Hệ thống sẽ tự động đóng 5 tabs cũ và mở 5 tabs mới

### Bước 6: Lặp lại cho đến hết

- Tiếp tục click "Open Next Batch" cho đến khi xử lý hết tất cả pages
- Progress bar sẽ hiển thị tiến độ: `Batch X/X | Pages: Y/Y`
- Khi hoàn thành, nút sẽ hiển thị: "✅ All batches completed"

## Các nút điều khiển

### 📥 Load Pages from Current Tab

- Load danh sách pages từ tab Facebook đang mở
- Chỉ hoạt động khi đang ở trang tìm kiếm Facebook
- Reset toàn bộ progress về đầu

### 🚀 Open Next Batch (5 tabs)

- Mở 5 tabs tiếp theo trong danh sách
- Tự động đóng batch trước đó (nếu có)
- Disabled khi: chưa load data, đang processing, hoặc đã hết pages

### ❌ Close Current Batch

- Đóng tất cả 5 tabs đang mở của batch hiện tại
- Không ảnh hưởng đến progress
- Disabled khi không có tabs nào đang mở

### 🔄 Reset Process

- Reset progress về đầu
- Đóng tất cả tabs đang mở
- Không xóa dữ liệu đã load (vẫn giữ danh sách pages)
- Dùng khi muốn bắt đầu lại từ batch 1

## Ví dụ workflow

Giả sử bạn có 23 fanpages:

```
1. Click "Load Pages" → Load 23 pages
   Progress: Batch 1/5 | Pages: 0/23

2. Click "Open Next Batch" → Mở pages 1-5
   Progress: Batch 1/5 | Pages: 5/23

3. [Gửi tin nhắn cho 5 pages này]

4. Click "Open Next Batch" → Đóng pages 1-5, mở pages 6-10
   Progress: Batch 2/5 | Pages: 10/23

5. [Gửi tin nhắn cho 5 pages này]

6. Click "Open Next Batch" → Đóng pages 6-10, mở pages 11-15
   Progress: Batch 3/5 | Pages: 15/23

7. [Tiếp tục...]

8. Click "Open Next Batch" → Mở pages 16-20
   Progress: Batch 4/5 | Pages: 20/23

9. Click "Open Next Batch" → Mở pages 21-23 (chỉ 3 pages)
   Progress: Batch 5/5 | Pages: 23/23

10. Nút hiển thị: "✅ All batches completed"
```

## Tips & Best Practices

### ✅ Nên làm:

- Load pages sau khi auto-scroll hoàn tất
- Xử lý xong batch hiện tại mới mở batch tiếp theo
- Sử dụng "Close Current Batch" để giảm số lượng tabs mở
- Check progress bar để biết còn bao nhiêu pages

### ❌ Không nên:

- Load pages khi chưa scroll hết (sẽ thiếu data)
- Mở nhiều batch cùng lúc (sẽ quá nhiều tabs)
- Click "Open Next Batch" liên tục quá nhanh
- Đóng tabs thủ công (nên dùng nút "Close Current Batch")

## Tính năng sắp tới (cần implement)

Module này chỉ mới mở tabs. Bạn cần tự implement:

1. **Auto-send message**: Tự động gửi tin nhắn cho mỗi page
2. **Custom message template**: Template tin nhắn tùy chỉnh
3. **Delay giữa các message**: Tránh spam
4. **Skip failed pages**: Bỏ qua pages không gửi được
5. **Export report**: Báo cáo pages đã gửi/chưa gửi

## Troubleshooting

### "No pages found. Make sure you scrolled to load all results"

- Bạn chưa scroll đủ để load hết kết quả
- Bật auto-scroll và đợi scroll completed

### "Please navigate to Facebook search results first"

- Tab hiện tại không phải Facebook
- Mở Facebook và search trước khi load

### Tabs không mở

- Kiểm tra popup blocker của browser
- Kiểm tra permissions trong manifest.json
- Thử refresh extension

### Progress không chính xác

- Click "Reset Process" để reset lại
- Load pages lại từ đầu
