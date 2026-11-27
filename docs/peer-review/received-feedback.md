# Góp ý của giảng viên và quá trình cải tiến

## 1. Góp ý ban đầu – Prototype 1

Trong buổi review Prototype 1, giảng viên ghi nhận nhóm có định hướng tốt và ý tưởng website rõ ràng. Tuy nhiên, giao diện và trải nghiệm chơi được đánh giá là còn quá đơn giản, chưa đủ hấp dẫn.

Góp ý chính tập trung vào hai mảng:

- **Giao diện người dùng:** Thiết kế hình ảnh cần được chăm chút hơn để tạo trải nghiệm đẹp mắt và cuốn hút hơn.
- **Trải nghiệm chơi:** Gameplay còn quá cơ bản và thiếu hứng khởi, có thể khiến người chơi thấy nhàm chán.

## 2. Cải tiến – Prototype 2

Dựa trên góp ý của giảng viên, nhóm chỉnh sửa prototype với trọng tâm là thiết kế hình ảnh và tương tác trong gameplay.

Các cải tiến gồm:

- Cải thiện thiết kế tổng thể, bố cục và bảng màu.
- Thêm hoạt ảnh và hiệu ứng hình ảnh để tương tác hấp dẫn hơn.
- Cải thiện cách chọn câu hỏi và luồng chơi.
- Tạo trải nghiệm thú vị và tương tác hơn cho người chơi.

## 3. Đánh giá lại

Sau khi trình bày Prototype 2, giảng viên cho rằng định hướng sau chỉnh sửa là chấp nhận được.

Góp ý này xác nhận các thay đổi đã giải quyết những vấn đề chính được nêu ở lần review đầu. Vì vậy nhóm tiếp tục phát triển dự án dựa trên định hướng prototype đã được chấp thuận.

## 4. Nhật ký góp ý (Task 5b — định dạng Report Template)

> Ghi lại mọi góp ý nhận được từ giảng viên và các nhóm review. Mục đã thực hiện cần liên kết commit/PR và có ảnh trước/sau (`docs/peer-review/screenshots/`). Mục không thực hiện phải nêu lý do.

