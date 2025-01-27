import express, { Router } from 'express'
import { createServer, type Server } from 'http'
import authRoutes from './routes/auth'
import inviteRoutes from './routes/invites'

export function registerRoutes(app: express.Express): Server {
  const router = Router()

  // Mount route modules
  router.use('/auth', authRoutes)
  router.use('/invites', inviteRoutes)
  app.use('/api', router)

  return createServer(app)
}

export { Router }
