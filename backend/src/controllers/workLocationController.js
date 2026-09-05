const { query } = require('../config/db');

async function getWorkLocations(req, res, next) {
  try {
    const locations = await query('SELECT * FROM work_locations ORDER BY name ASC');
    return res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    next(error);
  }
}

async function getWorkLocationById(req, res, next) {
  try {
    const { id } = req.params;
    const [location] = await query('SELECT * FROM work_locations WHERE id = ?', [id]);
    if (!location) {
      return res.status(404).json({ success: false, message: `Work location ${id} not found.` });
    }
    return res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
}

async function createWorkLocation(req, res, next) {
  try {
    const { name, address, latitude, longitude, radius_meters = 200.0, status = 'Active' } = req.body;
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Name, latitude, and longitude are required.' });
    }

    const result = await query(
      `INSERT INTO work_locations (name, address, latitude, longitude, radius_meters, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address || null, Number(latitude), Number(longitude), Number(radius_meters), status]
    );

    const [created] = await query('SELECT * FROM work_locations WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    next(error);
  }
}

async function updateWorkLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, radius_meters, status } = req.body;

    const [existing] = await query('SELECT * FROM work_locations WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Work location ${id} not found.` });
    }

    await query(
      `UPDATE work_locations SET
         name = COALESCE(?, name),
         address = COALESCE(?, address),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude),
         radius_meters = COALESCE(?, radius_meters),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name || null,
        address !== undefined ? address : null,
        latitude !== undefined ? Number(latitude) : null,
        longitude !== undefined ? Number(longitude) : null,
        radius_meters !== undefined ? Number(radius_meters) : null,
        status || null,
        id
      ]
    );

    const [updated] = await query('SELECT * FROM work_locations WHERE id = ?', [id]);
    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteWorkLocation(req, res, next) {
  try {
    const { id } = req.params;
    const [existing] = await query('SELECT * FROM work_locations WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Work location ${id} not found.` });
    }

    await query("UPDATE work_locations SET status = 'Inactive' WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: `Work location ${id} deactivated successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWorkLocations,
  getWorkLocationById,
  createWorkLocation,
  updateWorkLocation,
  deleteWorkLocation
};
