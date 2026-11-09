import { z } from 'zod'
import { registry } from '../openapi.ts'

export const RegisterSchema = registry.register(
  'Register',
  z.object({
    username: z.string().regex(/^[a-zA-Z0-9_]+$/).min(3).max(30),
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
  }),
)

export const LoginSchema = registry.register(
  'Login',
  z.object({
    username: z.string(),
    password: z.string(),
  }),
)

export type RegisterBody = z.infer<typeof RegisterSchema>
export type LoginBody = z.infer<typeof LoginSchema>

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': { schema: RegisterSchema },
      },
    },
  },
  responses: {
    201: { description: 'User registered successfully' },
    409: { description: 'Username or email already taken' },
    422: { description: 'Validation error' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login user',
  request: {
    body: {
      content: {
        'application/json': { schema: LoginSchema },
      },
    },
  },
  responses: {
    200: { description: 'Login successful' },
    401: { description: 'Invalid credentials' },
    422: { description: 'Validation error' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh token pair',
  request: {
    body: { content: { 'application/json': { schema: z.object({ refreshToken: z.string() }) } } },
  },
  responses: {
    200: { description: 'Tokens refreshed successfully' },
    401: { description: 'Invalid or expired refresh token' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Logout user',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'Logged out successfully' },
  },
})

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Current user profile' },
    401: { description: 'Invalid or expired token' },
  },
})
