# PeoplePay360 – REST API Reference Guide

This document provides a comprehensive technical reference for all REST API endpoints implemented in the PeoplePay360 backend.

---

## General Conventions

- **Base URL:** `http://localhost:5000/api`
- **Content Type:** `application/json` (except PDF binary downloads: `application/pdf`)
- **Authentication:** All protected endpoints require a valid JSON Web Token passed in the HTTP Authorization header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Standard JSON Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional human-readable confirmation message"
  }
  ```
- **Standard Error Envelope:**
  ```json
  {
    "success": false,
    "message": "Human-readable error description"
  }
  ```

---

## 1. Authentication & Session (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user with email and password. Returns a signed JWT and user session metadata.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "amit.singh@peoplepay360.com",
    "password": "Password@123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 4,
        "email": "amit.singh@peoplepay360.com",
        "role": "HR Payroll Admin",
        "employee_id": 4,
        "first_name": "Amit",
        "last_name": "Singh",
        "department_name": "Finance & Payroll",
        "job_title": "Lead Payroll Specialist",
        "avatar_url": "https://images.unsplash.com/..."
      }
    }
  }
  ```

### `GET /api/auth/me`
Fetches the currently authenticated user's profile and active permissions.
- **Access:** Authenticated (Any role)
- **Success Response (200 OK):** Current user object with department, role, and employee link.

### `POST /api/auth/switch-role`
Quickly switches the active persona for live demonstrations without requiring password re-entry.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "role": "HR Manager"
  }
  ```
- **Success Response (200 OK):** New signed JWT and refreshed user object for that persona.

### `POST /api/auth/forgot-password`
Initiates a password reset flow. Generates a secure random token and sends a reset link.
- **Access:** Public
- **Request Body:** `{ "email": "rahul.sharma@peoplepay360.com" }`
- **Success Response (200 OK):** `{ "success": true, "message": "Password reset instructions sent to your email." }`

### `POST /api/auth/reset-password`
Resets a user's password using the token received in email.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "password": "NewSecurePassword@123"
  }
  ```
- **Success Response (200 OK):** `{ "success": true, "message": "Password reset successfully. You can now log in." }`

---

## 2. Employee Management (`/api/employees`)

### `GET /api/employees`
Lists employees with optional filtering.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`
- **Query Parameters:**
  - `search`: Filter by name, email, or employee code
  - `department_id`: Filter by department ID
  - `status`: Filter by status (`Active`, `Inactive`, `Terminated`)
- **Success Response (200 OK):** Array of employee objects with department and job title joins.

### `GET /api/employees/:id`
Retrieves full profile details for a specific employee.
- **Access:** Authenticated (Managers/Admins or Self)

### `POST /api/employees`
Creates a new employee record.
- **Access:** `Admin`, `HR Manager`
- **Request Body:**
  ```json
  {
    "employee_code": "EMP007",
    "first_name": "Suresh",
    "last_name": "Raina",
    "email": "suresh.raina@peoplepay360.com",
    "phone": "+91 98999 11223",
    "department_id": 1,
    "job_position_id": 2,
    "manager_id": 1,
    "working_schedule_id": 1,
    "work_location_id": 1,
    "bank_name": "HDFC Bank",
    "bank_account_no": "50100987654321",
    "bank_ifsc": "HDFC0000128",
    "pan_no": "ABCDE5678G"
  }
  ```

### `PUT /api/employees/:id`
Updates an existing employee's details.
- **Access:** `Admin`, `HR Manager`

### `DELETE /api/employees/:id`
Deletes an employee record (fails with 400 if active payroll or contract records depend on them).
- **Access:** `Admin`

### `GET /api/employees/:id/contracts`
Returns the complete historical contract ledger for an employee.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`, or Self

### `GET /api/employees/:id/payslips`
Returns all past payslips for an employee.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`, or Self

---

## 3. Contracts & Wage History (`/api/contracts`)

### `GET /api/contracts`
Lists employment contracts across the organization.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`
- **Query Parameters:** `employee_id`, `status` (`Draft`, `Running`, `Expired`, `Cancelled`)

