import { Router } from 'express'
import { readRoles } from '../controllers/roles.controllers.js'

const routes = Router()

// Lista all users
routes.get('/roles', readRoles)

export default routes
