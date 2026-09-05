<<<<<<< HEAD
const { query, withTransaction } = require('../config/db');

// List all working schedules with daily breakdown
async function getSchedules(req, res) {
  const schedules = await query('SELECT * FROM working_schedules ORDER BY id ASC');

  for (const s of schedules) {
    const days = await query('SELECT * FROM schedule_days WHERE schedule_id = ? ORDER BY day_of_week ASC', [s.id]);
    s.days = days;
  }

  return res.json({ success: true, count: schedules.length, data: schedules });
}

// Get single schedule
async function getScheduleById(req, res) {
  const { id } = req.params;
  const schedules = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);

  if (schedules.length === 0) {
    return res.status(404).json({ success: false, message: 'Working schedule not found' });
  }

  const schedule = schedules[0];
  schedule.days = await query('SELECT * FROM schedule_days WHERE schedule_id = ? ORDER BY day_of_week ASC', [id]);

  return res.json({ success: true, data: schedule });
}

// Create working schedule with calculated weekly hours
async function createSchedule(req, res) {
  const { name, company, timezone, days } = req.body;

  if (!name || !days || !Array.isArray(days) || days.length === 0) {
    return res.status(400).json({ success: false, message: 'Schedule name and days configuration are required.' });
  }

  // Calculate weekly hours and active days count dynamically
  let totalWeeklyHours = 0;
  let activeDaysCount = 0;

  const processedDays = days.map(d => {
    // Calculate daily work hours: (end_time - start_time) - break_hours
    const [sh, sm] = d.start_time.split(':').map(Number);
    const [eh, em] = d.end_time.split(':').map(Number);
    const startMinutes = (sh * 60) + sm;
    const endMinutes = (eh * 60) + em;
    const grossHours = Math.max(0, (endMinutes - startMinutes) / 60);
    const breakHours = Number(d.break_hours) || 1.00;
    const workHours = Math.max(0, grossHours - breakHours);

    if (workHours > 0) {
      activeDaysCount++;
      totalWeeklyHours += workHours;
    }

    return {
      day_of_week: d.day_of_week,
      day_name: d.day_name,
      start_time: d.start_time,
      end_time: d.end_time,
      break_hours: breakHours,
      work_hours: workHours
    };
  });

  const schedId = await withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO working_schedules (name, days_per_week, hours_per_week, company, timezone)
       VALUES (?, ?, ?, ?, ?)`,
      [name, activeDaysCount, totalWeeklyHours, company || 'PeoplePay360 Global', timezone || 'Asia/Kolkata']
    );

    const insertedId = res.insertId;

    for (const d of processedDays) {
      await conn.query(
        `INSERT INTO schedule_days (schedule_id, day_of_week, day_name, start_time, end_time, break_hours, work_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [insertedId, d.day_of_week, d.day_name, d.start_time, d.end_time, d.break_hours, d.work_hours]
      );
    }

    return insertedId;
  });

  return res.status(201).json({
    success: true,
    message: `Schedule "${name}" created with ${totalWeeklyHours} weekly hours.`,
    schedule_id: schedId,
    hours_per_week: totalWeeklyHours
  });
}

// Update schedule
async function updateSchedule(req, res) {
  const { id } = req.params;
  const { name, company, timezone, days } = req.body;

  let totalWeeklyHours = 0;
  let activeDaysCount = 0;

  const processedDays = (days || []).map(d => {
    const [sh, sm] = d.start_time.split(':').map(Number);
    const [eh, em] = d.end_time.split(':').map(Number);
    const startMinutes = (sh * 60) + sm;
    const endMinutes = (eh * 60) + em;
    const grossHours = Math.max(0, (endMinutes - startMinutes) / 60);
    const breakHours = Number(d.break_hours) || 1.00;
    const workHours = Math.max(0, grossHours - breakHours);

    if (workHours > 0) {
      activeDaysCount++;
      totalWeeklyHours += workHours;
    }

    return {
      day_of_week: d.day_of_week,
      day_name: d.day_name,
      start_time: d.start_time,
      end_time: d.end_time,
      break_hours: breakHours,
      work_hours: workHours
    };
  });

  await withTransaction(async (conn) => {
    await conn.query(
      `UPDATE working_schedules SET
         name = ?, days_per_week = ?, hours_per_week = ?, company = ?, timezone = ?
       WHERE id = ?`,
      [name, activeDaysCount, totalWeeklyHours, company, timezone, id]
    );

    if (processedDays.length > 0) {
      await conn.query('DELETE FROM schedule_days WHERE schedule_id = ?', [id]);
      for (const d of processedDays) {
        await conn.query(
          `INSERT INTO schedule_days (schedule_id, day_of_week, day_name, start_time, end_time, break_hours, work_hours)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, d.day_of_week, d.day_name, d.start_time, d.end_time, d.break_hours, d.work_hours]
        );
      }
    }
  });

  return res.json({ success: true, message: 'Schedule updated successfully.' });
=======
const { query, getTransactionConnection } = require('../config/db');

function calculateHours(startTime, endTime, breakHours) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const workedMins = Math.max(0, endMins - startMins - (breakHours * 60));
  return Math.round((workedMins / 60) * 100) / 100;
}

async function getSchedules(req, res, next) {
  try {
    const schedules = await query(
      `SELECT ws.*, COUNT(sd.id) AS days_configured
       FROM working_schedules ws
       LEFT JOIN schedule_days sd ON ws.id = sd.schedule_id
       GROUP BY ws.id
       ORDER BY ws.id ASC`
    );

    for (const s of schedules) {
      s.days = await query(
        'SELECT * FROM schedule_days WHERE schedule_id = ? ORDER BY id ASC',
        [s.id]
      );
    }

    return res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
}

async function getScheduleById(req, res, next) {
  try {
    const { id } = req.params;
    const [schedule] = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `Schedule ${id} not found.`
      });
    }

    schedule.days = await query(
      'SELECT * FROM schedule_days WHERE schedule_id = ? ORDER BY id ASC',
      [id]
    );

    return res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
}

async function createSchedule(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { name, timezone = 'Asia/Kolkata', days = [] } = req.body;
    if (!name) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Schedule name is required.' });
    }

    let totalHours = 0;
    const processedDays = days.map(d => {
      const calcH = calculateHours(d.start_time, d.end_time, Number(d.break_hours || 1));
      totalHours += calcH;
      return {
        ...d,
        calculated_hours: calcH
      };
    });

    const [resSchedule] = await conn.query(
      `INSERT INTO working_schedules (name, days_per_week, hours_per_week, timezone, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [name, processedDays.length, totalHours, timezone]
    );

    const scheduleId = resSchedule.insertId;

    for (const d of processedDays) {
      await conn.query(
        `INSERT INTO schedule_days (schedule_id, day_of_week, start_time, end_time, break_hours, calculated_hours)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [scheduleId, d.day_of_week, d.start_time, d.end_time, d.break_hours || 1, d.calculated_hours]
      );
    }

    await conn.commit();

    const [created] = await query('SELECT * FROM working_schedules WHERE id = ?', [scheduleId]);
    created.days = await query('SELECT * FROM schedule_days WHERE schedule_id = ?', [scheduleId]);

    return res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
>>>>>>> feature/backend
}

module.exports = {
  getSchedules,
  getScheduleById,
<<<<<<< HEAD
  createSchedule,
  updateSchedule
=======
  createSchedule
>>>>>>> feature/backend
};
