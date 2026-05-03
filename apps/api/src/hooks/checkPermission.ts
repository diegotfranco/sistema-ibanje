import { FastifyRequest, FastifyReply } from 'fastify';
import { hasPermission } from '../lib/permissions';
import { ModuleName, ActionName } from '../lib/constants';

export function checkPermission(moduleName: ModuleName, permissionName: ActionName) {
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
