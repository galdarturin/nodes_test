
INSERT INTO events (name, total_seats)
SELECT 'Concert A', 3
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Concert A');

INSERT INTO events (name, total_seats)
SELECT 'Conference 2025', 5
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Conference 2025');

INSERT INTO events (name, total_seats)
SELECT 'Tech Meetup', 2
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Tech Meetup');

INSERT INTO bookings (event_id, user_id)
SELECT e.id, 'alice'
FROM events e
WHERE e.name = 'Concert A'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.event_id = e.id AND b.user_id = 'alice'
  );

INSERT INTO bookings (event_id, user_id)
SELECT e.id, 'bob'
FROM events e
WHERE e.name = 'Conference 2025'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.event_id = e.id AND b.user_id = 'bob'
  );
