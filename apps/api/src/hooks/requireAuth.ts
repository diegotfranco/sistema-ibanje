import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session.userId) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
  // Bind the authenticated userId onto the request logger so every downstream log line on this
  // request (including controller/service `req.log.*` calls) is attributable without each call site
  // re-plumbing it. Runs after session load, so the id is always present here.
  req.log = req.log.child({ userId: req.session.userId });
}
