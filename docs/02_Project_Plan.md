# LET'S TALK — Project Plan (Task 1c)

> Kế hoạch 3 tuần theo Final Project Brief. Ngày đã diễn ra lấy từ lịch sử commit trên GitHub. Các ô `[...]` là mốc nhóm cần chốt (ngày nộp, ngày review chéo).

**Thành viên:** M1 Nguyễn Thành Long · M2 Võ Duy Anh · M3 Nguyễn Bá Phát · M4 Trần Văn Huy

## 1. Phạm vi (Scope)

**Sản phẩm:** LET'S TALK — web app party game cho bạn bè / gia đình ngồi cùng nhau trên một thiết bị. Người chơi chọn chủ đề (Friends / Family) và độ dài (10 / 20 / Unlimited), sau đó hệ thống chọn ngẫu nhiên 1 trong 4 hoạt động (Question Zone, Pick Your Fate, Random Event, Hot Seat) từ 880 nội dung lưu trong PostgreSQL.

**Trong phạm vi (theo PRD v1.4):** 5 trang (Home + Game Setup, About, How to Play, Gameplay, Game Complete), REST API Express, Supabase PostgreSQL (5 bảng, read-only qua RLS), session lưu Local Storage, responsive, Lighthouse, GA4, Sentry, peer review.

**Ngoài phạm vi (quyết định của nhóm):**

- Tài khoản / đăng nhập, multiplayer nhiều thiết bị, bảng xếp hạng (PRD §1.3).
- Ghi dữ liệu từ client vào DB: runtime chỉ SELECT bằng publishable key; nội dung được quản lý bằng SQL seed/migration (`database/seeds/`).
- Tailwind CSS: giao diện đã được giảng viên duyệt ở Prototype 2 dùng CSS thuần với design tokens (`docs/DESIGN-SYSTEM.md`); nhóm quyết định không chuyển đổi để tránh rủi ro thay đổi UI.
- Thay đổi file ảnh (nén / đổi định dạng logo).
- Wireframe: không đưa vào bài nộp (quyết định của nhóm).

## 2. Deliverables

| # | Deliverable | Vị trí | Owner |
|---|---|---|---|
| D1 | Source code (frontend, backend, database) | GitHub repo | M2, M3 |
| D2 | Phân vai, project plan, quy trình GitHub | `docs/01_Team_Roles.md`, `docs/02_Project_Plan.md`, `CONTRIBUTING.md` | M1 |
| D4 | Schema / ERD | `docs/03_Database_Schema.md`, `database/schema.sql` | M3 |
| D5 | API contract | `docs/04_API_Documentation.md`, `docs/openapi.yaml` | M3 |
| D6 | Lighthouse trước/sau | `docs/optimization/lighthouse/` | M4 |
| D7 | GA4 + Sentry + logging | `docs/11_Monitoring_and_Analytics.md` | M4 |
| D8 | Peer review (cho 2 nhóm + nhận feedback) | `docs/peer-review/` | M1 + cả nhóm |
| D9 | README theo Report Template | `README.md` | M1 |
| D10 | Self-report × 4 | `docs/self-reports/self-report-<họ-tên>.md` | từng thành viên |
| D11 | Video demo YouTube (≤ 10 phút, ≥ 720p, unlisted/public) | link trong README | M1 |

## 3. Milestones

| # | Milestone | Deadline | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| 1 | Phân vai, Prototype 1 → 2 được giảng viên duyệt | Tuần 1 | ✅ Đúng hạn | `docs/peer-review/received-feedback.md`, commit `738ed76` (20/11/2026) |
| 2 | Setup GitHub + database schema (Supabase) | Tuần 1 | ✅ Đúng hạn | commit `11469aa`, `1b904d8`, `database/schema.sql` |
| 3 | Giao diện cơ bản (5 trang, responsive) | Tuần 1–2 | ✅ Đúng hạn | commit `738ed76` |
| 4 | Tích hợp database + API + trang động | Tuần 2 | ✅ Đúng hạn | PR #3 (`a6bc8c3`), backend deploy Render (`a064c96`) |
| 5 | Tối ưu (Lighthouse) + Monitoring (GA4, Sentry) | Tuần 3 | ✅ Hoàn thành code — chờ điền GA ID / Sentry DSN | branch `perf/lighthouse-optimization`, `feature/analytics-monitoring` |
| 6 | Peer review chéo (2 nhóm) + xử lý feedback | Tuần 3 — [DD/MM] | ⏳ Đang thực hiện | `docs/peer-review/` |
| 7 | README, self-report, video demo, nộp bài | [DD/MM/YYYY] | ⏳ Đang thực hiện | README, `docs/self-reports/` |

