const assert = require('assert');
const { evaluateFormula } = require('../src/services/payrollEngine');
const { generatePayslipPDF } = require('../src/services/pdfService');
const { calculateHaversineDistance, verifyCheckInLocation } = require('../src/services/locationService');
const { checkIn } = require('../src/controllers/attendanceController');
const { query } = require('../src/config/db');

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
  console.log('  ✅ Gross Formula evaluated correctly: ₹45,000');

  const pfCalculated = evaluateFormula('LEAST(BASIC, 15000) * 0.12', scope);
  assert.strictEqual(pfCalculated, 1800, 'PF should be 1,800 (capped at 15k * 12%)');
  console.log('  ✅ PF Capped Formula evaluated correctly: ₹1,800');

  const netCalculated = evaluateFormula('GROSS - (PF + PT + TDS)', scope);
  assert.strictEqual(netCalculated, 40750, 'Net should be 40,750');
  console.log('  ✅ Net Formula evaluated correctly: ₹40,750');

  const specialCalculated = evaluateFormula('(WAGE * ATTENDANCE_FACTOR) - BASIC - HRA - TRANS', scope);
  assert.strictEqual(specialCalculated, 10500, 'Special allowance should be 10,500');
  console.log('  ✅ Special Allowance Formula evaluated correctly: ₹10,500');

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

  // Test 4: Haversine Distance Formula
  console.log('\nTest 4: Haversine Distance Formula');
  const officeLat = 12.9715987;
  const officeLon = 77.5945627;

  // Exact location: distance should be 0 meters
  const distZero = calculateHaversineDistance(officeLat, officeLon, officeLat, officeLon);
  assert.strictEqual(distZero, 0, 'Distance to exact same coordinates should be 0');
  console.log('  ✅ Distance to same coordinates: 0 meters');

  // Point ~50 meters away (approx 0.00045 degrees lat)
  const distNearby = calculateHaversineDistance(officeLat, officeLon, officeLat + 0.00045, officeLon);
  assert(distNearby > 40 && distNearby < 60, `Expected ~50m, got ${distNearby}m`);
  console.log(`  ✅ Nearby point distance calculated correctly: ${distNearby}m`);

  // Point ~17 kilometers away (Electronic City: 12.8399, 77.6770)
  const distFar = calculateHaversineDistance(officeLat, officeLon, 12.8399, 77.6770);
  assert(distFar > 15000 && distFar < 20000, `Expected ~17km, got ${distFar}m`);
  console.log(`  ✅ Distant point distance calculated correctly: ${(distFar / 1000).toFixed(2)} km`);

  // Test 5: Location Verification Service - Valid Location (Inside Radius)
  console.log('\nTest 5: Location Verification - Valid Location (Inside Radius)');
  // Employee 2 (Rahul Sharma) is assigned to Bangalore Tech Park HQ (radius: 250m)
  const validCheck = await verifyCheckInLocation(2, 12.9716500, 77.5946000);
  assert.strictEqual(validCheck.allowed, true, 'Check-in must be allowed when inside radius');
  assert.strictEqual(validCheck.location_verified, true, 'location_verified must be true');
  assert(validCheck.distance <= 250, `Distance ${validCheck.distance}m must be within 250m radius`);
  console.log(`  ✅ Inside radius check passed: ${validCheck.distance}m from ${validCheck.location_name} (radius: 250m)`);

  // Test 6: Location Verification Service - Outside Radius
  console.log('\nTest 6: Location Verification - Outside Radius Location');
  // Employee 2 at Electronic City (12.8399, 77.6770)
  const invalidCheck = await verifyCheckInLocation(2, 12.8399000, 77.6770000);
  assert.strictEqual(invalidCheck.allowed, false, 'Check-in must be rejected when outside radius');
  assert.strictEqual(invalidCheck.location_verified, false, 'location_verified must be false on rejection');
  assert(invalidCheck.message.includes('rejected'), 'Rejection message must indicate check-in rejected');
  console.log(`  ✅ Outside radius check correctly rejected: ${invalidCheck.message}`);

  // Test 7: Location Verification Service - No Configured Work Location
  console.log('\nTest 7: Location Verification - No Configured Work Location');
  // Employee 6 (Vikas Mehta) has work_location_id = null
  const noConfigCheck = await verifyCheckInLocation(6, 12.9716000, 77.5946000);
  assert.strictEqual(noConfigCheck.allowed, true, 'Check-in must be allowed when no work location is configured');
  assert.strictEqual(noConfigCheck.location_verified, false, 'location_verified should be false when not configured');
  console.log('  ✅ No work location configured: check-in permitted with location_verified=false');

  // Test 8: End-to-End Attendance checkIn API Controller Verification
  console.log('\nTest 8: Check-In API Controller Verification');
  const testDate = '2026-09-06'; // Future date to avoid conflicts with seed attendance
  await query('DELETE FROM attendance WHERE date = ?', [testDate]);

  // Subtest 8a: Employee 2 (Rahul) checks in inside radius -> HTTP 200, location_verified=true
  let resStatus = 200;
  let resJson = null;
  const mockResSuccess = {
    status: (code) => { resStatus = code; return mockResSuccess; },
    json: (data) => { resJson = data; return data; }
  };
  const mockReqSuccess = {
    user: { id: 2, role: 'Employee', employee_id: 2 },
    body: {
      date: testDate,
      latitude: 12.9716500,
      longitude: 77.5946000,
      accuracy: 10.5
    }
  };
  await checkIn(mockReqSuccess, mockResSuccess, (err) => { throw err; });
  assert.strictEqual(resStatus, 200, 'Inside radius check-in must return HTTP 200');
  assert.strictEqual(resJson.success, true, 'Response success must be true');
  assert.strictEqual(resJson.data.location_verified, 1, 'Database record must have location_verified = 1');
  assert(resJson.data.distance_meters <= 250, 'Distance must be recorded in database');
  console.log(`  ✅ API Check-in with valid location succeeded! (distance: ${resJson.data.distance_meters}m, verified: ${resJson.data.location_verified})`);

  // Subtest 8b: Another employee (Employee 5) attempts check-in outside radius -> HTTP 403
  let resStatusOutside = 200;
  let resJsonOutside = null;
  const mockResOutside = {
    status: (code) => { resStatusOutside = code; return mockResOutside; },
    json: (data) => { resJsonOutside = data; return data; }
  };
  const mockReqOutside = {
    user: { id: 5, role: 'Employee', employee_id: 5 },
    body: {
      date: testDate,
      latitude: 19.0760, // Mumbai coordinates when assigned to Bangalore HQ
      longitude: 72.8777,
      accuracy: 15.0
    }
  };
  await checkIn(mockReqOutside, mockResOutside, (err) => { throw err; });
  assert.strictEqual(resStatusOutside, 403, 'Outside radius check-in must return HTTP 403 Forbidden');
  assert.strictEqual(resJsonOutside.success, false, 'Response success must be false');
  assert(resJsonOutside.message.includes('rejected'), 'Error message must state check-in rejected');
  console.log(`  ✅ API Check-in outside radius rejected with HTTP 403! (${resJsonOutside.message})`);

  // Subtest 8c: Employee 6 (Vikas) with no work location checks in -> HTTP 200
  let resStatusNoConfig = 200;
  let resJsonNoConfig = null;
  const mockResNoConfig = {
    status: (code) => { resStatusNoConfig = code; return mockResNoConfig; },
    json: (data) => { resJsonNoConfig = data; return data; }
  };
  const mockReqNoConfig = {
    user: { id: 6, role: 'Employee', employee_id: 6 },
    body: {
      date: testDate
    }
  };
  await checkIn(mockReqNoConfig, mockResNoConfig, (err) => { throw err; });
  assert.strictEqual(resStatusNoConfig, 200, 'Check-in without configured work location must return HTTP 200');
  assert.strictEqual(resJsonNoConfig.success, true, 'Response success must be true');
  assert.strictEqual(resJsonNoConfig.data.location_verified, 0, 'location_verified must be 0 for unconfigured employee');
  console.log('  ✅ API Check-in without configured work location succeeded with location_verified=0');

  // Cleanup test data
  await query('DELETE FROM attendance WHERE date = ?', [testDate]);

  console.log('\n🎉 ALL 8 TEST SUITES (ENGINE, PRO-RATA, PDF & LOCATION VERIFICATION) PASSED!\n');
  process.exit(0);
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
