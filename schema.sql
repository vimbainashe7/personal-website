-- Personal Course Management System Schema
CREATE DATABASE IF NOT EXISTS course_manager;
USE course_manager;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    instructor VARCHAR(150),
    description TEXT,
    color VARCHAR(20) DEFAULT '#4f46e5',
    semester VARCHAR(50),
    credits INT DEFAULT 3,
    mood VARCHAR(20) DEFAULT '😊',
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Schedule Table (e.g. Mon 10:00-11:30 in Room 302)
CREATE TABLE IF NOT EXISTS course_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    day_of_week ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(150),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Course Files Table (syllabi, notes, slides, assignments)
CREATE TABLE IF NOT EXISTS course_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    summary TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Timetable & Calendar Entries Table (classes, assignments, exams, study blocks)
CREATE TABLE IF NOT EXISTS timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    title VARCHAR(150) NOT NULL,
    entry_type ENUM('class', 'assignment', 'exam', 'study', 'other') DEFAULT 'other',
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- AI Conversations History
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    role ENUM('user', 'assistant') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT,
    type ENUM('reminder', 'deadline', 'ai', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_for DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Study Sessions (Focus / Pomodoro Logs for gamification & study streaks)
CREATE TABLE IF NOT EXISTS study_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    duration_minutes INT NOT NULL,
    xp_earned INT DEFAULT 25,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- User Gamification & Stats
CREATE TABLE IF NOT EXISTS user_gamification (
    user_id INT PRIMARY KEY,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_study_date DATE,
    badges_json TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
