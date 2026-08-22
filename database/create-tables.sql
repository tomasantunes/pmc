CREATE DATABASE pmc;
USE pmc;

CREATE TABLE folders (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(2048) NOT NULL,
    type VARCHAR(256) NOT NULL DEFAULT 'simple',
    hide_done BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    folder_id INT(11) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    is_done BOOLEAN NOT NULL,
    sort_index INT(11) NOT NULL DEFAULT 0,
    type VARCHAR(256) NOT NULL DEFAULT 'single',
    date_done DATETIME DEFAULT NULL,
    days VARCHAR(512) DEFAULT '',
    months VARCHAR(512) DEFAULT '',
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    starred BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE recurrent_checks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    task_id INT(11) NOT NULL,
    is_done BOOLEAN NOT NULL,
    is_cancelled BOOLEAN NOT NULL DEFAULT 0,
    date DATE NOT NULL
);

CREATE TABLE events (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    task_id INT(11) DEFAULT NULL,
    description VARCHAR(2048) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL
);

CREATE TABLE logins (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    is_valid BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_todos_tasks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    folder_id INT(11) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    is_done BOOLEAN NOT NULL,
    sort_index INT(11) NOT NULL DEFAULT 0,
    tdate DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    eisenhower_category VARCHAR(50) DEFAULT 'Not Urgent and Not Important',
    starred BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE time_tracking_sessions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE time_tracking_sub_sessions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    session_id INT(11) NOT NULL,
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    task_id INT(11) DEFAULT NULL,
    cron_string VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(256) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    email VARCHAR(512) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_key CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME DEFAULT NULL,
    used_by_user_id INT DEFAULT NULL,
    tier ENUM('individual', 'small_teams', 'enterprise') NOT NULL DEFAULT 'individual',
    max_users INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT NOT NULL UNIQUE,
    name VARCHAR(512) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES licenses(id)
);

CREATE TABLE folder_collaborators (
    folder_id INT NOT NULL,
    user_id INT NOT NULL,
    permission ENUM('read_write') NOT NULL DEFAULT 'read_write',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, user_id),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE task_assignees (
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workflows (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    name VARCHAR(512) NOT NULL,
    workflow_json_base64 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE logins ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE folders ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE tasks ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE recurrent_checks ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE events ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE daily_todos_tasks ADD COLUMN user_id INT(11) NOT NULL AFTER id;
ALTER TABLE alerts ADD COLUMN user_id INT(11) NOT NULL AFTER id;

UDPATE logins SET user_id = 0;
UPDATE folders SET user_id = 0;
UPDATE tasks SET user_id = 0;
UPDATE recurrent_checks SET user_id = 0;
UPDATE events SET user_id = 0;
UPDATE daily_todos_tasks SET user_id = 0;
UPDATE time_tracking_sessions SET user_id = 0;
UPDATE time_tracking_sub_sessions SET user_id = 0;
UPDATE alerts SET user_id = 0;

ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(512) DEFAULT NULL AFTER email;
ALTER TABLE users ADD COLUMN reset_password_expires DATETIME DEFAULT NULL AFTER reset_password_token;
ALTER TABLE users ADD COLUMN license_key CHAR(64) DEFAULT NULL AFTER reset_password_expires;
ALTER TABLE users ADD COLUMN license_expires DATETIME DEFAULT NULL AFTER license_key;
ALTER TABLE users ADD COLUMN organization_id INT DEFAULT NULL AFTER license_expires;
ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE tasks ADD COLUMN expiration_date DATETIME DEFAULT NULL AFTER end_time;
ALTER TABLE tasks ADD COLUMN priority INT(11) DEFAULT NULL AFTER expiration_date;
ALTER TABLE alerts MODIFY COLUMN task_id INT(11) NULL;
ALTER TABLE daily_todos_tasks ADD COLUMN start_time TIME DEFAULT NULL AFTER tdate;
ALTER TABLE daily_todos_tasks ADD COLUMN end_time TIME DEFAULT NULL AFTER start_time;
