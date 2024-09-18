import { test } from 'node:test';
import * as assert from 'node:assert';
import Fastify, { type FastifyInstance } from 'fastify';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

test('dockerServiceUpdate plugin', async (t) => {
	let fastify: FastifyInstance;
	let tmpDir: string;
	let originalPath: string;

	t.beforeEach(async () => {
		// Create a temporary directory
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docker-test-'));

		// Create a fake docker executable
		const fakeBinPath = path.join(tmpDir, 'docker');
		await fs.writeFile(fakeBinPath, `#!/bin/sh
if [ "$1" = "service" ] && [ "$2" = "ls" ]; then
  echo "test-app_test-app-1"
  echo "other-app_other-app-1"
elif [ "$1" = "service" ] && [ "$2" = "update" ]; then
  echo "Service updated"
else
  echo "Unexpected command" >&2
  exit 1
fi
`, { mode: 0o755 });

		// Modify PATH to include our fake docker
		originalPath = process.env.PATH || '';
		process.env.PATH = `${tmpDir}:${originalPath}`;

		const { default: dockerServiceUpdate } = await import('../../src/plugins/dockerServiceUpdate.js');

		fastify = Fastify();
		await fastify.register(dockerServiceUpdate);
	});

	t.afterEach(async () => {
		// Restore original PATH
		process.env.PATH = originalPath;

		// Clean up temporary directory
		await fs.rm(tmpDir, { recursive: true, force: true });

		await fastify.close();
	});

	await t.test('should register successfully', async () => {
		assert.ok(fastify.updateDockerService);
	});

	await t.test('should update docker service', async () => {
		const result = await fastify.updateDockerService('test-app');
		assert.deepStrictEqual(result, { success: true, message: 'Service test-app_test-app-1 updated successfully' });
	});

	await t.test('should throw error if service not found', async () => {
		await assert.rejects(
			async () => {
				await fastify.updateDockerService('non-existent-app');
			},
			{
				name: 'Error',
				message: 'No matching service found for non-existent-app'
			}
		);
	});
});
