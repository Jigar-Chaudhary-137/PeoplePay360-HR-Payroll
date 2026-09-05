<<<<<<< HEAD
-- PeoplePay360 Database Schema (MySQL)

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

=======
-- ============================================================
-- PEOPLEPAY360 DATABASE SCHEMA (MySQL 8)
-- Normalized relational design with strict foreign keys & constraints
-- ============================================================

CREATE DATABASE IF NOT EXISTS peoplepay360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE peoplepay360;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Departments
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  manager_id INT NULL,
<<<<<<< HEAD
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

=======
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Job Positions
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS job_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
<<<<<<< HEAD
  grade VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

=======
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Working Schedules
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS working_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  days_per_week INT NOT NULL DEFAULT 5,
<<<<<<< HEAD
  hours_per_week DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
  company VARCHAR(100) DEFAULT 'PeoplePay360 Corp',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  day_name VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  break_hours DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
  work_hours DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
  FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET') NOT NULL,
  sequence INT NOT NULL DEFAULT 10,
  calculation_type ENUM('FIXED', 'PERCENT_BASIC', 'PERCENT_COMPONENT', 'FORMULA', 'PRORATED_DAYS') NOT NULL DEFAULT 'FIXED',
  percentage DECIMAL(6, 2) DEFAULT 0.00,
  component_code VARCHAR(50) NULL,
  fixed_amount DECIMAL(12, 2) DEFAULT 0.00,
  formula_expression VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_structure_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  structure_id INT NOT NULL,
  rule_id INT NOT NULL,
  sequence_override INT NULL,
  FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES salary_rules(id) ON DELETE CASCADE,
  UNIQUE KEY uk_structure_rule (structure_id, rule_id)
);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(25),
  gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  date_of_birth DATE,
  joining_date DATE NOT NULL,
  department_id INT NULL,
  job_position_id INT NULL,
  manager_id INT NULL,
  employment_status ENUM('active', 'probation', 'on_notice', 'terminated') DEFAULT 'active',
  working_schedule_id INT NULL,
  company VARCHAR(100) DEFAULT 'PeoplePay360 Global',
  bank_name VARCHAR(100),
  bank_account_no VARCHAR(50),
  bank_ifsc VARCHAR(30),
  pan_number VARCHAR(20),
  avatar_url VARCHAR(255),
=======
  hours_per_week DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Schedule Days
CREATE TABLE IF NOT EXISTS schedule_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  break_hours DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  calculated_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  UNIQUE KEY unique_schedule_day (schedule_id, day_of_week),
  FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Employees
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  department_id INT NULL,
  job_position_id INT NULL,
  manager_id INT NULL,
  working_schedule_id INT NULL,
  employment_status ENUM('Active', 'Inactive', 'Terminated', 'On Leave') DEFAULT 'Active',
  work_location VARCHAR(100) DEFAULT 'Main Office',
  company VARCHAR(100) DEFAULT 'PeoplePay360 Inc',
  bank_name VARCHAR(100) NULL,
  bank_account_no VARCHAR(50) NULL,
  bank_ifsc VARCHAR(20) NULL,
  pan_no VARCHAR(20) NULL,
  avatar_url VARCHAR(255) NULL,
>>>>>>> feature/backend
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL,
<<<<<<< HEAD
  FOREIGN KEY (working_schedule_id) REFERENCES working_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NULL UNIQUE,
  work_email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'HR Payroll Admin', 'HR Payroll User', 'HR Manager', 'Employee') NOT NULL DEFAULT 'Employee',
  account_status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

=======
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (working_schedule_id) REFERENCES working_schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Add deferred foreign key for departments.manager_id
ALTER TABLE departments 
  ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 7. Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Salary Rules
CREATE TABLE IF NOT EXISTS salary_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category ENUM('Basic', 'Allowance', 'Gross', 'Deduction', 'Net') NOT NULL,
  sequence INT NOT NULL DEFAULT 1,
  calc_type ENUM('fixed', 'percent_wage', 'percent_basic', 'formula') NOT NULL,
  rate_or_amount DECIMAL(12,2) DEFAULT 0.00,
  formula VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Salary Structure Rules
