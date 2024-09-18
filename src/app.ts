import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad from '@fastify/autoload';
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import { v7 as uuidv7 } from 'uuid';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass --options via CLI arguments in command to enable these options.
const options: FastifyPluginOptions = {};

const app: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  fastify.log.info('Initializing application');

  // Customize Pino logger options
  fastify.log = fastify.log.child({
    genReqId: () => uuidv7()
  });

  // This loads all plugins defined in plugins
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  });

  // This loads all plugins defined in routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  });

  fastify.log.info('Application initialized successfully');
};

export default app;
export { options };
