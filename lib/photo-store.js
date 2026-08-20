/* One place that knows where the photos live, so the S3 to R2 cutover is a single
   env change rather than an edit at every call site. R2 speaks the S3 API, so the
   only thing that varies is client construction: callers keep using
   ListObjectsV2Command against bucketFor() and see no difference.

   PHOTO_STORE=s3 (default) | r2. Defaulting to s3 keeps existing builds byte
   identical until the flip is deliberate.

   Everything reads process.env when called, never at module scope: ESM evaluates
   imports before the importing file's dotenv.config(), so a captured constant
   silently gets the fallback instead of the configured value. */
import { S3Client } from '@aws-sdk/client-s3';

const S3_BUCKET = 'wnphoto01';

export function photoStore() {
  return (process.env.PHOTO_STORE || 's3').toLowerCase();
}

/* R2_BUCKET exists so a differing name on the R2 side needs no code change. */
export function bucketFor(store = photoStore()) {
  return store === 'r2' ? (process.env.R2_BUCKET || S3_BUCKET) : S3_BUCKET;
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`PHOTO_STORE=r2 requires ${name}`);
  return value;
}

export function createStoreClient(store = photoStore()) {
  if (store === 'r2') {
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
  return new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.WN_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.WN_AWS_SECRET_ACCESS_KEY,
    },
  });
}
