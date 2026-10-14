# 🚍 KhadarBus - Online Bus Reservation & Fleet Management System

A state-of-the-art full-stack **Online Bus Reservation System** built with **HTML5, CSS3, Vanilla JavaScript, Node.js (Express), and MySQL Workbench**.

---

## 🏛️ System Architecture

```
[ Frontend: KhadarBus UI (HTML5 / Modern CSS / Vanilla JS) ]
                     ↕ HTTP (REST API: fetch)
[ Express Backend (server.js) ]
                     ↕ TCP / mysql2 driver connection pool
[ MySQL Workbench (khadarbus_db / bus_reservation_db) ]
```

- **Frontend Client:** Ultra-modern responsive dashboard with live search, interactive driver-cabin seat layout, boarding pass generator, and fleet manager.
- **Node.js Express Server (`server.js`):** REST API handling bus fleet querying, seat reservation transactions, booking cancellations, and real-time fallbacks.
- **MySQL Database (`khadarbus_db`):** Relational schema storing buses, registered users, and booking records with relational foreign keys.

---

## 📋 Core Fleet Specifications (`buses` table)

The system is built around the following essential fields:

| Field Name | Type | Description |
|---|---|---|
| `bus_id` | `INT AUTO_INCREMENT` (PK) | Unique identifier for each bus in the fleet |
| `service_no` | `VARCHAR(30)` (UNIQUE) | Service / registration number (e.g., `KB-101`, `KB-102`) |
| `bus_type` | `VARCHAR(50)` | Type of bus (`AC Sleeper`, `Luxury Multi-Axle Volvo`, `AC Seater`, `Non-AC Sleeper`, `Electric AC Coach`, `Super Luxury Express`) |
| `source` | `VARCHAR(100)` | Origin terminal / city (e.g., `Hyderabad`) |
| `destination` | `VARCHAR(100)` | Destination terminal / city (e.g., `Bangalore`) |
| `departure_time` | `TIME` | Scheduled departure time (e.g., `21:00:00`) |
| `arrival_time` | `TIME` | Scheduled arrival time (e.g., `06:30:00`) |
| `total_seats` | `INT` | Total seating capacity (e.g., 36, 40, 44 seats) |
| `available_seats` | `INT` | Real-time remaining unbooked seats |
| `fare` | `DECIMAL(10, 2)` | Ticket price per seat in Indian Rupees (₹) |

---

## 🚀 Quick Setup & Execution Guide

### 1. Database Setup in MySQL Workbench
1. Open **MySQL Workbench**.
2. Connect to your local instance (e.g. `Local instance MySQL80`).
3. Open a new query tab (`Ctrl + T`) and paste the contents of [`database.sql`](./database.sql).
4. Click the **Execute (⚡)** button.
5. It will create `khadarbus_db` with `buses`, `users`, and `bookings` tables populated with sample KhadarBus fleet services (`KB-101` to `KB-108`).

### 2. Configure Database Password (in `server.js`)
Open [`server.js`](./server.js) and check lines 15–23:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'YOUR_MYSQL_PASSWORD', // <-- Replace with your MySQL password
    database: 'khadarbus_db'
};
```

### 3. Start the Server
```bash
npm start
```
or with automatic restart:
```bash
npm run dev
```

### 4. Open in Your Browser
Open: 👉 **`http://localhost:3000`**

---

## 🌟 Key Features

1. **🚍 Find & Book Buses:**
   - Search by source, destination, bus type, and date.
   - Quick route shortcuts for popular intercity routes.
   - Live sorting by departure time, fare, and available seats.

2. **💺 Interactive Seat Matrix:**
   - Realistic coach layout with driver cabin, passenger aisle, and numbered seats.
   - Real-time seat selection with dynamic fare total calculation.

3. **🎫 Luxury Electronic Boarding Pass:**
   - Confirmed ticket slip with barcode, route overview, passenger info, and 1-click **Print Boarding Pass** button.

4. **📋 Bus Fleet Master Directory:**
   - Full tabular breakdown showcasing: `bus_id`, `service_no`, `bus_type`, `source`, `destination`, `departure_time`, `total_seats`, `available_seats`, and `fare`.
   - Admin action buttons to Book or Delete bus entries directly.

5. **🎫 Booked Tickets Ledger:**
   - View all passenger bookings saved in MySQL with **Cancel & Refund** capability.

6. **➕ Register New Bus Service (Admin):**
   - Simple web form to insert new buses directly into MySQL `buses` table.
