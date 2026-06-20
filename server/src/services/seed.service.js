import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env file');
  process.exit(1);
}

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      console.log('Admin email: ' + existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ca-firm.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set in .env file. Set a strong password before seeding.');
      process.exit(1);
    }

    await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'super_admin',
      mustChangePassword: false,
    });

    console.log('\nAdmin created successfully:');
    console.log('  Email:    ' + adminEmail);
    console.log('  Password: (set in .env ADMIN_PASSWORD)');
    console.log('\nYou can now log in and create departments, users, and categories from the dashboard.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
