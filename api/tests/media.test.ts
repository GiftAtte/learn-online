import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { signParams } from '../src/modules/media/media.service';
import { api, createUser } from './helpers';

describe('upload signatures', () => {
  it('signs the way Cloudinary documents it (sorted settings + secret, SHA-1)', () => {
    // The worked example from Cloudinary's documentation.
    const signature = signParams(
      { eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 },
      'abcd',
    );
    expect(signature).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e');
  });

  it('gives an admin everything needed to upload a video straight to Cloudinary', async () => {
    const admin = await createUser('ADMIN');
    const res = await api().post('/api/v1/media/signature').set(admin.auth).send({ kind: 'video' });

    expect(res.status).toBe(200);
    const { uploadUrl, apiKey, folder, allowedFormats, timestamp, signature } = res.body.data;
    expect(uploadUrl).toBe('https://api.cloudinary.com/v1_1/demo-cloud/video/upload');
    expect(apiKey).toBe('123456789012345');
    expect(folder).toBe('learnonline/videos');
    expect(allowedFormats).toBe('mp4,webm,mov');

    // The signature really covers these settings and uses the secret (which is never sent back).
    const expected = createHash('sha1')
      .update(
        `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}test-secret-for-signatures`,
      )
      .digest('hex');
    expect(signature).toBe(expected);
    expect(JSON.stringify(res.body)).not.toContain('test-secret-for-signatures');
  });

  it('uses image settings for covers and thumbnails', async () => {
    const admin = await createUser('ADMIN');
    const res = await api().post('/api/v1/media/signature').set(admin.auth).send({ kind: 'image' });

    expect(res.status).toBe(200);
    expect(res.body.data.uploadUrl).toContain('/image/upload');
    expect(res.body.data.allowedFormats).toBe('jpg,jpeg,png,webp,gif');
  });

  it('refuses anyone who is not an administrator, and unknown kinds of file', async () => {
    const learner = await createUser('LEARNER');
    const admin = await createUser('ADMIN', 'second-admin@test.dev');

    expect((await api().post('/api/v1/media/signature').send({ kind: 'video' })).status).toBe(401);
    expect(
      (await api().post('/api/v1/media/signature').set(learner.auth).send({ kind: 'video' })).status,
    ).toBe(403);
    expect(
      (await api().post('/api/v1/media/signature').set(admin.auth).send({ kind: 'script' })).status,
    ).toBe(400);
  });
});
