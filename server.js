const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'bus_reservation_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;
let isDbConnected = false;

// Fallback Data if MySQL is offline
let fallbackBuses = [
    {
        bus_id: 1,
        service_no: 'EXP-101',
        bus_type: 'AC Sleeper',
        source: 'Hyderabad',
        destination: 'Bangalore',
        departure_time: '21:00:00',
        arrival_time: '06:00:00',
        total_seats: 36,
        available_seats: 28,
        fare: 1250.00
    },
    {
        bus_id: 2,
        service_no: 'EXP-102',
        bus_type: 'Luxury Express',
        source: 'Chennai',
        destination: 'Coimbatore',
        departure_time: '22:30:00',
        arrival_time: '05:30:00',
        total_seats: 44,
        available_seats: 44,
        fare: 850.00
    },
    {
        bus_id: 3,
        service_no: 'EXP-103',
        bus_type: 'AC Seater',
        source: 'Vijayawada',
        destination: 'Hyderabad',
        departure_time: '06:00:00',
        arrival_time: '11:30:00',
        total_seats: 40,
        available_seats: 40,
        fare: 650.00
    },
    {
        bus_id: 4,
        service_no: 'EXP-104',
        bus_type: 'Non-AC Sleeper',
        source: 'Bangalore',
        destination: 'Goa',
        departure_time: '20:15:00',
        arrival_time: '08:00:00',
        total_seats: 32,
        available_seats: 32,
        fare: 950.00
    },
    {
        bus_id: 5,
        service_no: 'EXP-105',
        bus_type: 'AC Seater',
        source: 'Kurnool',
        destination: 'Hyderabad',
        departure_time: '12:00:00',
        arrival_time: '16:00:00',
        total_seats: 45,
        available_seats: 19,
        fare: 450.00
    },
    {
        bus_id: 6,
        service_no: 'EXP-106',
        bus_type: 'Non-AC Sleeper',
        source: 'Hyderabad',
        destination: 'Kurnool',
        departure_time: '05:00:00',
        arrival_time: '09:30:00',
        total_seats: 36,
        available_seats: 12,
        fare: 550.00
    },
    {
        bus_id: 7,
        service_no: 'EXP-107',
        bus_type: 'Luxury Express',
        source: 'Nandyala',
        destination: 'Kurnool',
        departure_time: '07:00:00',
        arrival_time: '09:30:00',
        total_seats: 50,
        available_seats: 10,
        fare: 200.00
    },
    {
        bus_id: 8,
        service_no: 'EXP-108',
        bus_type: 'AC Seater',
        source: 'Kurnool',
        destination: 'Nandyala',
        departure_time: '05:00:00',
        arrival_time: '07:30:00',
        total_seats: 45,
        available_seats: 14,
        fare: 250.00
    },
    {
        bus_id: 9,
        service_no: 'EXP-109',
        bus_type: 'AC Sleeper',
        source: 'Kadapa',
        destination: 'Nandyala',
        departure_time: '08:00:00',
        arrival_time: '10:00:00',
        total_seats: 48,
        available_seats: 18,
        fare: 300.00
    },
    {
        bus_id: 10,
        service_no: 'EXP-110',
        bus_type: 'Non-AC Sleeper',
        source: 'Nellore',
        destination: 'Kurnool',
        departure_time: '03:00:00',
        arrival_time: '08:00:00',
        total_seats: 35,
        available_seats: 16,
        fare: 650.00
    },
    {
        bus_id: 11,
        service_no: 'EXP-111',
        bus_type: 'Ultra Deluxe',
        source: 'Hyderabad',
        destination: 'Bangalore',
        departure_time: '09:00:00',
        arrival_time: '14:00:00',
        total_seats: 48,
        available_seats: 21,
        fare: 1050.00
    },
    {
        bus_id: 12,
        service_no: 'EXP-112',
        bus_type: 'Super Luxury',
        source: 'Chennai',
        destination: 'Coimbatore',
        departure_time: '05:00:00',
        arrival_time: '10:00:00',
        total_seats: 40,
        available_seats: 15,
        fare: 1000.00
    },
    {
        bus_id: 13,
        service_no: 'EXP-113',
        bus_type: 'AC Sleeper',
        source: 'Mumbai',
        destination: 'Pune',
        departure_time: '07:00:00',
        arrival_time: '10:30:00',
        total_seats: 40,
        available_seats: 38,
        fare: 450.00
    },
    {
        bus_id: 14,
        service_no: 'EXP-114',
        bus_type: 'Luxury Express',
        source: 'Hyderabad',
        destination: 'Visakhapatnam',
        departure_time: '20:30:00',
        arrival_time: '07:00:00',
        total_seats: 42,
        available_seats: 35,
        fare: 1300.00
    },
    {
        bus_id: 15,
        service_no: 'EXP-115',
        bus_type: 'Super Luxury',
        source: 'Bangalore',
        destination: 'Mysore',
        departure_time: '08:00:00',
        arrival_time: '11:15:00',
        total_seats: 44,
        available_seats: 42,
        fare: 380.00
    },
    {
        bus_id: 16,
        service_no: 'EXP-116',
        bus_type: 'AC Sleeper',
        source: 'Chennai',
        destination: 'Madurai',
        departure_time: '21:30:00',
        arrival_time: '06:00:00',
        total_seats: 36,
        available_seats: 30,
        fare: 850.00
    },
    {
        bus_id: 17,
        service_no: 'EXP-117',
        bus_type: 'Ultra Deluxe',
        source: 'Bangalore',
        destination: 'Kochi',
        departure_time: '21:00:00',
        arrival_time: '06:30:00',
        total_seats: 36,
        available_seats: 32,
        fare: 1150.00
    },
    {
        bus_id: 18,
        service_no: 'EXP-118',
        bus_type: 'Luxury Express',
        source: 'Hyderabad',
        destination: 'Tirupati',
        departure_time: '19:30:00',
        arrival_time: '06:30:00',
        total_seats: 40,
        available_seats: 34,
        fare: 1100.00
    },
    {
        bus_id: 19,
        service_no: 'EXP-119',
        bus_type: 'AC Seater',
        source: 'Delhi',
        destination: 'Jaipur',
        departure_time: '06:30:00',
        arrival_time: '11:30:00',
        total_seats: 40,
        available_seats: 36,
        fare: 550.00
    },
    {
        bus_id: 20,
        service_no: 'EXP-120',
        bus_type: 'Non-AC Sleeper',
        source: 'Pune',
        destination: 'Goa',
        departure_time: '20:30:00',
        arrival_time: '06:30:00',
        total_seats: 36,
        available_seats: 29,
        fare: 1100.00
    }
];

