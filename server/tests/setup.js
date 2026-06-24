import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.model.js';
import Department from '../src/models/Department.model.js';
import FileCategory from '../src/models/FileCategory.model.js';
import Notification from '../src/models/Notification.model.js';
import Document from '../src/models/Document.model.js';
import app from '../src/app.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const getJwtSecret = () => process.env.JWT_SECRET || 'test-secret-key';

export {
  app,
  User,
  Department,
  FileCategory,
  Notification,
  Document,
  getJwtSecret,
};

export async function createAdmin(overrides = {}) {
  const user = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'super_admin',
    isActive: true,
    ...overrides,
  });
  const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '1h' });
  return { user, token };
}

export async function createDepartment(overrides = {}) {
  const dept = await Department.create({
    name: 'Test Department',
    isActive: true,
    ...overrides,
  });
  return dept;
}

export async function createDeptUser(deptId, overrides = {}) {
  const user = await User.create({
    name: 'Dept User',
    email: 'dept@test.com',
    password: 'password123',
    role: 'department',
    departmentId: deptId,
    isActive: true,
    ...overrides,
  });
  const token = jwt.sign({ id: user._id, role: user.role, departmentId: deptId }, getJwtSecret(), { expiresIn: '1h' });
  return { user, token };
}

export async function createCustomer(overrides = {}) {
  const user = await User.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'password123',
    role: 'customer',
    isActive: true,
    ...overrides,
  });
  const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '1h' });
  return { user, token };
}

export async function createFileCategory(deptId, overrides = {}) {
  const fc = await FileCategory.create({
    name: 'Tax Return File',
    description: 'For tax return documents',
    departmentId: deptId,
    isActive: true,
    ...overrides,
  });
  return fc;
}