### `GET /api/contracts/applicable`
Resolves which contract was legally active for an employee during a given pay period.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`
- **Query Parameters:**
  - `employee_id`: e.g. `2`
  - `period_start`: e.g. `2026-08-01`
  - `period_end`: e.g. `2026-08-31`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 2,
      "contract_code": "CON-2026-001B",
      "employee_id": 2,
      "wage": "45000.00",
      "start_date": "2026-07-01",
      "end_date": "2026-12-31",
      "salary_structure_id": 1,
      "salary_structure_name": "Regular Full-Time Structure",
      "status": "Running"
    }
  }
  ```

### `POST /api/contracts`
Creates a new contract. Prevents overlapping date ranges for the same employee.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`
- **Request Body:**
  ```json
  {
    "contract_code": "CON-2026-007",
    "employee_id": 2,
    "start_date": "2027-01-01",
    "end_date": null,
    "wage": 55000.00,
    "working_schedule_id": 1,
    "salary_structure_id": 1,
    "status": "Draft",
    "notes": "Annual merit increment"
  }
  ```

### `PUT /api/contracts/:id`
Updates an existing contract.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`

---

## 4. Working Schedules (`/api/schedules`)

### `GET /api/schedules`
Lists all working schedules with configured shift days and break durations.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`

### `POST /api/schedules`
Creates a new working schedule.
- **Access:** `Admin`, `HR Manager`
- **Request Body:**
  ```json
  {
    "name": "Shift B (4-Day Condensed)",
    "days_per_week": 4,
    "hours_per_week": 40.00,
    "timezone": "Asia/Kolkata",
    "days": [
      { "day_of_week": "Monday", "start_time": "08:00:00", "end_time": "19:00:00", "break_hours": 1.00 },
      { "day_of_week": "Tuesday", "start_time": "08:00:00", "end_time": "19:00:00", "break_hours": 1.00 },
      { "day_of_week": "Wednesday", "start_time": "08:00:00", "end_time": "19:00:00", "break_hours": 1.00 },
      { "day_of_week": "Thursday", "start_time": "08:00:00", "end_time": "19:00:00", "break_hours": 1.00 }
    ]
  }
  ```

---

## 5. Work Locations & Geofences (`/api/work-locations`)

### `GET /api/work-locations`
Lists configured office locations, latitude/longitude coordinates, and geofence radii.
- **Access:** Authenticated (Any role)
- **Response Example:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Bangalore Tech Park HQ",
        "address": "Prestige Tech Cloud, Hebbal, Bangalore, Karnataka 560092",
        "latitude": 12.9715987,
        "longitude": 77.5945627,
        "radius_meters": 250,
        "status": "Active"
      }
    ]
  }
  ```

### `POST /api/work-locations`
Registers a new work location and geofence boundary.
- **Access:** `Admin`, `HR Manager`

---

## 6. Attendance & GPS Verification (`/api/attendance`)

### `POST /api/attendance/check-in`
Records an employee check-in with GPS coordinate verification.
- **Access:** Authenticated (`Employee` or Self)
- **Request Body:**
  ```json
  {
    "latitude": 12.9716200,
    "longitude": 77.5945900,
    "accuracy": 15.0,
    "notes": "Office desk check-in"
  }
  ```
- **Success Response (200 OK - Inside Radius):**
  ```json
  {
    "success": true,
    "message": "Check-in recorded successfully. Location verified (18 meters from Bangalore Tech Park HQ).",
    "data": {
      "attendance_id": 142,
      "check_in": "09:02:15",
      "location_verified": true,
      "distance_meters": 18.2
    }
  }
  ```
- **Rejection Response (403 Forbidden - Outside Radius):**
  ```json
  {
    "success": false,
    "message": "Check-in rejected: You are 17,155 meters away from your assigned work location \"Bangalore Tech Park HQ\". Maximum permitted radius is 250 meters."
  }
  ```