let fallbackBookings = [
    {
        booking_id: 1,
        passenger_name: 'Khadar Basha',
        phone: '9876543210',
        email: 'khadar@example.com',
        service_no: 'EXP-101',
        bus_type: 'AC Sleeper',
        source: 'Hyderabad',
        destination: 'Bangalore',
        seat_numbers: 'S1, S2',
        seats_count: 2,
        journey_date: new Date().toISOString().slice(0, 10),
        departure_time: '21:00:00',
        total_amount: 2500.00,
        booking_status: 'CONFIRMED'
    }
];

// Initialize MySQL pool
async function initDb() {
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        isDbConnected = true;
        console.log(`Connected to MySQL (${dbConfig.database})`);
    } catch (err) {
        // Try fallback to khadarbus_db
        try {
            const altPool = mysql.createPool({ ...dbConfig, database: 'khadarbus_db' });
            const altConn = await altPool.getConnection();
            await altConn.ping();
            altConn.release();
            pool = altPool;
            isDbConnected = true;
            console.log('Connected to MySQL (khadarbus_db)');
            return;
        } catch (e2) {
            isDbConnected = false;
            console.log('Running in demo mode');
        }
    }
}

initDb();

// 0. Get All Cities (Available in Database + Other Popular Indian Destinations)
app.get('/api/cities', async (req, res) => {
    const additionalPopularCities = [
        'Ahmedabad', 'Delhi', 'Guntur', 'Jaipur', 'Kochi', 'Kolkata',
        'Kozhikode', 'Lucknow', 'Madurai', 'Mangalore', 'Mumbai',
        'Mysore', 'Nagpur', 'Pondicherry', 'Pune', 'Rajahmundry',
        'Surat', 'Thiruvananthapuram', 'Tiruchirappalli', 'Varanasi',
        'Visakhapatnam', 'Warangal'
    ];

    let dbCities = [];
    if (isDbConnected && pool) {
        try {
            const [rows] = await pool.query(`
                SELECT DISTINCT city FROM (
                    SELECT TRIM(source) AS city FROM buses WHERE source IS NOT NULL AND source != ''
                    UNION
                    SELECT TRIM(destination) AS city FROM buses WHERE destination IS NOT NULL AND destination != ''
                ) AS c ORDER BY city ASC
            `);
            dbCities = rows.map(r => r.city).filter(Boolean);
        } catch (err) {
            console.error('Error fetching cities from DB:', err.message);
        }
    }

    if (dbCities.length === 0) {
        const set = new Set();
        fallbackBuses.forEach(b => {
            if (b.source) set.add(b.source.trim());
            if (b.destination) set.add(b.destination.trim());
        });
        dbCities = Array.from(set).sort();
    }

    // Filter out cities already in dbCities (case-insensitive)
    const lowerDbSet = new Set(dbCities.map(c => c.toLowerCase()));
    const otherCities = additionalPopularCities.filter(c => !lowerDbSet.has(c.toLowerCase())).sort();
    const allCities = Array.from(new Set([...dbCities, ...otherCities])).sort();

    return res.json({
        success: true,
        dbCities,
        otherCities,
        allCities
    });
});

