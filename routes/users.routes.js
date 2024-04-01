import { Router } from 'express'
import { createUser, deleteUser, readUser, readUsers, updateUser } from '../controllers/users.controllers.js'
import { subirArchivos } from '../config/multer.js'

const routes = Router()

// Lista all users
routes.get('/users', readUsers)

// List an specific user
routes.get('/users/:id', readUser)

// Create a new user
routes.post('/users', subirArchivos.single('picture'), createUser)

// Delete an user
routes.delete('/users/:id', deleteUser)

// Update an user
routes.patch('/users/:id', subirArchivos.single('picture'), updateUser)

export default routes
