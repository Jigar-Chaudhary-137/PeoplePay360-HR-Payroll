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
}

async function updateSchedule(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { id } = req.params;
    const { name, timezone = 'Asia/Kolkata', days = [] } = req.body;

    const [existing] = await conn.query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: `Schedule ${id} not found.` });
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

    await conn.query(
      `UPDATE working_schedules 
       SET name = COALESCE(?, name), 
           days_per_week = ?, 
           hours_per_week = ?, 
           timezone = COALESCE(?, timezone)
       WHERE id = ?`,
      [name || null, processedDays.length, totalHours, timezone || null, id]
    );

    if (days.length > 0) {
      await conn.query('DELETE FROM schedule_days WHERE schedule_id = ?', [id]);
      for (const d of processedDays) {
        await conn.query(
          `INSERT INTO schedule_days (schedule_id, day_of_week, start_time, end_time, break_hours, calculated_hours)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, d.day_of_week, d.start_time, d.end_time, d.break_hours || 1, d.calculated_hours]
        );
      }
    }

    await conn.commit();

    const [updated] = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (updated) {
      updated.days = await query('SELECT * FROM schedule_days WHERE schedule_id = ? ORDER BY id ASC', [id]);
    }

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const [existing] = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Schedule ${id} not found.` });
    }

    await query('UPDATE working_schedules SET is_active = FALSE WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Schedule ${id} deactivated successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
