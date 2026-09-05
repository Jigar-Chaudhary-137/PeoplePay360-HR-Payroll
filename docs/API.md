# PEOPLEPAY360 — Backend REST API Specification
**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Audience:** Team Members 2 & 3 (Frontend & Workflow Integrations)

---

## 1. Authentication & Security
- **Type:** Bearer JWT Token
- **Header:** `Authorization: Bearer <token>`
- **Token Validity:** 7 days

### User Roles & Permissions Matrix
| Role | Access Scope |
| :--- | :--- |
| **Admin** | Full access to all modules, user administration, system config |
| **HR Manager** | Employees, Contracts, Schedules, Attendance, Time-Off Approvals |
| **HR Payroll Admin** | Payruns, Payslips, Salary Structures, Salary Rules, Mark Paid |
| **HR Payroll User** | Payrun Processing, Payslips, Views |
| **Employee** | Self-Service Portal (Own profile, attendance, time-off requests, payslips) |

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
| `admin@peoplepay360.com` | `Password@123` | **Admin** | Superuser, all actions |
| `priya.patel@peoplepay360.com` | `Password@123` | **HR Manager** | Leave approvals, Employee creation |
| `amit.singh@peoplepay360.com` | `Password@123` | **HR Payroll Admin** | Payrun wizard, validation, mark paid |
| `neha.gupta@peoplepay360.com` | `Password@123` | **HR Payroll User** | Payruns / Has missing bank info warning |
| `rahul.sharma@peoplepay360.com` | `Password@123` | **Employee** | **PRIMARY DEMO:** 2 Historical contracts (Jan-Jun ₹35k, Jul-Dec ₹45k) |
| `vikas.mehta@peoplepay360.com` | `Password@123` | **Employee** | Operations / Has missing checkout anomaly |

---

## 3. Endpoints Directory

### 3.1 Authentication
- **`POST /auth/login`**
  - **Body:** `{ "email": "admin@peoplepay360.com", "password": "Password@123" }`
  - **Returns:** `{ success: true, data: { token: "...", user: { id, email, role, employee_id, name } } }`
- **`GET /auth/me`**
  - **Auth:** Required
  - **Returns:** Current authenticated user profile with role and employee link.

---

### 3.2 Employees
- **`GET /employees`**
  - **Auth:** HR Manager, HR Payroll Admin, HR Payroll User, Admin
  - **Query Params:** `search`, `department_id`, `status` ('Active', 'Inactive')
  - **Returns:** Array of employees with department, position, manager, and schedule details.
- **`GET /employees/:id`**
  - **Auth:** Self or HR/Payroll/Admin
  - **Returns:** Detailed employee object including related `contracts`, `attendance`, `time_off_requests`, and `time_off_allocations`.
- **`POST /employees`**
  - **Auth:** HR Manager, Admin
  - **Body:** `{ first_name, last_name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, bank_name, bank_account_no, bank_ifsc, pan_no }`
- **`PUT /employees/:id`**
  - **Auth:** HR Manager, Admin
- **`DELETE /employees/:id`**
  - **Auth:** HR Manager, Admin

---

### 3.3 Contracts & Historical Selection
- **`GET /contracts`**
  - **Query Params:** `employee_id`, `status`
- **`GET /contracts/applicable`**
  - **Query Params:** `employee_id`, `period_start`, `period_end`
  - **Business Rule:** Returns the exact contract active during the given period.
    *Example: For Rahul Sharma (`employee_id=2`), `period_start=2026-08-01` returns Contract B (`wage=45000.00`).*
- **`POST /contracts`**
  - **Body:** `{ contract_code, employee_id, start_date, end_date, wage, salary_structure_id, working_schedule_id }`
- **`PUT /contracts/:id`**

---

### 3.4 Working Schedules
- **`GET /schedules`**
  - Returns schedules with dynamic hours per week and day configs.
- **`POST /schedules`**
  - **Body:** `{ name, days: [{ day_of_week: "Monday", start_time: "09:00:00", end_time: "18:00:00", break_hours: 1 }] }`

---

### 3.5 Attendance
- **`GET /attendance`**
  - **Query Params:** `employee_id`, `start_date`, `end_date`, `status`
- **`GET /attendance/today`**
  - Returns today's check-in/out status for the logged-in employee.
