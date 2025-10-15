var express = require('express');
var router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  database: process.env.PGDATABASE || 'bookingdb',
  password: process.env.PGPASSWORD || 'yourpassword',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});

router.post('/reserve', async function (req, res) {
  const { event_id, user_id } = req.body || {};

  console.log("Params", event_id, user_id);

  const eventId = Number(event_id);
  const userId = typeof user_id === 'string' ? user_id.trim() : '';

  if (!Number.isInteger(eventId) || eventId <= 0 || !userId) {
    return res.status(400).json({ error: 'event_id (positive integer) and user_id (non-empty string) are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query(
      'SELECT id, total_seats FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    console.log("eventRes", eventRes);

    if (eventRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event not found' });
    }

    const totalSeats = eventRes.rows[0].total_seats;

    console.log("totalSeats", totalSeats);

    const countRes = await client.query(
      'SELECT COUNT(*)::int AS cnt FROM bookings WHERE event_id = $1',
      [eventId]
    );
    const currentCount = countRes.rows[0].cnt;

    console.log("currentCount", currentCount);

    if (currentCount >= totalSeats) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'No seats available' });
    }

    const insertText = `
      INSERT INTO bookings (event_id, user_id)
      VALUES ($1, $2)
      RETURNING id, event_id, user_id, created_at
    `;

    try {
      const insertRes = await client.query(insertText, [eventId, userId]);
      await client.query('COMMIT');
      return res.status(201).json({ booking: insertRes.rows[0] });
    } catch (err) {
      if (err && err.code === '23505') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'User already booked this event' });
      }
      await client.query('ROLLBACK');
      console.error('Insert error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Transaction error', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
