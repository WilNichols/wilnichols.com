/* One place that knows where the photos live: the R2 bucket behind cdn.dznr.me.
   R2 speaks the S3 API, so callers keep using ListObjectsV2Command from
   @aws-sdk/client-s3 against bucketFor() and never mention a provider.

   Everything reads process.env when called, never at module scope: ESM evaluates
   imports before the importing file's dotenv.config(), so a captured constant
   silently gets the fallback instead of the configured value. */
import { S3Client } from '@aws-sdk/client-s3';

/* Required rather than defaulted: a missing name would otherwise list an empty
   prefix and quietly publish albums with no photos in them. */
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function bucketFor() {
  return required('R2_BUCKET');
}

export function createStoreClient() {
  /* region 'auto' is what R2 expects; the account id is part of the endpoint,
     not a header, so a wrong one fails as DNS rather than as auth. */
  return new S3Client({
    region: 'auto',
    endpoint: `https://${required('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    },
  });
}
