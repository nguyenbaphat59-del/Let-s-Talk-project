# Thiết kế UI / Wireframes (Task 1b)

> **Lưu ý về bản chất tài liệu:** Nhóm không vẽ wireframe độ trung thực thấp (đen-trắng) bằng Figma. Thiết kế giao diện được tạo trực tiếp bằng **Google Stitch** (công cụ sinh thiết kế UI bằng AI). Các ảnh trong thư mục này là thiết kế UI độ trung thực cao xuất từ Stitch, được dùng thay cho wireframe. Chúng tôi nêu rõ điều này để giảng viên đánh giá đúng.

| Mục | Nội dung |
|---|---|
| Công cụ | Google Stitch (không dùng Figma) |
| Link dự án Stitch (xem được không cần đăng nhập) | https://stitch.google.com/projects/17284348942162000882 |
| Tài khoản chứa dự án | Tài khoản Stitch của M3 (Nguyễn Bá Phát); cả nhóm góp ý tưởng thiết kế ban đầu |
| Người xuất ảnh và đưa vào repo | M2 — Võ Duy Anh (tài khoản tuananhvo588-design) |
| Thiết kế ban đầu | Dự án Stitch "Let's Talk Party Game": các lần yêu cầu đầu tiên khoảng đầu tháng 11/2026 (thành viên xác nhận 05/11/2026; Stitch hiển thị "3w ago" tại ngày 26/11/2026) |
| Bản tinh chỉnh (nguồn các ảnh ở đây) | Dự án Stitch "Let's Talk Game Prototype": lần chỉnh sửa gần nhất khoảng 20/11/2026 |
| Ngày xuất ảnh | 26/11/2026 |
| Ngày review & chốt | 08/11/2026 |

## Giải thích trung thực về cách thực hiện

1. **Không có bước wireframe thô riêng.** Nhóm đi thẳng từ yêu cầu (PRD) sang thiết kế giao diện hoàn chỉnh trong Google Stitch.
2. **Lý do:** Vì nhóm đã có ý tưởng từ ban đầu là lấy cảm hứng từ phong cách thiết kế của nền tảng Discord.
3. **Khác gì wireframe chuẩn:** ảnh thể hiện cả bố cục lẫn màu sắc, hình ảnh và phong cách, nên giảng viên có thể coi là prototype. Phần bố cục (vị trí thành phần, luồng màn hình) vẫn thể hiện đầy đủ.
4. **Thứ tự với việc lập trình:** thiết kế Stitch ban đầu có trước commit `frontend` đầu tiên trong repo (20/11/2026, theo `git log`).
5. **Thiết kế đã được tinh chỉnh dần:** bản Stitch sớm khác giao diện hiện tại (ví dụ có chủ đề "Love" ở trang chủ, câu chữ khác); bảng đối chiếu thiết kế ↔ bản thật ở README mục 2(a) ghi rõ điểm lệch và lý do.
6. **Ảnh có lỗi do Stitch sinh ra:** logo hiện chữ "06-official-logo.png" ở nhiều trang và chữ "ORKLES" ở Game Complete. Đây là lỗi hiển thị trong bản xuất, giao diện web thật không có.

## Checklist trang

| Trang | Desktop | Mobile | File |
|---|---|---|---|
| Homepage + Game Setup | [x] | [x] | `01-home-desktop.png`, `01-home-mobile.png` |
| About | [x] | [x] | `02-about-desktop.png`, `02-about-mobile.png`, `02-about-tablet.png` (768px) |
| How to Play | [x] | [x] | `03-how-to-play-desktop.png`, `03-how-to-play-mobile.png` |
| Gameplay | [x] màn câu hỏi | [x] màn idle "Ready to Connect?" | `04-gameplay-desktop.png`, `04-gameplay-mobile.png` |
| Game Complete | [x] | [x] | `05-complete-desktop.png`, `05-complete-mobile.png` |

**Chưa có trong thiết kế Stitch:** các trạng thái Gameplay intro, roulette, activity và modal Exit/End/Rules; màn Custom Deck (sẽ bổ sung khi triển khai).

## Cách xuất từ Stitch

1. Chọn từng màn hình trong dự án Stitch → menu *More* → *Download* (file zip chứa `screen.png`), hoặc chụp màn hình.
2. Đặt tên theo bảng trên rồi copy vào `docs/wireframes/`.
3. Commit: `docs(wireframes): add Google Stitch UI designs