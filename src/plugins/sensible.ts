import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import sensible, { type FastifySensibleOptions } from '@fastify/sensible'

async function sensiblePlugin(fastify: FastifyInstance) {
  fastify.register(sensible)
}

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp<FastifySensibleOptions>(sensiblePlugin, {
  name: 'sensible'
})
