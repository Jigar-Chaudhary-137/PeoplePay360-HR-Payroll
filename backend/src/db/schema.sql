-- PeoplePay360 Database Schema (MySQL)

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  manager_id INT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  grade VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS working_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  days_per_week INT NOT NULL DEFAULT 5,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_code VARCHAR(50) NOT NULL UNIQUE,
  employee_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  department_id INT NULL,
  job_position_id INT NULL,
  wage DECIMAL(12, 2) NOT NULL,
  working_schedule_id INT NULL,
  salary_structure_id INT NOT NULL,
  status ENUM('draft', 'running', 'expired', 'cancelled') DEFAULT 'running',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL,
  FOREIGN KEY (working_schedule_id) REFERENCES working_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
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

CREATE TABLE IF NOT EXISTS time_off_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
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

CREATE TABLE IF NOT EXISTS time_off_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  requested_amount DECIMAL(5, 2) NOT NULL,
  unit ENUM('days', 'hours') DEFAULT 'days',
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approver_id INT NULL,
  approval_notes TEXT NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE RESTRICT,
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

CREATE TABLE IF NOT EXISTS payrun_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payrun_id INT NOT NULL,
  employee_id INT NOT NULL,
  contract_id INT NOT NULL,
  status ENUM('included', 'excluded') DEFAULT 'included',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_payrun_emp (payrun_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payslip_code VARCHAR(50) NOT NULL UNIQUE,
  payrun_id INT NOT NULL,
  employee_id INT NOT NULL,
  contract_id INT NOT NULL,
  salary_structure_id INT NOT NULL,
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
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payslip_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payslip_id INT NOT NULL,
  rule_id INT NULL,
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

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
