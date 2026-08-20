/* Acceptance test for the S3 to R2 copy: lists every object from both backends and
   reports what is missing or differs. Sizes are compared because a truncated copy
   still shows up as present. LastModified is deliberately ignored — R2 reports the
   copy date, not the original, so it differs for every object by design.

   This is the last thing in the repo that talks to AWS, and it builds its own S3
   client rather than going through lib/photo-store.js, which is R2-only now. Run
   it once more immediately before deleting the S3 bucket, then delete this file
   along with the WN_AWS_* credentials.

   Usage: node scripts/compare-photo-stores.mjs [prefix]
   Needs WN_AWS_* and R2_* in .env. Read-only. */
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createStoreClient, bucketFor } from '../lib/photo-store.js';

dotenv.config();

const PREFIX = process.argv[2] ?? '';
const S3_BUCKET = 'wnphoto01';

function clientAndBucketFor(store) {
  if (store === 'r2') return [createStoreClient(), bucketFor()];
  return [
    new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.WN_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.WN_AWS_SECRET_ACCESS_KEY,
      },
    }),
    S3_BUCKET,
  ];
}

async function listAll(store) {
  const [client, Bucket] = clientAndBucketFor(store);
  const objects = new Map();
  let ContinuationToken;
  let pages = 0;

  do {
    const resp = await client.send(new ListObjectsV2Command({ Bucket, Prefix: PREFIX, ContinuationToken }));
    for (const { Key, Size } of resp.Contents ?? []) {
      if (Key.endsWith('/')) continue;              // zero-byte directory marker
      objects.set(Key, Size ?? 0);
    }
    ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    pages++;
  } while (ContinuationToken);

  console.log(`[${store}] ${objects.size} objects in ${Bucket} (${pages} page${pages === 1 ? '' : 's'})`);
  return objects;
}

const [s3, r2] = await Promise.all([listAll('s3'), listAll('r2')]);

const missingFromR2 = [...s3.keys()].filter(k => !r2.has(k));
const missingFromS3 = [...r2.keys()].filter(k => !s3.has(k));
const sizeMismatch = [...s3.entries()].filter(([k, size]) => r2.has(k) && r2.get(k) !== size);

const show = (label, items, format = k => k) => {
  console.log(`\n${label}: ${items.length}`);
  for (const item of items.slice(0, 20)) console.log(`  ${format(item)}`);
  if (items.length > 20) console.log(`  ...and ${items.length - 20} more`);
};

show('Missing from R2', missingFromR2);
show('Present only in R2', missingFromS3);
show('Size mismatch', sizeMismatch, ([k, size]) => `${k}  s3=${size} r2=${r2.get(k)}`);

const ok = !missingFromR2.length && !missingFromS3.length && !sizeMismatch.length;
console.log(`\n${ok ? 'PASS — object sets and sizes are identical' : 'FAIL — see above'}`);
process.exit(ok ? 0 : 1);