- **`POST /attendance/check-in`**
  - Logs check-in timestamp.
- **`POST /attendance/check-out`**
  - Computes worked hours = `(check_out - check_in) - break_hours`.
- **`PUT /attendance/:id`**
  - **Auth:** HR Manager, Admin (Manual authorized correction).

---

### 3.6 Time Off
- **`GET /time-off/types`** & **`POST /time-off/types`**
- **`GET /time-off/allocations`** & **`POST /time-off/allocations`**
- **`GET /time-off/requests`**
- **`POST /time-off/requests`**
  - **Body:** `{ employee_id, time_off_type_id, start_date, end_date, days_requested, reason }`
  - *Note:* Leave balance is NOT reduced when status is `Pending`.
- **`PATCH /time-off/requests/:id/approve`**
  - **Auth:** HR Manager, Admin
  - *Transaction:* Validates balance, reduces allocation, marks status `Approved`.
- **`PATCH /time-off/requests/:id/reject`**
  - **Body:** `{ rejection_reason: "..." }`

---

### 3.7 Salary Structures & Rules
- **`GET /salary-config/structures`** & **`POST /salary-config/structures`**
- **`GET /salary-config/rules`** & **`POST /salary-config/rules`**
  - **Rule Categories:** `Basic`, `Allowance`, `Gross`, `Deduction`, `Net`
  - **Calculation Types:** `fixed`, `percent_wage`, `percent_basic`, `formula`
  - **Sequential evaluation:** Each rule can reference previous rules in sequence!

---

### 3.8 Payruns (2-Step Creation & State Machine)
- **`GET /payruns`** & **`GET /payruns/:id`**
- **`GET /payruns/eligible-employees`**
  - **Query Params:** `salary_structure_id`, `period_start`, `period_end`
  - *Step 2 Wizard Support:* Scans database and returns employees eligible with matching active contracts.
- **`POST /payruns`**
  - **Body:**
    ```json
    {
      "name": "Regular Payrun - August 2026",
      "salary_structure_id": 1,
      "period_start": "2026-08-01",
      "period_end": "2026-08-31",
      "pay_date": "2026-08-31",
      "employee_selections": [
        { "employee_id": 2, "contract_id": 2 },
        { "employee_id": 5, "contract_id": 6 }
      ]
    }
    ```
- **`POST /payruns/:id/compute`**
  - **State Transition:** `draft` → `computed`
  - Runs the backend salary engine in a database transaction.
  - Automatically runs Anomaly Detection.
- **`POST /payruns/:id/validate`**
  - **State Transition:** `computed` → `validated`
  - Finalizes and locks payslips.
- **`POST /payruns/:id/mark-paid`**
  - **State Transition:** `validated` → `paid`
  - Records payment timestamp.
- **`GET /payruns/:id/anomalies`**
  - Returns rule-based anomaly reports (Salary drops/spikes > 15%, missing checkouts, missing bank info, duplicate slips).

---

### 3.9 Payslips, PDF & Email
- **`GET /payslips`**
- **`GET /payslips/:id`**
  - Returns complete itemized payslip with earnings breakdown, deduction breakdown, gross, and net take-home pay.
- **`GET /payslips/:id/pdf`**
  - Streams high-resolution generated PDF file (`application/pdf`).
- **`POST /payslips/:id/send-email`**
  - Sends payslip with PDF attachment via Nodemailer.
- **`POST /payslips/send-bulk`**
  - **Body:** `{ "payrun_id": 1 }`
  - Sends payslips to all employees in the payrun.

---

### 3.10 Dashboard
- **`GET /dashboard`**
  - **Query Params:** `department_id`, `start_date`, `end_date`
  - Returns real database aggregations:
    - `kpis`: `totalNetPaid`, `totalGrossPaid`, `totalDeductionsPaid`, `payslipsGenerated`, `averageSalary`, `totalEmployees`, `approvedTimeOffDays`, `attendanceHealthPercent`
    - `departmentSalaries`: Array of total costs grouped by department
    - `monthlyTrends`: Historical net salaries across payruns
    - `alerts`: Real-time warning banners

---

### 3.11 AI Assistant
- **`POST /ai/ask`**
  - **Body:** `{ "question": "Why did Rahul's salary decrease this month?" }`
  - Contextually queries database metrics and returns structured factual explanation.
