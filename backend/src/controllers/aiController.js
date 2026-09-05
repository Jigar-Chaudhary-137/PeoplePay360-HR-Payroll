const { query } = require('../config/db');
const { detectPayrunAnomalies } = require('../services/anomalyService');

/**
 * Gathers relevant contextual data from the database based on keywords in the question
 */
async function gatherContext(question) {
  const q = question.toLowerCase();
  const context = {};

  // 1. Department Salaries
  if (q.includes('department') || q.includes('cost') || q.includes('highest') || q.includes('lowest') || q.includes('overview')) {
    context.departmentCosts = await query(
      `SELECT d.name AS department, COUNT(DISTINCT e.id) AS employees,
              IFNULL(SUM(ps.net_salary), 0) AS total_net_cost
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id
       LEFT JOIN payslips ps ON e.id = ps.employee_id
       GROUP BY d.id, d.name
       ORDER BY total_net_cost DESC`
    );
  }

  // 2. Individual Employee (e.g. Rahul Sharma, Priya, Neha, Vikas, etc.)
  const [matchingEmp] = await query(
    `SELECT id, employee_code, first_name, last_name, email, department_id, bank_account_no
     FROM employees
     WHERE LOWER(?) LIKE CONCAT('%', LOWER(first_name), '%')
        OR LOWER(?) LIKE CONCAT('%', LOWER(last_name), '%')
     LIMIT 1`,
    [q, q]
  );

  if (matchingEmp) {
    const empId = matchingEmp.id;
    context.targetEmployee = `${matchingEmp.first_name} ${matchingEmp.last_name} (${matchingEmp.employee_code})`;

    // Fetch employee contracts
    context.contracts = await query(
      'SELECT contract_code, start_date, end_date, wage, status FROM contracts WHERE employee_id = ? ORDER BY start_date DESC',
      [empId]
    );

    // Fetch employee recent payslips
    context.payslips = await query(
      'SELECT period_start, period_end, worked_days, absent_days, leave_days, gross_salary, total_deductions, net_salary, status FROM payslips WHERE employee_id = ? ORDER BY period_start DESC LIMIT 3',
      [empId]
    );

    // Fetch approved leaves
    context.approvedLeaves = await query(
      `SELECT tor.start_date, tor.end_date, tor.days_requested, tot.name AS leave_type, tor.reason
       FROM time_off_requests tor
       JOIN time_off_types tot ON tor.time_off_type_id = tot.id
       WHERE tor.employee_id = ? AND tor.status = 'Approved'`,
      [empId]
    );
  }

  // 3. Payrun summary
  const payruns = await query('SELECT id, name, period_start, period_end, total_net, status FROM payruns ORDER BY period_start DESC LIMIT 3');
  context.recentPayruns = payruns;

  // 4. Anomalies if asked
  if (q.includes('anomal') || q.includes('unusual') || q.includes('problem') || q.includes('issue') || q.includes('warning')) {
    if (payruns && payruns.length > 0) {
      context.latestAnomalies = await detectPayrunAnomalies(payruns[0].id);
    }
  }

  return context;
}

/**
 * Intelligent deterministic response generator when no external LLM key is configured
 */
