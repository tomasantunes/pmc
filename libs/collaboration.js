async function canAccessFolder(db, folderId, userId) {
  const [rows] = await db.query(
    `SELECT f.id, f.user_id AS owner_id
       FROM folders f
       LEFT JOIN folder_collaborators fc ON fc.folder_id = f.id AND fc.user_id = ?
      WHERE f.id = ? AND (f.user_id = ? OR fc.user_id IS NOT NULL)
      LIMIT 1`,
    [userId, folderId, userId]
  );
  return rows[0] || null;
}

async function canAccessTask(db, taskId, userId) {
  const [rows] = await db.query(
    `SELECT t.id, t.user_id AS owner_id, t.folder_id
       FROM tasks t
       JOIN folders f ON f.id = t.folder_id
       LEFT JOIN folder_collaborators fc ON fc.folder_id = f.id AND fc.user_id = ?
      WHERE t.id = ? AND (f.user_id = ? OR fc.user_id IS NOT NULL)
      LIMIT 1`,
    [userId, taskId, userId]
  );
  return rows[0] || null;
}

async function setTaskAssignees(db, taskId, userIds, organizationId) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map(Number).filter(Number.isInteger))];
  await db.query('DELETE FROM task_assignees WHERE task_id = ?', [taskId]);
  if (!ids.length || !organizationId) return;
  const [members] = await db.query(
    'SELECT id FROM users WHERE organization_id = ? AND id IN (?)',
    [organizationId, ids]
  );
  for (const member of members) {
    await db.query('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, member.id]);
  }
}

module.exports = { canAccessFolder, canAccessTask, setTaskAssignees };
