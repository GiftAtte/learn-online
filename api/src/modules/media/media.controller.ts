import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import * as service from './media.service';

/** POST /media/signature: a signed, short-lived permission to upload one file to Cloudinary. */
export const createSignature = async (req: Request, res: Response) => {
  ok(res, await service.createUploadSignature(req.body));
};
