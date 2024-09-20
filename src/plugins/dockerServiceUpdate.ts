import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { exec, ExecException } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type DockerServiceUpdateOptions = Record<string, unknown>;

const handleDockerError = (fastify: FastifyInstance) => (error: ExecException & { stderr?: string }) => {
  if (error.message.includes('permission denied')) {
    const errorMessage = 'Permission denied: Unable to access Docker daemon. Please ensure the application has the necessary permissions.';
    fastify.log.error(errorMessage);
    return new Error(errorMessage);
  }
  return error;
};

const getServiceName = (serviceList: string, appName: string): string | undefined =>
  serviceList.split('\n').find(name => name.startsWith(`${appName}_${appName}`));

const updateService = async (fastify: FastifyInstance, serviceName: string): Promise<void> => {
  fastify.log.info({ serviceName }, 'Updating service');
  await execAsync(`docker service update --force ${serviceName}`);
  fastify.log.info({ serviceName }, 'Service updated successfully');
};

const updateDockerService = (fastify: FastifyInstance) => async (appName: string) => {
  try {
    fastify.log.info({ appName }, 'Attempting to update Docker service');

    const { stdout: serviceList } = await execAsync('docker service ls --format "{{.Name}}"');
    fastify.log.debug({ serviceList, appName }, 'Service list and app name');

    const serviceName = getServiceName(serviceList, appName);

    if (!serviceName) {
      fastify.log.error({ appName }, 'No matching service found');
      throw new Error(`No matching service found for ${appName}`);
    }

    await updateService(fastify, serviceName);

    return { success: true, message: `Service ${serviceName} updated successfully` };
  } catch (error) {
    fastify.log.error({ appName, error }, 'Failed to update Docker service');
    throw handleDockerError(fastify)(error as ExecException & { stderr?: string });
  }
};

export default fp<DockerServiceUpdateOptions>(async (fastify: FastifyInstance) => {
  fastify.log.info('Registering Docker service update plugin');

  fastify.decorate('updateDockerService', updateDockerService(fastify));

  fastify.log.info('Docker service update plugin registered successfully');
});

declare module 'fastify' {
  interface FastifyInstance {
    updateDockerService: (appName: string) => Promise<{ success: boolean; message: string }>;
  }
}
