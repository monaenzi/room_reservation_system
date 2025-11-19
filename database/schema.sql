-- CREATE DATABASE IF NOT EXISTS room_booking_system;
-- USE room_booking_system;

CREATE TABLE role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) Not NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    account_deactivated BOOLEAN DEFAULT NULL, -- NULL = aktiv, 1= deaktiviert
    first_login BOOLEAN DEFAULT 0 NOT NULL, -- 0= muss Passwort ändern, 1= normal login
    FOREIGN KEY (role_id) REFERENCES role(role_id)
);

CREATE TABLE room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    room_description TEXT,
    room_capacity INT,
    floor_number INT,
    building VARCHAR(100),
    is_visible BOOLEAN DEFAULT TRUE,
    created_by INT;
    FOREIGN KEY (created_by) REFERENCES user(user_id)
);

