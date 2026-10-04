import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || 'admin@gemsinsider.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean))

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const role = ADMIN_EMAILS.has(email) && password === ADMIN_PASSWORD ? 'admin' : 'user'
    const user = new User({ email, password: hashedPassword, name, role })
    await user.save()
    const token = jwt.sign({ uid: user._id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ token, user: { uid: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'No account found with this email or incorrect password.' })
    }
    const token = jwt.sign({ uid: user._id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { uid: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// Check auth
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ token: req.headers.authorization, user: { uid: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Logout (just invalidate client-side token)
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    const user = await User.findByIdAndUpdate(req.user.uid, { name }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user: { uid: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

export default router
