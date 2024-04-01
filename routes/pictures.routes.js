import { Router } from 'express'
import { verArchivos } from './../controllers/pictures.controllers.js'

const routes = Router()
routes.get('/pictures/:nombre', verArchivos)

export default routes
