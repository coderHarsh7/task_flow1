const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const access = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );
    if (!access.rows.length) return res.status(403).json({ message: 'Access denied' });

    const result = await pool.query(
      `SELECT t.*,
        a.name AS assignee_name,
        c.name AS created_by_name
       FROM tasks t
       LEFT JOIN users a ON a.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.project_id = $1
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks assigned to current user (for dashboard)
router.get('/mine', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, p.name AS project_name, a.name AS assignee_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users a ON a.id = t.assignee_id
       WHERE t.assignee_id = $1
       ORDER BY
         CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 0 ELSE 1 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/project/:projectId', auth, async (req, res) => {
  const { title, description, assignee_id, priority, due_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

  try {
    const access = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );
    if (!access.rows.length) return res.status(403).json({ message: 'Access denied' });

    const insert = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        req.params.projectId,
        assignee_id || null,
        req.user.id,
        priority || 'medium',
        due_date || null,
      ]
    );

    const task = await pool.query(
      `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
       FROM tasks t
       LEFT JOIN users a ON a.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [insert.rows[0].id]
    );

    res.status(201).json(task.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  const { title, description, assignee_id, priority, due_date, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = $2,
        assignee_id = $3,
        priority = COALESCE($4, priority),
        due_date = $5,
        status = COALESCE($6, status),
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title?.trim() || null,
        description?.trim() || null,
        assignee_id || null,
        priority || null,
        due_date || null,
        status || null,
        req.params.id,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });

    const task = await pool.query(
      `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
       FROM tasks t
       LEFT JOIN users a ON a.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.json(task.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick status update
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const valid = ['todo', 'in_progress', 'done'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status value' });

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await pool.query('SELECT created_by, project_id FROM tasks WHERE id = $1', [req.params.id]);
    if (!task.rows.length) return res.status(404).json({ message: 'Task not found' });

    const isCreator = task.rows[0].created_by === req.user.id;
    const adminCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.rows[0].project_id, req.user.id]
    );
    const isAdmin = adminCheck.rows[0]?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only task creator or project admin can delete tasks' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
