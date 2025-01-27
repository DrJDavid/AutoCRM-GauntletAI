import { config } from './config'
import { logger } from './config/logger'
import { configureMiddleware } from './config/middleware'
import express from 'express'
import { createServer } from 'http'
import { setupVite, serveStatic } from './vite'
import authRoutes from './routes/auth'
import inviteRoutes from './routes/invites'

async function startServer(): Promise<void> {
  try {
    // Initialize Express app
    const app = express()
    
    // Configure all middleware (cors, security, session, etc.)
    configureMiddleware(app)
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })
    
    // Mount API routes
    app.use('/api/auth', authRoutes)
    app.use('/api/invites', inviteRoutes)
    
    // Create HTTP server
    const server = createServer(app)
    
    // Setup Vite or static serving based on environment
    if (config.isDev) {
      await setupVite(app)
      logger.info('Vite middleware configured for development')
    } else {
      serveStatic(app)
      logger.info('Static file serving configured for production')
    }
    
    // Start listening
    server.listen(config.PORT, () => {
      logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`)
      logger.info(`📝 Logging level: ${process.env.LOG_LEVEL || 'info'}`)
      
      if (config.isDev) {
        logger.info('🔧 Development server features:')
        logger.info('   - Hot Module Replacement (HMR) enabled')
        logger.info('   - Detailed error messages')
        logger.info('   - Runtime type checking')
        logger.info(`   - API accessible at http://localhost:${config.PORT}/api`)
      }
      
      if (config.isProd) {
        logger.info('🔒 Production security features:')
        logger.info('   - Rate limiting enabled')
        logger.info('   - Helmet security headers')
        logger.info('   - Strict CORS policy')
      }
    })
    
    // Handle server shutdown
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)
      
      server.close(() => {
        logger.info('HTTP server closed')
        process.exit(0)
      })
      
      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down')
        process.exit(1)
      }, 10000)
    }
    
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer().catch(error => {
  logger.error('Unhandled error during server startup:', error)
  process.exit(1)
})