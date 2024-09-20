import { fileURLToPath } from 'node:url';
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import { v7 as uuidv7 } from 'uuid';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';
import path from 'node:path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass --options via CLI arguments in command to enable these options.
const options: FastifyPluginOptions = {};

const app: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  fastify.log.info('Initializing application');

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

// Add this new section at the end of the file
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = Fastify({
    logger: {
      genReqId: () => uuidv7()
    }
  });

  await server.register(app);

  const start = async () => {
    try {
      await server.listen({ host: '0.0.0.0', port: 3000 });
      server.log.info({ addresses: server.addresses() }, 'Server listening on');
      server.log.info({ routes: server.printRoutes() }, 'Registered routes');
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}

export default app;
export { options };
