import type { Readable } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

const s3 = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY
  },
  forcePathStyle: true
});

const BUCKET = env.MINIO_BUCKET;

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf'
};

export async function initStorage() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export type StoredFile = {
  body: Readable;
  contentType: string;
  contentLength: number | null;
};

// MinIO stays on an internal Docker DNS name, so presigned URLs are unreachable
// from browsers; instead the API streams stored files back through authenticated routes.
export async function getFileStream(key: string): Promise<StoredFile | null> {
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!result.Body) return null;
    return {
      body: result.Body as Readable,
      contentType: result.ContentType ?? 'application/octet-stream',
      contentLength: result.ContentLength ?? null
    };
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err.name === 'NoSuchKey' || err.name === 'NotFound')
    ) {
      return null;
    }
    throw err;
  }
}