CREATE TABLE IF NOT EXISTS salary_structure_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salary_structure_id INT NOT NULL,
  salary_rule_id INT NOT NULL,
  UNIQUE KEY unique_structure_rule (salary_structure_id, salary_rule_id),
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (salary_rule_id) REFERENCES salary_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Contracts
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_code VARCHAR(50) NOT NULL UNIQUE,
  employee_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  department_id INT NULL,
  job_position_id INT NULL,
<<<<<<< HEAD
  wage DECIMAL(12, 2) NOT NULL,
  working_schedule_id INT NULL,
  salary_structure_id INT NOT NULL,
  status ENUM('draft', 'running', 'expired', 'cancelled') DEFAULT 'running',
  notes TEXT,
=======
  wage DECIMAL(12,2) NOT NULL,
  working_schedule_id INT NULL,
  salary_structure_id INT NOT NULL,
  status ENUM('Draft', 'Running', 'Expired', 'Terminated') DEFAULT 'Running',
  notes TEXT NULL,
>>>>>>> feature/backend
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL,
  FOREIGN KEY (working_schedule_id) REFERENCES working_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
<<<<<<< HEAD
);

=======
) ENGINE=InnoDB;

-- 12. Attendance
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
<<<<<<< HEAD
  check_in DATETIME NOT NULL,
  check_out DATETIME NULL,
  worked_hours DECIMAL(5, 2) DEFAULT 0.00,
  break_hours DECIMAL(4, 2) DEFAULT 1.00,
  overtime_hours DECIMAL(4, 2) DEFAULT 0.00,
  status ENUM('present', 'half_day', 'absent', 'late', 'on_leave') DEFAULT 'present',
  notes VARCHAR(255) NULL,
  is_manual_correction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uk_employee_date (employee_id, date)
);

CREATE TABLE IF NOT EXISTS time_off_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  unit ENUM('days', 'hours') DEFAULT 'days',
  requires_allocation BOOLEAN DEFAULT TRUE,
  color VARCHAR(20) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

=======
  check_in TIME NULL,
  check_out TIME NULL,
  break_hours DECIMAL(4,2) DEFAULT 1.00,
  worked_hours DECIMAL(4,2) DEFAULT 0.00,
  status ENUM('Present', 'Half Day', 'Late', 'Absent') DEFAULT 'Present',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_emp_date (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Time Off Types
CREATE TABLE IF NOT EXISTS time_off_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  unit ENUM('Days', 'Hours') DEFAULT 'Days',
  requires_allocation BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 14. Time Off Allocations
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS time_off_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
<<<<<<< HEAD
  year INT NOT NULL,
  allocated_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  used_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  remaining_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE CASCADE,
  UNIQUE KEY uk_emp_type_year (employee_id, time_off_type_id, year)
);

=======
  allocated_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  used_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_emp_type_year (employee_id, time_off_type_id, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Time Off Requests
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS time_off_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
<<<<<<< HEAD
  requested_amount DECIMAL(5, 2) NOT NULL,
  unit ENUM('days', 'hours') DEFAULT 'days',
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approver_id INT NULL,
  approval_notes TEXT NULL,
  approved_at DATETIME NULL,
=======
  days_requested DECIMAL(5,2) NOT NULL,
  reason TEXT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approver_id INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
>>>>>>> feature/backend
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE RESTRICT,
<<<<<<< HEAD
  FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payruns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payrun_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  period_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g. 2026-08)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  salary_structure_id INT NOT NULL,
  status ENUM('draft', 'computed', 'validated', 'paid') DEFAULT 'draft',
  total_gross DECIMAL(14, 2) DEFAULT 0.00,
  total_deductions DECIMAL(14, 2) DEFAULT 0.00,
  total_net DECIMAL(14, 2) DEFAULT 0.00,
  employee_count INT DEFAULT 0,
  paid_at DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

