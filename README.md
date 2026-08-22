# Paperback iOS Extension: MangaHost (Cloudflare R2)

Extension tích hợp cho ứng dụng **Paperback** trên iPhone / iPad để đọc manga trực tiếp từ hệ thống **MangaHost API** (Cloudflare R2 + Go Backend).

---

## 🌟 Tính Năng

- **Home Page Sections**: Hiển thị Truyện Nổi Bật, Truyện Mới Cập Nhật, Truyện Xem Nhiều Nhất.
- **Tìm kiếm & Phân trang**: Tìm kiếm theo tên truyện, tác giả, hỗ trợ phân trang vô tận.
- **Chi tiết Manga & Chapter**: Hiển thị ảnh bìa, tóm tắt, tác giả, thể loại và danh sách chapter.
- **Đọc truyện tốc độ cao**: Tải trực tiếp ảnh các trang truyện từ Cloudflare R2 CDN không bị giới hạn băng thông.

---

## 🛠️ Hướng Dẫn Cấu Hình & Build

### 1. Đổi Domain API của bạn
Mở file `src/MangaHost/MangaHost.ts` và thay đổi `websiteBaseURL` thành domain backend Go của bạn (ví dụ đã host trên Render / Railway / VPS):

```typescript
export const MangaHostInfo = {
  version: '1.0.0',
  name: 'MangaHost R2',
  websiteBaseURL: 'https://api.yourdomain.com/api/v1' // <-- Điền URL API của bạn tại đây
};
```

### 2. Cài đặt Paperback Toolchain & Build
Chạy lệnh sau trong thư mục `paperback-extension`:

```bash
npm install -g @paperback/cli
npm install
paperback bundle
```

Lệnh `paperback bundle` sẽ tạo ra thư mục `bundles/` chứa repository extension tương thích hoàn toàn với Paperback iOS.

---

## 📱 Cách Thêm Extension vào App Paperback trên iOS

1. **Cách 1: Host qua GitHub Pages (Khuyên dùng)**
   - Đẩy mã nguồn extension lên một GitHub repository (ví dụ: `github.com/your-username/paperback-manga-repo`).
   - Bật **GitHub Pages** trỏ vào thư mục `gh-pages` hoặc thư mục xuất bundle.
   - Mở app **Paperback** trên iOS > vào tab **Settings** > **External Repositories** > bấm **Add** và dán URL GitHub Pages của bạn vào.

2. **Cách 2: Test Local**
   - Chạy lệnh `paperback serve` trên máy tính.
   - Đảm bảo iPhone và máy tính cùng chung mạng Wifi, nhập IP máy tính vào mục Sources trên app Paperback để đọc thử ngay lập tức.
