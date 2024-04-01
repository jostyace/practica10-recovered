import { Router } from 'express'

const routes = Router()

routes.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API!' })
})

export default routes