### `POST /api/attendance/check-out`
Records an employee check-out for the day and calculates total worked hours.
- **Access:** Authenticated (`Employee` or Self)
- **Request Body:** `{ "notes": "Day ended" }`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Check-out recorded successfully",
    "data": {
      "check_out": "18:05:00",
      "worked_hours": 8.05
    }
  }
  ```

### `POST /api/attendance/manual`
Creates or corrects an attendance punch manually with an administrative reason.
- **Access:** `Admin`, `HR Manager`
- **Request Body:**
  ```json
  {
    "employee_id": 6,
    "date": "2026-08-07",
    "check_in": "09:15:00",
    "check_out": "18:15:00",
    "break_hours": 1.00,
    "status": "Present",
    "notes": "Manual punch correction approved by HR"
  }
  ```

---

## 7. Time Off & Leaves (`/api/time-off`)

### `GET /api/time-off/types`
Lists all active time-off types (Paid Time Off, Sick Leave, Compensatory Off).
- **Access:** Authenticated (Any role)

### `GET /api/time-off/allocations`
Retrieves annual leave quota balances for an employee.
- **Access:** Authenticated (Self or Managers/Admins)
- **Query Parameters:** `employee_id`, `year` (e.g. `2026`)

### `POST /api/time-off/requests`
Submits a leave request.
- **Access:** Authenticated (`Employee` or Self)
- **Request Body:**
  ```json
  {
    "time_off_type_id": 1,
    "start_date": "2026-08-14",
    "end_date": "2026-08-15",
    "days_requested": 2.0,
    "reason": "Family vacation & long weekend"
  }
  ```

### `PUT /api/time-off/requests/:id/approve`
Approves a pending leave request and updates the employee's used balance.
- **Access:** `Admin`, `HR Manager`

### `PUT /api/time-off/requests/:id/reject`
Rejects a leave request with a recorded reason.
- **Access:** `Admin`, `HR Manager`
- **Request Body:** `{ "rejection_reason": "Team coverage required on project release day" }`

---

## 8. Salary Structures & Rules (`/api/salary-config`)

### `GET /api/salary-config/structures`
Lists all salary structures with their associated rules.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`

### `GET /api/salary-config/rules`
Lists rules ordered by execution sequence (`sequence ASC`).
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`

### `POST /api/salary-config/rules`
Creates a new salary rule.
- **Access:** `Admin`, `HR Payroll Admin`
- **Request Body:**
  ```json
  {
    "name": "Internet Allowance",
    "code": "INET",
    "category": "Allowance",
    "sequence": 4,
    "calc_type": "fixed",
    "rate_or_amount": 1500.00,
    "formula": "FIXED * ATTENDANCE_FACTOR",
    "is_active": true
  }
  ```

---

## 9. Payruns & Payroll Engine (`/api/payruns`)

### `GET /api/payruns`
Lists payruns across the organization with aggregated gross and net totals.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`

### `POST /api/payruns`
Initializes a new payrun in `draft` status.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`
- **Request Body:**
  ```json
  {
    "name": "Regular Payrun - August 2026",
    "salary_structure_id": 1,
    "period_start": "2026-08-01",
    "period_end": "2026-08-31",
    "pay_date": "2026-08-31",
    "employee_ids": [1, 2, 3, 4, 5, 6]
  }
  ```

### `POST /api/payruns/:id/compute`
Executes the sequential payroll engine for all employees attached to the payrun. Generates payslips and line items in MySQL transactions. Moves state from `draft` &rarr; `computed`.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payroll computation completed successfully for 6 employee(s)",
    "data": {
      "payrun_id": 2,
      "status": "computed",
      "total_gross": "278500.00",
      "total_deductions": "47950.00",
      "total_net": "230550.00",
      "computed_slips": 6
    }
  }
  ```

