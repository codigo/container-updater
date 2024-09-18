import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export interface DockerServiceUpdateOptions {}

export default fp<DockerServiceUpdateOptions>(async (fastify: FastifyInstance) => {

  fastify.log.info('Registering Docker service update plugin');

  fastify.decorate('updateDockerService', async (appName: string) => {
    try {
      fastify.log.info({ appName }, 'Attempting to update Docker service');

      // Get the list of services
      const { stdout: serviceList } = await execAsync('docker service ls --format "{{.Name}}"');
      // Find the matching service
      fastify.log.info({ serviceList, appName }, 'Service list and app name');
      const serviceName = serviceList.split('\n').find(name => name.startsWith(`${appName}_${appName}`));

      if (!serviceName) {
        fastify.log.error({ appName }, 'No matching service found');
        throw new Error(`No matching service found for ${appName}`);
      }

      fastify.log.info({ serviceName }, 'Matching service found, updating');

      // Update the service
      await execAsync(`docker service update --force ${serviceName}`);

      fastify.log.info({ serviceName }, 'Service updated successfully');
      return { success: true, message: `Service ${serviceName} updated successfully` };
    } catch (error) {
      fastify.log.error({ appName, error }, 'Failed to update Docker service');
      throw error; // Throw the original error instead of a new one
    }
  });

  fastify.log.info('Docker service update plugin registered successfully');
});

declare module 'fastify' {
  interface FastifyInstance {
    updateDockerService: (appName: string) => Promise<{ success: boolean; message: string }>;
  }
}
