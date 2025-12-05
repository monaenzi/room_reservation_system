CREATE TABLE role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) Not NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    account_deactivated TINYINT(1) DEFAULT 0 NOT NULL, -- 0 = aktiv, 1= deaktiviert
    first_login TINYINT(1) DEFAULT 0 NOT NULL, -- 0= muss Passwort ändern, 1= normal login
    FOREIGN KEY (role_id) REFERENCES role(role_id)
);

CREATE TABLE room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    room_description TEXT,
    room_capacity INT,
    floor_number INT,
    building VARCHAR(100),
    is_visible TINYINT(1) DEFAULT 1 NOT NULL,
    created_by INT,
    image_url VARCHAR(255)
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE timeslot (
    timeslot_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    timeslot_status INT DEFAULT 0 NOT NULL, -- status: 0 = not released/inactive, 1 = available, 2 = reserved, 3 = blocked by admin
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    blocked_reason TEXT,
    timeslot_name VARCHAR(100),
    FOREIGN KEY (room_id) REFERENCES room(room_id)
);
 
CREATE TABLE booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    timeslot_id INT NOT NULL,
    reason TEXT NOT NULL,
    booking_status INT DEFAULT 0 NOT NULL, -- status: 0 = pending, 1 = confirmed, 2 =declined, 3= cancelled
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (timeslot_id) REFERENCES timeslot(timeslot_id)
);