### `GET /api/payruns/:id/anomalies`
Runs automated pre-flight checks and returns active compliance and variance warnings.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "anomaliesCount": 2,
      "anomalies": [
        {
          "type": "MISSING_BANK_INFO",
          "severity": "WARNING",
          "employeeId": 5,
          "employeeName": "Neha Gupta",
          "reason": "Missing bank account number or IFSC code."
        },
        {
          "type": "MISSING_CHECKOUT",
          "severity": "WARNING",
          "employeeId": 6,
          "employeeName": "Vikas Mehta",
          "reason": "Has 1 attendance record(s) with missing check-out timestamp."
        }
      ]
    }
  }
  ```

### `POST /api/payruns/:id/validate`
Validates and locks the payrun. Prevents further recalculation. Moves state from `computed` &rarr; `validated`.
- **Access:** `Admin`, `HR Payroll Admin`

### `POST /api/payruns/:id/pay`
Marks the payrun as paid and sets payment timestamps on all associated payslips. Moves state from `validated` &rarr; `paid`.
- **Access:** `Admin`, `HR Payroll Admin`

---

## 10. Payslips, PDF & Email (`/api/payslips`)

### `GET /api/payslips/:id`
Returns full details for a payslip, including employee info and all line items.
- **Access:** Authenticated (`Admin`, `HR Payroll Admin`, `HR Payroll User`, or Self)

### `GET /api/payslips/:id/pdf`
Streams a server-rendered vector PDF payslip.
- **Access:** Authenticated (`Admin`, `HR Payroll Admin`, `HR Payroll User`, or Self)
- **Response:** Binary stream with `Content-Type: application/pdf`.

### `POST /api/payslips/:id/send-email`
Dispatches the PDF payslip to the employee's email address via Nodemailer.
- **Access:** `Admin`, `HR Payroll Admin`, `HR Payroll User`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payslip emailed successfully to rahul.sharma@peoplepay360.com"
  }
  ```

---

## 11. Dashboard & Analytics (`/api/dashboard`)

### `GET /api/dashboard/stats`
Aggregated organization KPIs.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalEmployees": 6,
      "activeContracts": 6,
      "lastPayrollCost": 226800.0,
      "pendingLeaves": 1,
      "averageSalary": 46166.67
    }
  }
  ```

### `GET /api/dashboard/department-costs`
Returns payroll totals grouped by department.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`

---

## 12. User Administration (`/api/users`)

### `GET /api/users`
Lists system user logins, assigned roles, and linked employee records.
- **Access:** `Admin`

### `POST /api/users`
Creates a new login account and assigns a system role.
- **Access:** `Admin`
- **Request Body:**
  ```json
  {
    "email": "finance.lead@peoplepay360.com",
    "password": "TemporaryPassword@123",
    "role_id": 3,
    "employee_id": 4
  }
  ```

---

## 13. Ask PeoplePay AI Assistant (`/api/ai`)

### `POST /api/ai/ask`
Submits a natural language query regarding live HR, payroll, leave, or anomaly records.
- **Access:** Authenticated (Any role)
- **Request Body:**
  ```json
  {
    "question": "Why did Rahul's salary decrease this month?"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "answer": "Rahul Sharma's net salary increased by ₹2,000 (from ₹38,750 in 2026-07-01 to ₹40,750 in 2026-08-01).\n\nKey Contributing Factors:\n• Promoted to Contract B effective July 1, 2026 (Wage: ₹45,000/mo).\n• Utilized 2 approved leave day(s).\n• Gross Salary: ₹45,000.\n• Deductions: PF ₹1,800, PT ₹200, TDS ₹2,250.",
      "source": "gemini-llm",
      "contextUsed": ["targetEmployee", "contracts", "payslips", "approvedLeaves"]
    }
  }
  ```

---

## 14. Notifications (`/api/notifications`)

### `GET /api/notifications`
Retrieves in-app notifications for the logged-in user.
- **Access:** Authenticated (Self)

### `PUT /api/notifications/:id/read`
Marks a specific notification as read.
- **Access:** Authenticated (Self)

### `PUT /api/notifications/read-all`
Marks all notifications for the logged-in user as read.
- **Access:** Authenticated (Self)

---

## 15. Audit Logs (`/api/audit-logs`)

### `GET /api/audit-logs`
Returns the immutable system audit trail with timestamps, actors, and JSON details.
- **Access:** `Admin`, `HR Manager`, `HR Payroll Admin`
- **Query Parameters:** `limit` (default 50), `offset` (default 0), `action`
