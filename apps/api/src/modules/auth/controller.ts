import { FastifyRequest, FastifyReply } from 'fastify'
import {
  LoginRequestSchema,
  PasswordResetRequestSchema,
  ResetPasswordRequestSchema,
  RegisterRequestSchema,
} from './schema'
import * as service from './service'

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const body = LoginRequestSchema.parse(req.body)

  const result = await service.login(body.email, body.password)
  if (!result) {
    req.log.warn({ email: body.email, ip: req.ip }, 'failed login attempt')
    return reply.code(401).send({ message: 'Invalid credentials' })
  }

  await req.session.regenerate()
  req.session.userId = result.userId

  return reply.send({
    name: result.name,
    email: result.email,
    role: result.role,
  })
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  await req.session.destroy()
  return reply.send({ message: 'Logged out' })
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  const user = await service.getMe(req.session.userId!)

  if (!user) {
    return reply.code(404).send({ message: 'User not found' })
  }

  return reply.send(user)
}

export async function requestPasswordReset(req: FastifyRequest, reply: FastifyReply) {
  const body = PasswordResetRequestSchema.parse(req.body)

  await service.requestPasswordReset(
    body.email,
    req.ip,
    req.headers['user-agent']
  )

  return reply.send({ message: 'If that email exists, a reset link was sent' })
}

export async function confirmPasswordReset(req: FastifyRequest, reply: FastifyReply) {
  const body = ResetPasswordRequestSchema.parse(req.body)

  const success = await service.confirmPasswordReset(body.token, body.newPassword)
  if (!success) {
    return reply.code(400).send({ message: 'Invalid or expired token' })
  }

  return reply.send({ message: 'Password updated successfully' })
}

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const body = RegisterRequestSchema.parse(req.body)
  await service.register(body.name, body.email)
  return reply.code(201).send({ message: 'Registration submitted. An admin will review your request.' })
}
