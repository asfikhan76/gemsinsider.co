import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import contactRoutes from './routes/contact.js'
import User from './models/User.js'
import bcrypt from 'bcryptjs'
import { existsSync } from 'fs'
import { execFileSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 5000

if (!process.env.ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is required to start the server')
  process.exit(1)
}

const adminEmails = (process.env.ADMIN_EMAILS || 'admin@gemsinsider.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: (origin, callback) => {
    if (!origin || origin.includes('localhost:') || origin === 'null') return callback(null, true)
    try {
      const requestOrigin = new URL(origin)
      const host = requestOrigin.host
      const appHost = process.env.HOST || ''
      if (allowedOrigins.includes(origin) || host === appHost || host.endsWith('.hostingersite.com') || host === 'gemsinsider.co' || host === 'www.gemsinsider.co') {
        return callback(null, true)
      }
    } catch {
      return callback(new Error('Invalid request origin'))
    }
    callback(new Error('Not allowed by CORS'))
  }, credentials: true }))
app.use(express.json())

connectDB()

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/contact', contactRoutes)

app.post('/api/auth/create-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' })
  }

  try {
    const { email, password, name } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Admin account already exists' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ email, password: hashedPassword, name, role: 'admin' })
    await user.save()
    res.status(201).json({ message: 'Admin account created' })
  } catch (error) {
    console.error('Create admin error:', error)
    res.status(500).json({ message: 'Failed to create admin' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const createDefaultAdmins = async () => {
  try {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    for (const email of adminEmails) {
      const existing = await User.findOne({ email })
      if (!existing) {
        const user = new User({ email, password: hashed, name: 'Admin', role: 'admin' })
        await user.save()
        console.log(`Admin account created for ${email}`)
      }
    }
  } catch (error) {
    console.error('Could not create admin accounts:', error)
  }
}

createDefaultAdmins()

const distPath = join(__dirname, '..', '..', 'dist')
if (!existsSync(join(distPath, 'index.html'))) {
  const projectRoot = join(__dirname, '..', '..')
  try {
    execFileSync(process.execPath, [join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: projectRoot, stdio: 'inherit' })
  } catch (error) {
    console.error('Frontend build failed:', error.message)
  }
}

if (existsSync(join(distPath, 'index.html'))) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
  console.log('Serving frontend from dist/')
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
