import { FastifyInstance } from 'fastify';
import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import buildApp from '../helper.js';
import sensible from '../../src/plugins/sensible.js'
import jwtAuth from '../../src/plugins/jwtAuth.js'
import dockerServiceUpdate from '../../src/plugins/dockerServiceUpdate.js'
import update from '../../src/routes/update/index.js'

test('update route', async (t) => {
  process.env.JWT_SECRET = 'test-secret';
  let tmpDir: string;
  let originalPath: string;

  const app: FastifyInstance = await buildApp(t);

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
  })

  t.afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  await app.register(sensible)
  await app.register(jwtAuth)
  await app.register(dockerServiceUpdate)
  await app.register(update, { prefix: '/update' })

  await t.test('should update service successfully', async () => {
    const token = app.jwtUtils.sign({ userId: 1 });
    const response = await app.inject({
      method: 'POST',
      url: '/update',
      payload: { appName: 'test-app' },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(response.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(response.payload), {
      success: true,
      message: 'Service test-app_test-app-1 updated successfully'
    });
  });

  await t.test('should return 401 for invalid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/update',
      payload: { appName: 'test-app' },
      headers: {
        authorization: 'Bearer invalid_token'
      }
    });

    assert.equal(response.statusCode, 401);
  });

  await t.test('should return 500 if update fails', async () => {
    // Mock updateDockerService to throw an error
    app.updateDockerService = async () => {
      throw new Error('Update failed');
    };

    const token = app.jwtUtils.sign({ userId: 1 });
    const response = await app.inject({
      method: 'POST',
      url: '/update',
      payload: { appName: 'test-app' },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(response.statusCode, 500);
    assert.deepStrictEqual(JSON.parse(response.payload), {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Failed to update service'
    });
  });
});
