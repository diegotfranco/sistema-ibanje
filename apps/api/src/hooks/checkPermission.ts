import { FastifyRequest, FastifyReply } from 'fastify';
import { hasPermission } from '../lib/permissions';

export function checkPermission(moduleName: string, permissionName: string) {
  return async function (req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.session.userId) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
    const allowed = await hasPermission(req.session.userId, moduleName, permissionName);
    if (!allowed) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}