// 1. Get All Buses or Search
app.get('/api/buses', async (req, res) => {
    const { source, destination, bus_type, q } = req.query;

    if (isDbConnected && pool) {
        try {
            let sql = 'SELECT * FROM buses WHERE 1=1';
            const params = [];

            if (q) {
                sql += ' AND (LOWER(service_no) LIKE LOWER(?) OR LOWER(source) LIKE LOWER(?) OR LOWER(destination) LIKE LOWER(?))';
                params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
            }
            if (source) {
                sql += ' AND LOWER(source) LIKE LOWER(?)';
                params.push(`%${source.trim()}%`);
            }
            if (destination) {
                sql += ' AND LOWER(destination) LIKE LOWER(?)';
                params.push(`%${destination.trim()}%`);
            }
            if (bus_type && bus_type !== 'All') {
                sql += ' AND bus_type = ?';
                params.push(bus_type);
            }

            sql += ' ORDER BY departure_time ASC';
            const [rows] = await pool.query(sql, params);
            return res.json({ success: true, data: rows });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        let results = [...fallbackBuses];
        if (q) {
            const query = q.toLowerCase().trim();
            results = results.filter(b =>
                b.service_no.toLowerCase().includes(query) ||
                b.source.toLowerCase().includes(query) ||
                b.destination.toLowerCase().includes(query)
            );
        }
        if (source) {
            results = results.filter(b => b.source.toLowerCase().includes(source.toLowerCase().trim()));
        }
        if (destination) {
            results = results.filter(b => b.destination.toLowerCase().includes(destination.toLowerCase().trim()));
        }
        if (bus_type && bus_type !== 'All') {
            results = results.filter(b => b.bus_type === bus_type);
        }
        return res.json({ success: true, data: results });
    }
});

// 2. Get Single Bus
app.get('/api/buses/:id', async (req, res) => {
    const busId = parseInt(req.params.id);

    if (isDbConnected && pool) {
        try {
            const [rows] = await pool.query('SELECT * FROM buses WHERE bus_id = ?', [busId]);
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Bus not found' });
            return res.json({ success: true, data: rows[0] });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        const bus = fallbackBuses.find(b => b.bus_id === busId);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
        return res.json({ success: true, data: bus });
    }
});

// 3. Add New Bus
app.post('/api/buses', async (req, res) => {
    const { service_no, bus_type, source, destination, departure_time, arrival_time, total_seats, fare } = req.body;

    if (!service_no || !bus_type || !source || !destination || !departure_time || !total_seats || !fare) {
        return res.status(400).json({ success: false, message: 'Please fill in all bus details.' });
    }

    const seats = parseInt(total_seats);
    const busFare = parseFloat(fare);

    if (isNaN(seats) || seats <= 0) {
        return res.status(400).json({ success: false, message: 'Total seats must be a positive number.' });
    }
    if (isNaN(busFare) || busFare < 0) {
        return res.status(400).json({ success: false, message: 'Fare must be a valid amount.' });
    }

    const cleanServiceNo = service_no.trim().toUpperCase();
    const cleanSource = source.trim();
    const cleanDestination = destination.trim();
    const depTime = departure_time.length === 5 ? `${departure_time}:00` : departure_time;
    const arrTime = arrival_time ? (arrival_time.length === 5 ? `${arrival_time}:00` : arrival_time) : '00:00:00';

    if (isDbConnected && pool) {
        try {
            // Check for duplicate service_no first
            const [existing] = await pool.query('SELECT bus_id FROM buses WHERE UPPER(service_no) = ?', [cleanServiceNo]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: `Bus service number '${cleanServiceNo}' already exists.` });
            }

            const sql = `
                INSERT INTO buses (service_no, bus_type, source, destination, departure_time, arrival_time, total_seats, available_seats, fare)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(sql, [
                cleanServiceNo,
                bus_type,
                cleanSource,
                cleanDestination,
                depTime,
                arrTime,
                seats,
                seats,
                busFare
            ]);
            return res.json({
                success: true,
                message: `Bus ${cleanServiceNo} added successfully!`,
                bus_id: result.insertId
            });
        } catch (error) {
            console.error('Error adding bus:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: `Bus service number '${cleanServiceNo}' already exists.` });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        const dup = fallbackBuses.find(b => b.service_no.toUpperCase() === cleanServiceNo);
        if (dup) {
            return res.status(400).json({ success: false, message: `Bus service number '${cleanServiceNo}' already exists.` });
        }

        const nextId = fallbackBuses.reduce((max, b) => Math.max(max, b.bus_id), 0) + 1;
        const newBus = {
            bus_id: nextId,
            service_no: cleanServiceNo,
            bus_type,
            source: cleanSource,
            destination: cleanDestination,
            departure_time: depTime,
            arrival_time: arrTime,
            total_seats: seats,
            available_seats: seats,
            fare: busFare
        };
        fallbackBuses.push(newBus);
        return res.json({ success: true, message: `Bus ${cleanServiceNo} added successfully!`, bus_id: newBus.bus_id });
    }
});

// 4. Delete Bus
app.delete('/api/buses/:id', async (req, res) => {
    const busId = parseInt(req.params.id);

    if (isNaN(busId)) {
        return res.status(400).json({ success: false, message: 'Invalid bus ID.' });
    }

    if (isDbConnected && pool) {
        try {
            // Delete bookings first in case foreign key cascade is not enabled in DB
            await pool.query('DELETE FROM bookings WHERE bus_id = ?', [busId]);
            const [result] = await pool.query('DELETE FROM buses WHERE bus_id = ?', [busId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: `Bus #${busId} not found.` });
            }
            return res.json({ success: true, message: `Bus #${busId} deleted successfully.` });
        } catch (error) {
            console.error('Error deleting bus:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        const idx = fallbackBuses.findIndex(b => b.bus_id === busId);
        if (idx !== -1) {
            const removed = fallbackBuses.splice(idx, 1)[0];
            // Remove any associated fallback bookings
            for (let i = fallbackBookings.length - 1; i >= 0; i--) {
                if (fallbackBookings[i].bus_id === busId) {
                    fallbackBookings.splice(i, 1);
                }
            }
            return res.json({ success: true, message: `Bus ${removed.service_no} (#${busId}) deleted successfully.` });
        }
        return res.status(404).json({ success: false, message: 'Bus not found.' });
    }
});

// 5. Create Booking
app.post('/api/bookings', async (req, res) => {
    const { bus_id, passenger_name, email, phone, seat_numbers, journey_date } = req.body;

    if (!bus_id || !passenger_name || !phone || !seat_numbers || !seat_numbers.length) {
        return res.status(400).json({ success: false, message: 'Please provide passenger name, phone and select seat(s).' });
    }

    const seatsCount = seat_numbers.length;
    const seatString = seat_numbers.join(', ');

    if (isDbConnected && pool) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Find or create user
            let [userRows] = await connection.query('SELECT user_id FROM users WHERE email = ? OR phone = ?', [
                email || `${phone}@khadarbus.com`,
                phone
            ]);
            let userId;
            if (userRows.length > 0) {
                userId = userRows[0].user_id;
            } else {
                const [insertUser] = await connection.query(
                    'INSERT INTO users (full_name, email, phone) VALUES (?, ?, ?)',
                    [passenger_name, email || `${phone}@khadarbus.com`, phone]
                );
                userId = insertUser.insertId;
            }

            // Lock and fetch bus details
            const [busRows] = await connection.query('SELECT * FROM buses WHERE bus_id = ? FOR UPDATE', [bus_id]);
            if (busRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Bus not found!' });
            }

            const bus = busRows[0];
            if (bus.available_seats < seatsCount) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: `Only ${bus.available_seats} seats remaining!` });
            }

            const totalAmount = bus.fare * seatsCount;

            // Insert booking record (no created_at to avoid column mismatch)
            const [bookingResult] = await connection.query(
                `INSERT INTO bookings (bus_id, user_id, seat_numbers, seats_count, journey_date, total_amount, booking_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
                [bus_id, userId, seatString, seatsCount, journey_date || new Date().toISOString().slice(0, 10), totalAmount]
            );

            // Deduct available seats
            await connection.query(
                'UPDATE buses SET available_seats = available_seats - ? WHERE bus_id = ?',
                [seatsCount, bus_id]
            );

            await connection.commit();

            return res.json({
                success: true,
                message: 'Tickets booked successfully!',
                booking_id: bookingResult.insertId,
                ticket: {
                    booking_id: bookingResult.insertId,
                    passenger_name,
                    phone,
                    bus_id: bus.bus_id,
                    service_no: bus.service_no,
                    bus_type: bus.bus_type,
                    source: bus.source,
                    destination: bus.destination,
                    seats: seatString,
                    seats_count: seatsCount,
                    departure_time: bus.departure_time,
                    arrival_time: bus.arrival_time,
                    journey_date: journey_date || new Date().toISOString().slice(0, 10),
                    total_amount: totalAmount
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Booking failed:', error);
            return res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    } else {
        const bus = fallbackBuses.find(b => b.bus_id == bus_id);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found!' });
        if (bus.available_seats < seatsCount) return res.status(400).json({ success: false, message: `Only ${bus.available_seats} seats remaining!` });

        bus.available_seats -= seatsCount;
        const totalAmount = bus.fare * seatsCount;
        const bookingId = fallbackBookings.length + 1;

        const ticket = {
            booking_id: bookingId,
            passenger_name,
            phone,
            email: email || `${phone}@khadarbus.com`,
            bus_id: bus.bus_id,
            service_no: bus.service_no,
            bus_type: bus.bus_type,
            source: bus.source,
            destination: bus.destination,
            seats: seatString,
            seat_numbers: seatString,
            seats_count: seatsCount,
            departure_time: bus.departure_time,
            arrival_time: bus.arrival_time,
            journey_date: journey_date || new Date().toISOString().slice(0, 10),
            total_amount: totalAmount,
            booking_status: 'CONFIRMED'
        };
        fallbackBookings.unshift(ticket);

        return res.json({
            success: true,
            message: 'Tickets booked successfully!',
            booking_id: bookingId,
            ticket
        });
    }
});

// 6. Get All Booked Tickets (CLEANED UP - No b.created_at, LEFT JOIN for safety)
app.get('/api/bookings', async (req, res) => {
    if (isDbConnected && pool) {
        try {
            const sql = `
                SELECT 
                    b.booking_id,
                    COALESCE(u.full_name, 'Passenger') AS passenger_name,
                    COALESCE(u.phone, '-') AS phone,
                    COALESCE(u.email, '-') AS email,
                    b.bus_id,
                    COALESCE(bs.service_no, '-') AS service_no,
                    COALESCE(bs.bus_type, '-') AS bus_type,
                    COALESCE(bs.source, '-') AS source,
                    COALESCE(bs.destination, '-') AS destination,
                    COALESCE(bs.departure_time, '--:--') AS departure_time,
                    b.seat_numbers,
                    b.seats_count,
                    b.journey_date,
                    b.total_amount,
                    b.booking_status
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.user_id
                LEFT JOIN buses bs ON b.bus_id = bs.bus_id
                ORDER BY b.booking_id DESC
            `;
            const [rows] = await pool.query(sql);
            return res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        return res.json({ success: true, data: fallbackBookings });
    }
});

// 7. Cancel Booking
app.post('/api/bookings/:id/cancel', async (req, res) => {
    const bookingId = parseInt(req.params.id);

    if (isDbConnected && pool) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [bookingRows] = await connection.query(
                'SELECT * FROM bookings WHERE booking_id = ? AND booking_status = "CONFIRMED" FOR UPDATE',
                [bookingId]
            );

            if (bookingRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Active booking not found.' });
            }

            const booking = bookingRows[0];
            await connection.query('UPDATE bookings SET booking_status = "CANCELLED" WHERE booking_id = ?', [bookingId]);
            await connection.query('UPDATE buses SET available_seats = available_seats + ? WHERE bus_id = ?', [
                booking.seats_count,
                booking.bus_id
            ]);

            await connection.commit();
            return res.json({ success: true, message: `Booking #${bookingId} cancelled.` });
        } catch (error) {
            await connection.rollback();
            return res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    } else {
        const booking = fallbackBookings.find(b => b.booking_id === bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        if (booking.booking_status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Already cancelled.' });
        }

        booking.booking_status = 'CANCELLED';
        const bus = fallbackBuses.find(b => b.service_no === booking.service_no || b.bus_id === booking.bus_id);
        if (bus) {
            bus.available_seats += (booking.seats_count || 1);
        }
        return res.json({ success: true, message: `Booking #${bookingId} cancelled.` });
    }
});

app.listen(PORT, () => {
    console.log(`KhadarBus running at http://localhost:${PORT}`);
});
