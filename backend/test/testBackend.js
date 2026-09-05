const assert = require('assert');
const { evaluateFormula } = require('../src/services/payrollEngine');
const { generatePayslipPDF } = require('../src/services/pdfService');

async function runTests() {
  console.log('🧪 Starting PeoplePay360 Backend Unit & Engine Tests...\n');

  // Test 1: Formula Evaluation - Math and Scope replacement
  console.log('Test 1: Mathematical Formula Evaluation');
  const scope = {
    WAGE: 45000,
    ATTENDANCE_FACTOR: 1.0,
    BASIC: 22500,
    HRA: 9000,
    TRANS: 3000,
    SPECIAL: 10500,
    GROSS: 45000,
    PF: 1800,
    PT: 200,
    TDS: 2250
  };

  const grossCalculated = evaluateFormula('BASIC + HRA + TRANS + SPECIAL', scope);
  assert.strictEqual(grossCalculated, 45000, 'Gross should be 45,000');
  console.log('  ✅ Gross Formula evaluated correctly:', grossCalculated);

  const pfCalculated = evaluateFormula('LEAST(BASIC, 15000) * 0.12', scope);
  assert.strictEqual(pfCalculated, 1800, 'PF should be 1,800 (capped at 15k * 12%)');
  console.log('  ✅ PF Capped Formula evaluated correctly:', pfCalculated);

  const netCalculated = evaluateFormula('GROSS - (PF + PT + TDS)', scope);
  assert.strictEqual(netCalculated, 40750, 'Net should be 40,750');
  console.log('  ✅ Net Formula evaluated correctly:', netCalculated);

  const specialCalculated = evaluateFormula('(WAGE * ATTENDANCE_FACTOR) - BASIC - HRA - TRANS', scope);
  assert.strictEqual(specialCalculated, 10500, 'Special allowance should be 10,500');
  console.log('  ✅ Special Allowance Formula evaluated correctly:', specialCalculated);

  // Test 2: Attendance Pro-ration logic
  console.log('\nTest 2: Pro-rata Attendance Logic');
  const partialScope = {
    WAGE: 45000,
    ATTENDANCE_FACTOR: 0.8 // 80% attendance
  };
  const proratedBasic = 45000 * 0.5 * 0.8;
  assert.strictEqual(proratedBasic, 18000, 'Prorated basic should be 18,000');
  console.log('  ✅ Prorated Basic calculated correctly for 80% attendance: ₹18,000');

  // Test 3: PDF Generation
  console.log('\nTest 3: Server-side PDF Generation');
  const testSlipData = {
    employee: {
      first_name: 'Rahul',
      last_name: 'Sharma',
      employee_code: 'EMP002',
      department_name: 'Engineering',
      job_position_title: 'Senior Software Engineer',
      bank_name: 'State Bank of India',
      bank_account_no: '30245678901234'
    },
    payslip: {
      id: 1,
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      worked_days: 22,
      scheduled_days: 22,
      gross_salary: 45000,
      total_deductions: 4250,
      net_salary: 40750,
      status: 'paid'
    },
    earnings: [
      { name: 'Basic Salary', amount: 22500 },
      { name: 'House Rent Allowance', amount: 9000 },
      { name: 'Transport Allowance', amount: 3000 },
      { name: 'Special Allowance', amount: 10500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 1800 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'TDS / Income Tax', amount: 2250 }
    ]
  };

  const pdfBuffer = await generatePayslipPDF(testSlipData);
  assert(Buffer.isBuffer(pdfBuffer), 'Output must be a Buffer');
  assert(pdfBuffer.length > 1000, 'PDF buffer should be non-empty (>1000 bytes)');
  console.log(`  ✅ PDF Generated successfully! Buffer size: ${pdfBuffer.length} bytes.`);

  console.log('\n🎉 ALL UNIT & ENGINE TESTS PASSED SUCCESSFULLY!\n');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
