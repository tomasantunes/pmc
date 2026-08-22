ALTER TABLE licenses
    ADD COLUMN tier ENUM('individual', 'small_teams', 'enterprise') NOT NULL DEFAULT 'individual' AFTER used_by_user_id,
    ADD COLUMN max_users INT NOT NULL DEFAULT 1 AFTER tier;

UPDATE licenses SET tier = 'individual', max_users = 1 WHERE tier IS NULL OR max_users IS NULL;

CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT NOT NULL UNIQUE,
    name VARCHAR(512) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES licenses(id)
);

ALTER TABLE users
    ADD COLUMN organization_id INT DEFAULT NULL AFTER license_expires;

-- Preserve existing accounts by creating their license organization and membership.
INSERT IGNORE INTO organizations (license_id, name)
SELECT id, CONCAT('Organization ', id) FROM licenses;

UPDATE users u
JOIN licenses l ON l.license_key = u.license_key
JOIN organizations o ON o.license_id = l.id
SET u.organization_id = o.id
WHERE u.organization_id IS NULL;

CREATE TABLE IF NOT EXISTS folder_collaborators (
    folder_id INT NOT NULL,
    user_id INT NOT NULL,
    permission ENUM('read_write') NOT NULL DEFAULT 'read_write',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, user_id),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
