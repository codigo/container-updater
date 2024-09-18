import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from 'process';
import { SignPayloadType } from '@fastify/jwt';

async function jwtAuth(fastify: FastifyInstance) {
  fastify.log.info('Registering JWT authentication plugin');

  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  fastify.register(jwt, {
    secret: env.JWT_SECRET
  });

  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      fastify.log.info('Request authenticated successfully');
    } catch (err) {
      fastify.log.error({ err }, 'Authentication failed');
      reply.send(err);
    }
  });

  fastify.decorate('jwtUtils', {
    decode: (token: string) => fastify.jwt.decode(token),
    sign: (payload: SignPayloadType) => fastify.jwt.sign(payload),
    verify: (token: string) => fastify.jwt.verify(token)
  });

  fastify.log.info('JWT authentication plugin registered successfully');
}

export default fp(jwtAuth, { name: 'jwtAuth' });

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    jwtUtils: {
      sign: (payload: SignPayloadType) => string;
      verify: (token: string) => SignPayloadType;
      decode: (token: string) => string | Record<string, unknown> | null;
    };
  }
}
