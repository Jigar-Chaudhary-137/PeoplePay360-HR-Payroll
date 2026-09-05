const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  console.log('=== GENERATING EXPANDED 500+ TRANSACTIONAL DEMO DATASET ===\n');

  const sqlStatements = [];
  sqlStatements.push('-- ============================================================');
  sqlStatements.push('-- PEOPLEPAY360 ENTERPRISE DEMO DATASET');
  sqlStatements.push('-- Realistic Indian HR & Payroll dataset across all modules');
  sqlStatements.push('-- Fully idempotent with ON DUPLICATE KEY UPDATE / INSERT IGNORE');
  sqlStatements.push('USE peoplepay360;\n');
  sqlStatements.push('-- Cleanup previous demo records for complete idempotency');
  sqlStatements.push('DELETE FROM payslip_lines WHERE id >= 1000 OR payslip_id >= 100;');
  sqlStatements.push('DELETE FROM payslips WHERE id >= 100;');
  sqlStatements.push('DELETE FROM payrun_employees WHERE payrun_id IN (2, 3, 4, 5) OR employee_id >= 100;');
  sqlStatements.push('DELETE FROM payruns WHERE id IN (3, 4, 5);');
  sqlStatements.push('DELETE FROM attendance WHERE employee_id >= 100;');
  sqlStatements.push('DELETE FROM time_off_requests WHERE id >= 100 OR employee_id >= 100;');
  sqlStatements.push('DELETE FROM time_off_allocations WHERE employee_id >= 100;');
  sqlStatements.push('DELETE FROM contracts WHERE id >= 100;');
  sqlStatements.push('DELETE FROM employees WHERE id >= 100;');
  sqlStatements.push('DELETE FROM job_positions WHERE id >= 10;');
  sqlStatements.push('DELETE FROM notifications WHERE id >= 100;');
  sqlStatements.push('DELETE FROM audit_logs WHERE id >= 100;\n');

  // 1. Job Positions (IDs 10 to 18)
  sqlStatements.push('-- 1. Job Positions (IDs 10 to 18)');
  const jobPositions = [
    [10, 'Cloud DevOps Architect', 1],
    [11, 'Talent Acquisition Lead', 2],
    [12, 'Tax & Compliance Manager', 3],
    [13, 'Supply Chain Coordinator', 4],
    [14, 'Customer Success Executive', 5],
    [15, 'Product Manager', 1],
    [16, 'Site Reliability Engineer', 1],
    [17, 'HR Business Partner', 2],
    [18, 'Treasury & Risk Analyst', 3]
  ];
  sqlStatements.push(`INSERT INTO job_positions (id, title, department_id) VALUES
${jobPositions.map(j => `(${j[0]}, '${j[1]}', ${j[2]})`).join(',\n')}
ON DUPLICATE KEY UPDATE title = VALUES(title), department_id = VALUES(department_id);\n`);

  // 2. Employees (55 new employees, IDs 101 to 155)
  // Total employees in company = 7 (base) + 55 = 62 employees
  sqlStatements.push('-- 2. Employees (IDs 101 - 155)');
  const employees = [
    // Cohort 1: 101 - 125
    [101, 'EMP101', 'Rajesh', 'Iyer', 'rajesh.iyer@peoplepay360.com', '+91 98123 45001', 1, 10, 1, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566001', 'HDFC0001234', 'ABCPI1001A'],
    [102, 'EMP102', 'Ananya', 'Sharma', 'ananya.sharma@peoplepay360.com', '+91 98123 45002', 1, 2, 101, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001002', 'SBIN0004567', 'ABCPS1002B'],
    [103, 'EMP103', 'Suresh', 'Nair', 'suresh.nair@peoplepay360.com', '+91 98123 45003', 1, 15, 1, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001003', 'ICIC0000012', 'ABCPN1003C'],
    [104, 'EMP104', 'Meenakshi', 'Sundaram', 'meenakshi.s@peoplepay360.com', '+91 98123 45004', 1, 3, 101, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001004', 'UTIB0000915', 'ABCPS1004D'],
    [105, 'EMP105', 'Rohan', 'Kulkarni', 'rohan.kulkarni@peoplepay360.com', '+91 98123 45005', 1, 1, 101, 1, 1, 'Active', 'Bangalore HQ', 'Kotak Mahindra Bank', '6211001005', 'KKBK0000621', 'ABCPK1005E'],
    [106, 'EMP106', 'Deepa', 'Deshmukh', 'deepa.d@peoplepay360.com', '+91 98123 45006', 1, 2, 105, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566006', 'HDFC0001234', 'ABCPD1006F'],
    [107, 'EMP107', 'Kavita', 'Rao', 'kavita.rao@peoplepay360.com', '+91 98123 45007', 2, 11, 3, 1, 2, 'Active', 'Mumbai Office', 'ICICI Bank', '001205001007', 'ICIC0000012', 'ABCPR1007G'],
    [108, 'EMP108', 'Arjun', 'Kapoor', 'arjun.kapoor@peoplepay360.com', '+91 98123 45008', 2, 5, 3, 1, 2, 'Active', 'Mumbai Office', 'Axis Bank', '915010001008', 'UTIB0000915', 'ABCPK1008H'],
    [109, 'EMP109', 'Divya', 'Menon', 'divya.menon@peoplepay360.com', '+91 98123 45009', 2, 5, 107, 1, 2, 'Active', 'Mumbai Office', 'HDFC Bank', '50100445566009', 'HDFC0001234', 'ABCPM1009I'],
    [110, 'EMP110', 'Pooja', 'Bhatt', 'pooja.bhatt@peoplepay360.com', '+91 98123 45010', 2, 11, 107, 1, 2, 'Active', 'Mumbai Office', 'Kotak Mahindra Bank', '6211001010', 'KKBK0000621', 'ABCPB1010J'],
    [111, 'EMP111', 'Harish', 'Reddy', 'harish.reddy@peoplepay360.com', '+91 98123 45011', 3, 12, 4, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001011', 'SBIN0004567', 'ABCPR1011K'],
    [112, 'EMP112', 'Sneha', 'Patil', 'sneha.patil@peoplepay360.com', '+91 98123 45012', 3, 7, 4, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566012', 'HDFC0001234', 'ABCPA1012L'],
    [113, 'EMP113', 'Gaurav', 'Joshi', 'gaurav.joshi@peoplepay360.com', '+91 98123 45013', 3, 6, 4, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001013', 'ICIC0000012', 'ABCPJ1013M'],
    [114, 'EMP114', 'Sunita', 'Chauhan', 'sunita.chauhan@peoplepay360.com', '+91 98123 45014', 3, 7, 111, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001014', 'UTIB0000915', 'ABCPC1014N'],
    [115, 'EMP115', 'Vivek', 'Singhania', 'vivek.s@peoplepay360.com', '+91 98123 45015', 4, 8, 6, 1, 2, 'Active', 'Mumbai Office', 'State Bank of India', '302450001015', 'SBIN0004567', 'ABCPS1015O'],
    [116, 'EMP116', 'Ritu', 'Agarwal', 'ritu.agarwal@peoplepay360.com', '+91 98123 45016', 4, 13, 115, 1, 2, 'Active', 'Mumbai Office', 'HDFC Bank', '50100445566016', 'HDFC0001234', 'ABCPA1016P'],
    [117, 'EMP117', 'Manoj', 'Pillai', 'manoj.pillai@peoplepay360.com', '+91 98123 45017', 4, 13, 115, 1, 2, 'Active', 'Mumbai Office', 'ICICI Bank', '001205001017', 'ICIC0000012', 'ABCPP1017Q'],
    [118, 'EMP118', 'Swati', 'Mukherjee', 'swati.m@peoplepay360.com', '+91 98123 45018', 4, 8, 6, 1, 2, 'Active', 'Mumbai Office', 'Kotak Mahindra Bank', '6211001018', 'KKBK0000621', 'ABCPM1018R'],
    [119, 'EMP119', 'Karthik', 'Subramanian', 'karthik.s@peoplepay360.com', '+91 98123 45019', 5, 9, 1, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566019', 'HDFC0001234', 'ABCPS1019S'],
    [120, 'EMP120', 'Preeti', 'Nambiar', 'preeti.n@peoplepay360.com', '+91 98123 45020', 5, 14, 119, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001020', 'UTIB0000915', 'ABCPN1020T'],
    [121, 'EMP121', 'Alok', 'Saxena', 'alok.saxena@peoplepay360.com', '+91 98123 45021', 5, 9, 119, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001021', 'SBIN0004567', 'ABCPS1021U'],
    [122, 'EMP122', 'Shreya', 'Sen', 'shreya.sen@peoplepay360.com', '+91 98123 45022', 5, 14, 119, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001022', 'ICIC0000012', 'ABCPS1022V'],
    [123, 'EMP123', 'Tarun', 'Chadha', 'tarun.chadha@peoplepay360.com', '+91 98123 45023', 1, 2, 101, 1, 1, 'On Leave', 'Bangalore HQ', 'HDFC Bank', '50100445566023', 'HDFC0001234', 'ABCPC1023W'],
    [124, 'EMP124', 'Tanvi', 'Sethi', 'tanvi.sethi@peoplepay360.com', '+91 98123 45024', 2, 5, 3, 1, 2, 'On Leave', 'Mumbai Office', 'Kotak Mahindra Bank', '6211001024', 'KKBK0000621', 'ABCPS1024X'],
    [125, 'EMP125', 'Manish', 'Tiwari', 'manish.tiwari@peoplepay360.com', '+91 98123 45025', 4, 13, 115, 1, 2, 'Terminated', 'Mumbai Office', 'Axis Bank', '915010001025', 'UTIB0000915', 'ABCPT1025Y'],

    // Cohort 2: 126 - 155 (30 Additional Employees)
    [126, 'EMP126', 'Ashish', 'Verma', 'ashish.verma@peoplepay360.com', '+91 98123 45026', 1, 16, 101, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566026', 'HDFC0001234', 'ABCPV1026A'],
    [127, 'EMP127', 'Pallavi', 'Sengupta', 'pallavi.s@peoplepay360.com', '+91 98123 45027', 1, 2, 105, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001027', 'ICIC0000012', 'ABCPS1027B'],
    [128, 'EMP128', 'Deepak', 'Bhatia', 'deepak.bhatia@peoplepay360.com', '+91 98123 45028', 1, 1, 101, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001028', 'UTIB0000915', 'ABCPB1028C'],
    [129, 'EMP129', 'Shruti', 'Saxena', 'shruti.saxena@peoplepay360.com', '+91 98123 45029', 1, 3, 104, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001029', 'SBIN0004567', 'ABCPS1029D'],
    [130, 'EMP130', 'Abhishek', 'Kulkarni', 'abhishek.k@peoplepay360.com', '+91 98123 45030', 1, 2, 105, 1, 1, 'Active', 'Bangalore HQ', 'Kotak Mahindra Bank', '6211001030', 'KKBK0000621', 'ABCPK1030E'],
    [131, 'EMP131', 'Nalini', 'Raman', 'nalini.raman@peoplepay360.com', '+91 98123 45031', 2, 17, 3, 1, 2, 'Active', 'Mumbai Office', 'HDFC Bank', '50100445566031', 'HDFC0001234', 'ABCPR1031F'],
    [132, 'EMP132', 'Sandeep', 'Dubey', 'sandeep.dubey@peoplepay360.com', '+91 98123 45032', 2, 5, 107, 1, 2, 'Active', 'Mumbai Office', 'State Bank of India', '302450001032', 'SBIN0004567', 'ABCPD1032G'],
    [133, 'EMP133', 'Lavanya', 'Reddy', 'lavanya.reddy@peoplepay360.com', '+91 98123 45033', 2, 11, 107, 1, 2, 'Active', 'Mumbai Office', 'ICICI Bank', '001205001033', 'ICIC0000012', 'ABCPR1033H'],
    [134, 'EMP134', 'Mayur', 'Hegde', 'mayur.hegde@peoplepay360.com', '+91 98123 45034', 3, 18, 4, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566034', 'HDFC0001234', 'ABCPH1034I'],
    [135, 'EMP135', 'Smita', 'Chawla', 'smita.chawla@peoplepay360.com', '+91 98123 45035', 3, 7, 111, 1, 1, 'Active', 'Bangalore HQ', 'Kotak Mahindra Bank', '6211001035', 'KKBK0000621', 'ABCPC1035J'],
    [136, 'EMP136', 'Pranav', 'Deshpande', 'pranav.d@peoplepay360.com', '+91 98123 45036', 3, 6, 113, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001036', 'UTIB0000915', 'ABCPD1036K'],
    [137, 'EMP137', 'Anjali', 'Nambisan', 'anjali.n@peoplepay360.com', '+91 98123 45037', 3, 7, 111, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001037', 'SBIN0004567', 'ABCPN1037L'],
    [138, 'EMP138', 'Nitin', 'Bansal', 'nitin.bansal@peoplepay360.com', '+91 98123 45038', 4, 13, 115, 1, 2, 'Active', 'Mumbai Office', 'HDFC Bank', '50100445566038', 'HDFC0001234', 'ABCPB1038M'],
    [139, 'EMP139', 'Vandana', 'Pillai', 'vandana.pillai@peoplepay360.com', '+91 98123 45039', 4, 13, 115, 1, 2, 'Active', 'Mumbai Office', 'ICICI Bank', '001205001039', 'ICIC0000012', 'ABCPP1039N'],
    [140, 'EMP140', 'Kunal', 'Singhal', 'kunal.singhal@peoplepay360.com', '+91 98123 45040', 4, 8, 6, 1, 2, 'Active', 'Mumbai Office', 'Kotak Mahindra Bank', '6211001040', 'KKBK0000621', 'ABCPS1040O'],
    [141, 'EMP141', 'Komal', 'Agarwal', 'komal.agarwal@peoplepay360.com', '+91 98123 45041', 5, 9, 119, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001041', 'UTIB0000915', 'ABCPA1041P'],
    [142, 'EMP142', 'Varun', 'Kashyap', 'varun.kashyap@peoplepay360.com', '+91 98123 45042', 5, 14, 119, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566042', 'HDFC0001234', 'ABCPK1042Q'],
    [143, 'EMP143', 'Divyansh', 'Mishra', 'divyansh.m@peoplepay360.com', '+91 98123 45043', 5, 9, 119, 1, 1, 'Active', 'Bangalore HQ', 'State Bank of India', '302450001043', 'SBIN0004567', 'ABCPM1043R'],
    [144, 'EMP144', 'Bhavna', 'Trivedi', 'bhavna.trivedi@peoplepay360.com', '+91 98123 45044', 5, 14, 119, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001044', 'ICIC0000012', 'ABCPT1044S'],
    [145, 'EMP145', 'Chetan', 'Somani', 'chetan.somani@peoplepay360.com', '+91 98123 45045', 1, 2, 105, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566045', 'HDFC0001234', 'ABCPS1045T'],
    [146, 'EMP146', 'Shilpa', 'Jain', 'shilpa.jain@peoplepay360.com', '+91 98123 45046', 1, 3, 104, 1, 1, 'Active', 'Bangalore HQ', 'Kotak Mahindra Bank', '6211001046', 'KKBK0000621', 'ABCPJ1046U'],
    [147, 'EMP147', 'Rohit', 'Bhaduri', 'rohit.bhaduri@peoplepay360.com', '+91 98123 45047', 1, 16, 101, 1, 1, 'Active', 'Bangalore HQ', 'Axis Bank', '915010001047', 'UTIB0000915', 'ABCPB1047V'],
    [148, 'EMP148', 'Archana', 'Murthy', 'archana.murthy@peoplepay360.com', '+91 98123 45048', 2, 17, 3, 1, 2, 'Active', 'Mumbai Office', 'State Bank of India', '302450001048', 'SBIN0004567', 'ABCPM1048W'],
    [149, 'EMP149', 'Tejas', 'Parekh', 'tejas.parekh@peoplepay360.com', '+91 98123 45049', 3, 18, 4, 1, 1, 'Active', 'Bangalore HQ', 'HDFC Bank', '50100445566049', 'HDFC0001234', 'ABCPP1049X'],
    [150, 'EMP150', 'Natasha', 'DSouza', 'natasha.dsouza@peoplepay360.com', '+91 98123 45050', 5, 9, 119, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001050', 'ICIC0000012', 'ABCPD1050Y'],
    [151, 'EMP151', 'Saurabh', 'Malviya', 'saurabh.m@peoplepay360.com', '+91 98123 45051', 1, 2, 105, 1, 1, 'On Leave', 'Bangalore HQ', 'Kotak Mahindra Bank', '6211001051', 'KKBK0000621', 'ABCPM1051Z'],
    [152, 'EMP152', 'Payal', 'Goswami', 'payal.goswami@peoplepay360.com', '+91 98123 45052', 2, 5, 107, 1, 2, 'On Leave', 'Mumbai Office', 'Axis Bank', '915010001052', 'UTIB0000915', 'ABCPG1052A'],
    [153, 'EMP153', 'Arvind', 'Swaminathan', 'arvind.s@peoplepay360.com', '+91 98123 45053', 3, 7, 111, 1, 1, 'Terminated', 'Bangalore HQ', 'State Bank of India', '302450001053', 'SBIN0004567', 'ABCPS1053B'],
    [154, 'EMP154', 'Radhika', 'Madan', 'radhika.madan@peoplepay360.com', '+91 98123 45054', 4, 13, 115, 1, 2, 'Terminated', 'Mumbai Office', 'HDFC Bank', '50100445566054', 'HDFC0001234', 'ABCPM1054C'],
    [155, 'EMP155', 'Raghavendra', 'Rao', 'raghavendra.rao@peoplepay360.com', '+91 98123 45055', 5, 14, 119, 1, 1, 'Active', 'Bangalore HQ', 'ICICI Bank', '001205001055', 'ICIC0000012', 'ABCPR1055D']
  ];

  const empValues = employees.map(e => {
    return `(${e[0]}, '${e[1]}', '${e[2]}', '${e[3]}', '${e[4]}', '${e[5]}', ${e[6]}, ${e[7]}, ${e[8]}, ${e[9]}, ${e[10]}, '${e[11]}', '${e[12]}', 'PeoplePay360 Inc', '${e[13]}', '${e[14]}', '${e[15]}', '${e[16]}', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')`;
  }).join(',\n');

  sqlStatements.push(`INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, work_location_id, employment_status, work_location, company, bank_name, bank_account_no, bank_ifsc, pan_no, avatar_url) VALUES
${empValues}
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), employment_status = VALUES(employment_status), department_id = VALUES(department_id), job_position_id = VALUES(job_position_id);\n`);

  // 3. Contracts (IDs 101 to 164)
  sqlStatements.push('-- 3. Contracts (IDs 101 - 164)');
  const wages = {
    101: 95000.00, 102: 55000.00, 103: 85000.00, 104: 42000.00, 105: 72000.00,
    106: 48000.00, 107: 58000.00, 108: 40000.00, 109: 36000.00, 110: 52000.00,
    111: 78000.00, 112: 54000.00, 113: 62000.00, 114: 45000.00, 115: 68000.00,
    116: 42000.00, 117: 39000.00, 118: 64000.00, 119: 75000.00, 120: 46000.00,
    121: 52000.00, 122: 38000.00, 123: 50000.00, 124: 38000.00, 125: 35000.00,
    126: 88000.00, 127: 49000.00, 128: 76000.00, 129: 44000.00, 130: 51000.00,
    131: 65000.00, 132: 41000.00, 133: 53000.00, 134: 70000.00, 135: 47000.00,
    136: 60000.00, 137: 46000.00, 138: 43000.00, 139: 39000.00, 140: 67000.00,
    141: 55000.00, 142: 48000.00, 143: 53000.00, 144: 40000.00, 145: 52000.00,
    146: 45000.00, 147: 82000.00, 148: 62000.00, 149: 68000.00, 150: 56000.00,
    151: 50000.00, 152: 39000.00, 153: 45000.00, 154: 38000.00, 155: 47000.00
  };

  const contracts = [];
  employees.forEach(emp => {
    const id = emp[0];
    const dept = emp[6];
    const pos = emp[7];
    const wage = wages[id] || 45000.00;

    if (id === 125 || id === 153 || id === 154) {
      // Terminated contracts ended 2026-06-30
      contracts.push([id, `CON-2026-${id}`, id, '2026-01-01', '2026-06-30', dept, pos, wage, 1, 1, 'Terminated', `${emp[2]} ${emp[3]} completed contract`]);
    } else {
      contracts.push([id, `CON-2026-${id}`, id, '2026-01-01', null, dept, pos, wage, 1, 1, 'Running', `${emp[2]} ${emp[3]} standard active continuous contract`]);
    }
  });

  // Add 9 historical contracts demonstrating promotions / revisions (IDs 156 to 164)
  contracts.push([156, 'CON-2025-101H2', 101, '2025-07-01', '2025-12-31', 1, 10, 80000.00, 1, 1, 'Expired', 'Rajesh Iyer previous contract before promotion to Cloud Architect']);
  contracts.push([157, 'CON-2025-105H2', 105, '2025-07-01', '2025-12-31', 1, 1, 60000.00, 1, 1, 'Expired', 'Rohan Kulkarni previous contract before annual increment']);
  contracts.push([158, 'CON-2025-119H2', 119, '2025-07-01', '2025-12-31', 5, 9, 65000.00, 1, 1, 'Expired', 'Karthik Subramanian previous contract before Q1 revision']);
  contracts.push([159, 'CON-2025-126H2', 126, '2025-07-01', '2025-12-31', 1, 16, 75000.00, 1, 1, 'Expired', 'Ashish Verma previous SRE level contract']);
  contracts.push([160, 'CON-2025-128H2', 128, '2025-07-01', '2025-12-31', 1, 1, 65000.00, 1, 1, 'Expired', 'Deepak Bhatia previous Senior Developer contract']);
  contracts.push([161, 'CON-2025-131H2', 131, '2025-07-01', '2025-12-31', 2, 17, 55000.00, 1, 1, 'Expired', 'Nalini Raman HR Specialist contract']);
  contracts.push([162, 'CON-2025-134H2', 134, '2025-07-01', '2025-12-31', 3, 18, 60000.00, 1, 1, 'Expired', 'Mayur Hegde Finance Analyst contract']);
  contracts.push([163, 'CON-2025-140H2', 140, '2025-07-01', '2025-12-31', 4, 8, 58000.00, 1, 1, 'Expired', 'Kunal Singhal Operations Assistant contract']);
  contracts.push([164, 'CON-2025-141H2', 141, '2025-07-01', '2025-12-31', 5, 9, 48000.00, 1, 1, 'Expired', 'Komal Agarwal Sales Specialist contract']);

  const contractValues = contracts.map(c => {
    const end = c[4] ? `'${c[4]}'` : 'NULL';
    return `(${c[0]}, '${c[1]}', ${c[2]}, '${c[3]}', ${end}, ${c[5]}, ${c[6]}, ${c[7].toFixed(2)}, ${c[8]}, ${c[9]}, '${c[10]}', '${c[11]}')`;
  }).join(',\n');

  sqlStatements.push(`INSERT INTO contracts (id, contract_code, employee_id, start_date, end_date, department_id, job_position_id, wage, working_schedule_id, salary_structure_id, status, notes) VALUES
${contractValues}
ON DUPLICATE KEY UPDATE wage = VALUES(wage), status = VALUES(status), notes = VALUES(notes);\n`);

  // 4. Time Off Allocations (Year 2026 for all 55 employees: 55 * 3 = 165 allocations)
  sqlStatements.push('-- 4. Time Off Allocations (2026)');
  const allocations = [];
  employees.forEach(emp => {
    const empId = emp[0];
    allocations.push(`(${empId}, 1, 18.00, ${(empId % 4)}.00, 2026)`); // PTO
    allocations.push(`(${empId}, 2, 10.00, ${(empId % 3)}.00, 2026)`); // Sick Leave
    allocations.push(`(${empId}, 3, 5.00, ${(empId % 2)}.00, 2026)`);  // Comp Off
  });
  sqlStatements.push(`INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_days, used_days, year) VALUES
${allocations.join(',\n')}
ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days), used_days = VALUES(used_days);\n`);

  // 5. Time Off Requests (80 records, IDs 101 to 180)
  sqlStatements.push('-- 5. Time Off Requests (IDs 101 - 180)');
  const leaveReasons = [
    'Attending family function in hometown',
    'Viral fever and prescribed medical rest',
    'Personal errands and bank documentation',
    'Sibling wedding festivities in Jaipur',
    'Dental appointment and extraction recovery',
    'Annual vacation with family in Kerala',
    'Emergency plumbing and home maintenance',
    'Attending technical certification exam',
    'Child school admissions and interview',
    'Travel for pilgrimage with elderly parents',
    'Eye surgery and required screen rest',
    'Relocation and apartment lease signing'
  ];

  const timeOffRequests = [
    // Approved leaves in July & late August
    [101, 101, 1, '2026-07-08', '2026-07-09', 2.00, leaveReasons[0], 'Approved', 3, '2026-07-05 10:00:00', null],
    [102, 102, 2, '2026-07-21', '2026-07-22', 2.00, leaveReasons[1], 'Approved', 3, '2026-07-20 16:30:00', null],
    [103, 103, 1, '2026-07-27', '2026-07-28', 2.00, leaveReasons[2], 'Approved', 3, '2026-07-24 11:15:00', null],
    [104, 104, 1, '2026-08-25', '2026-08-26', 2.00, leaveReasons[3], 'Approved', 3, '2026-08-22 14:00:00', null],
    [105, 105, 2, '2026-08-27', '2026-08-28', 2.00, leaveReasons[4], 'Approved', 3, '2026-08-25 09:30:00', null],
    [106, 106, 1, '2026-08-24', '2026-08-25', 2.00, leaveReasons[5], 'Approved', 3, '2026-08-20 12:00:00', null],
    [107, 107, 1, '2026-07-15', '2026-07-16', 2.00, leaveReasons[6], 'Approved', 3, '2026-07-12 15:45:00', null],
    [108, 108, 3, '2026-07-29', '2026-07-29', 1.00, leaveReasons[7], 'Approved', 3, '2026-07-26 10:20:00', null],
    [109, 109, 2, '2026-08-26', '2026-08-27', 2.00, leaveReasons[1], 'Approved', 3, '2026-08-24 17:00:00', null],
    [110, 110, 1, '2026-08-28', '2026-08-28', 1.00, leaveReasons[0], 'Approved', 3, '2026-08-25 11:00:00', null],
    [111, 111, 1, '2026-07-14', '2026-07-15', 2.00, leaveReasons[3], 'Approved', 3, '2026-07-11 14:10:00', null],
    [112, 112, 2, '2026-07-16', '2026-07-17', 2.00, leaveReasons[4], 'Approved', 3, '2026-07-15 09:00:00', null],
    [113, 113, 1, '2026-08-24', '2026-08-25', 2.00, leaveReasons[5], 'Approved', 3, '2026-08-21 10:40:00', null],
    [114, 114, 3, '2026-08-26', '2026-08-26', 1.00, leaveReasons[2], 'Approved', 3, '2026-08-24 16:15:00', null],
    [115, 115, 1, '2026-07-06', '2026-07-07', 2.00, leaveReasons[0], 'Approved', 3, '2026-07-02 11:30:00', null],
    [116, 116, 2, '2026-08-27', '2026-08-28', 2.00, leaveReasons[1], 'Approved', 3, '2026-08-25 18:00:00', null],
    [117, 117, 1, '2026-08-25', '2026-08-26', 2.00, leaveReasons[6], 'Approved', 3, '2026-08-21 14:00:00', null],
    [118, 118, 3, '2026-08-28', '2026-08-28', 1.00, leaveReasons[7], 'Approved', 3, '2026-08-26 09:45:00', null],
    [119, 119, 1, '2026-07-23', '2026-07-24', 2.00, leaveReasons[0], 'Approved', 3, '2026-07-20 13:20:00', null],
    [120, 120, 2, '2026-08-25', '2026-08-26', 2.00, leaveReasons[1], 'Approved', 3, '2026-08-23 16:50:00', null],
    [121, 121, 1, '2026-08-27', '2026-08-28', 2.00, leaveReasons[8], 'Approved', 3, '2026-08-24 11:10:00', null],
    [122, 122, 1, '2026-08-26', '2026-08-27', 2.00, leaveReasons[5], 'Approved', 3, '2026-08-23 15:30:00', null],
    [123, 126, 1, '2026-07-02', '2026-07-03', 2.00, leaveReasons[0], 'Approved', 3, '2026-06-29 11:00:00', null],
    [124, 127, 2, '2026-07-08', '2026-07-09', 2.00, leaveReasons[1], 'Approved', 3, '2026-07-06 14:15:00', null],
    [125, 128, 1, '2026-07-13', '2026-07-14', 2.00, leaveReasons[9], 'Approved', 3, '2026-07-10 10:30:00', null],
    [126, 129, 3, '2026-07-17', '2026-07-17', 1.00, leaveReasons[7], 'Approved', 3, '2026-07-15 16:00:00', null],
    [127, 130, 1, '2026-07-22', '2026-07-23', 2.00, leaveReasons[5], 'Approved', 3, '2026-07-19 12:40:00', null],
    [128, 131, 2, '2026-07-28', '2026-07-29', 2.00, leaveReasons[4], 'Approved', 3, '2026-07-26 09:20:00', null],
    [129, 132, 1, '2026-08-24', '2026-08-25', 2.00, leaveReasons[2], 'Approved', 3, '2026-08-21 15:10:00', null],
    [130, 133, 1, '2026-08-26', '2026-08-27', 2.00, leaveReasons[0], 'Approved', 3, '2026-08-23 11:45:00', null],
    [131, 134, 2, '2026-08-27', '2026-08-28', 2.00, leaveReasons[10], 'Approved', 3, '2026-08-25 10:00:00', null],
    [132, 135, 1, '2026-08-25', '2026-08-26', 2.00, leaveReasons[11], 'Approved', 3, '2026-08-22 17:00:00', null],
    [133, 136, 3, '2026-08-28', '2026-08-28', 1.00, leaveReasons[7], 'Approved', 3, '2026-08-26 14:15:00', null],
    [134, 137, 1, '2026-07-30', '2026-07-31', 2.00, leaveReasons[3], 'Approved', 3, '2026-07-27 16:30:00', null],
    [135, 138, 2, '2026-08-24', '2026-08-25', 2.00, leaveReasons[1], 'Approved', 3, '2026-08-22 09:15:00', null],
    [136, 139, 1, '2026-08-26', '2026-08-27', 2.00, leaveReasons[6], 'Approved', 3, '2026-08-24 13:00:00', null],
    [137, 140, 1, '2026-08-27', '2026-08-28', 2.00, leaveReasons[0], 'Approved', 3, '2026-08-25 15:40:00', null],
    [138, 141, 2, '2026-07-16', '2026-07-17', 2.00, leaveReasons[4], 'Approved', 3, '2026-07-14 11:20:00', null],
    [139, 142, 1, '2026-07-20', '2026-07-21', 2.00, leaveReasons[5], 'Approved', 3, '2026-07-17 10:00:00', null],
    [140, 143, 3, '2026-07-24', '2026-07-24', 1.00, leaveReasons[7], 'Approved', 3, '2026-07-22 14:50:00', null],
    [141, 144, 1, '2026-08-25', '2026-08-26', 2.00, leaveReasons[2], 'Approved', 3, '2026-08-23 16:10:00', null],
    [142, 145, 2, '2026-08-27', '2026-08-28', 2.00, leaveReasons[1], 'Approved', 3, '2026-08-25 18:30:00', null],
    [143, 146, 1, '2026-07-09', '2026-07-10', 2.00, leaveReasons[0], 'Approved', 3, '2026-07-07 12:00:00', null],
    [144, 147, 1, '2026-07-27', '2026-07-28', 2.00, leaveReasons[9], 'Approved', 3, '2026-07-24 11:30:00', null],
    [145, 148, 2, '2026-08-26', '2026-08-27', 2.00, leaveReasons[4], 'Approved', 3, '2026-08-24 09:45:00', null],
    [146, 149, 1, '2026-08-24', '2026-08-25', 2.00, leaveReasons[3], 'Approved', 3, '2026-08-21 14:20:00', null],
    [147, 150, 1, '2026-08-27', '2026-08-28', 2.00, leaveReasons[6], 'Approved', 3, '2026-08-25 10:15:00', null],
    [148, 155, 3, '2026-08-28', '2026-08-28', 1.00, leaveReasons[7], 'Approved', 3, '2026-08-26 16:00:00', null],

    // Pending leaves (Current / upcoming September 2026)
    [149, 101, 1, '2026-09-08', '2026-09-09', 2.00, leaveReasons[0], 'Pending', null, null, null],
    [150, 103, 2, '2026-09-07', '2026-09-08', 2.00, leaveReasons[1], 'Pending', null, null, null],
    [151, 107, 1, '2026-09-10', '2026-09-11', 2.00, leaveReasons[5], 'Pending', null, null, null],
    [152, 111, 1, '2026-09-14', '2026-09-15', 2.00, leaveReasons[3], 'Pending', null, null, null],
    [153, 115, 2, '2026-09-09', '2026-09-10', 2.00, leaveReasons[4], 'Pending', null, null, null],
    [154, 117, 1, '2026-09-16', '2026-09-18', 3.00, leaveReasons[6], 'Pending', null, null, null],
    [155, 119, 3, '2026-09-11', '2026-09-11', 1.00, leaveReasons[7], 'Pending', null, null, null],
    [156, 122, 1, '2026-09-15', '2026-09-16', 2.00, leaveReasons[2], 'Pending', null, null, null],
    [157, 126, 1, '2026-09-17', '2026-09-18', 2.00, leaveReasons[9], 'Pending', null, null, null],
    [158, 128, 2, '2026-09-07', '2026-09-08', 2.00, leaveReasons[1], 'Pending', null, null, null],
    [159, 131, 1, '2026-09-14', '2026-09-15', 2.00, leaveReasons[0], 'Pending', null, null, null],
    [160, 134, 1, '2026-09-21', '2026-09-22', 2.00, leaveReasons[5], 'Pending', null, null, null],
    [161, 138, 2, '2026-09-08', '2026-09-09', 2.00, leaveReasons[4], 'Pending', null, null, null],
    [162, 140, 3, '2026-09-11', '2026-09-11', 1.00, leaveReasons[7], 'Pending', null, null, null],
    [163, 142, 1, '2026-09-15', '2026-09-16', 2.00, leaveReasons[6], 'Pending', null, null, null],
    [164, 145, 1, '2026-09-18', '2026-09-19', 2.00, leaveReasons[8], 'Pending', null, null, null],
    [165, 147, 2, '2026-09-10', '2026-09-11', 2.00, leaveReasons[1], 'Pending', null, null, null],
    [166, 150, 1, '2026-09-22', '2026-09-23', 2.00, leaveReasons[2], 'Pending', null, null, null],

    // Rejected leaves
    [167, 102, 1, '2026-08-11', '2026-08-12', 2.00, leaveReasons[3], 'Rejected', 3, '2026-08-08 11:00:00', 'Critical project sprint deliverable window - please reschedule'],
    [168, 105, 1, '2026-08-13', '2026-08-14', 2.00, leaveReasons[5], 'Rejected', 3, '2026-08-09 14:30:00', 'Multiple team members already on approved leave for these dates'],
    [169, 108, 2, '2026-08-10', '2026-08-11', 2.00, leaveReasons[1], 'Rejected', 3, '2026-08-07 16:00:00', 'Insufficient medical documentation attached'],
    [170, 113, 1, '2026-08-12', '2026-08-13', 2.00, leaveReasons[0], 'Rejected', 3, '2026-08-08 17:15:00', 'Payroll validation cycle in progress; presence required'],
    [171, 120, 1, '2026-08-14', '2026-08-15', 2.00, leaveReasons[6], 'Rejected', 3, '2026-08-10 10:00:00', 'Client on-site onboarding scheduled on this date'],
    [172, 127, 1, '2026-08-18', '2026-08-19', 2.00, leaveReasons[3], 'Rejected', 3, '2026-08-15 11:30:00', 'Department coverage below required threshold'],
    [173, 129, 2, '2026-08-20', '2026-08-21', 2.00, leaveReasons[1], 'Rejected', 3, '2026-08-17 14:00:00', 'Leave balance insufficient for requested duration'],
    [174, 132, 1, '2026-08-17', '2026-08-18', 2.00, leaveReasons[0], 'Rejected', 3, '2026-08-14 16:20:00', 'Quarterly operations audit week; mandatory presence'],
    [175, 135, 1, '2026-08-19', '2026-08-20', 2.00, leaveReasons[5], 'Rejected', 3, '2026-08-16 10:45:00', 'Statutory filing deadline in finance during this period'],
    [176, 139, 1, '2026-08-21', '2026-08-22', 2.00, leaveReasons[6], 'Rejected', 3, '2026-08-18 12:15:00', 'Vendor dispatch coordination scheduled'],
    [177, 143, 2, '2026-08-18', '2026-08-19', 2.00, leaveReasons[1], 'Rejected', 3, '2026-08-15 15:00:00', 'Requested dates conflict with annual sales summit'],
    [178, 146, 1, '2026-08-20', '2026-08-21', 2.00, leaveReasons[2], 'Rejected', 3, '2026-08-17 09:30:00', 'Release candidate testing cycle in progress'],
    [179, 149, 1, '2026-08-21', '2026-08-22', 2.00, leaveReasons[0], 'Rejected', 3, '2026-08-18 17:40:00', 'Internal compliance review week'],
    [180, 155, 1, '2026-08-17', '2026-08-18', 2.00, leaveReasons[5], 'Rejected', 3, '2026-08-14 13:10:00', 'Key account quarterly business review meeting']
  ];

  const reqValues = timeOffRequests.map(r => {
    const status = `'${r[7]}'`;
    const app = r[8] ? r[8] : 'NULL';
    const appAt = r[9] ? `'${r[9]}'` : 'NULL';
    const rej = r[10] ? `'${r[10]}'` : 'NULL';
    return `(${r[0]}, ${r[1]}, ${r[2]}, '${r[3]}', '${r[4]}', ${r[5].toFixed(2)}, '${r[6]}', ${status}, ${app}, ${appAt}, ${rej})`;
  }).join(',\n');

  sqlStatements.push(`INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, days_requested, reason, status, approver_id, approved_at, rejection_reason) VALUES
${reqValues}
ON DUPLICATE KEY UPDATE status = VALUES(status), approver_id = VALUES(approver_id), approved_at = VALUES(approved_at), rejection_reason = VALUES(rejection_reason);\n`);

  // 6. Attendance Records (250 distinct records across working days in August 2026)
  // Two cohorts:
  // Week 1 (Aug 10 - Aug 14): 25 employees (125 records)
  // Week 2 (Aug 17 - Aug 21): 25 employees (125 records)
  sqlStatements.push('-- 6. Attendance Records (250 records across working days in August 2026)');
  const week1Dates = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'];
  const week2Dates = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];

  const attendanceRows = [];
  const activeEmps = employees.filter(e => e[11] === 'Active' || e[11] === 'On Leave');
  const cohort1Emps = activeEmps.slice(0, 25);
  const cohort2Emps = activeEmps.slice(25, 50);

  function generateAttendance(empList, dateList, offset) {
    empList.forEach((emp, eIdx) => {
      const empId = emp[0];
      const locId = emp[10];
      const baseLat = locId === 1 ? 12.9715987 : 19.0657100;
      const baseLng = locId === 1 ? 77.5945627 : 72.8683700;

      dateList.forEach((d, dIdx) => {
        let status = 'Present';
        let checkIn = '08:58:00';
        let checkOut = '18:02:00';
        let breakH = 1.00;
        let workedH = 8.07;
        let notes = 'Normal punch';
        let lat = baseLat + 0.0001;
        let lng = baseLng + 0.0001;
        let verified = 1;

        if ((eIdx + dIdx + offset) % 11 === 0) {
          // Late
          status = 'Late';
          checkIn = '09:42:00';
          checkOut = '18:35:00';
          workedH = 7.88;
          notes = 'Delayed due to traffic on tech corridor';
        } else if ((eIdx + dIdx + offset) % 17 === 0) {
          // Half Day
          status = 'Half Day';
          checkIn = '09:00:00';
          checkOut = '13:30:00';
          breakH = 0.00;
          workedH = 4.50;
          notes = 'Approved half day duty';
        } else if ((eIdx + dIdx + offset) % 23 === 0) {
          // Absent
          status = 'Absent';
          checkIn = null;
          checkOut = null;
          breakH = 0.00;
          workedH = 0.00;
          notes = 'Unscheduled absence';
          lat = null;
          lng = null;
          verified = 0;
        }

        const cIn = checkIn ? `'${checkIn}'` : 'NULL';
        const cOut = checkOut ? `'${checkOut}'` : 'NULL';
        const lLat = lat ? lat.toFixed(7) : 'NULL';
        const lLng = lng ? lng.toFixed(7) : 'NULL';
        const wLoc = locId ? locId : 'NULL';

        attendanceRows.push(`(${empId}, '${d}', ${cIn}, ${cOut}, ${breakH.toFixed(2)}, ${workedH.toFixed(2)}, '${status}', '${notes}', ${lLat}, ${lLng}, 15.00, 45.00, ${verified}, ${wLoc})`);
      });
    });
  }

  generateAttendance(cohort1Emps, week1Dates, 0); // 125 records
  generateAttendance(cohort2Emps, week2Dates, 5); // 125 records

  sqlStatements.push(`INSERT INTO attendance (employee_id, date, check_in, check_out, break_hours, worked_hours, status, notes, latitude, longitude, accuracy, distance_meters, location_verified, work_location_id) VALUES
${attendanceRows.join(',\n')}
ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), check_out = VALUES(check_out), status = VALUES(status), worked_hours = VALUES(worked_hours), notes = VALUES(notes);\n`);

  // 7. Multi-Month Payruns (May 2026, June 2026, July 2026, August 2026, and Draft September 2026)
  sqlStatements.push('-- 7. Payruns (May, June, July, August, September 2026)');
  sqlStatements.push(`INSERT INTO payruns (id, name, salary_structure_id, period_start, period_end, pay_date, status, total_gross, total_deductions, total_net, created_by, validated_by, paid_at) VALUES
(2, 'Regular Payrun - August 2026', 1, '2026-08-01', '2026-08-31', '2026-08-31', 'paid', 1850000.00, 180500.00, 1669500.00, 1, 1, '2026-08-31 18:00:00'),
(3, 'Regular Payrun - June 2026', 1, '2026-06-01', '2026-06-30', '2026-06-30', 'paid', 625000.00, 61500.00, 563500.00, 1, 1, '2026-06-30 18:00:00'),
(4, 'Regular Payrun - May 2026', 1, '2026-05-01', '2026-05-31', '2026-05-31', 'paid', 740000.00, 72200.00, 667800.00, 1, 1, '2026-05-31 18:00:00'),
(5, 'Regular Payrun - September 2026', 1, '2026-09-01', '2026-09-30', '2026-09-30', 'draft', 0.00, 0.00, 0.00, 1, NULL, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), total_net = VALUES(total_net);\n`);

  function computePayslip(wage) {
    const basic = Math.round(wage * 0.50);
    const hra = Math.round(basic * 0.40);
    const trans = 3000.00;
    const special = Math.round(wage - basic - hra - trans);
    const gross = wage;
    const pf = Math.round(Math.min(basic, 15000) * 0.12);
    const pt = 200.00;
    const tds = Math.round(wage * 0.05);
    const deductions = pf + pt + tds;
    const net = gross - deductions;
    return { basic, hra, trans, special, gross, pf, pt, tds, deductions, net };
  }

  const payrunEmployees = [];
  const payslips = [];
  const payslipLines = [];

  let nextPayslipId = 101;
  let nextLineId = 1001;

  // Payrun 2: August 2026 (30 employees)
  const augEmpIds = [2, 5, 6, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 126, 127, 128, 129, 130];
  const augContracts = {
    2: 2, 5: 6, 6: 7,
    101: 101, 102: 102, 103: 103, 104: 104, 105: 105, 106: 106, 107: 107, 108: 108, 109: 109, 110: 110,
    111: 111, 112: 112, 113: 113, 114: 114, 115: 115, 116: 116, 117: 117, 118: 118, 119: 119, 120: 120,
    121: 121, 122: 122, 126: 126, 127: 127, 128: 128, 129: 129, 130: 130
  };
  const baseWages = { 2: 45000.00, 3: 60000.00, 4: 50000.00, 5: 38000.00, 6: 42000.00, ...wages };

  let augGrossSum = 0, augDedSum = 0, augNetSum = 0;
  augEmpIds.forEach(empId => {
    const contractId = augContracts[empId];
    const wage = baseWages[empId] || 50000.00;
    const calc = computePayslip(wage);
    augGrossSum += calc.gross;
    augDedSum += calc.deductions;
    augNetSum += calc.net;

    payrunEmployees.push(`(2, ${empId}, ${contractId}, 'included')`);
    const slipId = nextPayslipId++;
    payslips.push(`(${slipId}, 2, ${empId}, ${contractId}, 1, '2026-08-01', '2026-08-31', 22, 22.00, 0.00, 0.00, ${calc.gross.toFixed(2)}, ${calc.deductions.toFixed(2)}, ${calc.net.toFixed(2)}, 'paid', 1, '2026-08-31 18:30:00')`);

    payslipLines.push(`(${nextLineId++}, ${slipId}, 1, 'BASIC', 'Basic Salary', 'Basic', 1, ${calc.basic.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 2, 'HRA', 'House Rent Allowance', 'Allowance', 2, ${calc.hra.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 3, 'TRANS', 'Transport Allowance', 'Allowance', 3, ${calc.trans.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 4, 'SPECIAL', 'Special Allowance', 'Allowance', 4, ${calc.special.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 5, 'GROSS', 'Gross Salary', 'Gross', 5, ${calc.gross.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 6, 'PF', 'Provident Fund (PF)', 'Deduction', 6, ${calc.pf.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 7, 'PT', 'Professional Tax (PT)', 'Deduction', 7, ${calc.pt.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 8, 'TDS', 'TDS / Income Tax', 'Deduction', 8, ${calc.tds.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 9, 'NET', 'Net Salary', 'Net', 9, ${calc.net.toFixed(2)})`);
  });

  // Payrun 3: June 2026 (10 employees)
  const junEmpIds = [2, 3, 4, 101, 103, 105, 111, 115, 119, 125];
  const junContracts = { 2: 1, 3: 4, 4: 5, 101: 101, 103: 103, 105: 105, 111: 111, 115: 115, 119: 119, 125: 125 };
  const junWages = { 2: 35000.00, 3: 60000.00, 4: 50000.00, 101: 95000.00, 103: 85000.00, 105: 72000.00, 111: 78000.00, 115: 68000.00, 119: 75000.00, 125: 35000.00 };

  let junGrossSum = 0, junDedSum = 0, junNetSum = 0;
  junEmpIds.forEach(empId => {
    const contractId = junContracts[empId];
    const wage = junWages[empId];
    const calc = computePayslip(wage);
    junGrossSum += calc.gross;
    junDedSum += calc.deductions;
    junNetSum += calc.net;

    payrunEmployees.push(`(3, ${empId}, ${contractId}, 'included')`);
    const slipId = nextPayslipId++;
    payslips.push(`(${slipId}, 3, ${empId}, ${contractId}, 1, '2026-06-01', '2026-06-30', 22, 22.00, 0.00, 0.00, ${calc.gross.toFixed(2)}, ${calc.deductions.toFixed(2)}, ${calc.net.toFixed(2)}, 'paid', 1, '2026-06-30 18:30:00')`);

    payslipLines.push(`(${nextLineId++}, ${slipId}, 1, 'BASIC', 'Basic Salary', 'Basic', 1, ${calc.basic.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 2, 'HRA', 'House Rent Allowance', 'Allowance', 2, ${calc.hra.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 3, 'TRANS', 'Transport Allowance', 'Allowance', 3, ${calc.trans.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 4, 'SPECIAL', 'Special Allowance', 'Allowance', 4, ${calc.special.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 5, 'GROSS', 'Gross Salary', 'Gross', 5, ${calc.gross.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 6, 'PF', 'Provident Fund (PF)', 'Deduction', 6, ${calc.pf.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 7, 'PT', 'Professional Tax (PT)', 'Deduction', 7, ${calc.pt.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 8, 'TDS', 'TDS / Income Tax', 'Deduction', 8, ${calc.tds.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 9, 'NET', 'Net Salary', 'Net', 9, ${calc.net.toFixed(2)})`);
  });

  // Payrun 4: May 2026 (12 employees)
  const mayEmpIds = [2, 3, 4, 101, 103, 105, 111, 115, 119, 126, 128, 131];
  const mayContracts = { 2: 1, 3: 4, 4: 5, 101: 101, 103: 103, 105: 105, 111: 111, 115: 115, 119: 119, 126: 126, 128: 128, 131: 131 };
  const mayWages = { 2: 35000.00, 3: 60000.00, 4: 50000.00, 101: 95000.00, 103: 85000.00, 105: 72000.00, 111: 78000.00, 115: 68000.00, 119: 75000.00, 126: 88000.00, 128: 76000.00, 131: 65000.00 };

  let mayGrossSum = 0, mayDedSum = 0, mayNetSum = 0;
  mayEmpIds.forEach(empId => {
    const contractId = mayContracts[empId];
    const wage = mayWages[empId];
    const calc = computePayslip(wage);
    mayGrossSum += calc.gross;
    mayDedSum += calc.deductions;
    mayNetSum += calc.net;

    payrunEmployees.push(`(4, ${empId}, ${contractId}, 'included')`);
    const slipId = nextPayslipId++;
    payslips.push(`(${slipId}, 4, ${empId}, ${contractId}, 1, '2026-05-01', '2026-05-31', 22, 22.00, 0.00, 0.00, ${calc.gross.toFixed(2)}, ${calc.deductions.toFixed(2)}, ${calc.net.toFixed(2)}, 'paid', 1, '2026-05-31 18:30:00')`);

    payslipLines.push(`(${nextLineId++}, ${slipId}, 1, 'BASIC', 'Basic Salary', 'Basic', 1, ${calc.basic.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 2, 'HRA', 'House Rent Allowance', 'Allowance', 2, ${calc.hra.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 3, 'TRANS', 'Transport Allowance', 'Allowance', 3, ${calc.trans.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 4, 'SPECIAL', 'Special Allowance', 'Allowance', 4, ${calc.special.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 5, 'GROSS', 'Gross Salary', 'Gross', 5, ${calc.gross.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 6, 'PF', 'Provident Fund (PF)', 'Deduction', 6, ${calc.pf.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 7, 'PT', 'Professional Tax (PT)', 'Deduction', 7, ${calc.pt.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 8, 'TDS', 'TDS / Income Tax', 'Deduction', 8, ${calc.tds.toFixed(2)})`);
    payslipLines.push(`(${nextLineId++}, ${slipId}, 9, 'NET', 'Net Salary', 'Net', 9, ${calc.net.toFixed(2)})`);
  });

  sqlStatements.push(`-- Update payrun totals to match exact line sums
UPDATE payruns SET total_gross = ${augGrossSum.toFixed(2)}, total_deductions = ${augDedSum.toFixed(2)}, total_net = ${augNetSum.toFixed(2)} WHERE id = 2;
UPDATE payruns SET total_gross = ${junGrossSum.toFixed(2)}, total_deductions = ${junDedSum.toFixed(2)}, total_net = ${junNetSum.toFixed(2)} WHERE id = 3;
UPDATE payruns SET total_gross = ${mayGrossSum.toFixed(2)}, total_deductions = ${mayDedSum.toFixed(2)}, total_net = ${mayNetSum.toFixed(2)} WHERE id = 4;\n`);

  sqlStatements.push('-- Payrun Employees');
  sqlStatements.push(`INSERT INTO payrun_employees (payrun_id, employee_id, contract_id, status) VALUES
${payrunEmployees.join(',\n')}
ON DUPLICATE KEY UPDATE status = VALUES(status);\n`);

  sqlStatements.push('-- Payslips');
  sqlStatements.push(`INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, scheduled_days, worked_days, absent_days, leave_days, gross_salary, total_deductions, net_salary, status, email_sent, email_sent_at) VALUES
${payslips.join(',\n')}
ON DUPLICATE KEY UPDATE net_salary = VALUES(net_salary), status = VALUES(status);\n`);

  sqlStatements.push('-- Payslip Lines');
  sqlStatements.push(`INSERT INTO payslip_lines (id, payslip_id, rule_id, code, name, category, sequence, amount) VALUES
${payslipLines.join(',\n')}
ON DUPLICATE KEY UPDATE amount = VALUES(amount);\n`);

  // 8. Notifications (12 notifications)
  sqlStatements.push('-- 8. Notifications');
  const notifications = [
    [101, 1, 'August 2026 Payrun Completed', 'August 2026 company payroll across 30 employees has been successfully disbursed.', 'success', 0],
    [102, 3, 'Time-Off Approvals Required', '18 pending employee leave requests for September 2026 require HR manager approval.', 'info', 0],
    [103, 4, 'Compliance Reminder', 'Monthly PF and PT statutory submission deadline is approaching on September 15.', 'warning', 0],
    [104, 2, 'August 2026 Payslip Available', 'Your August 2026 payslip has been credited to your account.', 'success', 0],
    [105, 1, 'Draft Payrun Pending', 'September 2026 Payrun is currently in Draft status. Run computation to generate payslips.', 'warning', 0],
    [106, 4, 'Salary Structure Audit', 'Regular Full-Time Structure rules were successfully synced across 52 active contracts.', 'info', 0],
    [107, 3, 'Employee Roster Updated', '55 new employee records onboarded across Engineering, HR, Finance, Operations and Sales.', 'success', 0],
    [108, 2, 'Attendance Verified', 'Your weekly GPS-verified punches have been approved by operations.', 'info', 1]
  ];
  sqlStatements.push(`INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
${notifications.map(n => `(${n[0]}, ${n[1]}, '${n[2]}', '${n[3]}', '${n[4]}', ${n[5]})`).join(',\n')}
ON DUPLICATE KEY UPDATE title = VALUES(title), message = VALUES(message);\n`);

  // 9. Audit Logs (12 audit logs)
  sqlStatements.push('-- 9. Audit Logs');
  const auditLogs = [
    [101, 1, 'PAYRUN_COMPUTED', 'payrun', 2, '{"payrun_id": 2, "period": "August 2026", "employees_count": 30}'],
    [102, 1, 'PAYRUN_PAID', 'payrun', 2, '{"payrun_id": 2, "disbursed_net": ' + augNetSum.toFixed(2) + ', "paid_at": "2026-08-31 18:00:00"}'],
    [103, 3, 'LEAVE_REQUEST_APPROVED', 'time_off_request', 101, '{"employee_id": 101, "days": 2.00, "approver_id": 3}'],
    [104, 1, 'EMPLOYEE_PROMOTION', 'contract', 101, '{"employee_id": 101, "new_wage": 95000.00, "contract_code": "CON-2026-101"}'],
    [105, 1, 'PAYRUN_CREATED', 'payrun', 5, '{"payrun_id": 5, "period": "September 2026", "status": "draft"}'],
    [106, 4, 'STATUTORY_REVISION', 'salary_rule', 6, '{"rule": "PF", "rate": 0.12, "cap": 15000.00}'],
    [107, 3, 'BULK_ATTENDANCE_LOG', 'attendance', 100, '{"date_range": "2026-08-10 to 2026-08-21", "records_count": 250}'],
    [108, 1, 'SYSTEM_HEALTH_CHECK', 'system', 1, '{"status": "optimal", "active_employees": 55, "total_contracts": 71}']
  ];
  sqlStatements.push(`INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES
${auditLogs.map(a => `(${a[0]}, ${a[1]}, '${a[2]}', '${a[3]}', ${a[4]}, '${a[5]}')`).join(',\n')}
ON DUPLICATE KEY UPDATE action = VALUES(action);\n`);

  const fullSql = sqlStatements.join('\n');
  const outPath = path.resolve(__dirname, 'demo_data.sql');
  fs.writeFileSync(outPath, fullSql, 'utf8');
  console.log(`Saved SQL to ${outPath} (${(fullSql.length / 1024).toFixed(1)} KB)`);

  // Connect to MySQL and execute
  console.log('Connecting to MySQL database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'peoplepay360',
    multipleStatements: true
  });

  console.log('Executing expanded demo data SQL statements...');
  await conn.query(fullSql);
  console.log('Demo data SQL execution complete!');

  // Validate record counts
  console.log('\n=== RECORD COUNTS AFTER EXPANDED DEMO DATA INSERTION ===');
  const tables = [
    'departments', 'job_positions', 'employees', 'contracts',
    'time_off_allocations', 'time_off_requests', 'attendance',
    'payruns', 'payrun_employees', 'payslips', 'payslip_lines',
    'notifications', 'audit_logs'
  ];

  let totalRecords = 0;
  for (const t of tables) {
    const [[{ count }]] = await conn.query(`SELECT COUNT(*) as count FROM ${t}`);
    console.log(`  ${t.padEnd(25)}: ${count}`);
    totalRecords += Number(count);
  }
  console.log(`\nTotal records across core tables: ${totalRecords}`);

  // Foreign Key Integrity Check
  console.log('\n=== CHECKING FOREIGN KEY INTEGRITY ===');
  const orphanChecks = [
    { name: 'employees -> departments', sql: 'SELECT COUNT(*) as c FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.department_id IS NOT NULL AND d.id IS NULL' },
    { name: 'employees -> job_positions', sql: 'SELECT COUNT(*) as c FROM employees e LEFT JOIN job_positions j ON e.job_position_id = j.id WHERE e.job_position_id IS NOT NULL AND j.id IS NULL' },
    { name: 'contracts -> employees', sql: 'SELECT COUNT(*) as c FROM contracts c LEFT JOIN employees e ON c.employee_id = e.id WHERE e.id IS NULL' },
    { name: 'attendance -> employees', sql: 'SELECT COUNT(*) as c FROM attendance a LEFT JOIN employees e ON a.employee_id = e.id WHERE e.id IS NULL' },
    { name: 'time_off_requests -> employees', sql: 'SELECT COUNT(*) as c FROM time_off_requests r LEFT JOIN employees e ON r.employee_id = e.id WHERE e.id IS NULL' },
    { name: 'payslips -> payruns', sql: 'SELECT COUNT(*) as c FROM payslips p LEFT JOIN payruns pr ON p.payrun_id = pr.id WHERE pr.id IS NULL' },
    { name: 'payslips -> employees', sql: 'SELECT COUNT(*) as c FROM payslips p LEFT JOIN employees e ON p.employee_id = e.id WHERE e.id IS NULL' },
    { name: 'payslip_lines -> payslips', sql: 'SELECT COUNT(*) as c FROM payslip_lines pl LEFT JOIN payslips p ON pl.payslip_id = p.id WHERE p.id IS NULL' }
  ];

  let anyOrphan = false;
  for (const check of orphanChecks) {
    const [[{ c }]] = await conn.query(check.sql);
    if (c > 0) {
      console.error(`  FAIL: ${check.name} has ${c} orphan records!`);
      anyOrphan = true;
    } else {
      console.log(`  PASS: ${check.name} (0 orphans)`);
    }
  }

  if (anyOrphan) {
    throw new Error('Integrity check failed: orphan records detected.');
  }

  // Contract overlap check
  console.log('\n=== CHECKING CONTRACT OVERLAPS ===');
  const [overlappingContracts] = await conn.query(`
    SELECT c1.employee_id, c1.id AS c1_id, c2.id AS c2_id, c1.start_date AS c1_start, c1.end_date AS c1_end, c2.start_date AS c2_start, c2.end_date AS c2_end
    FROM contracts c1
    JOIN contracts c2 ON c1.employee_id = c2.employee_id AND c1.id < c2.id
    WHERE (c1.end_date IS NULL OR c1.end_date >= c2.start_date)
      AND (c2.end_date IS NULL OR c2.end_date >= c1.start_date)
  `);

  if (overlappingContracts.length > 0) {
    console.error('FAIL: Overlapping contracts detected:', overlappingContracts);
    throw new Error('Overlapping contracts detected!');
  } else {
    console.log('PASS: Zero overlapping contracts across all employees!');
  }

  // End-to-End Tracing of 5 complete employees
  console.log('\n=== END-TO-END TRACE VERIFICATION (5 EMPLOYEES) ===');
  const traceEmpIds = [
    { id: 101, name: 'Rajesh Iyer (Engineering Architect)' },
    { id: 105, name: 'Rohan Kulkarni (Senior Developer)' },
    { id: 111, name: 'Harish Reddy (Tax & Compliance Manager)' },
    { id: 115, name: 'Vivek Singhania (Operations Lead)' },
    { id: 2, name: 'Rahul Sharma (Base Demo Employee)' }
  ];

  for (const tEmp of traceEmpIds) {
    const testEmpId = tEmp.id;
    const [[emp]] = await conn.query('SELECT id, employee_code, first_name, last_name, email, department_id, job_position_id FROM employees WHERE id = ?', [testEmpId]);
    const [empContracts] = await conn.query('SELECT id, contract_code, start_date, end_date, wage, status FROM contracts WHERE employee_id = ? ORDER BY start_date ASC', [testEmpId]);
    const [empAttendance] = await conn.query('SELECT id, date, status, worked_hours FROM attendance WHERE employee_id = ? ORDER BY date ASC', [testEmpId]);
    const [empLeaves] = await conn.query('SELECT id, start_date, end_date, days_requested, status FROM time_off_requests WHERE employee_id = ?', [testEmpId]);
    const [empPayslips] = await conn.query('SELECT ps.id, ps.payrun_id, pr.name as payrun_name, ps.net_salary, ps.gross_salary, ps.status FROM payslips ps JOIN payruns pr ON ps.payrun_id = pr.id WHERE ps.employee_id = ? ORDER BY ps.period_start ASC', [testEmpId]);

    console.log(`\n--- TRACE: ${tEmp.name} ---`);
    console.log(`  1. Employee: [${emp.employee_code}] ${emp.first_name} ${emp.last_name} (${emp.email})`);
    console.log(`  2. Contracts: ${empContracts.length} contract(s) ->`, empContracts.map(c => `${c.contract_code} (₹${c.wage}, ${c.status})`).join(' | '));
    console.log(`  3. Attendance: ${empAttendance.length} punch record(s) -> Sample: ${empAttendance.slice(0, 3).map(a => `${a.date}: ${a.status} (${a.worked_hours}h)`).join(', ')}...`);
    console.log(`  4. Leaves: ${empLeaves.length} request(s) ->`, empLeaves.map(l => `${l.start_date} (${l.days_requested}d, ${l.status})`).join(' | '));
    console.log(`  5. Payslips: ${empPayslips.length} payslip(s) ->`, empPayslips.map(p => `${p.payrun_name}: Net ₹${p.net_salary} (${p.status})`).join(' | '));
  }

  await conn.end();
  console.log('\nAll verifications passed with complete relational cohesion!');
}

main().catch(err => {
  console.error('Fatal error in generateDemoData:', err.sqlMessage || err.message || err);
  if (err.sql) console.error('Offending SQL snippet:', err.sql.slice(0, 300));
  process.exit(1);
});
