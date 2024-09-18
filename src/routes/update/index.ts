import { FastifyPluginAsync } from 'fastify';

interface UpdateRequestBody {
  appName: string;
}

const update: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.log.info('Registering update route');

  fastify.post<{
    Body: UpdateRequestBody
  }>('/', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['appName'],
        properties: {
          appName: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { appName } = request.body;
      fastify.log.info({ reqId: request.id, appName }, 'Received update request');

      try {
        const result = await fastify.updateDockerService(appName);
        fastify.log.info({ reqId: request.id, appName, result }, 'Service update successful');
        return result;
      } catch (error) {
        fastify.log.error({ reqId: request.id, appName, error }, 'Failed to update service');
        throw fastify.httpErrors.internalServerError('Failed to update service');
      }
    }
  });

  fastify.log.info('Update route registered successfully');
};

export default update;
