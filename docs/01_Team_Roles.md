# LET'S TALK — Phân công vai trò và trách nhiệm (Task 1a)

## 1. Thông tin buổi họp

| Mục | Nội dung |
|---|---|
| Hình thức | Họp nhóm Discord |
| Ngày họp | 26/11/2026 |
| Thành phần | Đủ 4/4 thành viên |
| Mục tiêu | Thống nhất vai trò, phạm vi trách nhiệm, quy trình làm việc trên GitHub và lịch milestone |
| Kết quả | Thống nhất 4 vai trò dưới đây, kèm quy trình trong `CONTRIBUTING.md` và kế hoạch trong `docs/02_Project_Plan.md` |

## 2. Vai trò

| # | Họ tên | GitHub | Vai trò | Trách nhiệm chính |
|---|---|---|---|---|
| M1 | Nguyễn Thành Long | [`NguyenThanhLong-dev`](https://github.com/NguyenThanhLong-dev) | **Team Leader / Project Manager & Documentation** | Tài liệu đặc tả (PRD, kiến trúc, test plan); lập kế hoạch và milestone; quản lý repo, branch, issue và review PR; viết README (Report Template); điều phối peer review; dựng video demo |
| M2 | Võ Duy Anh | [`tuananhvo588-design`](https://github.com/tuananhvo588-design) | **Frontend Developer (UI/UX)** | Wireframe; xây dựng 5 trang HTML/CSS; responsive mobile/tablet/desktop; tương tác JS (setup, modal, animation, gameplay UI); áp dụng các góp ý UI/UX |
| M3 | Nguyễn Bá Phát | [`nguyenbaphat59-del`](https://github.com/nguyenbaphat59-del) | **Backend & Database Developer** | Thiết kế schema/ERD Supabase PostgreSQL; seed 880 nội dung; Express REST API `/api/v1`; tích hợp Frontend ↔ API; deploy Backend (Render) |
| M4 | Trần Văn Huy | (chưa có — đang tạo) | **QA, Optimization & Monitoring** | Unit/integration test; Lighthouse audit và tối ưu; Google Analytics 4 và Sentry; kiểm thử đa thiết bị |

Ghi chú: các tài liệu kỹ thuật cũ dùng nhãn “Member 1 / Member 3” (ví dụ `09_STEP3_BACKEND_COMPLETION_REPORT.md` ghi *Member 3 — Backend Development*). Bảng trên giữ nguyên quy ước số thứ tự đó: M3 là Backend.

## 3. Ma trận trách nhiệm (RACI)

R = thực hiện, A = chịu trách nhiệm cuối cùng / duyệt, C = tham vấn, I = được thông báo.

| Hạng mục | M1 Leader | M2 Frontend | M3 Backend | M4 QA/Opt |
|---|---|---|---|---|
| 1a Phân vai | **A/R** | C | C | C |
| 1b Wireframe (Figma) | A | **R** | C | C |
| 1c Project plan, milestone | **A/R** | C | C | C |
| 1d GitHub repo, branch, issue | **A/R** | R | R | R |
| 1e Quy ước commit / PR | **A/R** | R | R | R |
| 2a 5 trang + điều hướng | C | **A/R** | I | C |
| 2c Tương tác JavaScript | C | **A/R** | C | C (test) |
| 2d Responsive | C | **A/R** | I | R (test thiết bị) |
| 3a Schema / ERD | C | I | **A/R** | C |
| 3b Kết nối DB, API | I | C | **A/R** | C |
| 3c Trang dữ liệu động | I | R | **A/R** | C |
| 4a Lighthouse | C | R | I | **A/R** |
| 4b GA4 + Sentry + logging | I | C | R (Backend) | **A/R** |
| 5a Review 2 nhóm khác | **A** | R | R | R |
| 5b Xử lý feedback nhận được | A | **R** | R | R |
| README / Report | **A/R** | R | R | R |
| Video demo | **A/R** | C | C | C |
| Self-report (mỗi người) | R | R | R | R |

## 4. Phân chia theo thư mục / module

| Thư mục / file | Chủ sở hữu | Reviewer bắt buộc |
|---|---|---|
| `frontend/*.html`, `frontend/css/*` | M2 | M1 |
| `frontend/js/homepage.js`, `gameplay.js`, `game-complete.js` | M2 | M3 |
| `frontend/js/api.js`, `session.js`, `storage.js` | M3 | M2 |
| `frontend/js/config.js`, `monitoring.js`, `analytics.js` | M4 | M3 |
| `backend/**` | M3 | M4 |
| `database/**` | M3 | M1 |
| `frontend/test/**`, `backend/test/**`, `tools/**` | M4 | M3 |
| `docs/optimization/**`, `docs/11_Monitoring_and_Analytics.md` | M4 | M1 |
| `README.md`, `docs/01_*`, `docs/02_*`, `CONTRIBUTING.md`, `.github/**` | M1 | cả nhóm |
| `docs/peer-review/**` | M1 điều phối, cả nhóm viết | M2 |
| `docs/self-reports/self-report-<họ-tên>.md` | từng thành viên | — |

## 5. Quy tắc làm việc đã thống nhất

1. Không commit trực tiếp lên `main`: mỗi việc có một issue → một branch → một Pull Request có ít nhất 1 reviewer (xem `CONTRIBUTING.md`).
2. Mỗi thành viên commit đều đặn bằng tài khoản GitHub của chính mình. Commit nhỏ, mỗi commit một thay đổi logic, message theo Conventional Commits và tham chiếu issue (`#n`).
3. Họp nhanh 2 lần/tuần để cập nhật tiến độ trên GitHub Issues / Project board. Việc bị chặn được báo ngay trong issue.
4. Không thay đổi phạm vi (thêm/bớt tính năng, đổi thiết kế đã duyệt) khi chưa có quyết định ghi lại trong issue.
5. Không commit `.env`, khóa Supabase hay bất kỳ secret nào.
