import path from 'path';
import fs from 'fs';
import env from '../config/env.js';
import User from '../models/User.model.js';

class StorageService {
  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getCustomerFolderName(customerId) {
    const customer = await User.findById(customerId);
    if (!customer) return customerId.toString();
    const safeName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    const safeEmail = customer.email.replace(/[^a-zA-Z0-9@.]/g, '_');
    return path.join(safeName, safeEmail);
  }

  async getSubmissionDir(customerId, categoryId) {
    const folder = await this.getCustomerFolderName(customerId);
    return path.join(env.UPLOAD_DIR, 'customers', folder, categoryId.toString(), 'submissions');
  }

  async getResultDir(customerId, categoryId) {
    const folder = await this.getCustomerFolderName(customerId);
    return path.join(env.UPLOAD_DIR, 'customers', folder, categoryId.toString(), 'results');
  }

  async saveSubmission(file, customerId, categoryId) {
    const dir = await this.getSubmissionDir(customerId, categoryId);
    this.ensureDir(dir);
    const fileName = `${Date.now()}_${file.originalname}`;
    const storedPath = path.join(dir, fileName);
    fs.renameSync(file.path, storedPath);
    return { storedPath, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size };
  }

  async saveResult(file, customerId, categoryId) {
    const dir = await this.getResultDir(customerId, categoryId);
    this.ensureDir(dir);
    const fileName = `${Date.now()}_${file.originalname}`;
    const storedPath = path.join(dir, fileName);
    fs.renameSync(file.path, storedPath);
    return { storedPath, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size };
  }

  getFilePath(storedPath) {
    if (!fs.existsSync(storedPath)) {
      return null;
    }
    return storedPath;
  }

  deleteFile(storedPath) {
    try {
      if (fs.existsSync(storedPath)) {
        fs.unlinkSync(storedPath);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }

  async saveDepartmentResult(file, customerId, categoryId) {
    const dir = await this.getResultDir(customerId, categoryId);
    this.ensureDir(dir);
    const fileName = `${Date.now()}_${file.originalname}`;
    const storedPath = path.join(dir, fileName);
    fs.renameSync(file.path, storedPath);
    return { storedPath, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size };
  }
}

export default new StorageService();
