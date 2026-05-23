const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// List projects the user owns or is a member of
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS owner_name, pm.role AS my_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Project name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description?.trim() || null, req.user.id]
    );
    const project = result.rows[0];

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );

    res.status(201).json({ ...project, my_role: 'admin', member_count: 1, task_count: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project with members
router.get('/:id', auth, async (req, res) => {
  try {
    const projectRes = await pool.query(
      `SELECT p.*, u.name AS owner_name, pm.role AS my_role
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [req.params.id, req.user.id]
    );

    if (!projectRes.rows.length) return res.status(404).json({ message: 'Project not found' });

    const project = projectRes.rows[0];
    if (!project.my_role) return res.status(403).json({ message: 'Access denied' });

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name ASC`,
      [req.params.id]
    );

    res.json({ ...project, members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  const { name, description } = req.body;
  try {
    const check = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length || check.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update project details' });
    }

    const result = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name?.trim() || null, description?.trim() || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  const { email, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const check = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length || check.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (!userRes.rows.length) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    const targetUser = userRes.rows[0];
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO NOTHING',
      [req.params.id, targetUser.id, role]
    );

    res.json({ user: targetUser, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length || check.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const projectOwner = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.id]);
    if (projectOwner.rows[0]?.owner_id == req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [
      req.params.id,
      req.params.userId,
    ]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Project not found' });
    if (result.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
