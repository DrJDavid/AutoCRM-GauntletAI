import winston from 'winston'
import { config } from './index'

const formats = {
  pretty: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(info => {
      const { timestamp, level, message, ...args } = info
      const ts = typeof timestamp === 'string' ? timestamp.slice(0, 19).replace('T', ' ') : new Date().toISOString()
      return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`
    })
  ),
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: formats[config.LOG_FORMAT],
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// Don't log to files in test environment
if (config.isTest) {
  logger.clear()
  logger.add(new winston.transports.Console({
    format: formats.pretty,
    silent: process.env.SUPPRESS_LOGS === 'true',
  }))
}

export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`
    
    if (res.statusCode >= 400) {
      logger.warn(message)
    } else {
      logger.http(message)
    }
  })
  
  next()
}