| # | Góp ý | Nguồn | Quyết định | Lý do / Commit / PR |
|---|---|---|---|---|
| 1 | Giao diện của Prototype 1 quá đơn giản và chưa cuốn hút. | Giảng viên (review Prototype 1) | ✅ Đã thực hiện | Prototype 2 thiết kế lại lớp hình ảnh (kính mờ, gradient, hình mascot, hoạt ảnh). Commit `738ed76` |
| 2 | Gameplay quá đơn giản, chưa đủ hứng khởi. | Giảng viên (review Prototype 1) | ✅ Đã thực hiện | Bốn nhóm hoạt động tự động (Question Zone, Pick Your Fate, Random Event, Hot Seat), đoạn intro điện ảnh và hiệu ứng roulette (PRD v1.4). Commit `738ed76`, `a6bc8c3` |
| 3 | "chuyển trạng thái giữa các lượt chơi chưa có phản hồi tải trang rõ ràng" (#47, mục 2) | Nhóm Thai Tu Fashion (#47) | ✅ Đã thực hiện | Gameplay hiện thông báo đang tải kèm `aria-busy` khi bấm START TURN, chọn Fate và tải câu hỏi tiếp theo; sau 6 giây giải thích rằng máy chủ có thể đang thức dậy. PR #69 (merge commit `2c25d61`, commit `07271f4`), do M3 review và kiểm tra với throttling độ trễ 8000 ms |
| 4 | "Một số khu vực trên màn hình nhỏ còn hơi chật" và ưu tiên 1: bố cục trên thiết bị di động (#47, mục 2 và 3) | Nhóm Thai Tu Fashion (#47) | ⏸ Hoãn (chưa thực hiện) | Chưa kịp thực hiện trước hạn nộp 29/11/2026. Việc cần làm sau: tăng vùng bấm `.nav-link` lên khoảng 44 px, đặt cỡ chữ tối thiểu ở màn hình ≤599 px, kiểm tra ở 360 px và 390 px. Issue #47 giữ mở để theo dõi |
| 5 | "Đối chiếu thêm giữa repo và bản chạy live" (#47, mục 2) | Nhóm Thai Tu Fashion (#47) | 🟨 Làm một phần | Đã ghi rõ Custom Deck chưa có trên bản live; bảng đối chiếu wireframe ↔ live sẽ làm cùng M2-2 |
| 6 | Ưu tiên 2: "Cập nhật README hướng dẫn sử dụng ngắn gọn để người đánh giá dễ test nhanh" (#47, mục 3) | Nhóm Thai Tu Fashion (#47) | ✅ Đã thực hiện | Thêm mục "Test nhanh" vào README |

**Góp ý từ nhóm khác:** ngày 26/11/2026 nhóm đã nhờ FocuSpace (trong FocuSpace#164) và Thai Tu Fashion (trong thai_tu_fashion#51) review Let's Talk. Nhóm Thai Tu Fashion đã phản hồi bằng issue [#47](https://github.com/nguyenbaphat59-del/Let-s-Talk-project/issues/47) ngày 26/11/2026 (khoảng 21:30). FocuSpace chưa phản hồi tính đến 09:55 ngày 27/11/2026.

### Nguyên văn góp ý: issue #47

Tiêu đề: `[UI/UX & Demo Review] Nhận xét từ Nguyễn Trần Minh Nguyên (nhóm ThaiTuFashion)`. Tác giả: `nguyen06-vn`. Quyết định và PR tương ứng nằm ở các dòng 3–6 của bảng trên.

```text
Chào nhóm Let-s-Talk-project

Mình là Nguyễn Trần Minh Nguyên (nhóm ThaiTuFashion), sau khi xem repository và chạy thử bản deploy trên Vercel (`https://let-s-talk-project-frontend.vercel.app`), xin gửi đến nhóm một số nhận xét:

 1. Điểm mạnh
-Ý tưởng và ngữ cảnh rõ ràng:Web party game trực tuyến cho bạn bè và gia đình dễ hiểu, đúng mục đích sử dụng.
- Tổ chức repository & quy trình làm việc bài bản: Có tách rõ các thư mục (backend,database, docs, frontend, tools,github), có env.example, tài liệu thiết kế/wireframes trong docs, lịch sử commit/branch và PR rõ ràng.
- Thêm 1 ý thực tế khi test web, ví dụ: Giao diện trang chủ trực quan, các nút điều hướng chính dễ nhận diện.

2. Điểm cần cải thiện
- Điền lỗi UI/UX hoặc trải nghiệm thực tế bạn gặp khi bấm thử, ví dụ: Một số khu vực trên màn hình nhỏ còn hơi chật ,chuyển trạng thái giữa các lượt chơi chưa có phản hồi tải trang rõ ràng.
- Đối chiếu thêm giữa repo và bản chạy live, ví dụ: Một số nội dung tính năng ghi trong tài liệu hoặc commit chưa thấy hiển thị đầy đủ trên bản live.

 3. Đề xuất ưu tiên
- Ưu tiên 1: Sửa các lỗi ảnh hưởng trực tiếp tới luồng chơi chính hoặc bố cục trên thiết bị di động.
- Ưu tiên 2: Cập nhật README  hướng dẫn sử dụng ngắn gọn để người đánh giá dễ test nhanh toàn bộ luồng game.

Cảm ơn nhóm đã chia sẻ bài làm, chúc nhóm hoàn thiện bản demo thật mượt!
```

### Quy tắc xử lý góp ý đã thống nhất trong nhóm

- Góp ý cải thiện khả năng sử dụng hoặc tiếp cận mà không đổi luật chơi đã duyệt thì được thực hiện trước.
- Góp ý mâu thuẫn với PRD (ví dụ thêm tài khoản, điểm số hoặc chơi trực tuyến nhiều người, những thứ PRD §1.3 đã loại trừ) thì không thực hiện, và lý do được ghi ở bảng trên.
- Mỗi mục được thực hiện có issue, nhánh riêng (ví dụ `fix/47-gameplay-loading`) và PR tham chiếu tới issue.