=======
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 16. Payruns
CREATE TABLE IF NOT EXISTS payruns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  salary_structure_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status ENUM('draft', 'computed', 'validated', 'paid') DEFAULT 'draft',
  total_gross DECIMAL(14,2) DEFAULT 0.00,
  total_deductions DECIMAL(14,2) DEFAULT 0.00,
  total_net DECIMAL(14,2) DEFAULT 0.00,
  created_by INT NULL,
  validated_by INT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 17. Payrun Employees
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS payrun_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payrun_id INT NOT NULL,
  employee_id INT NOT NULL,
  contract_id INT NOT NULL,
  status ENUM('included', 'excluded') DEFAULT 'included',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
<<<<<<< HEAD
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_payrun_emp (payrun_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payslip_code VARCHAR(50) NOT NULL UNIQUE,
=======
  UNIQUE KEY unique_payrun_emp (payrun_id, employee_id),
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 18. Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
>>>>>>> feature/backend
  payrun_id INT NOT NULL,
  employee_id INT NOT NULL,
  contract_id INT NOT NULL,
  salary_structure_id INT NOT NULL,
<<<<<<< HEAD
  period_month VARCHAR(7) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  worked_days DECIMAL(5, 2) DEFAULT 0.00,
  total_days DECIMAL(5, 2) DEFAULT 30.00,
  unpaid_leave_days DECIMAL(5, 2) DEFAULT 0.00,
  paid_leave_days DECIMAL(5, 2) DEFAULT 0.00,
  gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM('draft', 'computed', 'validated', 'paid') DEFAULT 'draft',
  pdf_url VARCHAR(255) NULL,
=======
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scheduled_days INT NOT NULL DEFAULT 22,
  worked_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  absent_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  leave_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('draft', 'computed', 'confirmed', 'paid') DEFAULT 'draft',
  pdf_path VARCHAR(255) NULL,
>>>>>>> feature/backend
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
<<<<<<< HEAD
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
);

=======
  UNIQUE KEY unique_payrun_emp_slip (payrun_id, employee_id),
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 19. Payslip Lines
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS payslip_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payslip_id INT NOT NULL,
  rule_id INT NULL,
<<<<<<< HEAD
  rule_code VARCHAR(50) NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  category ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET') NOT NULL,
  sequence INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  rate DECIMAL(6, 2) DEFAULT 0.00,
  base_amount DECIMAL(12, 2) DEFAULT 0.00,
  notes VARCHAR(255) NULL,
  FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES salary_rules(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payroll_anomalies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payrun_id INT NOT NULL,
  payslip_id INT NULL,
  employee_id INT NOT NULL,
  severity ENUM('info', 'warning', 'critical') DEFAULT 'warning',
  type VARCHAR(50) NOT NULL, -- e.g., 'SALARY_VARIANCE', 'MISSING_BANK_INFO', 'ATTENDANCE_GAP', 'DUPLICATE_PAYSLIP'
  title VARCHAR(150) NOT NULL,
  reason TEXT NOT NULL,
  previous_value VARCHAR(100) NULL,
  current_value VARCHAR(100) NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  link VARCHAR(255) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

=======
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('Basic', 'Allowance', 'Gross', 'Deduction', 'Net') NOT NULL,
  sequence INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES salary_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 20. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 21. Audit Logs
>>>>>>> feature/backend
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
<<<<<<< HEAD
  entity VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
=======
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes for performance & frequent queries
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_emp_status ON employees(employment_status);
CREATE INDEX idx_contract_emp ON contracts(employee_id, start_date, end_date);
CREATE INDEX idx_att_emp_date ON attendance(employee_id, date);
CREATE INDEX idx_timeoff_emp ON time_off_requests(employee_id, status);
CREATE INDEX idx_payslip_payrun ON payslips(payrun_id);
CREATE INDEX idx_payslip_emp ON payslips(employee_id);
CREATE INDEX idx_payslip_lines_slip ON payslip_lines(payslip_id);
>>>>>>> feature/backend
