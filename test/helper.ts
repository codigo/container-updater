// This file contains code that we reuse between our tests.
import Fastify, { type FastifyInstance } from 'fastify'

export default async function buildApp(t: any): Promise<FastifyInstance> {
  const app: FastifyInstance = Fastify()
  // Tear down our app after we are done
  t.after(() => app.close())

  return app
}
