import { test } from 'node:test'
import { FastifyInstance } from 'fastify'
import * as assert from 'node:assert'
import buildApp from '../helper.js'
import health from '../../src/routes/health/index.js'

test('health check', async (t) => {
  const app: FastifyInstance = await buildApp(t)

  app.register(health, { prefix: '/health' })

  const res = await app.inject({
    url: '/health'
  })

  assert.equal(res.statusCode, 200, 'Status code should be 200')
  assert.equal(res.payload, 'OK', 'Payload should be "OK"')
})