## 4. Phân công công việc chi tiết

Mỗi dòng tương ứng một GitHub Issue (script tạo issue: `tools/github/create-issues.sh`).

| Issue | Công việc | Owner | Branch | Tuần | Trạng thái |
|---|---|---|---|---|---|
| — | Prototype frontend 5 trang + responsive | M2 | `feature/member-2-frontend-logic` | 1 | ✅ |
| — | PRD, Solution Architecture, Database Schema, API docs | M1 + M3 | — | 1 | ✅ |
| — | Schema + seed 880 nội dung + RLS read-only | M3 | — | 1–2 | ✅ |
| — | Express API + gameplay service + tests | M3 | `test-backend` | 2 | ✅ |
| — | Tích hợp Frontend ↔ API, session Local Storage v2 | M3 | `integration/laptop-sync` | 2 | ✅ |
| — | Deploy Backend lên Render, cấu hình CORS | M3 | `main` | 2 | ✅ |
| — | Lighthouse audit lần 1 | M4 | `main` | 3 | ✅ |
| #A | Sửa test API client sau khi chuyển sang Render | M4 | `fix/frontend-api-tests` | 3 | ✅ PR chờ merge |
| #B | Tối ưu Lighthouse (font không chặn render, kích thước ảnh, ưu tiên LCP) + đo lại | M4 (M2 review UI) | `perf/lighthouse-optimization` | 3 | ✅ PR chờ merge |
| #C | Sentry Backend + structured logs | M3 | `feature/analytics-monitoring` | 3 | ✅ PR chờ merge |
| #D | GA4 events + Sentry Frontend | M4 | `feature/analytics-monitoring` | 3 | ✅ PR chờ merge |
| #E | Tạo GA4 property + 2 Sentry project, điền ID/DSN, chụp dashboard | M4 | `chore/monitoring-ids` | 3 | ⏳ |
| #F | Phân vai, project plan, CONTRIBUTING, issue/PR template | M1 | `docs/project-management` | 3 | ✅ PR chờ merge |
| #H | Review UI/UX nhóm khác #1 | M1, M2 | `docs/peer-review-given` | 3 | ⏳ |
| #I | Review UI/UX nhóm khác #2 | M3, M4 | `docs/peer-review-given` | 3 | ⏳ |
| #J | Ghi nhận và xử lý feedback nhận được | M2 (+ owner module liên quan) | `fix/peer-feedback-*` | 3 | ⏳ |
| #K | README theo Report Template + screenshots | M1 | `docs/final-report` | 3 | ✅ khung — cần điền thông tin nhóm, ảnh |
| #L | Self-report (4 file) | mỗi thành viên | `docs/self-report-<họ-tên>` | 3 | ⏳ bản nháp sẵn |
| #M | Video demo + upload YouTube | M1 | — | 3 | ⏳ |

`#A…#M` là ký hiệu tạm, sẽ được thay bằng số issue thật sau khi chạy script.

## 5. Rủi ro và phương án

| Rủi ro | Ảnh hưởng | Phương án |
|---|---|---|
| Render free tier “ngủ” → lần gọi API đầu chậm 30–60 s | Trải nghiệm demo / Lighthouse | Mở `/api/v1/health` trước khi demo; Frontend đã có thông báo lỗi/thử lại |
| Logo PNG 1 MB → mobile LCP ~7–8 s | Điểm Performance mobile ~76 | Đã ghi nhận trong báo cáo; phương án: thêm bản WebP nén (chưa làm theo quyết định nhóm) |
| Không dùng Tailwind | Có thể mất điểm Task 2b | Quyết định có ghi lại; giải thích trong README |
| Runtime read-only (chỉ R trong CRUD) | Có thể mất điểm Task 3b | Quyết định bảo mật có chủ đích (RLS, publishable key); C/U/D nội dung qua SQL seed/migration — giải thích trong README |
| Commit tập trung ở 1–2 người | Điểm cá nhân | Từ nay mỗi PR do đúng owner tạo và commit bằng tài khoản của mình |
