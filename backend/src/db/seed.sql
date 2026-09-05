-- ============================================================
-- PEOPLEPAY360 SEED DATA
-- Realistic demo data with 5 roles, employees, 2 historical contracts,
-- schedules, attendance, leaves, structures, rules, and warning cases
-- ============================================================

USE peoplepay360;

-- 1. Seed Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'Admin', 'Full administrative access across all modules and user management'),
(2, 'HR Manager', 'Manages employees, contracts, schedules, attendance, and time-off approvals'),
(3, 'HR Payroll Admin', 'Comprehensive payroll configuration, payruns, payslips, and salary rules'),
(4, 'HR Payroll User', 'Processes payruns, generates payslips, and views payroll records'),
(5, 'Employee', 'Self-service portal for profile, attendance check-in, leave requests, and payslips')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Seed Departments
INSERT INTO departments (id, name, code, manager_id) VALUES
(1, 'Engineering', 'ENG', NULL),
(2, 'Human Resources', 'HR', NULL),
(3, 'Finance & Payroll', 'FIN', NULL),
(4, 'Operations', 'OPS', NULL),
(5, 'Sales & Marketing', 'SALES', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Seed Job Positions
INSERT INTO job_positions (id, title, department_id) VALUES
(1, 'Senior Software Engineer', 1),
(2, 'Full Stack Developer', 1),
(3, 'QA Automation Engineer', 1),
(4, 'HR Director', 2),
(5, 'HR Operations Specialist', 2),
(6, 'Lead Payroll Specialist', 3),
(7, 'Financial Analyst', 3),
(8, 'Operations Manager', 4),
(9, 'Senior Account Executive', 5)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 4. Seed Working Schedules
INSERT INTO working_schedules (id, name, days_per_week, hours_per_week, timezone, is_active) VALUES
(1, 'Standard 5-Day (40h/week)', 5, 40.00, 'Asia/Kolkata', TRUE),
(2, 'Flexible 5-Day (40h/week)', 5, 40.00, 'Asia/Kolkata', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Seed Schedule Days for Schedule 1 (Mon-Fri 09:00 - 18:00 with 1h break = 8h/day)
INSERT INTO schedule_days (schedule_id, day_of_week, start_time, end_time, break_hours, calculated_hours) VALUES
(1, 'Monday', '09:00:00', '18:00:00', 1.00, 8.00),
(1, 'Tuesday', '09:00:00', '18:00:00', 1.00, 8.00),
(1, 'Wednesday', '09:00:00', '18:00:00', 1.00, 8.00),
(1, 'Thursday', '09:00:00', '18:00:00', 1.00, 8.00),
(1, 'Friday', '09:00:00', '18:00:00', 1.00, 8.00)
ON DUPLICATE KEY UPDATE calculated_hours = VALUES(calculated_hours);

-- 6. Seed Salary Structures
INSERT INTO salary_structures (id, name, description, is_active) VALUES
(1, 'Regular Full-Time Structure', 'Standard salary structure with Basic (50%), HRA (40%), Transport, PF (12%), PT and TDS', TRUE),
(2, 'Executive Leadership Structure', 'Senior executive structure with performance allowances and managerial deductions', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. Seed Salary Rules (Data-driven, sequence ordered)
INSERT INTO salary_rules (id, name, code, category, sequence, calc_type, rate_or_amount, formula, is_active) VALUES
(1, 'Basic Salary', 'BASIC', 'Basic', 1, 'percent_wage', 0.50, 'WAGE * 0.50 * ATTENDANCE_FACTOR', TRUE),
(2, 'House Rent Allowance', 'HRA', 'Allowance', 2, 'percent_basic', 0.40, 'BASIC * 0.40', TRUE),
(3, 'Transport Allowance', 'TRANS', 'Allowance', 3, 'fixed', 3000.00, 'FIXED * ATTENDANCE_FACTOR', TRUE),
(4, 'Special Allowance', 'SPECIAL', 'Allowance', 4, 'formula', 0.00, '(WAGE * ATTENDANCE_FACTOR) - BASIC - HRA - TRANS', TRUE),
(5, 'Gross Salary', 'GROSS', 'Gross', 5, 'formula', 0.00, 'BASIC + HRA + TRANS + SPECIAL', TRUE),
(6, 'Provident Fund (PF)', 'PF', 'Deduction', 6, 'percent_basic', 0.12, 'LEAST(BASIC, 15000) * 0.12', TRUE),
(7, 'Professional Tax (PT)', 'PT', 'Deduction', 7, 'fixed', 200.00, '200.00', TRUE),
(8, 'TDS / Income Tax', 'TDS', 'Deduction', 8, 'percent_wage', 0.05, 'WAGE * 0.05', TRUE),
(9, 'Net Salary', 'NET', 'Net', 9, 'formula', 0.00, 'GROSS - (PF + PT + TDS)', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Associate Rules with Salary Structure 1
INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9)
ON DUPLICATE KEY UPDATE salary_structure_id = VALUES(salary_structure_id);

-- 8. Seed Time Off Types
INSERT INTO time_off_types (id, name, unit, requires_allocation, requires_approval, is_active) VALUES
(1, 'Paid Time Off', 'Days', TRUE, TRUE, TRUE),
(2, 'Sick Leave', 'Days', TRUE, TRUE, TRUE),
(3, 'Compensatory Off', 'Days', TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8b. Seed Work Locations
INSERT INTO work_locations (id, name, address, latitude, longitude, radius_meters, status) VALUES
(1, 'Bangalore Tech Park HQ', 'Prestige Tech Cloud, Hebbal, Bangalore, Karnataka 560092', 12.9715987, 77.5945627, 250.00, 'Active'),
(2, 'Mumbai BKC Office', 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051', 19.0657100, 72.8683700, 200.00, 'Active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 9. Seed Employees
-- Rahul Sharma is assigned to Bangalore Tech Park HQ (work_location_id = 1)
-- Vikas Mehta has NO work location configured (work_location_id = NULL) to verify fallback behavior!
-- Neha Gupta has NULL bank details for testing warning detection!
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, work_location_id, employment_status, work_location, company, bank_name, bank_account_no, bank_ifsc, pan_no, avatar_url) VALUES
(1, 'EMP001', 'Vikram', 'Verma', 'admin@peoplepay360.com', '+91 98765 43210', 1, 1, NULL, 1, 1, 'Active', 'Bangalore HQ', 'PeoplePay360 Inc', 'HDFC Bank', '50100234567890', 'HDFC0001234', 'ABCDE1234F', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(2, 'EMP002', 'Rahul', 'Sharma', 'rahul.sharma@peoplepay360.com', '+91 98111 22233', 1, 1, 1, 1, 1, 'Active', 'Bangalore HQ', 'PeoplePay360 Inc', 'State Bank of India', '30245678901234', 'SBIN0004567', 'BLWPS9876K', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(3, 'EMP003', 'Priya', 'Patel', 'priya.patel@peoplepay360.com', '+91 98222 33344', 2, 4, 1, 1, 2, 'Active', 'Mumbai Office', 'PeoplePay360 Inc', 'ICICI Bank', '001205012345', 'ICIC0000012', 'CPRPP1122M', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(4, 'EMP004', 'Amit', 'Singh', 'amit.singh@peoplepay360.com', '+91 98333 44455', 3, 6, 1, 1, 1, 'Active', 'Delhi Office', 'PeoplePay360 Inc', 'Axis Bank', '915010034567890', 'UTIB0000915', 'DKLPS3344N', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
(5, 'EMP005', 'Neha', 'Gupta', 'neha.gupta@peoplepay360.com', '+91 98444 55566', 1, 3, 2, 1, 1, 'Active', 'Bangalore HQ', 'PeoplePay360 Inc', NULL, NULL, NULL, 'EKFPG5566P', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
(6, 'EMP006', 'Vikas', 'Mehta', 'vikas.mehta@peoplepay360.com', '+91 98555 66677', 4, 8, 1, 1, NULL, 'Active', 'Pune Plant', 'PeoplePay360 Inc', 'Kotak Mahindra Bank', '6211234567', 'KKBK0000621', 'FLMPM7788Q', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- Update Department Managers
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 3 WHERE id = 2;
UPDATE departments SET manager_id = 4 WHERE id = 3;
UPDATE departments SET manager_id = 6 WHERE id = 4;

-- 10. Seed Users (password is 'Password@123' for all)
-- Password hash: $2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu
INSERT INTO users (id, employee_id, email, password_hash, role_id, status) VALUES
(1, 1, 'admin@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 1, 'Active'),
(2, 2, 'rahul.sharma@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 5, 'Active'),
(3, 3, 'priya.patel@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 2, 'Active'),
(4, 4, 'amit.singh@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 3, 'Active'),
(5, 5, 'neha.gupta@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 4, 'Active'),
(6, 6, 'vikas.mehta@peoplepay360.com', '$2a$10$mAAEik/4JDVhgGTuSrIt6eqtQsinPnEIEu3eX3DVL.d/VtAKy9Rhu', 5, 'Active')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- 11. Seed Contracts
-- Crucial hackathon test case:
-- Rahul Sharma:
-- Contract A (Jan 1, 2026 to Jun 30, 2026): Wage ₹35,000 (Expired)
-- Contract B (Jul 1, 2026 to Dec 31, 2026): Wage ₹45,000 (Running) -> MUST BE USED FOR AUGUST 2026!
INSERT INTO contracts (id, contract_code, employee_id, start_date, end_date, department_id, job_position_id, wage, working_schedule_id, salary_structure_id, status, notes) VALUES
(1, 'CON-2026-001A', 2, '2026-01-01', '2026-06-30', 1, 1, 35000.00, 1, 1, 'Expired', 'H1 2026 Contract - ₹35,000/mo'),
(2, 'CON-2026-001B', 2, '2026-07-01', '2026-12-31', 1, 1, 45000.00, 1, 1, 'Running', 'H2 2026 Promotion Contract - ₹45,000/mo - Applicable for August 2026'),
(3, 'CON-2026-002', 1, '2026-01-01', NULL, 1, 1, 85000.00, 1, 1, 'Running', 'Admin Ongoing Contract'),
(4, 'CON-2026-003', 3, '2026-01-01', NULL, 2, 4, 60000.00, 1, 1, 'Running', 'HR Director Ongoing Contract'),
(5, 'CON-2026-004', 4, '2026-01-01', NULL, 3, 6, 50000.00, 1, 1, 'Running', 'Payroll Specialist Ongoing Contract'),
(6, 'CON-2026-005', 5, '2026-01-01', NULL, 1, 3, 38000.00, 1, 1, 'Running', 'QA Engineer Contract'),
(7, 'CON-2026-006', 6, '2026-01-01', NULL, 4, 8, 42000.00, 1, 1, 'Running', 'Operations Contract')
ON DUPLICATE KEY UPDATE wage = VALUES(wage);

-- 12. Seed Time Off Allocations (Year 2026)
INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_days, used_days, year) VALUES
(2, 1, 18.00, 2.00, 2026), -- Rahul Sharma: 18 PTO allocated, 2 used
(2, 2, 10.00, 0.00, 2026),
(1, 1, 24.00, 0.00, 2026),
(3, 1, 20.00, 1.00, 2026),
(4, 1, 18.00, 0.00, 2026),
(5, 1, 18.00, 3.00, 2026),
(6, 1, 18.00, 0.00, 2026)
ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days);

-- 13. Seed Time Off Requests
INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, days_requested, reason, status, approver_id, approved_at) VALUES
(1, 2, 1, '2026-08-14', '2026-08-15', 2.00, 'Family vacation & long weekend', 'Approved', 3, '2026-08-10 14:30:00'),
(2, 5, 1, '2026-08-20', '2026-08-22', 3.00, 'Personal work', 'Approved', 3, '2026-08-18 11:00:00'),
(3, 6, 2, '2026-09-01', '2026-09-02', 2.00, 'Fever recovery', 'Pending', NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 14. Seed Attendance Records for August 2026 (Working sample days)
INSERT INTO attendance (employee_id, date, check_in, check_out, break_hours, worked_hours, status, notes) VALUES
(2, '2026-08-03', '09:02:00', '18:05:00', 1.00, 8.05, 'Present', 'On time'),
(2, '2026-08-04', '08:58:00', '18:00:00', 1.00, 8.03, 'Present', 'On time'),
(2, '2026-08-05', '09:10:00', '18:15:00', 1.00, 8.08, 'Present', 'Normal day'),
(2, '2026-08-06', '09:00:00', '18:00:00', 1.00, 8.00, 'Present', 'Normal day'),
(2, '2026-08-07', '09:05:00', '18:00:00', 1.00, 7.92, 'Present', 'Normal day'),
-- Anomaly demo record: Vikas Mehta missing check-out on 2026-08-07!
(6, '2026-08-07', '09:15:00', NULL, 1.00, 0.00, 'Present', 'Missing check-out')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 15. Seed Prior Payrun for July 2026 (Demonstrating salary trend and anomaly baseline)
INSERT INTO payruns (id, name, salary_structure_id, period_start, period_end, pay_date, status, total_gross, total_deductions, total_net, created_by, validated_by, paid_at) VALUES
(1, 'Regular Payrun - July 2026', 1, '2026-07-01', '2026-07-31', '2026-07-31', 'paid', 275000.00, 48200.00, 226800.00, 1, 1, '2026-07-31 18:00:00')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- July Payslip for Rahul Sharma (Contract B: Wage ₹45,000 -> Net ₹38,750)
INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, scheduled_days, worked_days, absent_days, leave_days, gross_salary, total_deductions, net_salary, status, email_sent, email_sent_at) VALUES
(1, 1, 2, 2, 1, '2026-07-01', '2026-07-31', 22, 22.00, 0.00, 0.00, 45000.00, 4250.00, 40750.00, 'paid', TRUE, '2026-07-31 18:30:00')
ON DUPLICATE KEY UPDATE net_salary = VALUES(net_salary);

-- July Payslip Lines for Rahul Sharma
INSERT INTO payslip_lines (payslip_id, rule_id, code, name, category, sequence, amount) VALUES
(1, 1, 'BASIC', 'Basic Salary', 'Basic', 1, 22500.00),
(1, 2, 'HRA', 'House Rent Allowance', 'Allowance', 2, 9000.00),
(1, 3, 'TRANS', 'Transport Allowance', 'Allowance', 3, 3000.00),
(1, 4, 'SPECIAL', 'Special Allowance', 'Allowance', 4, 10500.00),
(1, 5, 'GROSS', 'Gross Salary', 'Gross', 5, 45000.00),
(1, 6, 'PF', 'Provident Fund (PF)', 'Deduction', 6, 1800.00),
(1, 7, 'PT', 'Professional Tax (PT)', 'Deduction', 7, 200.00),
(1, 8, 'TDS', 'TDS / Income Tax', 'Deduction', 8, 2250.00),
(1, 9, 'NET', 'Net Salary', 'Net', 9, 40750.00)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- Seed Notification
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
(1, 2, 'July 2026 Payslip Ready', 'Your July 2026 payslip of ₹40,750 has been processed and paid.', 'success', FALSE),
(2, 4, 'Payroll Warning', 'Employee Neha Gupta has missing bank details. Please review before August payroll.', 'warning', FALSE)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Seed Audit Log
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'SYSTEM_INITIALIZED', 'system', 1, '{"version": "1.0.0", "message": "PeoplePay360 database initialized with base seed data"}'),
(1, 'PAYRUN_PAID', 'payrun', 1, '{"payrun_id": 1, "month": "July 2026", "total_net": 226800.00}');
