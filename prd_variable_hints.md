## 1. Mục tiêu cốt lõi

- Giúp người dùng điền biến `{{ }}` nhanh hơn và chính xác hơn bằng cách hiển thị **gợi ý/hướng dẫn ngay trong placeholder** của input (ví dụ: `{{topic:Chủ đề chính của bài viết}}`).
- Giảm lỗi khi copy prompt có biến, tăng trải nghiệm cho power user.

## 2. Yêu cầu chức năng (Functional Requirements)

- Hỗ trợ cú pháp `{{tên_biến:gợi_ý}}` trong nội dung prompt.
- Khi mở Quick Test modal, tự động tách tên biến và hint, hiển thị hint làm placeholder.
- Preview realtime khi người dùng điền giá trị.
- Copy kết quả đã thay thế biến.
- Backward compatible: `{{tên_biến}}` cũ vẫn hoạt động (hint mặc định = "Giá trị cho tên_biến").

## 3. Yêu cầu phi chức năng (Non-functional Requirements)

- Hiệu suất: Parse biến < 50ms ngay cả với prompt 5000 ký tự.
- UX: Không làm chậm modal, placeholder rõ ràng, responsive.
- Bảo mật: Không lưu giá trị biến người dùng (chỉ preview tạm thời).
- Khả năng mở rộng: Hỗ trợ nhiều biến, hint dài tối đa 80 ký tự.

## 4. Epics / Luồng người dùng chính

**Epic 1: Tạo/Edit Prompt có biến có hint**

- User gõ `{{topic:Chủ đề chính}}` trong textarea nội dung.
- Hệ thống tự nhận diện và lưu.

**Epic 2: Quick Test với gợi ý**

- User nhấn nút "Test" trên prompt có biến.
- Modal hiện input với placeholder = hint từ cú pháp.
- User điền → Preview realtime cập nhật.
- User copy kết quả đã thay thế.

**Epic 3: Copy thường (không qua Test)**

- Nếu prompt có biến → tự động mở Quick Test modal trước khi copy.
- Nếu không có biến → copy ngay như cũ.

---

**MVP Scope:** Chỉ hỗ trợ Quick Test modal + parse `{{var:hint}}`.  
**Future:** Hỗ trợ nhiều hint format, auto-suggest từ lịch sử, v.v.
