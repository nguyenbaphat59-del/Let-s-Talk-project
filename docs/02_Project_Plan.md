# LET'S TALK — Project Plan (Task 1c)

> Cập nhật lần cuối: **27/11/2026** (M1 – Nguyễn Thành Long, issue #50). Mọi ngày trong file lấy từ lịch sử commit/PR trên GitHub, GitHub Milestones và biên bản họp trong `docs/meetings/`. Trạng thái ghi theo thời điểm cập nhật; mục chưa xong ghi rõ là chưa xong.

**Thành viên:** M1 Nguyễn Thành Long (Leader, tài liệu, README) · M2 Võ Duy Anh (Frontend, UI) · M3 Nguyễn Bá Phát (Backend, Database) · M4 Trần Văn Huy (Tối ưu, Monitoring, Test)

**Mốc chính:** hạn nộp **29/11/2026** (giảng viên xác nhận 26/11/2026) · đóng băng code **28/11/2026 20:00** (biên bản kickoff `docs/meetings/2026-11-26-kickoff.md`).

## 1. Phạm vi (Scope)

**Sản phẩm:** LET'S TALK — web app party game cho bạn bè / gia đình ngồi cùng nhau trên một thiết bị. Người chơi chọn chủ đề (Friends / Family) và độ dài (10 / 20 / Unlimited), sau đó hệ thống chọn ngẫu nhiên 1 trong 4 hoạt động (Question Zone, Pick Your Fate, Random Event, Hot Seat) từ 880 nội dung lưu trong PostgreSQL.

**Trong phạm vi:** 5 trang (Home + Game Setup, About, How to Play, Gameplay, Game Complete); REST API Express; Supabase PostgreSQL (5 bảng nội dung, read-only qua RLS); session lưu Local Storage; responsive; Tailwind CSS v4 (cài 26/11/2026, chuyển dần từng trang); Lighthouse; GA4; Sentry; peer review.

**Đang làm thêm (quyết định 26/11/2026, xem `docs/meetings/2026-11-26-update.md`):**
- **Custom Deck** — người chơi thêm/sửa/xoá câu hỏi hoặc hành động của riêng mình (bảng `custom_cards`, API `/api/v1/custom-cards`) để có đủ CRUD cho Task 3(b). Chưa làm
- **Next.js** — tuỳ chọn, chỉ làm nếu còn thời gian sau khi mọi mục khác xong.

**Ngoài phạm vi:**
- Tài khoản / đăng nhập, multiplayer nhiều thiết bị, bảng xếp hạng (PRD §1.3).
- Thẻ tuỳ chỉnh không đưa vào luồng chơi chính.

## 2. Deliverables

| # | Deliverable | Vị trí | Owner |
|---|---|---|---|
| D1 | Source code (frontend, backend, database) | GitHub repo | M2, M3 |
| D2 | Phân vai, project plan, quy trình GitHub | `docs/01_Team_Roles.md`, `docs/02_Project_Plan.md`, `CONTRIBUTING.md` | M1 |
| D3 | Thiết kế UI (Google Stitch) + biên bản duyệt + bảng đối chiếu | `docs/wireframes/`, `docs/meetings/2026-11-06-design-review.md`, README 2(a) | M2 |
| D4 | Schema / ERD | `docs/03_Database_Schema.md`, `database/schema.sql` | M3 |
| D5 | API contract | `docs/04_API_Documentation.md`, `docs/openapi.yaml` | M3 |
| D6 | Lighthouse trước/sau | `docs/optimization/lighthouse/` | M4 |
| D7 | GA4 + Sentry + logging | `docs/11_Monitoring_and_Analytics.md`, `docs/optimization/monitoring/` | M4 |
| D8 | Bảng test thủ công | `docs/12_Test_Report.md` | M4 |
| D9 | Peer review (cho 2 nhóm + nhận và xử lý góp ý) | `docs/peer-review/` | M1, M4 (gửi) · M2 (xử lý) |
| D10 | README theo Report Template | `README.md` | M1 |
| D11 | Self-report × 4 | `docs/self-reports/` | từng thành viên |
| D12 | Video demo YouTube (≤ 10 phút, ≥ 720p) | link trong README | M1 |

## 3. Milestones (theo ngày thật)

Từ 26/11/2026 nhóm quản lý tiến độ bằng **GitHub Milestones** (ảnh: `docs/screenshots/github-milestones.png`). Các giai đoạn trước đó ghi theo lịch sử commit.

| # | Giai đoạn / Milestone | Thời gian | Trạng thái (27/11/2026) | Bằng chứng |
|---|---|---|---|---|
| 1 | Thiết kế UI trên Google Stitch, Prototype 1 → 2, giảng viên nhận xét | 06/11 – 08/11/2026 | ✅ Xong | `docs/meetings/2026-11-06-design-review.md` (biên bản lập bổ sung 27/11), `docs/wireframes/` |
| 2 | Tạo repo, đưa prototype frontend lên GitHub | 20/11/2026 | ✅ Xong | commit `11469aa`, `738ed76` |
| 3 | Tài liệu PRD, kiến trúc, schema, API | 21/11/2026 | ✅ Xong | commit `1b904d8`, `docs/` |
| 4 | Backend Express + tích hợp frontend ↔ API + deploy Render | 21/11/2026 | ✅ Xong | PR #2, PR #3 (gồm commit `a6bc8c3`), commit `a064c96` |
| 5 | Lighthouse lần 1, GA4 + Sentry, deploy Vercel | 22/11/2026 | ✅ Xong | PR #20, #23, #24, #25, #26 (issue #10, #22) |
| 6 | **Sprint 0 – Bản chấm lần 1** | hạn 25/11/2026 | ✅ Đóng (9/9 issue) | GitHub Milestone |
| 7 | **Sprint 1 – Lấy lại điểm nhanh**: họp kickoff, phân vai lại, sửa README, Sentry, Stitch vào repo, Tailwind, logo WebP, Milestones | hạn 26/11/2026 | ✅ Xong | PR #28, #32, #34, #36, #38, #40, #42, #44, #46, #68 |
| 8 | **Sprint 2 – Tailwind, Test, CRUD**: xử lý góp ý, biên bản thiết kế, project plan, Lighthouse đủ trang, bảng test, Custom Deck | hạn 28/11/2026 (đóng băng 20:00) | 🟨 Đang làm | PR #69, #70, #72 đã merge; còn lại xem mục 4 |
| 9 | **Sprint 3 – Nộp bài**: README cuối, video, self-report, checklist | 29/11/2026 | ⬜ Chưa bắt đầu | issue #14, #51, #52, #56, #62, #67 |

## 4. Phân công công việc (issue thật trên GitHub)

Quy trình: issue → nhánh `<loại>/<số-issue>-<mô-tả>` → commit `type(scope): mô tả (#n)` → PR có `Closes #n` → reviewer khác người tạo → merge (`CONTRIBUTING.md`).

### 4.1. Đã xong

| Issue | Công việc | Owner | PR | Ngày merge |
|---|---|---|---|---|
| #10 | Điền GA4 Measurement ID + Sentry DSN, ảnh dashboard | M4 | #20, #25 | 22/11/2026 |
| #22 | Sửa hostname backend Render ở frontend | M3 | #23 | 22/11/2026 |
| #27 | Sentry frontend tự host SDK | M4 | #28 | 26/11/2026 |
| #31 | Họp kickoff + biên bản | M1 | #32 | 26/11/2026 |
| #35 | Thêm tài khoản M4 vào Team Roles | M4 | #36 | 26/11/2026 |
| #37 | Ảnh bằng chứng Sentry + GA4 | M4 | #38 | 26/11/2026 |
| #39 | Đưa thiết kế Stitch vào `docs/wireframes/` | M2 | #40 | 26/11/2026 |
| #41 | Cài Tailwind CSS v4 + chuyển khối Game Complete | M2 | #42 | 26/11/2026 |
| #43 | Nén logo sang WebP | M4 | #44 | 26/11/2026 |
| #45 | Sửa các claim chưa có bằng chứng trong README | M1 | #46 | 26/11/2026 |
| #48 | Rà issue, tạo Milestones, backlog | M1 | #68 | 26/11/2026 |
| #53 | Biên bản duyệt thiết kế + bảng đối chiếu wireframe ↔ live | M2 | #72 | 27/11/2026 |

### 4.2. Đang làm / chưa làm (Sprint 2, hạn 28/11/2026)

| Issue | Công việc | Owner | Trạng thái (27/11/2026) |
|---|---|---|---|
| #47 | Xử lý góp ý của nhóm Thai Tu Fashion | M2 | 🟨 Loading state (PR #69) và README "Test nhanh" (PR #70) xong; bố cục mobile **hoãn**, issue giữ mở |
| #71 | Xử lý góp ý của nhóm FocusFlow | M2 | ⬜ Mới nhận 27/11/2026 |
| #33 | Review nhóm FocuSpace (FocuSpace#164) | M1 | 🟨 Đã gửi 26/11/2026, chờ phản hồi |
| #50 | Project plan có ngày và trạng thái thật (file này) | M1 | 🟨 Đang làm |
| #49 | Tailwind cho About và How to Play | M1 | ⬜ |
| #54 | Tailwind cho Home và Game Complete | M2 | ⬜ |
| #63 | Sentry backend + kiểm tra ngày log Render | M4 | 🟨 Phần frontend xong |
| #64 | Lighthouse Gameplay, Game Complete, Home | M4 | ⬜ |
| #65 | Bảng test thủ công giao diện | M4 | ⬜ |
| #57 | Hợp đồng API Custom Deck | M3 | ⬜ |
| #58 | Migration bảng `custom_cards` | M3 | ⬜ |
| #59 | API CRUD Custom Deck + test | M3 | ⬜ |
| #60 | Deploy Render + smoke test Custom Deck | M3 | ⬜ |
| #61 | Tài liệu DB cho Custom Deck | M3 | ⬜ |
| #55 | Trang My Deck (Custom Deck) | M2 | ⬜ chờ #59, #60 |
| #66 | Hồi quy trước đóng băng + ảnh 3 kích thước | M4 | ⬜ 28/11/2026 |

### 4.3. Sprint 3 – Nộp bài (29/11/2026)

| Issue | Công việc | Owner |
|---|---|---|
| #14 | README cuối (điền placeholder) | M1 |
| #51 | Quay video demo | M1 |
| #52 | Self-report + checklist nộp bài | M1 |
| #56 | Self-report Võ Duy Anh | M2 |
| #62 | Self-report Nguyễn Bá Phát | M3 |
| #67 | Self-report Trần Văn Huy | M4 |

## 5. Rủi ro và phương án

| Rủi ro | Ảnh hưởng | Phương án |
|---|---|---|
| Render free tier "ngủ" → lần gọi API đầu chậm 30–60 s | Trải nghiệm demo, Lighthouse | Gameplay có thông báo đang tải (PR #69); mở `/api/v1/health` trước khi demo/quay video |
| Custom Deck không kịp trước đóng băng | Task 3(b) chỉ có Read | Cổng quyết định 27/11/2026 15:00 (muộn nhất 18:00); không kịp thì dừng và ghi lý do trong README 3(b) |
| Tailwind mới chuyển một phần giao diện | Task 2(b) | Chuyển thêm About, How to Play, Home (#49, #54) nếu kịp; mỗi trang có ảnh trước/sau |
| Nhóm được review chưa phản hồi | Task 5(a) | Ghi lại thời điểm đã gửi; trả lời ngay khi có phản hồi |
| Commit dồn vào vài ngày cuối | Task 1(d), 1(e) | Mỗi thành viên làm issue của mình, commit bằng tài khoản của mình, PR có reviewer khác |
