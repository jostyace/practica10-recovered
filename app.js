import express from 'express'
import usersRoutes from './routes/users.routes.js'
import rolesRoutes from './routes/roles.routes.js'
import indexRoutes from './routes/index.routes.js'
import picturesRoutes from './routes/pictures.routes.js'

import { PORT } from './config/config.js'

const app = express()
app.use(express.json())
// app.use(express.static('public'))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE')
  next()
})

app.use('/api', usersRoutes)
app.use('/api', rolesRoutes)
app.use('/api', picturesRoutes)

app.use(indexRoutes)

app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT)
})
