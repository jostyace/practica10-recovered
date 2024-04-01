import path from 'node:path'
export const basePath = process.cwd()

export const verArchivos = (req, res) => {
  const { nombre } = req.params
  try {
    res.sendFile(path.join(basePath, 'public/uploads', nombre))
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' })
  }
}
