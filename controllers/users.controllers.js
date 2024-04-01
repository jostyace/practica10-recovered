import { pool } from '../config/db.js'
import path from 'node:path'
import fs from 'node:fs'
export const basePath = process.cwd()

export const readUsers = async (req, res) => {
  try {
    const [exist] = await pool.query('SELECT * FROM users')
    if (!exist[0]) {
      res.status(400).json({ message: 'Users not found' })
    } else {
      const query = `SELECT u.id, u.name, u.email, r.role AS role, u.picture FROM users u
      LEFT JOIN role r ON r.id = u.role_id`
      const [users] = await pool.query(query)
      for (const user of users) {
        if (user.picture === null) {
          user.picture = 'avatar.jpg'
        } else {
          const archivo = basePath + '/public/uploads/' + user.picture
          try {
            fs.accessSync(archivo, fs.constants.F_OK)
          } catch (err) {
            user.picture = 'avatar.jpg'
          }
        }
      }
      res.json(users)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const readUser = async (req, res) => {
  const { id } = req.params
  try {
    // Validar Formato del ID
    await validateId(id)
    // Verificar si el usuario existe y obtener la Información del Usuario
    const [exist] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    if (!exist[0]) {
      res.status(400).json({ message: 'User not found' })
    } else {
      const query = `SELECT u.id, u.name, u.email, r.role AS role, r.id AS role_id, u.picture FROM users u
      LEFT JOIN role r ON r.id = u.role_id WHERE u.id = ?`
      const [users] = await pool.query(query, id)
      if (users[0].picture === null) {
        users[0].picture = 'avatar.jpg'
        res.json(users)
      } else {
        const archivo = basePath + '/public/uploads/' + users[0].picture
        fs.access(archivo, fs.constants.F_OK, (err) => {
          if (err) {
            users[0].picture = 'avatar.jpg'
          }
          res.json(users)
        })
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createUser = async (req, res) => {
  const { name, email, role_id: roleId } = req.body
  const picture = req.file ? req.file.filename : null
  try {
    // Validar los datos del body
    await validateFields(name, email, roleId, picture, 'create')

    // Crear Usuario
    const query = 'INSERT INTO users (name, email, role_id, picture) VALUES (?,?,?,?)'
    const [user] = await pool.query(query, [name, email, roleId, picture])
    const [newUser] = await pool.query(
      `SELECT u.id, u.name, u.email, r.role AS role, u.picture FROM users u
      LEFT JOIN role r ON r.id = u.role_id WHERE u.id = ?`,
      [user.insertId]
    )
    res.json({ message: 'User created successfully', newUser })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteUser = async (req, res, next) => {
  const { id } = req.params
  try {
    // Validar Formato del ID
    await validateId(id)

    // Verificar si el usuario existe y eliminarlo
    const [exist] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    if (!exist[0]) {
      res.status(400).json({ message: 'User not found' })
    } else {
      const [pic] = await pool.query('SELECT picture FROM users WHERE id = ?', [id])
      const query = 'DELETE FROM users WHERE id = ?'
      await pool.query(query, id)
      eliminarArchivo(pic[0].picture)
      res.status(200).json({ message: 'User with id ' + id + ' deleted succesfully' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateUser = async (req, res, next) => {
  const { id } = req.params
  const { name, email, role_id: roleId } = req.body
  const picture = req.file ? req.file.filename : null

  try {
    // Validar Formato del ID
    await validateId(id)
    // Validar los campos
    await validateFields(name, email, roleId, picture, 'update')
    // Verificar si el usuario existe y obtener la Información del Usuario
    const [exist] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    if (!exist[0]) {
      res.status(400).json({ message: 'User not found' })
    } else {
      // Actualizar los datos del Usuario
      const query = 'UPDATE users SET name =?, email =?, role_id =?, picture =? WHERE id =?'
      const values = []
      if (name !== '') values.push(name)
      else values.push(exist[0].name)
      if (email !== '') values.push(email)
      else values.push(exist[0].email)
      if (roleId !== '') values.push(roleId)
      else values.push(exist[0].role_id)
      if (picture !== null) values.push(picture)
      else values.push(exist[0].picture)
      values.push(id)
      reemplazarFoto(picture, id)
      await pool.query(query, values)
      const [editedUser] = await pool.query(
        `SELECT u.id, u.name, u.email, r.role AS role, u.picture FROM users u
        LEFT JOIN role r ON r.id = u.role_id WHERE u.id = ?`, [id])
      res.json({ message: 'User updated successfully', editedUser })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Funciones de validacion
export function isInteger (value) {
  return Number.isInteger(value)
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar ID
async function validateId (id) {
  if (!Number.isInteger(parseInt(id)) || parseInt(id) === 0) {
    throw new Error('ID is invalid')
  }
}

// Validate picture
async function reemplazarFoto (picture, id) {
  const [pic] = await pool.query('SELECT picture FROM users WHERE id = ?', [id])
  if (picture && picture !== pic[0].picture) {
    eliminarArchivo(pic[0].picture)
  }
}

// Funcion para vvalidar los campos
async function validateFields (name, email, roleId, picture, action) {
  if (action === 'create') {
    if (!name || !email || !roleId) {
      eliminarArchivo(picture)
      throw new Error('All fields are required')
    }
    if (!isValidEmail(email)) {
      eliminarArchivo(picture)
      throw new Error('Email is not valid')
    }
    if (!Number.isInteger(parseInt(roleId)) || roleId > 3 || parseInt(roleId) === 0) {
      eliminarArchivo(picture)
      throw new Error('Role ID is invalid')
    }
    const [emailDuplicated] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (emailDuplicated.length !== 0) {
      eliminarArchivo(picture)
      throw new Error('Email is already in use')
    }
    if (!picture) {
      throw new Error('Picture is required')
    }
  } else if (action === 'update') {
    if (!isValidEmail(email)) {
      throw new Error('Email is not valid')
    }
    if (!Number.isInteger(parseInt(roleId)) || roleId > 3 || parseInt(roleId) === 0) {
      throw new Error('Role ID is invalid')
    }
  }
}

// Funcion para eliminar el archivo
function eliminarArchivo (nombre) {
  const archivo = basePath + '/public/uploads/' + nombre
  const aEliminar = path.resolve(archivo)
  fs.access(archivo, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlinkSync(aEliminar)
    }
  })
}
