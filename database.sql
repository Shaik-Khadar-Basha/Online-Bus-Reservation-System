-- ===================================================
-- 🚍 KhadarBus - Database Script
-- ===================================================

CREATE DATABASE IF NOT EXISTS bus_reservation_db;
USE bus_reservation_db;

-- 1. Buses Table
CREATE TABLE IF NOT EXISTS buses (
    bus_id INT AUTO_INCREMENT PRIMARY KEY,
    service_no VARCHAR(30) NOT NULL UNIQUE,
    bus_type VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    total_seats INT NOT NULL DEFAULT 40,
    available_seats INT NOT NULL DEFAULT 40,
    fare DECIMAL(10, 2) NOT NULL DEFAULT 500.00
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    user_id INT NOT NULL,
    seat_numbers VARCHAR(100) NOT NULL,
    seats_count INT NOT NULL DEFAULT 1,
    journey_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Sample Data (Optional)
INSERT INTO buses (service_no, bus_type, source, destination, departure_time, arrival_time, total_seats, available_seats, fare) VALUES
('KB-101', 'AC Sleeper', 'Hyderabad', 'Bangalore', '21:00:00', '06:30:00', 36, 36, 1250.00),
('KB-102', 'Luxury Express', 'Chennai', 'Coimbatore', '22:30:00', '05:30:00', 44, 44, 890.00),
('KB-103', 'AC Seater', 'Vijayawada', 'Hyderabad', '06:00:00', '11:30:00', 40, 40, 650.00),
('KB-104', 'Non-AC Sleeper', 'Bangalore', 'Goa', '20:15:00', '08:00:00', 32, 32, 950.00),
('KB-105', 'Luxury Express', 'Hyderabad', 'Tirupati', '19:30:00', '06:30:00', 40, 40, 1100.00),
('KB-106', 'Non-AC Sleeper', 'Hyderabad', 'Kurnool', '05:00:00', '09:30:00', 36, 36, 550.00),
('KB-107', 'Luxury Express', 'Nandyala', 'Kurnool', '07:00:00', '09:30:00', 50, 50, 200.00),
('KB-108', 'AC Seater', 'Kurnool', 'Nandyala', '05:00:00', '07:30:00', 45, 45, 250.00),
('KB-109', 'AC Sleeper', 'Kadapa', 'Nandyala', '08:00:00', '10:00:00', 48, 48, 300.00),
('KB-110', 'Non-AC Sleeper', 'Nellore', 'Kurnool', '03:00:00', '08:00:00', 35, 35, 650.00),
('KB-111', 'Ultra Deluxe', 'Hyderabad', 'Bangalore', '09:00:00', '14:00:00', 48, 48, 1050.00),
('KB-112', 'Super Luxury', 'Chennai', 'Coimbatore', '05:00:00', '10:00:00', 40, 40, 1000.00),
('KB-113', 'AC Sleeper', 'Mumbai', 'Pune', '07:00:00', '10:30:00', 40, 40, 450.00),
('KB-114', 'Luxury Express', 'Hyderabad', 'Visakhapatnam', '20:30:00', '07:00:00', 42, 42, 1300.00),
('KB-115', 'Super Luxury', 'Bangalore', 'Mysore', '08:00:00', '11:15:00', 44, 44, 380.00),
('KB-116', 'AC Sleeper', 'Chennai', 'Madurai', '21:30:00', '06:00:00', 36, 36, 850.00),
('KB-117', 'Ultra Deluxe', 'Bangalore', 'Kochi', '21:00:00', '06:30:00', 36, 36, 1150.00),
('KB-118', 'AC Seater', 'Delhi', 'Jaipur', '06:30:00', '11:30:00', 40, 40, 550.00),
('KB-119', 'Non-AC Sleeper', 'Pune', 'Goa', '20:30:00', '06:30:00', 36, 36, 1100.00),
('KB-120', 'AC Seater', 'Kurnool', 'Hyderabad', '12:00:00', '16:00:00', 45, 45, 450.00)
ON DUPLICATE KEY UPDATE service_no=VALUES(service_no);

INSERT INTO users (full_name, email, phone) VALUES
('Khadar Basha', 'khadar@example.com', '9876543210')
ON DUPLICATE KEY UPDATE email=VALUES(email);
