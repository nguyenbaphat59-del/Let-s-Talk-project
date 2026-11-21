# Self-Report — Final Project

## 1. Thông tin cá nhân

| | |
|---|---|
| Họ tên | Nguyễn Bá Phát |
| GitHub | https://github.com/nguyenbaphat59-del |
| Nhóm | Nhóm 3 |
| Vai trò trong nhóm | M3 — Backend & Database Developer |

## 2. Công việc theo Task

### Task 1: Planning & Setup

- **Tuần:** Tuần 1
- **Công việc đã làm:**
  - Tạo repository, xây dựng ý kiến trong việc làm prototype
- **Tự đánh giá:** [8]/10

### Task 2: UI Implementation

- **Tuần:** Tuần 1–2 
- **Công việc đã làm:**
  - Tích hợp các trang với API, quản lý session Local Storage v2 (`session.js`, `api.js`)
- **Khó khăn gặp phải:** 
    - gặp một số vấn đề cá nhân khiến cho nhóm bị trễ hạn
- **Tự đánh giá:** [8]/10

### Task 3: Database Integration

- **Tuần:** Tuần 2 
- **Công việc đã làm:**
  - Thiết kế schema 5 bảng + RLS read-only, seed 880 nội dung (`database/`)
  - Express API `/api/v1`, GameplayService chọn ngẫu nhiên an toàn, chống lặp nội dung, 34 test Backend
  - Tích hợp Frontend ↔ API (PR #3, commit `a6bc8c3`), deploy Backend lên Render, cấu hình CORS (`a064c96`, `2042060`)
- **Khó khăn gặp phải:** 
- **Tự đánh giá:** [10]/10

### Task 4: Optimization

- **Tuần:** Tuần 2–3 
- **Công việc đã làm:**
  - Sentry Backend (tuỳ chọn qua `SENTRY_DSN`), báo lỗi 5xx kèm requestId, structured JSON access log, 7 test (`backend/src/config/monitoring.js`, `request-logger.middleware.js`)
- **Khó khăn gặp phải:** 
- **Tự đánh giá:** [8]/10

### Task 5: Peer Review

- **Tuần:** Tuần 3
- **Công việc đã làm:**
  - Review nhóm #2 cùng M4
- **Bằng chứng đóng góp:** 
- **Khó khăn gặp phải:** 
- **Tự đánh giá:** [8]/10

## 3. Tổng kết đóng góp

- **Tóm tắt (3–5 câu):** toàn bộ backend của hệ thống, database và API.
- **Ước lượng đóng góp cho nhóm:** ~[50]%
- **Tự đánh giá tổng thể:** [8]/10
