# PeoplePay360 – Evaluator & Demo Guide

This guide is designed for evaluators, instructors, and hackathon judges to experience all features of the PeoplePay360 platform in a structured, 10-minute walkthrough.

---

## Quick Setup & Access

| Component | URL / Location | Credentials |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Any demo account below |
| **Backend API Health**| [http://localhost:5000/api/health](http://localhost:5000/api/health) | N/A |
| **All Demo Passwords**| `Password@123` | Applies to all accounts |

### Instant Role Switcher
You don't need to log out and log back in to test different user privileges. Use the **Persona Switcher** dropdown in the top navigation bar to switch between roles in one click:
- **Vikram Verma** &rarr; Admin
- **Priya Patel** &rarr; HR Manager
- **Amit Singh** &rarr; HR Payroll Admin
- **Neha Gupta** &rarr; HR Payroll User
- **Rahul Sharma** &rarr; Employee (Self-Service)

---

## 10-Minute Guided Evaluator Tour

### Step 1: Executive Payroll Dashboard
1. Log in or switch to **Amit Singh (HR Payroll Admin)**.
2. Navigate to **Payroll Dashboard** (`/dashboard`).
3. **What to Observe:**
   - **KPI Metric Cards:** Total Active Employees (6), Active Contracts (6), Last Payroll Cost (₹2,26,800), Pending Leaves (1), and Average Salary (₹46,167).
   - **Department Salary Distribution:** Visual breakdown comparing Engineering, Operations, Finance, and HR expenditure.
   - **Recent Payrun Summary:** Shows July 2026 completed payrun with paid status.

---

### Step 2: Employee Profiles & Data Model
1. In the sidebar, click **Employees** (`/employees`).
2. Search for **Rahul Sharma** (`EMP002`) and click his profile.
3. **What to Observe:**
   - Detailed profile showing Department (Engineering), Job Position (Senior Software Engineer), Manager (Vikram Verma), and Assigned Work Location (Bangalore Tech Park HQ).
   - Bank details (State Bank of India) and PAN number (`BLWPS9876K`).
   - Notice the tabs at the bottom: **Contracts**, **Attendance**, and **Payslips**, unifying all employee records in one place.

---

### Step 3: Contract History & Mid-Year Promotion
1. In Rahul's profile, click the **Contracts** tab (or go to **Contracts** in the sidebar).
2. **What to Observe:**
   - **Contract 1 (CON-2026-001A):** Valid `2026-01-01` to `2026-06-30`, Monthly Wage: **₹35,000.00**, Status: `Expired`.
   - **Contract 2 (CON-2026-001B):** Valid `2026-07-01` to `2026-12-31`, Monthly Wage: **₹45,000.00**, Status: `Running`.
3. **Key Technical Advantage:** The database preserves historical wage revisions. Past payruns for May or June are forever locked to ₹35,000, while payruns for August 2026 automatically select the ₹45,000 wage.

---

### Step 4: GPS-Verified Attendance Check-In
1. Switch to **Rahul Sharma (Employee)** via the top Persona Switcher. You are redirected to `/self-service`.
2. Notice the **Quick Check-In Widget** on the portal dashboard.
3. Click **Check In**:
   - The browser prompts for location permission (HTML5 Geolocation).
   - Coordinates are transmitted to the backend `locationService.js`.
   - The backend computes the Haversine distance against **Bangalore Tech Park HQ** (`12.9715987, 77.5945627`).
   - If within 250 meters, check-in succeeds with a green badge: `Location Verified`.
   - If tested from an off-site location, the check-in is rejected with an HTTP 403 error explaining the exact distance from the office.
4. Remote fallback: Switch to **Vikas Mehta (Employee)**. Because he is remote with no assigned office location, his check-in is permitted with `location_verified = false`.

---

### Step 5: Leave Management & Approvals
1. While logged in as **Rahul Sharma**, click **Time Off & Leaves** (`/time-off`).
2. View current allocations: **Paid Time Off (PTO): 18 days allocated, 2 days used, 16 days remaining**.
3. Submit a new leave request:
   - Type: Paid Time Off
   - Dates: `2026-08-14` to `2026-08-15` (2 days)
   - Reason: "Family vacation & long weekend"
4. Switch to **Priya Patel (HR Manager)**.
5. Go to **Time Off & Leaves** &rarr; locate Rahul's pending request &rarr; click **Approve**.
6. The request status updates to `Approved` and Rahul's used balance increments automatically.

---

### Step 6: Salary Structures & Sequenced Rules
1. Switch back to **Amit Singh (HR Payroll Admin)**.
2. In the sidebar, click **Salary Structures & Rules** (`/salary-config`).
3. Click **Regular Full-Time Structure**.
4. **What to Observe:**
   - 9 rules evaluated in numerical sequence:
     1. `BASIC` (50% of Wage &times; Attendance Factor)
     2. `HRA` (40% of Basic)
     3. `TRANS` (Fixed ₹3,000 &times; Attendance Factor)
     4. `SPECIAL` (Balancing allowance formula)
     5. `GROSS` (Basic + HRA + Transport + Special)
     6. `PF` (12% of Basic, capped at ₹15,000 statutory limit = ₹1,800 max)
     7. `PT` (Fixed ₹200)
     8. `TDS` (5% of Wage)
     9. `NET` (Gross &minus; Deductions)
   - Demonstrates that salary rules are data-driven database records rather than hardcoded scripts.

---

### Step 7: Payrun Creation & Execution
1. In the sidebar, click **Payrolls (Process)** (`/payruns`).
2. Click **Create Payrun**:
   - Name: `August 2026 Regular Payrun`
   - Structure: `Regular Full-Time Structure`
   - Period: `2026-08-01` to `2026-08-31`
   - Pay Date: `2026-08-31`
   - Select all eligible employees.
3. Click **Initialize Payrun**. The payrun is created in `draft` status.
4. Click **Compute Payroll**:
   - The engine iterates through each employee.
   - It fetches the active contract for August (Wage ₹45,000 for Rahul).
   - It evaluates payable days (20 worked days + 2 approved leave days = 22/22 days &rarr; factor 1.0).
   - It executes all 9 salary rules sequentially.
   - Status transitions from `draft` &rarr; `computed`.

---

### Step 8: Pre-Payrun Anomaly & Compliance Warnings
1. On the payrun detail screen, click the **Anomalies & Warnings** tab.
2. **What to Observe:**
   - **Warning 1 (Missing Bank Details):** Flagged for **Neha Gupta**. Her profile is missing bank account and IFSC details.
   - **Warning 2 (Missing Check-Out):** Flagged for **Vikas Mehta**. He has an open attendance punch from August 7th without a check-out time.
3. The payroll admin can review these issues before locking the payroll, preventing erroneous transfers.

---

### Step 9: Payrun Validation & Payslip PDF Inspection
1. Review the calculated payslips table on the payrun screen.
2. Click on **Rahul Sharma's** payslip:
   - Basic: ₹22,500.00
   - HRA: ₹9,000.00
   - Transport: ₹3,000.00
   - Special: ₹10,500.00
   - Gross: **₹45,000.00**
   - PF: ₹1,800.00 | PT: ₹200.00 | TDS: ₹2,250.00
   - Net Salary: **₹40,750.00**
3. Click **Download PDF**:
   - Opens the server-rendered vector PDF generated via `PDFKit`.
   - Clean corporate layout with company header, employee code, bank account, and itemized earnings/deductions ledger.
4. Click **Send Email**:
   - Dispatches the payslip to `rahul.sharma@peoplepay360.com` using Nodemailer. In development mode, the dispatch is simulated and logged to the backend console.
5. Click **Validate Payrun** &rarr; state changes to `validated` (locked from changes).
6. Click **Mark as Paid** &rarr; state changes to `paid`. Celebratory confetti displays on screen!

---

### Step 10: Ask PeoplePay AI Assistant
1. Click the **Sparkles / AI** button in the top navigation bar.
2. The **Ask PeoplePay AI** drawer slides open from the right.
3. Try these natural language queries:
   - **Query 1:** *"Why did Rahul's salary change?"*
     - The assistant checks live database records, sees Contract B took effect with wage ₹45,000, notes the 2 approved leave days, and explains the net pay change from ₹38,750 to ₹40,750.
   - **Query 2:** *"Which department has the highest salary cost?"*
     - The assistant queries the database and reports Engineering as the highest department cost.
   - **Query 3:** *"Show active payroll anomalies"*
     - The assistant lists the warnings for Neha Gupta (missing bank info) and Vikas Mehta (missing checkout).

---

## 6 High-Impact Demo Scenarios Summary

| # | Scenario | How to Verify in App | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | **Historical Contract Selection** | Check Rahul's wage in August payrun vs Contract list | Uses Contract B (₹45,000) for August, while past July payrun remains tied to Contract A (₹35,000). |
| **2** | **GPS Attendance Verification** | Click Check In from Rahul's portal | Coordinates verified against Bangalore Tech Park HQ (250m radius). Offsite attempts rejected with HTTP 403. |
| **3** | **Leave Impact on Salary** | Rahul's August payslip with 2 approved PTO days | 20 worked + 2 approved leave = 22 scheduled days. Full salary paid without penalty. |
| **4** | **Sequential Formula & PF Cap** | Inspect Rahul's PF deduction in payslip lines | Basic is ₹22,500. Statutory cap limits PF to 12% of ₹15,000 = **₹1,800.00** (not 12% of ₹22,500 = ₹2,700). |
| **5** | **Pre-Payrun Anomaly Detection** | View Anomalies tab on August payrun | Identifies Neha Gupta (missing bank info) and Vikas Mehta (missing checkout). |
| **6** | **Live AI Database Context** | Ask: "Why did Rahul's salary change?" | Analyzes live MySQL records and explains wage change and deduction components. |
