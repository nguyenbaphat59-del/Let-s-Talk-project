# Review gửi Thai Tu Fashion (Nhóm 5)

- **Issue đã đăng:** https://github.com/huynhsy986-droid/thai_tu_fashion/issues/51 (26/11/2026, bởi VanHuyTran0oooo — M4 Trần Văn Huy)
- **Repo:** https://github.com/huynhsy986-droid/thai_tu_fashion
- **Bản deploy đã xem:** https://thai-tu-fashion-v1.vercel.app
- **Phạm vi:** Home, Đăng nhập, Giỏ hàng, Smart Studio; Chrome, desktop 1280px. Chưa đánh giá mobile và luồng thanh toán.
- **Phản hồi của Thai Tu Fashion:** chưa có (kiểm tra lần cuối: 26/11/2026). Sẽ cập nhật khi nhóm trả lời.

Nội dung dưới đây chép nguyên văn từ issue đã đăng.

---

Chào Nhóm 5, mình là Huy (nhóm Let's Talk). Theo yêu cầu môn học, nhóm mình review UI/UX dự án của các bạn. Phạm vi: bản deploy https://thai-tu-fashion-v1.vercel.app, các trang Home, Đăng nhập, Giỏ hàng, Smart Studio, kiểm tra ngày 26/11/2026 trên Chrome, màn hình 1280px (desktop). Nhóm mình chưa đánh giá mobile và luồng thanh toán trong lượt review này.

## Điểm mạnh

- Nhận diện thị giác nhất quán: tiêu đề chữ đậm lớn ("Wear your own story"), hero pastel và ảnh người mẫu rõ nét tạo tinh thần Seoul đúng định vị.
- Tín hiệu tin cậy hiển thị sớm: thanh trên cùng nêu miễn phí giao từ 1.500.000₫, đổi size 7 ngày, mã THAITU10, lịch drop.
- Thẻ sản phẩm đủ thông tin: có nhãn Sale, giá gốc/giá giảm, dáng, số màu và "Thêm nhanh".
- Form đăng nhập tốt: nhãn rõ, ô email đúng `type="email"`, nút hiện mật khẩu có tên truy cập, có "Quên mật khẩu?" và "Đăng ký ngay".
- Giỏ hàng trống có thông báo kèm nút "Tiếp tục mua sắm".
- Nền tảng truy cập tốt: `lang="vi"`, đúng 1 thẻ H1, có landmark header/nav/main/footer, nút icon có tên truy cập.

## Gợi ý cải thiện (theo ưu tiên)

### Cao

1. Thanh thông báo: cả 4 thông điệp đều dẫn về `#shop-new` (ví dụ "Đổi size miễn phí" và "Nhập mã THAITU10" cùng ra trang hàng mới). Nội dung còn lặp hai lần trong DOM nên trình đọc màn hình sẽ đọc trùng. Gợi ý: mỗi thông điệp một đích đúng, thêm `aria-hidden` cho bản sao, cho phép tạm dừng và tôn trọng `prefers-reduced-motion`.
2. Vùng bấm nhỏ: đo ở 1280px, 81/146 phần tử bấm được có một chiều nhỏ hơn 40px (chuẩn gợi ý 44×44px). Gợi ý: tăng padding cho nút thả tim, link trong thẻ, "Thêm nhanh".
3. Chữ nhỏ: khoảng 32 phần tử chữ nhỏ hơn 12px (nhãn phụ như "Dáng rộng · 3 màu"). Gợi ý: tối thiểu 12–14px và kiểm tra tương phản ≥ 4.5:1.

### Trung bình

5. Nhãn giảm giá hiện "19%", nên ghi "-19%".
6. Menu chính có 10 mục: nên gom danh mục vào "Cửa hàng"/mega-menu để thanh trên còn 4–5 mục.
7. Ảnh: 29/30 ảnh thiếu `width`/`height` (dù đã lazy-load), có thể gây nhảy bố cục khi tải. 16/30 ảnh có `alt=""`, mong các bạn xác nhận đó đều là ảnh trang trí.
8. Định tuyến bằng hash (`#home`, `#cart`, `#product-k07`): khó chia sẻ link và nút Back dễ gây lạc. Có thể xem xét route riêng nếu dùng cho sản phẩm thật.

## Mời thảo luận

- Các bạn có lý do thiết kế khi nhiều thông điệp cùng dẫn về `#shop-new`, hay là do chưa hoàn thiện?
- Các bạn đã thử luồng xem hàng → chọn size → thêm giỏ với người dùng thật chưa?

## Nhờ review lại

Mong các bạn dành ít phút review UI/UX dự án Let's Talk của nhóm mình (game thẻ câu hỏi): repo https://github.com/nguyenbaphat59-del/Let-s-Talk-project, bản deploy `https://let-s-talk-project-frontend.vercel.app/`. Các bạn có thể trả lời bằng issue mới trên repo của nhóm mình hoặc bình luận tại đây. Cảm ơn các bạn!
