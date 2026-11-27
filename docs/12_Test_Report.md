# Báo cáo kiểm thử thủ công — Let's Talk

Người kiểm thử: Trần Văn Huy (M4) · Ngày chạy: 27/11/2026 · Issue: [#65](https://github.com/nguyenbaphat59-del/Let-s-Talk-project/issues/65)

Môi trường: bản production https://let-s-talk-project-frontend.vercel.app/ (frontend Vercel, backend Render gói miễn phí), Google Chrome trên Windows, cửa sổ rộng khoảng 1920 px (theo ảnh chụp), cửa sổ ẩn danh, một người kiểm thử.

Cách đọc: ID có kèm mã E2E tương ứng trong [`08_Traceability_and_Test_Plan.md`](08_Traceability_and_Test_Plan.md). Ảnh nằm trong `docs/screenshots/test-report/`. Cột "Thực tế" ghi đúng những gì quan sát được, kể cả lỗi; lỗi tìm thấy được mở issue riêng.

| ID | Thao tác | Kết quả mong đợi | Kết quả thực tế | Đạt/Không | Ảnh |
| --- | --- | --- | --- | --- | --- |
| TC-01 (E2E-01) | Mở trang chủ lần đầu | Friends và 10 được chọn sẵn; Start Playing chỉ mở khi đã kiểm tra xong kết nối backend | Friends đã tick, 10 đang chọn, dòng "Ready to play Friends · 10 activities". Nút Start Playing bị khoá khoảng 1 giây lúc mới tải rồi mở. | Đạt | [tc01](screenshots/test-report/tc01-home-default.png) |
| TC-02 (E2E-04) | Chọn Family + 20, bấm Start Playing | Vào Gameplay; nội dung chỉ thuộc chủ đề Family | Vào được Gameplay; câu hỏi đầu tiên có vẻ thuộc Family (chỉ quan sát câu đầu, chưa đối chiếu toàn bộ nội dung phiên). | Đạt | không có ảnh |
| TC-03 | Màn intro: bấm Skip | Bỏ qua intro, vào màn "Ready to Connect?" | Có intro, nút Skip hoạt động. Console có cảnh báo a11y F-01 (aria-hidden trên section#cinematic-intro khi nút skip-intro-btn đang giữ focus). | Đạt (kèm cảnh báo F-01) | [tc03](screenshots/test-report/tc03-a11y-aria-hidden-warning.png) |
| TC-04 (E2E-05) | Bấm START TURN nhiều lần | Roulette chạy; mỗi lượt ra một trong 4 loại: Question Zone, Pick Your Fate, Random Event, Hot Seat | Bấm khoảng 7–8 lượt, gặp đủ cả 4 loại. Roulette chạy từ trái sang phải. Không ghi thứ tự từng lượt. | Đạt | không có ảnh |
| TC-05 (E2E-07) | Question Zone: bấm Next Question | Câu hỏi đổi; bộ đếm và lượt hiện tại không đổi | Câu hỏi đổi; Completed, Skipped, Processed không đổi. Không ghi số cụ thể trước và sau. | Đạt | không có ảnh |
| TC-06 (E2E-10, E2E-11) | Pick Your Fate: chọn từng lựa chọn rồi làm theo hướng dẫn | Hiện 3 lựa chọn Truth, Challenge, Mystery; chọn một thì hiện hoạt động hợp lệ và Complete được | Hiện 3 lựa chọn Truth, Challenge, Mystery; đã thử cả ba, mỗi lựa chọn đều hiện hoạt động và hoàn thành được. | Đạt | không có ảnh |
| TC-07 | Random Event: làm theo hướng dẫn | Hiện hoạt động hợp lệ, hoàn thành được | Hiện hoạt động và hoàn thành được. | Đạt | không có ảnh |
| TC-08 (E2E-06, E2E-12) | Hot Seat: làm theo hướng dẫn, thử Complete và Pass | Hiện câu hỏi hoặc hành động Hot Seat; việc chọn người do nhóm tự quyết ngoài ứng dụng (không có bước chọn trong app); Complete tăng bộ đếm; Pass: Completed không đổi, Skipped và Processed tăng 1 | Hiện câu hỏi hoặc hành động, không có bước chọn người trong app. Complete: Completed tăng. Pass: Completed không đổi, Skipped +1, Processed +1. | Đạt | không có ảnh |
| TC-09 | Bấm Complete ở một hoạt động | Completed tăng 1, Skipped giữ nguyên, Processed tăng 1 | Trước: Completed 4/20, 11 Skipped, 15 Processed. Sau: 5/20, 11 Skipped, 16 Processed. | Đạt | [trước](screenshots/test-report/tc09-complete-before.png) · [sau](screenshots/test-report/tc09-complete-after.png) |
| TC-10 (E2E-08, E2E-12) | Bấm Pass ở 3 hoạt động liên tiếp (làm trên phiên 20, không phải phiên 10) | Completed giữ nguyên; Skipped và Processed cùng tăng 3 | Trước (lấy từ ảnh sau TC-09): 5/20, 11 Skipped, 16 Processed. Sau 3 lần Pass: 5/20, 14 Skipped, 19 Processed. | Đạt | [sau](screenshots/test-report/tc10-pass-after.png) |
| TC-11 | Quan sát thanh tiến độ khi Complete và khi Pass | Thanh dài ra khi Completed tăng; Pass không làm thanh dài ra | Complete (4/20 → 5/20): thanh dài ra. Pass (3 lần, giữ 5/20): thanh không dài thêm. Chỉ quan sát bằng mắt, không đo chính xác tỉ lệ độ dài. | Đạt | [tiến độ 3/20](screenshots/test-report/tc11-progress-bar.png) · [4/20](screenshots/test-report/tc09-complete-before.png) · [5/20](screenshots/test-report/tc09-complete-after.png) |
| TC-12 | Mở modal bằng nút HOW TO PLAY; đóng bằng nút ×, nút GOT IT → và phím Esc | Modal "How to Play" mở được và đóng được bằng cả ba cách; phiên chơi không đổi | Mở được. Đóng bằng ×: được; bằng Esc: được; bằng GOT IT →: được. Sau khi đóng bằng × và bằng Esc, bộ đếm vẫn 5/20, 14 Skipped, 19 Processed (chưa ghi bộ đếm sau lần đóng bằng GOT IT). Console chỉ còn cảnh báo F-01 cũ. | Đạt | [modal](screenshots/test-report/tc12-rules-modal.png) |
| TC-13 (E2E-13) | Reload trang (F5) khi đang ở một hoạt động | Cùng hoạt động và phiên được khôi phục | Sau F5: cùng hoạt động (cùng câu hỏi) và bộ đếm vẫn 5/20, 14 Skipped, 19 Processed, theo ghi nhận của người test. Chỉ có một ảnh chụp hoạt động tại thời điểm test. | Đạt | [hoạt động](screenshots/test-report/tc13-reload-restore.png) |
| TC-14 (E2E-15) | Bấm Exit trong phiên đang chơi | Xoá phiên đang chơi và về Home, không sang màn hoàn thành | Có hộp xác nhận. Sau khi xác nhận, app chuyển sang màn Session Complete ("Great Conversations!"), KHÔNG về Home. Từ Home bấm Back của trình duyệt thì quay lại màn Session Complete. Lệch với docs/08 E2E-15 (xem F-02). | Không đạt | [sau Exit](screenshots/test-report/tc14-exit-game-complete.png) |
| TC-15 (E2E-16) | Bấm End Game giữa phiên | Sang Game Complete; hoạt động chưa xong không được tính | Có hộp xác nhận. Sang màn Session Complete ("Great Conversations!"). Màn này không hiển thị số liệu nên không kiểm chứng được việc hoạt động dở có bị tính hay không. Màn hình giống hệt màn sau Exit (TC-14). | Đạt một phần | [Session Complete](screenshots/test-report/tc15-end-game-complete.png) |
| TC-16 (E2E-17) | Ở Game Complete: bấm Play Again | Cùng chủ đề và độ dài; phiên mới, bộ đếm về 0 | Vào phiên Gameplay mới, vẫn chủ đề Family, bộ đếm Completed 0/20, 0 Skipped, 0 Processed. Không kiểm tra session ID. | Đạt | [phiên mới](screenshots/test-report/tc16-play-again.png) |
| TC-17 (E2E-09) | Hoàn thành đủ 10 hoạt động (phiên Friends 10, có Pass xen kẽ) | Phiên kết thúc đúng khi Completed = 10, sang Game Complete | Tại Completed 9/10 có 3 Skipped, 12 Processed; bấm Pass thêm một lần ở đó thì phiên không kết thúc. Khi Completed đạt 10/10, app chuyển sang màn Session Complete (nội dung thông báo khác màn sau End Game/Exit). Không ghi tổng số lần Pass cả phiên. Console ở game-complete.html: không có cảnh báo hay lỗi. | Đạt | [9/10](screenshots/test-report/tc17-completed-9of10.png) · [kết thúc](screenshots/test-report/tc17-session-ended.png) · [console](screenshots/test-report/tc17-console-game-complete.png) |
| TC-18 | API lỗi: DevTools → Network → Offline, rồi bấm START TURN; sau đó bật lại mạng và bấm START TURN | Có thông báo lỗi rõ ràng, không treo im lặng, không mất phiên; thử lại được khi có mạng | Hiện thông báo "The game service could not be reached. Check your connection and try again." dưới nút START TURN; giao diện không treo. Bộ đếm vẫn 0/10, 0 Skipped, 0 Processed (phiên còn nguyên). Bật lại mạng, bấm START TURN lại: chạy bình thường (theo ghi nhận của người test, không có ảnh bước này). Console: lỗi đỏ ERR_INTERNET_DISCONNECTED ở POST next-activity, Sentry và Google Analytics (do chủ động tắt mạng); app ghi lỗi "Could not start the next activity: ApiError". | Đạt | [lỗi offline](screenshots/test-report/tc18-offline-error.png) · [bộ đếm](screenshots/test-report/tc18-counters-after.png) · [console](screenshots/test-report/tc18-offline-console.png) |
| TC-19 | API chậm: Network → Slow 3G, bấm START TURN (bấm thêm 2 lần trong lúc chờ) | Có trạng thái loading; không bấm trùng gây lỗi | Hiện dòng "Loading the next activity..."; nút START TURN, End Game và Exit mờ đi trong lúc tải. Bấm START TURN thêm 2 lần: không có phản ứng, không lỗi. Chỉ hiện đúng một hoạt động, mất khoảng 1,5 giây. Bộ đếm giữ nguyên 1/10, 3 Skipped, 4 Processed cho tới khi bấm Complete hoặc Skip. Console không được ghi nhận ở test này. | Đạt | [loading](screenshots/test-report/tc19-slow-loading.png) |

## Tổng kết

| Kết quả | Số ca | Ca |
| --- | --- | --- |
| Đạt | 17 | TC-01 đến TC-13, TC-16 đến TC-19 (TC-03 kèm cảnh báo a11y F-01) |
| Đạt một phần | 1 | TC-15 |
| Không đạt | 1 | TC-14 |
| Chưa chạy | 0 | |

## Phát hiện

- **F-01 (a11y, TC-03):** khi bấm Skip ở intro, Chrome ghi cảnh báo "Blocked aria-hidden on an element because its descendant retained focus" trên `section#cinematic-intro`, vì nút `#skip-intro-btn` vẫn đang giữ focus. Skip vẫn hoạt động; ảnh: [tc03](screenshots/test-report/tc03-a11y-aria-hidden-warning.png).
- **F-02 (hành vi Exit, TC-14):** bấm Exit chuyển sang màn Session Complete, trong khi `docs/08` (E2E-15) quy định Exit phải xoá phiên và về Home, không sang màn hoàn thành. Chưa xác định tài liệu hay code cần sửa; ảnh: [tc14](screenshots/test-report/tc14-exit-game-complete.png).
- **TC-15:** màn Session Complete không hiển thị số liệu của phiên, nên không kiểm chứng được việc hoạt động dở không bị tính khi End Game.

## Phạm vi và giới hạn

- Chỉ chạy một người, một trình duyệt (Chrome, Windows), kích thước màn hình khoảng 1920 px.
- Chưa kiểm: E2E-14 (Local Storage hỏng), E2E-18 và E2E-19 (dùng hết kho nội dung), E2E-20 (màn hình điện thoại), kiểm tra session ID mới ở Play Again, và Custom Deck (chưa có trên bản live).
- Một số ca ghi nhận theo lời người test, không có ảnh: TC-02 đến TC-08 (chỉ có kết quả bằng chữ), bước bấm START TURN lại ở TC-18. Các ca này được ghi rõ trong cột "Thực tế".
- Đây là kiểm thử thủ công; chưa có kiểm thử tự động đầu-cuối.