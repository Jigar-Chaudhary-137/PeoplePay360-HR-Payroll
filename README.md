# PeoplePay360 – Intelligent HR & Payroll Operations Platform

PeoplePay360 is an integrated web application for human resources management and payroll operations. It connects employee records, working schedules, GPS-verified attendance, leave approvals, and multi-rule salary calculations into a unified system.

---

## Table of Contents

- [1. Project Description](#1-project-description)
- [2. Key Features](#2-key-features)
- [3. Complete System Flow](#3-complete-system-flow)
- [4. User Roles & Access Control](#4-user-roles--access-control)
- [5. Technology Stack](#5-technology-stack)
- [6. System Architecture](#6-system-architecture)
- [7. Database Schema & Relationships](#7-database-schema--relationships)
- [8. Payroll Calculation Engine](#8-payroll-calculation-engine)
- [9. Authentication & Security](#9-authentication--security)
- [10. GPS Attendance Verification](#10-gps-attendance-verification)
- [11. Ask PeoplePay AI Assistant](#11-ask-peoplepay-ai-assistant)
- [12. Project Structure](#12-project-structure)
- [13. Installation & Setup Guide](#13-installation--setup-guide)
- [14. Environment Variables](#14-environment-variables)
- [15. Demo Accounts & Personas](#15-demo-accounts--personas)
- [16. API Overview](#16-api-overview)
- [17. Evaluator Demo Guide](#17-evaluator-demo-guide)
- [18. Troubleshooting](#18-troubleshooting)
- [19. Final Project Status](#19-final-project-status)

---

## 1. Project Description

### The Problem
In most small-to-medium workplaces, HR records and payroll processing live in separate silos:
- Employee profiles and wage rates are tracked in spreadsheets.
- Attendance is recorded via physical registers, punch cards, or standalone biometric devices.
- Leaves and vacation requests are approved over email or chat messages.
- At the end of every month, payroll accountants manually export attendance logs, calculate absent days, verify if wage increments took effect, calculate deductions like PF and TDS in Excel, and generate individual payslips.

This disconnected workflow leads to human errors: wrong wage rates applied after mid-year raises, unpaid absences ignored, incorrect tax calculations, and duplicate payslips.

### Why HR and Payroll Must Be Connected
Payroll is not an isolated calculation; it is the financial reflection of everyday HR events:
- A contract change or mid-year salary revision alters the wage baseline.
- An employee's working schedule dictates standard weekly hours and expected working days.
- Daily check-in/out records establish actual attendance and unpaid absences.
- Approved paid leave preserves pay, while unapproved absence triggers prorated deductions.

Connecting HR operations directly to the payroll engine eliminates manual data re-entry and guarantees that every figure on a payslip can be traced back to verified records.

### What Makes Our Approach Useful
1. **Historical Contract Accuracy:** Instead of merely storing one "current salary" field on the employee, PeoplePay360 stores contract histories with date ranges. If an employee is promoted from ₹35,000/month to ₹45,000/month starting July 1st, calculating payroll for August selects the ₹45,000 contract, while past payruns remain locked to ₹35,000.
2. **Deterministic, Configurable Calculation Engine:** Salary rules are stored as ordered records in the database. Basic pay, allowances, statutory deductions, and tax formulas are evaluated in strict sequence, allowing each rule to build upon earlier rules.
3. **Pre-Payrun Anomaly Detection:** Before a payrun is validated or paid, the system automatically checks for missing bank information, unclosed attendance punches, salary drops or spikes (>15%), and duplicate payslips.
4. **GPS-Verified Attendance:** Office check-ins compare the browser's coordinates against configured office coordinates using the Haversine formula within an allowed radius.
5. **Contextual AI Assistance:** An integrated assistant ("Ask PeoplePay AI") answers natural language questions using live data from MySQL tables, running via Google Gemini or an offline SQL analytics engine.

---

## 2. Key Features

| Module | Implemented Capabilities |
| :--- | :--- |
| **Employee Management** | Complete employee lifecycle, system codes (EMP001), job titles, departments, managers, bank accounts, IFSC, PAN numbers, and employment status tracking. |
| **Contracts & History** | Multiple sequential contracts per employee with effective start and end dates, wage rates, assigned schedules, and salary structures. Date overlap validation prevents conflicting contracts. |
| **Working Schedules** | Configurable shift schedules with day-by-day start/end times, lunch break deductions, and automated calculation of weekly and monthly standard working days. |
| **Attendance Tracking** | Daily check-in and check-out recording with net worked hours calculation: `(check_out - check_in) - break_hours`. Supports Present, Half Day, Late, and Absent statuses with authorized manual corrections. |
| **GPS Geofencing** | Validates browser coordinates against assigned office coordinates using Haversine distance. Automatically flags or blocks check-ins attempted outside the configured office radius. Remote employees without configured work locations are handled cleanly. |
| **Time Off & Leaves** | Leave types (Paid Time Off, Sick Leave, Casual Leave), annual employee allocations, leave requests with date pickers, and manager approval/rejection workflows that update balances in real time. |
| **Salary Structures & Rules** | Categorized salary rules (`Basic`, `Allowance`, `Gross`, `Deduction`, `Net`) using calculation types (`fixed`, `percent_wage`, `percent_basic`, `formula`). Rules are evaluated in strict numerical sequence. |
| **Payroll Engine** | Automated computation of payable days, prorated attendance factors, statutory Provident Fund (capped at 12% of basic up to ₹15,000), Professional Tax (₹200), and TDS (5% of wage). |
| **Payruns & State Machine** | Strict 4-step state machine: `draft` &rarr; `computed` &rarr; `validated` &rarr; `paid`. Locks records once validated to prevent accidental changes. |
| **Anomaly & Warning Engine** | Automatic scans flag missing bank details, missing check-outs, salary variances >15%, and duplicate payslips for the same period. |
| **Payslips Ledger** | Detailed itemized payslips showing scheduled days, worked days, leave days, absent days, line-by-line earnings, line-by-line deductions, gross salary, and net salary. |
| **PDF Generation** | Server-side vector PDF payslip generation using `PDFKit` with company header, employee details, bank info, and clear tabular layout. |
| **Email Delivery** | Direct email dispatch of PDF payslips to employees via `Nodemailer` with SMTP integration and simulated logging fallback for offline development. |
| **Notifications** | In-app notification center for approvals, payrun status updates, and system alerts with read/unread tracking. |
| **Audit Logs** | Comprehensive audit trail capturing user ID, action type (`USER_LOGIN`, `PAYRUN_COMPUTED`, `TIMEOFF_APPROVED`), target entity, timestamp, and JSON details. |
| **Role-Based Access Control** | 5 distinct roles (`Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`, `Employee`) enforced on every REST route and UI view. |
| **Ask PeoplePay AI** | Built-in AI assistant querying live MySQL context to explain salary drops, department costs, leave balances, and payroll anomalies. |

---

## 3. Complete System Flow

The platform connects daily operational events directly to monthly financial outputs:

```
+-----------------------------------------------------------------------------------+
| 1. Employee Profile (EMP code, department, bank account, PAN, work location)      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. Active Contract (Valid date range, monthly wage, assigned salary structure)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. Working Schedule (Days per week, shift hours, expected working days in period) |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. Attendance & Leaves (GPS check-in/out, worked days, approved paid time-off)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 5. Payrun Initialization (Period start & end dates, eligible employee selection)  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 6. Payroll Engine Execution                                                       |
|    - Computes attendance factor: payable_days / scheduled_days                    |
|    - Sequentially executes salary rules (Basic -> Allowances -> Gross)            |
|    - Sequentially executes deduction rules (PF -> PT -> TDS -> Net)               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 7. Pre-Validation Anomaly Detection (Missing bank info, missing checkouts, spikes)|
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 8. Payrun Validation & Finalization (State: validated -> paid)                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 9. Payslip Distribution & Reporting                                               |
|    - PDF generation via PDFKit                                                    |
|    - Email dispatch via Nodemailer                                                |
|    - Live KPIs updated on HR & Payroll Dashboard                                  |
+-----------------------------------------------------------------------------------+
```

### How Each Step Connects:
1. **Employee to Contract:** An employee can have multiple contracts over time. When a payrun is computed for August 2026, the backend checks contract dates and automatically binds the contract active during August.
2. **Schedule to Attendance:** The employee's working schedule defines expected working days in that month (typically 22 working days for a Monday–Friday schedule).
3. **Attendance & Time-Off to Attendance Factor:** The system calculates:
   $$\text{Payable Days} = \min(\text{Scheduled Days}, \text{Attended Days} + \text{Approved Leave Days})$$
   $$\text{Attendance Factor} = \frac{\text{Payable Days}}{\text{Scheduled Days}}$$
   If an employee has full attendance or approved paid leave, the factor is `1.0`. If there are unpaid absences, the factor drops accordingly.
4. **Salary Structure to Payslip Lines:** The engine reads active rules for the contract's structure sorted by sequence number. It calculates basic pay and allowances, sums them into gross pay, evaluates deductions, and determines net salary.
5. **Output Generation:** Individual payslips and line items are written to MySQL in a database transaction. PDFs can be downloaded or emailed, and dashboard charts update instantly.

---

## 4. User Roles & Access Control

PeoplePay360 implements strict Role-Based Access Control (RBAC) at both the Express middleware layer (`requireRole`, `requireSelfOrRole`) and the React routing layer (`ProtectedRoute`).

```
                              +--------------------+
                              |       Admin        |
                              |  (Full Privileges) |
                              +---------+----------+
                                        |
               +------------------------+------------------------+
               |                                                 |
               v                                                 v
      +-----------------+                              +--------------------+
      |   HR Manager    |                              |  HR Payroll Admin  |
      |  (People Ops)   |                              |   (Payroll Lead)   |
      +--------+--------+                              +---------+----------+
               |                                                 |
               |                                                 v
               |                                       +--------------------+
               |                                       |  HR Payroll User   |
               |                                       |   (Payroll Ops)    |
               |                                       +---------+----------+
               |                                                 |
               +------------------------+------------------------+
                                        |
                                        v
                              +--------------------+
                              |      Employee      |
                              |   (Self-Service)   |
                              +--------------------+
```

| Role | Scope & Permissions | Typical User |
| :--- | :--- | :--- |
| **Admin** | Full system-wide access. Can manage user accounts, assign roles, view audit logs, configure system settings, and perform all actions of any other role. | Vikram Verma (`admin@peoplepay360.com`) |
| **HR Manager** | Manages employees, departments, job positions, contracts, working schedules, work locations, attendance corrections, and leave approvals/rejections. Cannot run payroll or validate payruns. | Priya Patel (`priya.patel@peoplepay360.com`) |
| **HR Payroll Admin** | Full payroll control. Can create and modify salary structures and rules, create contracts, initiate payruns, run payroll calculations, review anomalies, validate payruns, and mark payruns as paid. | Amit Singh (`amit.singh@peoplepay360.com`) |
| **HR Payroll User** | Operational payroll tasks. Can create draft payruns, trigger computation, view payslips, and dispatch payslip emails. Cannot alter salary structures/rules or validate/pay payruns. | Neha Gupta (`neha.gupta@peoplepay360.com`) |
| **Employee** | Self-Service portal only. Can view own profile, check in/out with GPS verification, view time-off balances, submit leave requests, and view/download personal payslips. Cannot access managerial or payroll interfaces. | Rahul Sharma (`rahul.sharma@peoplepay360.com`) |

---

## 5. Technology Stack

Only libraries and tools actively utilized in the codebase are listed below:

### Frontend
- **React 18.3.1**: Component-based user interface.
- **Vite 6.2.0**: Fast build tool and local dev server.
- **Tailwind CSS v4.3.3**: Modern utility-first styling with responsive design.
- **React Router DOM 6.29.0**: Client-side routing, protected routes, and redirects.
- **Lucide React 1.16.0**: Clean, consistent icon set.
- **Axios 1.8.1**: HTTP client with JWT request interceptors and centralized error handling.
- **Canvas Confetti 1.9.4**: Visual feedback on successful payrun completions.

### Backend
- **Node.js (v18+)**: JavaScript runtime environment.
- **Express.js 4.21.2**: REST API routing, controllers, and middleware.
- **mysql2 3.12.0**: Promise-based MySQL client with connection pooling (`mysql/promise`).
- **jsonwebtoken (JWT) 9.0.2**: Stateless session token generation and verification (7-day validity).
- **bcryptjs 2.4.3**: Secure password hashing with salt rounds.
- **PDFKit 0.16.0**: Server-side vector PDF document generation for payslips.
- **Nodemailer 6.10.0**: Email delivery with SMTP support and development mock transporter.
- **Morgan 1.10.0**: HTTP request logger middleware.
- **Dotenv 16.4.7**: Environment variable configuration.

### Database
- **MySQL 8.0**: Relational database with InnoDB engine, utf8mb4 encoding, foreign key constraints (`ON DELETE RESTRICT`, `CASCADE`, `SET NULL`), and performance indexes.

### Artificial Intelligence
- **Google Gemini 1.5 Flash**: Natural language question answering with live SQL context injection.
- **Deterministic SQL Analytics Engine**: Built-in zero-dependency offline fallback engine when no Gemini API key is configured.

---

## 6. System Architecture

PeoplePay360 uses a layered client-server architecture:

```
[ Web Browser / Client ]
       |
       |  HTTP/REST (JSON, multipart, application/pdf)
       |  Header: Authorization: Bearer <JWT_TOKEN>
       v
+---------------------------------------------------------------+
|                      EXPRESS.JS BACKEND                       |
|                                                               |
|  [ Middleware Layer ]                                         |
|    - CORS (Cross-Origin Resource Sharing)                     |
|    - Morgan Request Logging                                   |
|    - authenticateToken (JWT verification & active user check) |
|    - requireRole / requireSelfOrRole (RBAC authorization)     |
|    - errorHandler & notFoundHandler                           |
|                                                               |
|  [ Routes Layer (16 route modules) ]                          |
|    /api/auth, /api/employees, /api/contracts,                 |
|    /api/attendance, /api/work-locations, /api/schedules,      |
|    /api/time-off, /api/salary-config, /api/payruns,           |
|    /api/payslips, /api/dashboard, /api/ai,                    |
|    /api/notifications, /api/audit-logs, /api/users,           |
|    /api/departments                                           |
|                                                               |
|  [ Controllers Layer ]                                        |
|    Request validation, param parsing, response formatting     |
|                                                               |
|  [ Business Logic & Services Layer ]                          |
|    - payrollEngine.js   (sequential formula execution)        |
|    - contractService.js (date-range historical resolution)    |
|    - locationService.js (Haversine GPS distance verification) |
|    - anomalyService.js  (variance & validation scans)         |
|    - pdfService.js      (PDFKit document renderer)            |
|    - emailService.js    (Nodemailer dispatch & tracking)      |
|    - aiService.js       (context assembler & LLM/NLP bridge)  |
|    - auditLogger.js     (audit event recorder)                |
+---------------------------------------------------------------+
                               |
                               |  Connection Pool (mysql2/promise)
                               v
+---------------------------------------------------------------+
|                       MYSQL 8 DATABASE                        |
|                                                               |
|  Normalized relational tables with foreign keys:              |
|  roles, users, employees, departments, job_positions,         |
|  working_schedules, schedule_days, work_locations,            |
|  contracts, salary_structures, salary_rules,                  |
|  attendance, time_off_types, time_off_allocations,            |
|  time_off_requests, payruns, payrun_employees,                |
|  payslips, payslip_lines, notifications, audit_logs           |
+---------------------------------------------------------------+
```

---

## 7. Database Schema & Relationships

The database schema is defined in `backend/src/db/schema.sql` and initialized via `initDb.js`. It contains 22 normalized tables:

```
[ departments ] <-----+
       |              |
       | 1:N          | 1:N
       v              |
[ job_positions ]     |
       |              |
       | 1:N          |
       v              |
[ employees ] --------+ (manager_id, department_id, job_position_id)
  |   |   |   |
  |   |   |   +--> [ users ] (1:1 link to employee, role_id -> roles)
  |   |   |
  |   |   +------> [ contracts ] (1:N, start_date, end_date, wage, salary_structure_id)
  |   |              |
  |   |              v
  |   |            [ salary_structures ] <---> [ salary_rules ]
  |   |                     ^            (via salary_structure_rules)
  |   |                     |
  |   |                     +-------+
  |   |                             |
  |   +----------> [ attendance ]   | (1:N, date, check_in, check_out, GPS coords, verified)
  |   |                             |
  |   +----------> [ time_off_requests ] (1:N, type_id, start/end, status: Pending/Approved)
  |                                 |
  |                                 v
  +--------------> [ payslips ] <---+ [ payruns ]
                      |
                      v
             [ payslip_lines ] (Line item breakdown: BASIC, HRA, TRANS, PF, PT, TDS, NET)
```

### Core Relationships

1. **Employee &rarr; Contract (`contracts.employee_id` &rarr; `employees.id`):**
   - An employee can have multiple contracts representing salary history.
   - Foreign key constraint: `ON DELETE CASCADE`.
   - Each contract defines an effective `start_date`, optional `end_date`, `wage`, `working_schedule_id`, and `salary_structure_id`.

2. **Employee &rarr; Attendance (`attendance.employee_id` &rarr; `employees.id`):**
   - Stores daily check-in time, check-out time, break hours, calculated worked hours, status, GPS coordinates, and verification flag.
   - Unique key `unique_emp_date (employee_id, date)` guarantees only one record per employee per day.

3. **Employee &rarr; Time Off (`time_off_requests.employee_id` &rarr; `employees.id`):**
   - Tracks leave requests with start and end dates, requested days, and status (`Pending`, `Approved`, `Rejected`).
   - Links to `time_off_allocations` to track allocated vs. used balances per year.

4. **Payrun &rarr; Payslip &rarr; Payslip Lines:**
   - A `payrun` covers a specific date period (`period_start` to `period_end`).
   - `payrun_employees` links eligible employees and their resolved `contract_id` to that payrun.
   - Each `payslip` represents an employee's calculation for that payrun.
   - Each `payslip` owns multiple `payslip_lines` (`payslip_lines.payslip_id` &rarr; `payslips.id` `ON DELETE CASCADE`), storing the itemized amount for each evaluated salary rule.

---

## 8. Payroll Calculation Engine

The calculation engine is implemented in `backend/src/services/payrollEngine.js`.

### Step 1: Historical Contract Selection
When a payrun is computed for a date range (e.g., `2026-08-01` to `2026-08-31`), the engine executes `findApplicableContract(employeeId, periodStart, periodEnd)`:
```sql
SELECT c.*, ss.name AS salary_structure_name
FROM contracts c
JOIN salary_structures ss ON c.salary_structure_id = ss.id
WHERE c.employee_id = ?
  AND c.start_date <= ?
  AND (c.end_date IS NULL OR c.end_date >= ?)
  AND c.status IN ('Running', 'Expired')
ORDER BY c.start_date DESC
LIMIT 1;
```
**Example:**
- Employee Rahul Sharma has Contract A (₹35,000, valid `2026-01-01` to `2026-06-30`) and Contract B (₹45,000, valid `2026-07-01` to `2026-12-31`).
- For August 2026, Contract B is automatically selected. Past July 2026 reports remain historically linked to their original contract.

### Step 2: Attendance Pro-Rating
The engine inspects working days, attended days, and approved leave days:
- `scheduledDays`: Count of working days in the period according to the employee's `working_schedules` (default 22 days).
- `workedDays`: Calculated from attendance records (`Present` = 1 day, `Half Day` = 0.5 day).
- `leaveDays`: Total approved days from `time_off_requests`.
- `payableDays`: $\min(\text{scheduledDays}, \text{workedDays} + \text{leaveDays})$.
- `attendanceFactor`: $\frac{\text{payableDays}}{\text{scheduledDays}}$ (bounded between 0.0 and 1.0).

### Step 3: Sequential Salary Rule Evaluation
The engine retrieves active salary rules for the assigned structure, ordered by `sr.sequence ASC`. A shared calculation `scope` is maintained throughout execution:

```javascript
const scope = {
  WAGE: monthlyWage,
  ATTENDANCE_FACTOR: factor,
  SCHEDULED_DAYS: scheduledDays,
  WORKED_DAYS: workedDays,
  LEAVE_DAYS: leaveDays,
  ABSENT_DAYS: absentDays
};
```

| Sequence | Rule Code | Category | Calculation Type | Rate / Formula | Scope Action |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `BASIC` | Basic | `percent_wage` | Rate: `0.50` | `scope.BASIC = WAGE * 0.50 * ATTENDANCE_FACTOR` |
| **2** | `HRA` | Allowance | `percent_basic` | Rate: `0.40` | `scope.HRA = scope.BASIC * 0.40` |
| **3** | `TRANS` | Allowance | `fixed` | Amount: `3000.00` | `scope.TRANS = 3000.00 * ATTENDANCE_FACTOR` |
| **4** | `SPECIAL` | Allowance | `formula` | `(WAGE * ATTENDANCE_FACTOR) - BASIC - HRA - TRANS` | Balancing allowance to match wage |
| **5** | `GROSS` | Gross | `formula` | `BASIC + HRA + TRANS + SPECIAL` | Total gross salary |
| **6** | `PF` | Deduction | `percent_basic` | Rate: `0.12` (Capped at ₹15k basic) | `Math.min(scope.BASIC, 15000) * 0.12` |
| **7** | `PT` | Deduction | `fixed` | Amount: `200.00` | Fixed Professional Tax deduction |
| **8** | `TDS` | Deduction | `percent_wage` | Rate: `0.05` | Standard 5% income tax withholding |
| **9** | `NET` | Net | `formula` | `GROSS - (PF + PT + TDS)` | Final net take-home salary |

### Concrete Calculation Example (Rahul Sharma, Full Attendance)
- Monthly Wage = ₹45,000.00
- Scheduled Days = 22, Attended = 20, Approved PTO = 2 &rarr; Payable Days = 22 &rarr; `ATTENDANCE_FACTOR = 1.0`

**Earnings:**
- `BASIC`: ₹45,000 &times; 50% = **₹22,500.00**
- `HRA`: ₹22,500 &times; 40% = **₹9,000.00**
- `TRANS`: Fixed = **₹3,000.00**
- `SPECIAL`: ₹45,000 &minus; (22,500 + 9,000 + 3,000) = **₹10,500.00**
- **GROSS SALARY:** ₹22,500 + ₹9,000 + ₹3,000 + ₹10,500 = **₹45,000.00**

**Deductions:**
- `PF`: $\min(22,500, 15,000) \times 12\% = 15,000 \times 12\% =$ **₹1,800.00**
- `PT`: Fixed = **₹200.00**
- `TDS`: ₹45,000 &times; 5% = **₹2,250.00**
- **TOTAL DEDUCTIONS:** ₹1,800 + ₹200 + ₹2,250 = **₹4,250.00**

**Net Take-Home Pay:**
- **NET SALARY:** ₹45,000 &minus; ₹4,250 = **₹40,750.00**

---

## 9. Authentication & Security

1. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds.
2. **Stateless JWT Sessions:** Successful authentication returns a signed JSON Web Token containing the user's `userId`, `email`, `role`, and `employeeId`. Tokens expire after 7 days (`JWT_EXPIRES_IN=7d`).
3. **Active User Verification:** On every authenticated request, the `authenticateToken` middleware verifies the JWT signature and queries MySQL to ensure the user exists and holds an `Active` account status.
4. **Role-Based Endpoint Protection:** Sensitive endpoints are wrapped in `requireRole(...)`. If an unauthorized role attempts access (e.g. an Employee attempting `POST /api/payruns`), the server rejects the request with `HTTP 403 Forbidden`.
5. **Self-Service Isolation:** The `requireSelfOrRole` middleware ensures employees can only view their own attendance, time-off requests, and payslips (`req.user.employee_id === targetId`).
6. **SQL Injection Prevention:** All database operations use parameterized queries (`query('SELECT ... WHERE id = ?', [id])`) via the `mysql2` driver. No string concatenation is used for user input in SQL.
7. **Secure Password Reset Flow:**
   - The user requests a reset via `POST /api/auth/forgot-password`.
   - The server verifies the email, generates a cryptographically secure 32-byte hex token using Node's native `crypto.randomBytes(32)`, hashes it, stores it in the `password_resets` table with a 1-hour expiration, and dispatches a reset link via email.
   - The user submits their new password to `POST /api/auth/reset-password` with the token.
8. **Audit Logging:** Administrative and financial actions (`USER_LOGIN`, `PAYRUN_COMPUTE`, `PAYRUN_VALIDATE`, `PAYRUN_PAID`, `TIMEOFF_APPROVE`) write immutable records to the `audit_logs` table.

---

## 10. GPS Attendance Verification

PeoplePay360 includes physical location verification for attendance check-ins.

```
[ Employee Browser / Mobile ]
            |
            | 1. navigator.geolocation.getCurrentPosition()
            |    (captures latitude, longitude, accuracy)
            v
[ POST /api/attendance/check-in ]
            |
            | 2. Backend reads employee's assigned work_locations (lat, lon, radius)
            v
[ locationService.calculateHaversineDistance ]
            |
            | 3. Computes great-circle distance in meters
            v
+-------------------------------------------------------------+
| Decision: Is distance <= radius_meters?                     |
|                                                             |
|   YES (<= 250m)  --> Allowed: Check-in saved                |
|                      location_verified = true               |
|                                                             |
|   NO (> 250m)    --> Rejected: HTTP 403                     |
|                      "Check-in rejected: You are X meters   |
|                      away from assigned office."            |
+-------------------------------------------------------------+
```

### Haversine Formula Implementation
The exact great-circle distance is calculated in `locationService.js`:
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
where $R = 6,371,000$ meters.

### Geofence Configuration
- **Bangalore Tech Park HQ:** Latitude `12.9715987`, Longitude `77.5945627`, Allowed Radius: **250 meters**.
- **Mumbai BKC Office:** Latitude `19.0657100`, Longitude `72.8683700`, Allowed Radius: **200 meters**.

### Spoofing Note
*Engineering Clarification:* While browser geolocation can technically be simulated by determined users via developer tooling or mock location apps, this check prevents casual off-site check-ins and provides verified spatial compliance suitable for standard organizational operations.

---

## 11. Ask PeoplePay AI Assistant

"Ask PeoplePay AI" is an intelligent assistant accessible from the top navigation bar. It is designed specifically to analyze and explain PeoplePay360 HR and payroll data.

```
[ User asks: "Why did Rahul's salary decrease?" ]
                        |
                        v
[ Backend aiController.js / aiService.js ]
                        |
                        | 1. Extracts keywords ('Rahul', 'decrease', 'department', etc.)
                        | 2. Executes contextual MySQL queries:
                        |    - Recent payslips for Rahul (worked days, deductions, gross)
                        |    - Active and past contracts
                        |    - Approved leave records
                        |    - Department cost aggregations
                        |    - Active payrun anomalies
                        v
+-------------------------------------------------------------+
| Is GEMINI_API_KEY present in .env?                          |
|                                                             |
|   YES --> Calls Gemini 1.5 Flash API with strictly          |
|           bounded database context. Formats professional    |
|           markdown output with zero hallucination.          |
|                                                             |
|   NO  --> Seamlessly executes built-in deterministic        |
|           analytics engine. Returns exact figures,          |
|           variance calculations, and contributing factors.  |
+-------------------------------------------------------------+
```

### Supported Query Scenarios
- **Salary Variance Explanation:** "Why did Rahul Sharma's salary change?" &rarr; Identifies differences between current and prior payslip, breaks down unpaid absences, contract wage changes, and statutory deductions.
- **Department Expenditure:** "Which department has the highest salary cost?" &rarr; Aggregates net payroll by department and ranks them with employee counts and averages.
- **Anomaly Reporting:** "Show active payroll warnings" &rarr; Returns real-time alerts (missing bank details for Neha Gupta, missing check-out for Vikas Mehta).
- **Leave Summaries:** "How many approved leaves does Rahul have?" &rarr; Queries `time_off_requests` and reports total approved days.

---

## 12. Project Structure

```
PeoplePay360-HR-Payroll/
├── package.json                   # Root workspace scripts (npm run dev)
├── package-lock.json
├── .gitignore
├── README.md                      # Comprehensive project documentation
├── API_REFERENCE.md               # Complete REST API endpoint reference
├── DEMO_GUIDE.md                  # Step-by-step evaluator walkthrough
├── PeoplePay360.postman_collection.json # Ready-to-import Postman suite
│
├── backend/
│   ├── package.json               # Backend dependencies and scripts
│   ├── .env.example               # Template for environment variables
│   ├── .env                       # Local environment variables (not committed)
│   ├── test/
│   │   └── testBackend.js         # Automated backend test suite (8 test suites)
│   └── src/
│       ├── server.js              # Express app bootstrap & route registration
│       ├── config/
│       │   └── db.js              # MySQL connection pool configuration
│       ├── middleware/
│       │   ├── auth.js            # JWT verification middleware
│       │   ├── rbac.js            # Role-based access control middleware
│       │   └── errorHandler.js    # Global error & 404 handlers
│       ├── routes/                # 16 REST API route modules
│       │   ├── authRoutes.js
│       │   ├── employeeRoutes.js
│       │   ├── contractRoutes.js
│       │   ├── scheduleRoutes.js
│       │   ├── attendanceRoutes.js
│       │   ├── workLocationRoutes.js
│       │   ├── timeOffRoutes.js
│       │   ├── salaryConfigRoutes.js
│       │   ├── payrunRoutes.js
│       │   ├── payslipRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── userRoutes.js
│       │   ├── aiRoutes.js
│       │   ├── notificationRoutes.js
│       │   ├── auditRoutes.js
│       │   └── departmentRoutes.js
│       ├── controllers/           # HTTP request handlers & validation
│       ├── services/              # Pure business logic services
│       │   ├── payrollEngine.js   # Rule evaluation & attendance pro-ration
│       │   ├── contractService.js # Date-range contract applicability
│       │   ├── locationService.js # Haversine distance & geofence validation
│       │   ├── anomalyService.js  # Pre-payrun compliance & variance scans
│       │   ├── pdfService.js      # PDFKit payslip vector renderer
│       │   ├── emailService.js    # Nodemailer email dispatch
│       │   └── aiService.js       # Live SQL context builder & AI handler
│       ├── utils/
│       │   └── auditLogger.js     # Structured audit logging utility
│       └── db/
│           ├── schema.sql         # 22 relational table definitions & indexes
│           ├── seed.sql           # Realistic demo dataset with 5 personas
│           └── initDb.js          # One-command database initializer script
│
├── frontend/
│   ├── package.json               # React, Vite, Tailwind CSS dependencies
│   ├── vite.config.js             # Vite development server configuration
│   ├── index.html                 # HTML5 entry point
│   └── src/
│       ├── main.jsx               # React DOM entry point
│       ├── App.jsx                # Route registry & ProtectedRoute definitions
│       ├── index.css              # Global styling & Tailwind directives
│       ├── context/
│       │   ├── AuthContext.jsx    # Session state & quick persona switcher
│       │   └── NotificationContext.jsx # Toast notifications & unread alerts
│       ├── layouts/
│       │   └── DashboardLayout.jsx # App sidebar, header, persona switcher, AI drawer
│       ├── components/
│       │   ├── AI/
│       │   │   └── AskPeoplePayAI.jsx # Interactive AI assistant drawer
│       │   ├── attendance/        # QuickCheckInWidget, ManualCorrectionModal
│       │   └── common/            # Loading spinners, badges, error boundary
│       ├── pages/
│       │   ├── Auth/              # Login, ForgotPassword, ResetPassword
│       │   ├── Dashboard/         # PayrollDashboard metrics & charts
│       │   ├── Employees/         # EmployeeList, EmployeeDetail
│       │   ├── Contracts/         # ContractList, creation modal
│       │   ├── Schedules/         # ScheduleList & day config
│       │   ├── Attendance/        # AttendanceList, AttendanceDetail
│       │   ├── TimeOff/           # TimeOffRequests, TimeOffTypes
│       │   ├── SalaryConfig/      # SalaryStructures & SalaryRules
│       │   ├── Payroll/           # PayrunList, PayrunDetail, Payslips
│       │   ├── SelfService/       # EmployeePortal (check-in, leaves, payslips)
│       │   └── Admin/             # UserManagement & role assignments
│       └── services/
│           └── api.js             # Centralized Axios client with interceptors
│
└── docs/
    └── API.md                     # REST API reference guide
```

---

## 13. Installation & Setup Guide

Follow these steps to set up and run PeoplePay360 locally on Windows, macOS, or Linux.

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **MySQL Server**: v8.0 or higher ([Download MySQL](https://dev.mysql.com/downloads/installer/))
- **npm**: v9.0.0 or higher (included with Node.js)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Jigar-Chaudhary-137/PeoplePay360-HR-Payroll.git
cd PeoplePay360-HR-Payroll
```

---

### Step 2: Install Dependencies
Install dependencies across root, backend, and frontend:
```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
# On Windows PowerShell
cp backend/.env.example backend/.env

# On Linux / macOS
cp backend/.env.example backend/.env
```

Open `backend/.env` in your editor and configure your MySQL credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=peoplepay360

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=peoplepay360_super_secret_jwt_key_hackathon_2026
JWT_EXPIRES_IN=7d

# Email Configuration (Optional - simulated in console if empty)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=payroll@peoplepay360.com

# AI Assistant (Optional - built-in offline engine runs if empty)
GEMINI_API_KEY=
```

---

### Step 4: Initialize the Database
Run the automated initialization script from the root directory:
```bash
npm --prefix backend run db:init
```
This single command will:
1. Connect to MySQL.
2. Create the `peoplepay360` database.
3. Execute `schema.sql` to build all 22 tables and foreign key constraints.
4. Execute `seed.sql` to populate realistic demo employees, schedules, contracts, rules, and prior payruns.

---

### Step 5: (Optional) Verify Backend Tests
Run the automated test suite to confirm the calculation engine, GPS verification, and PDF generator:
```bash
npm --prefix backend test
```
All 8 test suites should pass with `[PASS]`.

---

### Step 6: Start the Application
Run both backend and frontend concurrently using the root npm script:
```bash
npm run dev
```

Alternatively, you can run them in separate terminal windows:
```bash
# Terminal 1: Backend (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

---

### Step 7: Open the Application
Open your browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**

The backend health check is available at:
**[http://localhost:5000/api/health](http://localhost:5000/api/health)**

---

## 14. Environment Variables

| Variable | Required? | Default | Description |
| :--- | :---: | :--- | :--- |
| `DB_HOST` | **Yes** | `localhost` | MySQL host address |
| `DB_PORT` | **Yes** | `3306` | MySQL port |
| `DB_USER` | **Yes** | `root` | MySQL username |
| `DB_PASSWORD` | **Yes** | *(empty)* | MySQL user password |
| `DB_NAME` | **Yes** | `peoplepay360` | MySQL database name |
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production` / `test`) |
| `JWT_SECRET` | **Yes** | *(sample key)* | Secret key for signing JSON Web Tokens |
| `JWT_EXPIRES_IN`| No | `7d` | JWT session token validity duration |
| `SMTP_HOST` | No | `smtp.ethereal.email` | SMTP server host for sending payslip emails |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | *(empty)* | SMTP login username (if omitted, emails are simulated) |
| `SMTP_PASS` | No | *(empty)* | SMTP password |
| `EMAIL_FROM` | No | `payroll@peoplepay360.com` | From address on outgoing payslip emails |
| `GEMINI_API_KEY`| No | *(empty)* | Google Gemini API key (if omitted, offline SQL engine is used) |

---

## 15. Demo Accounts & Personas

The database comes pre-seeded with 5 distinct demo personas covering every level of organizational access.

> **Default Password for All Demo Accounts:** `Password@123`

| Name | Role | Email | Demo Focus & Highlights |
| :--- | :--- | :--- | :--- |
| **Vikram Verma** | **Admin** | `admin@peoplepay360.com` | Complete system access, user administration, system logs. |
| **Priya Patel** | **HR Manager** | `priya.patel@peoplepay360.com` | Employee creation, working schedules, leave approvals, attendance corrections. |
| **Amit Singh** | **HR Payroll Admin** | `amit.singh@peoplepay360.com` | Salary structure & rule designer, payrun execution, validation, mark paid. |
| **Neha Gupta** | **HR Payroll User** | `neha.gupta@peoplepay360.com` | Payrun processing and email dispatch. *(Also flagged in anomalies for missing bank info!)* |
| **Rahul Sharma** | **Employee** | `rahul.sharma@peoplepay360.com` | **Primary Demo Employee:** Has 2 sequential contracts (Jan–Jun ₹35k, Jul–Dec ₹45k), GPS check-in, leaves, payslips. |
| **Vikas Mehta** | **Employee (Ops)**| `vikas.mehta@peoplepay360.com` | Operations staff with remote status. *(Flagged in anomalies for missing check-out on Aug 7!)* |

### Quick Persona Switcher
When logged into the web application, click the **Persona Switcher** dropdown in the top navigation bar to switch between any of these roles in one click without re-typing passwords.

---

## 16. API Overview

The backend exposes 16 route groups. Detailed endpoint parameters, request bodies, and responses are documented in [API_REFERENCE.md](API_REFERENCE.md).

| Group | Base Path | Description | Access |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth` | Login, current user profile, role switcher, password reset | Public / Authenticated |
| **Employees** | `/api/employees` | Employee CRUD, contract history, attendance link | HR / Payroll / Admin |
| **Contracts** | `/api/contracts` | Contract CRUD, historical period resolution (`/applicable`) | HR / Payroll / Admin |
| **Schedules** | `/api/schedules` | Working schedules, day-by-day shift configs | HR Manager / Admin |
| **Work Locations** | `/api/work-locations` | Office geofence locations (lat/lon/radius) | HR Manager / Admin |
| **Attendance** | `/api/attendance` | Check-in, check-out, GPS verification, manual corrections | Employee (Self) / HR / Admin |
| **Time Off** | `/api/time-off` | Leave types, allocations, requests, approvals | All (Approvals: HR Manager) |
| **Salary Config** | `/api/salary-config`| Salary structures and sequenced calculation rules | HR Payroll Admin / Admin |
| **Payruns** | `/api/payruns` | Payrun wizard, eligible employees, compute, validate, pay | HR Payroll Admin / User |
| **Payslips** | `/api/payslips` | Payslip details, PDF generation, Nodemailer dispatch | All (Self or Payroll) |
| **Dashboard** | `/api/dashboard` | Aggregated payroll KPIs, department costs, monthly trends | HR / Payroll / Admin |
| **User Admin** | `/api/users` | User accounts and system role assignments | Admin |
| **AI Assistant** | `/api/ai` | Natural language queries with live database context | Authenticated |
| **Notifications** | `/api/notifications` | In-app user notifications and unread badges | Authenticated (Self) |
| **Audit Logs** | `/api/audit-logs` | Immutable system event log trail | Admin / HR Manager / Payroll |
| **Departments** | `/api/departments` | Department and job position directory | All Authenticated |

---

## 17. Evaluator Demo Guide

For a guided, step-by-step evaluation workflow with key demo scenarios, refer to [DEMO_GUIDE.md](DEMO_GUIDE.md).

### 5-Minute Fast Track Demo:
1. **Login:** Navigate to `http://localhost:5173/login`. Click "Quick Demo: HR Payroll Admin" or log in with `amit.singh@peoplepay360.com` / `Password@123`.
2. **Dashboard:** Observe the executive payroll KPIs, department cost breakdowns, and monthly salary trends.
3. **Contracts:** Go to **Contracts**. View Rahul Sharma (`EMP002`). Notice two contracts:
   - Contract A (Expired): ₹35,000/month (`2026-01-01` to `2026-06-30`)
   - Contract B (Running): ₹45,000/month (`2026-07-01` to `2026-12-31`)
4. **Payrun Creation:** Go to **Payrolls**. Click **Create Payrun**. Name it "August 2026 Payrun", select date range `2026-08-01` to `2026-08-31`. Notice Rahul is automatically bound to Contract B (₹45,000 wage).
5. **Compute & Anomalies:** Click **Compute Payroll**. The engine runs all sequential rules. View the **Anomalies** tab:
   - **Missing Bank Details:** Flagged for Neha Gupta.
   - **Missing Check-Out:** Flagged for Vikas Mehta.
6. **Payslip & PDF:** View Rahul Sharma's payslip. Check the line item breakdown: Basic (₹22,500), HRA (₹9,000), Transport (₹3,000), PF (₹1,800), Net (₹40,750). Click **Download PDF** to inspect the rendered vector PDF.
7. **Ask AI:** Click the **Ask AI** sparkle icon in the top header. Ask: *"Why did Rahul's salary change?"* Watch the system query live records and explain the wage increment and deduction formulas.
8. **GPS Check-In:** Use the Persona Switcher to become **Rahul Sharma (Employee)**. Go to **My Portal**, click **Check In**. The browser asks for location permission and verifies against Bangalore Tech Park HQ within 250 meters.

---

## 18. Troubleshooting

### 1. MySQL Connection Refused (`ECONNREFUSED 127.0.0.1:3306`)
- Ensure the MySQL service is running on your computer.
- On Windows: Open `services.msc` and check that `MySQL80` (or `MySQL`) is running.
- Verify `DB_PORT=3306` and `DB_HOST=localhost` in `backend/.env`.

### 2. Access Denied for User (`ER_ACCESS_DENIED_ERROR`)
- Open `backend/.env` and verify that `DB_USER` and `DB_PASSWORD` match your MySQL root (or custom user) password.
- Test connecting via command line: `mysql -u root -p`.

### 3. Port 5000 or 5173 Already in Use
- If port 5000 is occupied by another process:
  - Change `PORT=5001` in `backend/.env`.
  - Frontend will automatically route requests or you can set `VITE_API_URL=http://localhost:5001/api` in `frontend/.env`.
- On Windows, you can find and kill the process using port 5000:
  ```powershell
  netstat -ano | findstr :5000
  taskkill /PID <PID_NUMBER> /F
  ```

### 4. Database Initialization Fails (`ER_BAD_DB_ERROR`)
- The `initDb.js` script handles dropping and creating `peoplepay360` automatically.
- Ensure your MySQL user has `CREATE` and `DROP` privileges.

### 5. Email Dispatch Fails
- If `SMTP_USER` and `SMTP_PASS` are not configured in `backend/.env`, Nodemailer automatically falls back to **simulated dispatch mode**. The email content and recipient are logged cleanly to the backend terminal, and the database status updates to `email_sent = 1`.

---

## 19. Final Project Status

All core modules specified in the PeoplePay360 architecture are fully implemented and verified against the actual database and backend engine:

- [x] **Authentication & RBAC:** JWT tokens, 5 roles, route-level protection, password reset flow.
- [x] **Employee Profiles:** CRUD operations, department assignments, manager hierarchy, bank/PAN fields.
- [x] **Contract Engine:** Historical contract selection by pay period, date overlap protection, wage histories.
- [x] **Working Schedules:** Multi-day schedule configurations, daily break deduction, standard monthly day calculation.
- [x] **Attendance & GPS Geofencing:** Check-in/out, worked hours computation, Haversine distance geofencing, manual corrections.
- [x] **Time Off & Leaves:** Leave types, annual allocation balances, request workflow, manager approvals.
- [x] **Sequential Salary Rules:** Data-driven rule evaluation, mathematical formula parser, scope sharing.
- [x] **Payrun Lifecycle:** 4-stage state machine (`draft` &rarr; `computed` &rarr; `validated` &rarr; `paid`).
- [x] **Anomaly Detection:** Missing bank data, missing checkouts, >15% salary variance, duplicate payslips.
- [x] **Payslip Documents:** Tabular ledger, vector PDF generation via PDFKit, Nodemailer email dispatch.
- [x] **Executive Dashboard:** Live KPIs, department payroll distribution charts, monthly trends.
- [x] **Ask PeoplePay AI:** Live SQL context extraction, Gemini 1.5 Flash integration, offline fallback engine.
- [x] **Automated Tests:** 8 test suites in `backend/test/testBackend.js` passing.

---

## License

This project was built for academic evaluation and demonstration purposes. Distributed under the ISC License.
