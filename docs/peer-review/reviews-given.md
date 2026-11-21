# UI/UX Peer Review — Feedback cho nhóm khác (Task 5a)

> Mỗi nhóm được review do 2 thành viên phụ trách (xem `docs/01_Team_Roles.md`). Sau khi viết, nhóm **trao đổi trực tiếp** với nhóm được review và ghi lại kết quả ở mục “Trao đổi”. Xoá các dòng hướng dẫn `>` trước khi nộp.

## Tiêu chí đánh giá (theo brief)

| Khía cạnh | Câu hỏi kiểm tra |
|---|---|
| **Usability** | Giao diện có đơn giản không? Thông tin và chức năng có dễ tìm, dễ hiểu không? Điều hướng có logic không? Có phản hồi hệ thống (thông báo lỗi, xác nhận thành công) không? Có dùng tốt trên desktop, tablet và mobile không? |
| **Aesthetics** | Màu sắc, font và phong cách có nhất quán không? Bố cục có hợp lý, không rối không? Màu và hình ảnh có phù hợp nội dung, mục đích từng trang không? |
| **User-friendliness** | Người mới có hiểu cách dùng nhanh không? Hoàn thành tác vụ có ít bước không? Có tuỳ chỉnh khi cần không? |

Cách review được đề xuất: mỗi người tự làm 3 tác vụ chính của sản phẩm trên 2 thiết bị (điện thoại thật + desktop), ghi lại chỗ vướng, chụp màn hình, rồi cả hai người thống nhất nội dung.

---

> **Phương pháp (bản nháp):** PawPass được chạy thử từ mã nguồn công khai (`iceruychi-netizen/PawPass-Hosothucung`, thư mục `public/`) trên trình duyệt ở 1366 px và 390 px, thử các form. FocuSpace được đánh giá qua mã nguồn công khai (`CaoLePhucThinh2203/FocuSpace`) và ảnh chụp giao diện trong repo của nhóm. **Trước khi nộp, mỗi cặp review cần tự dùng thử bản deploy trên điện thoại thật, xác nhận hoặc sửa từng ý, chụp ảnh minh hoạ và trao đổi trực tiếp với nhóm được review.**

## 1. Nhóm FocuSpace

- **Project:** FocuSpace — https://focuspace-iota.vercel.app
- **Người review:** M1 Nguyễn Thành Long, M2 Võ Duy Anh
- **Ngày review:** 22/11/2026

| Khía cạnh | Điểm mạnh | Gợi ý cải thiện |
|---|---|---|
| Usability | Trang chủ có 2 nút hành động rõ (“Vào phòng”, “Xem thư viện đồ vật”), vào phòng không cần tài khoản. Đồng hồ Pomodoro 25:00 kèm nút “Bắt đầu” nằm cố định góc phải, luôn nhìn thấy khi học. Có ô thông báo ngắn (“2 nguồn âm đang hoạt động”) để biết trạng thái âm thanh. | Trên điện thoại dựng dọc, cả trang Căn phòng bị xoay 90° để thành màn ngang, người dùng phải tự nghiêng máy mà không có lời nhắc. Nên hiện thông báo “Xoay ngang để trải nghiệm tốt hơn” (có nút bỏ qua) hoặc làm bố cục dọc riêng. |
| Aesthetics | Pixel art đồng nhất từ logo, nút đến khung cảnh. Mỗi phòng có bảng màu riêng (phòng học nâu–cam, phòng ngủ tím, sân vườn xanh) nhưng vẫn cùng một phong cách. Nền tối hợp với nhạc Lo-fi và học buổi tối. | Thanh công cụ trong phòng chỉ có 3 biểu tượng pixel (nốt nhạc, đồ vật, loa). Tên của chúng chỉ hiện khi rê chuột nên trên điện thoại/máy tính bảng người dùng phải đoán. Nên thêm nhãn chữ ngắn dưới biểu tượng ở màn hình cảm ứng. |
| User-Friendliness | Trang Giới thiệu & Liên hệ có hướng dẫn dùng nhanh, email từng thành viên. Trang chủ nhắc đeo tai nghe để nghe rõ âm thanh trái/phải. Nút có trạng thái `aria-pressed` và nhãn cho trình đọc màn hình. | Trang Thống kê khi chưa đăng nhập chỉ có một dòng chữ và nút Đăng nhập. Nên cho xem biểu đồ mẫu để người dùng thấy lợi ích trước khi tạo tài khoản. Thẻ trong Thư viện hiển thị kích thước pixel (vd. `26×26`), thông tin này không có ý nghĩa với người dùng và có thể bỏ. |

**Trao đổi với nhóm:** [hình thức, ngày, nhóm phản hồi thế nào / sẽ sửa gì]

---

## 2. Nhóm PawPass

- **Project:** PawPass — https://pawpass-hosothucung-web.vercel.app
- **Người review:** M3 Nguyễn Bá Phát, M4 Trần Văn Huy
- **Ngày review:** 22/11/2026

| Khía cạnh | Điểm mạnh | Gợi ý cải thiện |
|---|---|---|
| Usability | Form đăng nhập kiểm tra ngay khi bấm: mỗi ô có thông báo riêng bằng tiếng Việt (“Vui lòng nhập email.”, “Email không đúng định dạng.”) và viền đỏ, sửa xong ô nào thì lỗi ô đó biến mất. Các trang không bị tràn ngang trên điện thoại 390 px. | Trang đầu tiên là màn Đăng nhập. Trên điện thoại, phần giới thiệu sản phẩm bị ẩn, khách mới chỉ thấy form mà không biết PawPass làm gì. Nên để trang Giới thiệu làm trang đầu, hoặc thêm 1–2 câu và nút “Tìm hiểu thêm” phía trên form. Các link “Giới thiệu PawPass”, “Liên hệ”, “Đăng ký ngay” chỉ cao khoảng 21–23 px, khó bấm bằng ngón tay (khuyến nghị ≥ 44 px). |
| Aesthetics | Ý tưởng “hộ chiếu” được thể hiện nhất quán: khung viền nét đứt, con dấu “Đã tiêm · Mũi 2”, thẻ mẫu bé “Mochi”, minh hoạ chó mèo. Tông cam–kem ấm áp, hợp chủ đề thú cưng. | Trên máy tính, màn Đăng nhập có khoảng trống lớn phía dưới. Màn Đăng nhập dùng 2 link chữ thay vì thanh menu như trang Giới thiệu và Liên hệ (có logo + menu ☰), nên chuyển trang thấy không đồng bộ. |
| User-Friendliness | Trang Giới thiệu đi theo mạch dễ hiểu: vấn đề → tính năng → “Bắt đầu trong 3 bước”. Form Liên hệ có bộ đếm ký tự 0/1000, cảnh báo không ghi thông tin riêng tư, kèm FAQ dạng mở rộng. | Không có “Quên mật khẩu” và nút hiện/ẩn mật khẩu. Lời nhắn Liên hệ được gửi thành Issue công khai trên GitHub nên người không có tài khoản GitHub khó dùng; nên thêm email liên hệ. Có thể thêm tài khoản dùng thử để người xem trải nghiệm trước khi đăng ký. |

**Trao đổi với nhóm:** [hình thức, ngày, nhóm phản hồi thế nào / sẽ sửa gì]
