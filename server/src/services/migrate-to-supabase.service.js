import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Document from '../models/Document.model.js';
import supabase from './supabase.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env file');
  process.exit(1);
}

const isLocalPath = (p) => p && (p.startsWith('.') || p.startsWith('/') || p.includes(':\\'));

const deriveKey = (storedPath) => {
  if (!isLocalPath(storedPath)) return storedPath;
  const parts = storedPath.replace(/\\/g, '/').split('/');
  const uploadsIdx = parts.indexOf('uploads');
  if (uploadsIdx !== -1) {
    return parts.slice(uploadsIdx + 1).join('/');
  }
  return parts.join('/');
};

const migrateFile = async (storedPath, docId, fieldName) => {
  const key = deriveKey(storedPath);
  console.log(`  [${fieldName}] ${storedPath} → ${key}`);

  if (!fs.existsSync(storedPath)) {
    console.log(`  ⚠ File not found locally, skipping: ${storedPath}`);
    return null;
  }

  const buffer = fs.readFileSync(storedPath);
  const contentType = storedPath.endsWith('.pdf') ? 'application/pdf'
    : storedPath.endsWith('.png') ? 'image/png'
    : storedPath.endsWith('.jpg') || storedPath.endsWith('.jpeg') ? 'image/jpeg'
    : storedPath.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : storedPath.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/octet-stream';

  await supabase.upload(key, buffer, contentType);
  return key;
};

const migrate = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const docs = await Document.find({
      $or: [
        { storedPath: { $ne: null, $exists: true } },
        { 'resultFile.storedPath': { $ne: null, $exists: true } },
      ],
    }).lean();

    console.log(`Found ${docs.length} documents with files to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const doc of docs) {
      console.log(`\nDocument ${doc._id} (${doc.title || 'no title'}):`);
      const update = {};

      if (doc.storedPath && isLocalPath(doc.storedPath)) {
        try {
          const newKey = await migrateFile(doc.storedPath, doc._id, 'storedPath');
          if (newKey) {
            update.storedPath = newKey;
            migrated++;
          }
        } catch (err) {
          console.error(`  ✗ Failed: ${err.message}`);
          failed++;
        }
      }

      if (doc.resultFile?.storedPath && isLocalPath(doc.resultFile.storedPath)) {
        try {
          const newKey = await migrateFile(doc.resultFile.storedPath, doc._id, 'resultFile.storedPath');
          if (newKey) {
            update['resultFile.storedPath'] = newKey;
            migrated++;
          }
        } catch (err) {
          console.error(`  ✗ Failed: ${err.message}`);
          failed++;
        }
      }

      if (Object.keys(update).length > 0) {
        await Document.findByIdAndUpdate(doc._id, { $set: update });
        console.log(`  ✓ Updated document`);
      }
    }

    console.log(`\nMigration complete: ${migrated} files migrated, ${failed} failed`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
