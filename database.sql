CREATE DATABASE IF NOT EXISTS college_admission;
USE college_admission;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    fees DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Insert an admin user manually for testing (Password: admin123, hashed using bcrypt)
-- $2a$10$C.oQ.mUfG81.1mZ6U/g20O8pT2B3hT1e9C7x.iQjF6G./eU5H6ZlG
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@college.edu', '$2a$10$C.oQ.mUfG81.1mZ6U/g20O8pT2B3hT1e9C7x.iQjF6G./eU5H6ZlG', 'admin')
ON DUPLICATE KEY UPDATE name='Admin';

-- Insert dummy courses
INSERT INTO courses (course_name, department, capacity, fees) VALUES
('B.Tech Computer Science', 'Engineering', 120, 150000.00),
('B.Tech Electronics', 'Engineering', 60, 120000.00),
('B.Sc Physics', 'Science', 40, 45000.00),
('B.A English', 'Arts', 50, 30000.00),
('B.Com Accounting', 'Commerce', 100, 50000.00)
ON DUPLICATE KEY UPDATE capacity=capacity;
