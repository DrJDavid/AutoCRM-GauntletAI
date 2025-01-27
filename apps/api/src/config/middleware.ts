import type { Express, Request, Response, NextFunction } from 'express'
import express from 'express'
import session from 'express-session'
import MemoryStore from 'memorystore'
import passport from 'passport'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './index'
import { logger, requestLogger } from './logger'

export function configureMiddleware(app: Express): void {
  // Security middleware
  app.use(helmet())
  
  // CORS
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }))
  
  // Body parsing
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Session handling
  const MemoryStoreSession = MemoryStore(session)
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
  })
  
  app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: config.isProd,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: config.isProd ? 'strict' : 'lax',
    },
  }))
  
  // Authentication
  app.use(passport.initialize())
  app.use(passport.session())
  
  // Rate limiting
  if (config.isProd) {
    app.use(rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.',
    }))
  }
  
  // Logging
  app.use(requestLogger)
  
  // Error handling
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { 
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
    
    res.status(500).json({ 
      error: config.isDev ? err.message : 'Internal Server Error',
      ...(config.isDev && { stack: err.stack }),
    })
  })
}
