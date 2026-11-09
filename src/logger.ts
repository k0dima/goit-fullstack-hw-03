import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
    },
  }),
})
