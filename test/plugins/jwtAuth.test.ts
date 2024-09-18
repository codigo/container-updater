import { env } from 'process';
import { test } from 'node:test';
import * as assert from 'node:assert';
import Fastify, { type FastifyInstance } from 'fastify';
import jwtAuth from '../../src/plugins/jwtAuth.js';

test('jwtAuth plugin', async (t) => {
  let fastify: FastifyInstance;

  t.beforeEach(async () => {
    env.JWT_SECRET = 'test-secret';
    fastify = Fastify();
  });

  t.afterEach(async () => {
    await fastify.close();
  });

  await t.test('should register successfully', async () => {
    await fastify.register(jwtAuth);
    assert.ok(fastify.jwt, 'fastify.jwt should be defined');
    assert.ok(fastify.authenticate, 'fastify.authenticate should be defined');
  });

  await t.test('should throw error if JWT_SECRET is not set', async () => {
    delete env.JWT_SECRET;
    await assert.rejects(
      async () => {
        await fastify.register(jwtAuth);
      },
      {
        name: 'Error',
        message: 'JWT_SECRET environment variable is not set'
      }
    );
  });

  await t.test('should sign and verify JWT', async () => {
    await fastify.register(jwtAuth);
    interface TokenPayload { userId: number }
    const token = fastify.jwtUtils.sign({ userId: 1 });
    const decoded = fastify.jwtUtils.verify(token) as TokenPayload;
    assert.equal(decoded.userId, 1);
  });

  await t.test('should throw error if JWT is invalid', async () => {
    await fastify.register(jwtAuth);
    await assert.rejects(
      async () => {
        await fastify.jwtUtils.verify('invalid-token');
      },
      {
        name: 'Error',
        message: 'The token is malformed.'
      }
    );
  });
});
