CREATE DATABASE pmc;
USE pmc;

CREATE TABLE folders (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(2048) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    folder_id INT(11) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    is_done BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE recurrent_checks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    task_id INT(11) NOT NULL,
    is_done BOOLEAN NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE logins (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    is_valid BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tasks ADD sort_index INT(11) NOT NULL DEFAULT 0;
ALTER TABLE folders ADD type VARCHAR(256) NOT NULL DEFAULT 'simple';
ALTER TABLE tasks ADD type VARCHAR(256) NOT NULL DEFAULT 'single';
ALTER TABLE tasks ADD day_of_week INT(11) DEFAULT NULL;
ALTER TABLE tasks ADD day_of_month INT(11) DEFAULT NULL;
ALTER TABLE tasks DROP COLUMN day_of_week;
ALTER TABLE tasks DROP COLUMN day_of_month;
ALTER TABLE tasks ADD week_day INT(11) DEFAULT NULL;
ALTER TABLE tasks ADD month_day INT(11) DEFAULT NULL;
ALTER TABLE tasks ADD month INT(11) DEFAULT NULL;
ALTER TABLE tasks ADD time VARCHAR(256) DEFAULT '';