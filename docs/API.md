# PeoplePay360 – Backend REST API Specification

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Comprehensive Reference:** See [API_REFERENCE.md](../API_REFERENCE.md) in the project root for detailed request/response schemas.

---

## 1. Authentication & Security
- **Type:** Bearer JWT Token
- **Header:** `Authorization: Bearer <token>`
- **Token Validity:** 7 days

### User Roles & Permissions Matrix
| Role | Access Scope |
| :--- | :--- |
| **Admin** | Full access to all modules, user administration, system config |
| **HR Manager** | Employees, Contracts, Schedules, Work Locations, Attendance, Time-Off Approvals |
| **HR Payroll Admin** | Payruns, Payslips, Salary Structures, Salary Rules, Mark Paid |
| **HR Payroll User** | Payrun Processing, Payslips, Views, Email Dispatch |
| **Employee** | Self-Service Portal (Own profile, GPS attendance check-in, time-off requests, payslips) |

### Predictable Response Envelope
#### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

#### Error Response (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "message": "Descriptive human-readable error explanation."
}
```

---

## 2. Seed Demo Credentials
| Email | Password | Role | Features / Demo Focus |
| :--- | :--- | :--- | :--- |
| `admin@peoplepay360.com` | `Password@123` | **Admin** | Superuser, all actions, user administration |
| `priya.patel@peoplepay360.com` | `Password@123` | **HR Manager** | Leave approvals, employee creation, schedule management |
| `amit.singh@peoplepay360.com` | `Password@123` | **HR Payroll Admin** | Payrun wizard, validation, mark paid, salary rules |
| `neha.gupta@peoplepay360.com` | `Password@123` | **HR Payroll User** | Payrun processing, email dispatch *(has missing bank info warning)* |
| `rahul.sharma@peoplepay360.com` | `Password@123` | **Employee** | **PRIMARY DEMO:** 2 Historical contracts (Jan-Jun ₹35k, Jul-Dec ₹45k), GPS check-in |
| `vikas.mehta@peoplepay360.com` | `Password@123` | **Employee** | Operations staff *(has missing checkout anomaly on Aug 7)* |

---

## 3. Endpoints Directory

### 3.1 Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticates user, returns JWT and user profile.
- `GET /api/auth/me` — Returns current authenticated user.
- `POST /api/auth/switch-role` — Instant role switching for evaluation demos.
- `POST /api/auth/forgot-password` — Generates cryptographically secure reset token.
- `POST /api/auth/reset-password` — Updates password using reset token.

### 3.2 Employees (`/api/employees`)
- `GET /api/employees` — Search and filter employee directory (`search`, `department_id`, `status`).
- `GET /api/employees/:id` — Full employee profile.
- `POST /api/employees` — Create new employee record.
- `PUT /api/employees/:id` — Update employee details.
- `DELETE /api/employees/:id` — Remove employee (restricted if active payroll records exist).
- `GET /api/employees/:id/contracts` — Contract history ledger.
- `GET /api/employees/:id/attendance` — Attendance records for employee.
- `GET /api/employees/:id/payslips` — Past payslips for employee.

### 3.3 Contracts & Historical Selection (`/api/contracts`)
- `GET /api/contracts` — List contracts across organization.
- `GET /api/contracts/applicable` — Resolves the active contract for an employee during a given pay period.
- `POST /api/contracts` — Create a contract with date range overlap validation.
- `PUT /api/contracts/:id` — Update contract terms.
- `DELETE /api/contracts/:id` — Remove contract.

### 3.4 Working Schedules (`/api/schedules`)
- `GET /api/schedules` — List schedules with working hours and days.
- `POST /api/schedules` — Create a schedule with daily shift hours and break configurations.
- `PUT /api/schedules/:id` — Update schedule.

### 3.5 Work Locations & Geofences (`/api/work-locations`)
- `GET /api/work-locations` — List office geofences (latitude, longitude, allowed radius).
- `POST /api/work-locations` — Create new work location.
- `PUT /api/work-locations/:id` — Update location coordinates or radius.

### 3.6 Attendance & GPS Verification (`/api/attendance`)
- `GET /api/attendance` — Query attendance logs (`employee_id`, `month`, `year`, `status`).
- `POST /api/attendance/check-in` — Clock in with browser coordinates; verified against office radius using Haversine formula.
- `POST /api/attendance/check-out` — Clock out; computes net worked hours deducting break.
- `POST /api/attendance/manual` — HR manual punch correction with authorized reason.
- `PUT /api/attendance/:id` — Update record.

### 3.7 Time Off & Leaves (`/api/time-off`)
- `GET /api/time-off/types` — List leave categories (Paid Time Off, Sick Leave, etc.).
- `GET /api/time-off/allocations` — Employee annual leave balances.
- `GET /api/time-off/requests` — Query leave requests.
- `POST /api/time-off/requests` — Submit a leave request.
- `PUT /api/time-off/requests/:id/approve` — Approve request and deduct balance.
- `PUT /api/time-off/requests/:id/reject` — Reject request with reason.

### 3.8 Salary Structures & Rules (`/api/salary-config`)
- `GET /api/salary-config/structures` — List salary structures and associated rules.
- `POST /api/salary-config/structures` — Create new salary structure.
- `GET /api/salary-config/rules` — List salary rules sorted by sequence (`sequence ASC`).
- `POST /api/salary-config/rules` — Create rule (`fixed`, `percent_wage`, `percent_basic`, `formula`).
- `PUT /api/salary-config/rules/:id` — Update rule.
- `DELETE /api/salary-config/rules/:id` — Remove rule.

### 3.9 Payruns (State Machine: draft → computed → validated → paid) (`/api/payruns`)
- `GET /api/payruns` — List payruns with totals.
- `GET /api/payruns/:id` — Get payrun header and computed payslip summary.
- `POST /api/payruns` — Create a draft payrun with eligible employees.
- `POST /api/payruns/:id/compute` — Execute sequential salary calculation engine for all employees.
- `GET /api/payruns/:id/anomalies` — Run compliance and variance pre-flight scans.
- `POST /api/payruns/:id/validate` — Lock payrun in `validated` state.
- `POST /api/payruns/:id/pay` — Mark payrun as `paid`.
- `DELETE /api/payruns/:id` — Delete draft payrun.

### 3.10 Payslips, PDF & Email (`/api/payslips`)
- `GET /api/payslips` — Query payslips.
- `GET /api/payslips/:id` — Full itemized payslip with earnings and deductions lines.
- `GET /api/payslips/:id/pdf` — Stream generated vector PDF payslip (`application/pdf`).
- `POST /api/payslips/:id/send-email` — Dispatch PDF payslip via Nodemailer to employee email.

### 3.11 Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats` — Executive KPI metric cards.
- `GET /api/dashboard/department-costs` — Aggregate payroll expenditure by department.
- `GET /api/dashboard/trends` — 6-month monthly payroll expenditure trends.

### 3.12 User Administration (`/api/users`)
- `GET /api/users` — List user logins and system roles (Admin only).
- `POST /api/users` — Create user login account (Admin only).
- `GET /api/users/roles` — Available system roles.

### 3.13 Ask PeoplePay AI (`/api/ai`)
- `POST /api/ai/ask` — Context-aware query answering using live MySQL records (Google Gemini + offline fallback).

### 3.14 Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch in-app user notifications.
- `PUT /api/notifications/:id/read` — Mark notification read.
- `PUT /api/notifications/read-all` — Mark all read.

### 3.15 Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` — Immutable audit trail of system events.

### 3.16 Departments & Positions (`/api/departments`)
- `GET /api/departments` — List departments with manager names.
- `GET /api/departments/positions` — List job positions by department.
