import request from 'supertest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/db';
import { createApp } from '../server/app';
let dir: string,
  db: ReturnType<typeof openDatabase>,
  app: ReturnType<typeof createApp>;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'resource-api-'));
  db = openDatabase(join(dir, 'resources.sqlite'));
  app = createApp(db, dir);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
it('API对参数错误、不存在和重复提供明确契约，并阻止直接删除online启用记录', async () => {
  expect(
    (
      await request(app)
        .post('/api/resourcePlacementLowCode/list')
        .send({ page: 0 })
    ).status
  ).toBe(400);
  const missing = await request(app)
    .post('/api/resourcePlacementLowCode/detail')
    .send({ id: 999 });
  expect(missing.status).toBe(404);
  expect(missing.body.error.code).toBe('NOT_FOUND');
  const input = {
    resourceKey: 'banner',
    resourceName: '横幅',
    bizId: 3006,
    env: 'online',
    directoryPath: '首页',
    exampleImage: '/uploads/test.png'
  };
  const created = await request(app)
    .post('/api/resourcePlacementLowCode/create')
    .send(input);
  expect(created.status).toBe(200);
  const duplicate = await request(app)
    .post('/api/resourcePlacementLowCode/create')
    .send(input);
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.error.code).toBe('DUPLICATE');
  const deleted = await request(app)
    .post('/api/resourcePlacementLowCode/delete')
    .send({ id: created.body.id });
  expect(deleted.status).toBe(400);
  expect(deleted.body.error.code).toBe('ONLINE_ENABLED');
});
it('上传保留内容、元数据与安全随机文件名，服务重建后仍可读取', async () => {
  const bytes = Buffer.from('local-upload-content');
  const result = await request(app)
    .post('/api/assets/upload')
    .attach('file', bytes, {
      filename: '../../example.png',
      contentType: 'image/png'
    });
  expect(result.status).toBe(200);
  expect(result.body.url).toMatch(/^\/uploads\/[a-f\d-]+\.png$/);
  expect(result.body.size).toBe(bytes.length);
  expect(readFileSync(join(dir, 'uploads', result.body.id))).toEqual(bytes);
  expect(
    (db.prepare('SELECT count(*) AS n FROM assets').get() as { n: number }).n
  ).toBe(1);
  const restarted = createApp(db, dir);
  const fetched = await request(restarted).get(result.body.url);
  expect(fetched.status).toBe(200);
  expect(fetched.body).toEqual(bytes);
  expect((await request(restarted).post('/api/assets/upload')).status).toBe(
    400
  );
});

it('直接更新HTTP接口不能清空必填示例图，且不写资源和历史', async () => {
  const created = await request(app)
    .post('/api/resourcePlacementLowCode/create')
    .send({
      resourceKey: 'required_image',
      resourceName: '示例图必填',
      bizId: 3006,
      env: 'ppe_test',
      directoryPath: '首页',
      exampleImage: '/uploads/test.png'
    });
  const rejected = await request(app)
    .post('/api/resourcePlacementLowCode/update')
    .send({ id: created.body.id, exampleImage: null });
  expect(rejected.status).toBe(400);
  expect(rejected.body.error.code).toBe('INVALID_RESOURCE');
  const detail = await request(app)
    .post('/api/resourcePlacementLowCode/detail')
    .send({ id: created.body.id });
  expect(detail.body).toEqual(created.body);
  const history = await request(app)
    .post('/api/resourcePlacementLowCode/getOperationLogs')
    .send({ resourcePlacementId: created.body.id });
  expect(history.body.total).toBe(1);
});
