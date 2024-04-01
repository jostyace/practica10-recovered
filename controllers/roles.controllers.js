import { pool } from '../config/db.js'

export const readRoles = async (req, res) => {
  try {
    const [exist] = await pool.query('SELECT * FROM role')
    if (!exist[0]) {
      res.status(400).json({ message: 'Not existing roles' })
    } else {
      const query = 'SELECT * FROM role'
      const [roles] = await pool.query(query)
      res.json(roles)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