function generateContextualAnswer(question, context) {
  const q = question.toLowerCase();

  // Question: Why did Rahul's salary decrease / change?
  if (context.targetEmployee && (q.includes('decrease') || q.includes('increase') || q.includes('change') || q.includes('why'))) {
    const slips = context.payslips || [];
    if (slips.length >= 2) {
      const curr = slips[0];
      const prev = slips[1];
      const diff = Number(curr.net_salary) - Number(prev.net_salary);
      const isDecrease = diff < 0;

      let explanation = `${context.targetEmployee}'s net salary ${isDecrease ? 'decreased' : 'increased'} by ₹${Math.abs(diff).toLocaleString()} (from ₹${Number(prev.net_salary).toLocaleString()} in ${prev.period_start} to ₹${Number(curr.net_salary).toLocaleString()} in ${curr.period_start}).\n\nKey Contributing Factors:\n`;
      if (curr.absent_days > 0) {
        explanation += `• Recorded ${curr.absent_days} unpaid absent day(s) during the period.\n`;
      }
      if (curr.leave_days > 0) {
        explanation += `• Utilized ${curr.leave_days} approved leave day(s).\n`;
      }
      explanation += `• Gross Salary: ₹${Number(curr.gross_salary).toLocaleString()} vs Previous Gross: ₹${Number(prev.gross_salary).toLocaleString()}.\n`;
      explanation += `• Statutory & Voluntary Deductions: ₹${Number(curr.total_deductions).toLocaleString()}.\n`;

      return explanation;
    } else if (slips.length === 1) {
      const s = slips[0];
      return `${context.targetEmployee} has 1 recorded payrun for ${s.period_start} to ${s.period_end} with Gross Salary: ₹${Number(s.gross_salary).toLocaleString()}, Deductions: ₹${Number(s.total_deductions).toLocaleString()}, and Net Salary: ₹${Number(s.net_salary).toLocaleString()} (${s.worked_days} worked days).`;
    }
  }

  // Question: Which department has highest salary cost?
  if (q.includes('highest') && (q.includes('department') || q.includes('cost'))) {
    const depts = context.departmentCosts || [];
    if (depts.length > 0) {
      const top = depts[0];
      return `The department with the highest total salary cost is **${top.department}** with a cumulative net payroll of **₹${Number(top.total_net_cost).toLocaleString()}** across ${top.employees} employee(s).`;
    }
  }

  // Question: How many approved leaves does [Employee] have?
  if (context.targetEmployee && (q.includes('leave') || q.includes('time off'))) {
    const leaves = context.approvedLeaves || [];
    const totalDays = leaves.reduce((sum, l) => sum + Number(l.days_requested), 0);
    return `${context.targetEmployee} currently has **${totalDays} approved leave day(s)** recorded in the system across ${leaves.length} approved request(s).`;
  }

  // Question: Show employees with attendance problems or anomalies
  if (q.includes('anomal') || q.includes('problem') || q.includes('unusual') || q.includes('issue')) {
    const anomalies = context.latestAnomalies || [];
    if (anomalies.length > 0) {
      let msg = `Found **${anomalies.length} active payroll / HR anomaly alert(s)**:\n\n`;
      anomalies.forEach((a, idx) => {
        msg += `${idx + 1}. **[${a.severity}] ${a.type}** — ${a.employeeName}: ${a.reason}\n`;
      });
      return msg;
    } else {
      return 'No active anomalies or attendance issues were detected in the latest payrun period.';
    }
  }

  // Default summary response
  return `Based on live PeoplePay360 database records:\n• Total Active Payruns: ${context.recentPayruns?.length || 0}\n• Total Departments Configured: ${context.departmentCosts?.length || 0}\n• System Anomaly Engine: Active and monitoring payruns.\n\nPlease ask any specific question regarding employee salaries, contract wages, department costs, or leave balances!`;
}

async function askAI(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question prompt is required.' });
    }

    const context = await gatherContext(question);

    // If Gemini API Key is available in environment, call Gemini
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are the PeoplePay360 Intelligent HR & Payroll Assistant. 
Answer the user's question accurately using ONLY the provided database context.
Do NOT hallucinate numbers or invent data. If the answer cannot be found in the context, state that clearly.

Live Database Context:
${JSON.stringify(context, null, 2)}

User Question:
${question}`
                    }
                  ]
                }
              ]
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return res.json({
              success: true,
              data: {
                answer,
                source: 'gemini-llm',
                contextUsed: Object.keys(context)
              }
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ External Gemini call failed, falling back to local NLP engine:', err.message);
      }
    }

    // Built-in intelligent fallback
    const answer = generateContextualAnswer(question, context);
    return res.json({
      success: true,
      data: {
        answer,
        source: 'peoplepay360-nlp-engine',
        contextUsed: Object.keys(context)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  askAI
};
