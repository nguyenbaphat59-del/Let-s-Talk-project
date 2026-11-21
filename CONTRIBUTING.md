# Quy trình làm việc trên GitHub — LET'S TALK (Task 1d, 1e)

## 1. Luồng làm việc: Issue → Branch → Commit → Pull Request

```text
1. Tạo / nhận Issue      →  gán Assignee, Label, Milestone
2. Tạo branch từ main    →  git switch main && git pull && git switch -c feature/12-ga4-events
3. Commit nhỏ, đúng quy ước, tham chiếu issue
4. Push + mở Pull Request (dùng template), ghi "Closes #12"
5. ≥ 1 reviewer approve, CI/test local pass  →  Squash/Merge vào main
6. Xoá branch sau khi merge
```

`main` luôn ở trạng thái chạy được và deploy được. Không push trực tiếp lên `main`.

## 2. Đặt tên branch

`<loại>/<số-issue>-<mô-tả-ngắn>` (chữ thường, gạch nối)

| Loại | Dùng cho | Ví dụ |
|---|---|---|
| `feature/` | Tính năng mới | `feature/14-ga4-events` |
| `fix/` | Sửa lỗi | `fix/21-api-client-tests` |
| `perf/` | Tối ưu hiệu năng | `perf/18-lighthouse-fonts` |
| `docs/` | Tài liệu | `docs/25-readme-report` |
| `test/` | Bổ sung test | `test/30-monitoring-tests` |
| `chore/` | Cấu hình, dependency | `chore/31-sentry-dsn` |

## 3. Commit message (Conventional Commits)

```text
<type>(<scope>): <mô tả ngắn, thì hiện tại, ≤ 72 ký tự> (#<issue>)

<thân (tuỳ chọn): vì sao thay đổi, ảnh hưởng gì>

Refs #<issue> | Closes #<issue>
```

- **type:** `feat`, `fix`, `perf`, `docs`, `test`, `refactor`, `style`, `chore`
- **scope:** `frontend`, `backend`, `database`, `docs`, `optimization`, `monitoring`, …
- Mỗi commit chỉ chứa **một** thay đổi logic. Không gộp “sửa UI + đổi API + cập nhật docs” vào một commit.
- Không dùng message chung chung như `update`, `fix bug`, `Add files via upload`.

Ví dụ thực tế trong repo:

```text
feat(frontend): integrate frontend with backend API
fix(backend): allow configured CORS origins in production
test(frontend): align API client tests with Render production base
perf(frontend): load fonts asynchronously and prioritise the LCP image
feat(backend): optional Sentry error monitoring and structured request logs
docs(optimization): record Lighthouse fixes and before/after re-run
```

## 4. Pull Request

- Tiêu đề PR theo cùng quy ước commit.
- Mô tả theo `.github/pull_request_template.md`: mục đích, thay đổi chính, cách kiểm thử, ảnh trước/sau (nếu có thay đổi UI), `Closes #n`.
- Ít nhất **1 reviewer** là owner/reviewer của module (xem `docs/01_Team_Roles.md` §4).
- Trước khi xin review: `npm run check` (hoặc `npm run check:offline`) phải pass.
- Reviewer dùng *Request changes* khi cần sửa; tác giả sửa bằng commit mới (không force-push xoá lịch sử review).

## 5. Issue

- Dùng template `Feature`/`Bug` trong `.github/ISSUE_TEMPLATE/`.
- Label: `frontend`, `backend`, `database`, `docs`, `optimization`, `monitoring`, `peer-review`, `bug`, `task-1` … `task-5`.
- Milestone: theo `docs/02_Project_Plan.md` §3.
- Mọi commit/PR liên quan đều tham chiếu số issue để GitHub tự liên kết.

## 6. Kiểm tra trước khi commit

```bash
npm install
npm run check           # cú pháp + toàn bộ test + validators
# hoặc khi không có mạng:
npm run check:offline
```

Không commit: `.env`, khoá Supabase, `node_modules/`, file log.
