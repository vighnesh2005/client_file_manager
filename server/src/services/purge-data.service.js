import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import FileCategory from '../models/FileCategory.model.js';
import Document from '../models/Document.model.js';
import Notification from '../models/Notification.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env file');
  process.exit(1);
}

const purge = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'super_admin' });
    if (!admin) {
      console.log('No admin found. Aborting — seed an admin first.');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`Preserving admin: ${admin.email} (${admin._id})`);

    const delUsers = await User.deleteMany({ role: { $ne: 'super_admin' } });
    console.log(`Deleted ${delUsers.deletedCount} non-admin users`);

    const delDepts = await Department.deleteMany({});
    console.log(`Deleted ${delDepts.deletedCount} departments`);

    const delFCs = await FileCategory.deleteMany({});
    console.log(`Deleted ${delFCs.deletedCount} file categories`);

    const delDocs = await Document.deleteMany({});
    console.log(`Deleted ${delDocs.deletedCount} documents`);

    const delNotifs = await Notification.deleteMany({});
    console.log(`Deleted ${delNotifs.deletedCount} notifications`);

    console.log('\nPurge complete. Only the admin user remains.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Purge failed:', error);
    process.exit(1);
  }
};

purge();
