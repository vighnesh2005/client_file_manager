import Document from '../models/Document.model.js';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import FileCategory from '../models/FileCategory.model.js';
import Notification from '../models/Notification.model.js';
import AppError from '../utils/AppError.js';
import storageService from '../services/storage.service.js';

const SLA_MS = 48 * 60 * 60 * 1000;
const WARNING_MS = 12 * 60 * 60 * 1000;

export const getDashboard = async (req, res) => {
  const deptId = req.user.departmentId;
  const now = new Date();

  const subFilter = { departmentId: deptId, direction: 'submission' };
  const [totalDocs, pending, processing, completed, blocked, recentDocs, slaOverdue, slaApproaching, slaWithin, slaMet, slaMissed, customers] = await Promise.all([
    Document.countDocuments(subFilter),
    Document.countDocuments({ ...subFilter, status: 'pending' }),
    Document.countDocuments({ ...subFilter, status: 'processing' }),
    Document.countDocuments({ ...subFilter, status: 'completed' }),
    Document.countDocuments({ ...subFilter, status: 'blocked' }),
    Document.find(subFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name email')
      
      .lean(),
    Document.countDocuments({
      ...subFilter,
      status: { $in: ['pending', 'processing'] },
      createdAt: { $lt: new Date(now - SLA_MS) },
    }),
    Document.countDocuments({
      ...subFilter,
      status: { $in: ['pending', 'processing'] },
      createdAt: {
        $gte: new Date(now - SLA_MS),
        $lt: new Date(now - SLA_MS + WARNING_MS),
      },
    }),
    Document.countDocuments({
      ...subFilter,
      status: { $in: ['pending', 'processing'] },
      createdAt: { $gte: new Date(now - SLA_MS + WARNING_MS) },
    }),
    Document.countDocuments({
      ...subFilter,
      status: { $in: ['completed', 'blocked'] },
      'resultFile.uploadedAt': { $exists: true },
      $expr: {
        $lte: [
          { $subtract: ['$resultFile.uploadedAt', '$createdAt'] },
          SLA_MS,
        ],
      },
    }),
    Document.countDocuments({
      ...subFilter,
      status: { $in: ['completed', 'blocked'] },
      'resultFile.uploadedAt': { $exists: true },
      $expr: {
        $gt: [
          { $subtract: ['$resultFile.uploadedAt', '$createdAt'] },
          SLA_MS,
        ],
      },
    }),
    Document.aggregate([
      { $match: { departmentId: deptId, direction: 'submission' } },
      { $group: { _id: '$customerId', totalDocs: { $sum: 1 }, pendingDocs: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, lastDoc: { $max: '$createdAt' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { lastDoc: -1 } },
      { $project: { _id: '$customer._id', name: '$customer.name', email: '$customer.email', totalDocs: 1, pendingDocs: 1, lastDoc: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: { totalDocs, pending, processing, completed, blocked, slaOverdue, slaApproaching, slaWithin, slaMet, slaMissed, recentDocs, customers },
  });
};

export const getCustomers = async (req, res) => {
  const deptId = req.user.departmentId;
  const { filter } = req.query;

  const matchStage = { departmentId: deptId, direction: 'submission' };
  if (filter === 'completed') {
    matchStage.status = 'completed';
  } else if (filter === 'non_completed') {
    matchStage.status = { $in: ['pending', 'processing', 'blocked'] };
  } else if (filter === 'near_deadline') {
    const warningMs = 12 * 60 * 60 * 1000;
    const slaMs = 48 * 60 * 60 * 1000;
    const now = new Date();
    matchStage.status = { $in: ['pending', 'processing'] };
    matchStage.createdAt = {
      $gte: new Date(now - slaMs),
      $lt: new Date(now - slaMs + warningMs),
    };
  }

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  if (page && limit) {
    const skip = (page - 1) * limit;
    
    const countRes = await Document.aggregate([
      { $match: matchStage },
      { $group: { _id: '$customerId' } },
      { $count: 'total' }
    ]);
    const total = countRes[0]?.total || 0;

    const customers = await Document.aggregate([
      { $match: matchStage },
      { $group: { _id: '$customerId', totalDocs: { $sum: 1 }, pendingDocs: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, lastDoc: { $max: '$createdAt' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { lastDoc: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: '$customer._id',
          name: '$customer.name',
          email: '$customer.email',
          totalDocs: 1,
          pendingDocs: 1,
          lastDoc: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } else {
    const customers = await Document.aggregate([
      { $match: matchStage },
      { $group: { _id: '$customerId', totalDocs: { $sum: 1 }, pendingDocs: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, lastDoc: { $max: '$createdAt' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { lastDoc: -1 } },
      {
        $project: {
          _id: '$customer._id',
          name: '$customer.name',
          email: '$customer.email',
          totalDocs: 1,
          pendingDocs: 1,
          lastDoc: 1,
        },
      },
    ]);

    res.json({ success: true, data: customers });
  }
};

export const getCustomerDocuments = async (req, res) => {
  const deptId = req.user.departmentId;
  const { customerId } = req.params;

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const query = { customerId, departmentId: deptId, direction: 'submission', isDeleted: { $ne: true } };

  if (page && limit) {
    const skip = (page - 1) * limit;
    const total = await Document.countDocuments(query);
    const docs = await Document.find(query)
      
      .populate('resultFile.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      data: docs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } else {
    const docs = await Document.find(query)
      
      .populate('resultFile.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: docs });
  }
};

export const getDocuments = async (req, res) => {
  const deptId = req.user.departmentId;
  const { status, customerId } = req.query;
  const query = { departmentId: deptId, direction: 'submission', isDeleted: { $ne: true } };

  if (status && typeof status === 'string') query.status = status;
  if (customerId && typeof customerId === 'string') query.customerId = customerId;

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  if (page && limit) {
    const skip = (page - 1) * limit;
    const total = await Document.countDocuments(query);
    const docs = await Document.find(query)
      .populate('customerId', 'name email')
      
      .populate('resultFile.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      data: docs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } else {
    const docs = await Document.find(query)
      .populate('customerId', 'name email')
      
      .populate('resultFile.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: docs });
  }
};

export const getDocumentDetail = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;

  const doc = await Document.findOne({ _id: id, departmentId: deptId })
    .populate('customerId', 'name email')
    
    .populate('resultFile.uploadedBy', 'name');

  if (!doc) throw new AppError('Document not found', 404);

  // If part of a group, fetch all other group documents
  let groupDocs = [];
  if (doc.groupId) {
    groupDocs = await Document.find({ groupId: doc.groupId })
      .populate('customerId', 'name email')
      
      .populate('resultFile.uploadedBy', 'name')
      .sort({ createdAt: 1 })
      .lean();
  } else {
    groupDocs = [doc.toJSON()];
  }

  res.json({
    success: true,
    data: {
      ...doc.toJSON(),
      groupDocs,
    },
  });
};

export const updateDocumentStatus = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!['pending', 'processing', 'completed'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  // If part of a group, synchronize status and notes across all files in the group
  if (doc.groupId) {
    await Document.updateMany(
      { groupId: doc.groupId, departmentId: deptId },
      { status, ...(notes !== undefined && { notes }) }
    );
    const updated = await Document.findOne({ _id: id, departmentId: deptId });
    return res.json({ success: true, data: updated });
  }

  doc.status = status;
  if (notes !== undefined) doc.notes = notes;
  await doc.save();

  res.json({ success: true, data: doc });
};

export const createResponse = async (req, res) => {
  const deptId = req.user.departmentId;
  const { customerId, fileCategoryId, notes } = req.body;

  if (!customerId) throw new AppError('Customer ID is required', 400);
  if (!fileCategoryId) throw new AppError('File category ID is required', 400);
  if (!req.file) throw new AppError('Response file is required', 400);

  const fileCategory = await FileCategory.findById(fileCategoryId);
  if (!fileCategory || !fileCategory.isActive) {
    throw new AppError('File category not found or inactive', 404);
  }
  if (fileCategory.departmentId.toString() !== deptId.toString()) {
    throw new AppError('File category does not belong to this department', 400);
  }

  const customer = await User.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const fileInfo = await storageService.saveResponse(req.file, customerId, fileCategoryId);

  const doc = await Document.create({
    customerId,
    departmentId: deptId,
    fileCategoryId,
    direction: 'response',
    title: req.file.originalname,
    notes: notes || '',
    ...fileInfo,
    status: 'completed',
  });

  // Notify the customer
  const dept = await Department.findById(deptId);
  await Notification.create({
    userId: customerId,
    type: 'new_response',
    message: `${dept.name} uploaded a new document: ${fileInfo.originalName}`,
    link: '/customer/responses',
  });

  const populated = await Document.findById(doc._id)
    .populate('customerId', 'name email')
    .populate('fileCategoryId', 'name')
    .populate('departmentId', 'name');

  res.status(201).json({ success: true, data: populated });
};

export const getResponses = async (req, res) => {
  const deptId = req.user.departmentId;
  const { customerId } = req.query;
  const query = { departmentId: deptId, direction: 'response', isDeleted: { $ne: true } };
  if (customerId) query.customerId = customerId;

  const docs = await Document.find(query)
    .populate('customerId', 'name email')
    .populate('fileCategoryId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: docs });
};

export const getDepartmentFileCategories = async (req, res) => {
  const deptId = req.user.departmentId;
  const fileCategories = await FileCategory.find({ departmentId: deptId, isActive: true })
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: fileCategories });
};

export const blockDocument = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;

  const dept = await Department.findById(deptId);
  if (!dept?.permissions?.blockDocuments) {
    throw new AppError('Your department does not have permission to block documents', 403);
  }

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  if (doc.groupId) {
    await Document.updateMany(
      { groupId: doc.groupId, departmentId: deptId, resultFile: { $exists: true } },
      {
        paymentBlocked: true,
        status: 'blocked',
        blockedAt: new Date(),
        blockedBy: req.user._id,
      }
    );
    const updated = await Document.findOne({ _id: id, departmentId: deptId });
    return res.json({ success: true, data: updated });
  }

  // Only block if this doc has a result file
  if (!doc.resultFile) throw new AppError('No result file to block', 400);

  doc.paymentBlocked = true;
  doc.status = 'blocked';
  doc.blockedAt = new Date();
  doc.blockedBy = req.user._id;
  await doc.save();

  res.json({ success: true, data: doc });
};

export const unblockDocument = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;

  const dept = await Department.findById(deptId);
  if (!dept?.permissions?.blockDocuments) {
    throw new AppError('Your department does not have permission to unblock documents', 403);
  }

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  if (doc.groupId) {
    await Document.updateMany(
      { groupId: doc.groupId, departmentId: deptId, resultFile: { $exists: true } },
      {
        paymentBlocked: false,
        $unset: { blockedAt: 1, blockedBy: 1 }
      }
    );
    const updated = await Document.findOne({ _id: id, departmentId: deptId });
    return res.json({ success: true, data: updated });
  }

  // Only unblock if this doc has a result file
  if (!doc.resultFile) throw new AppError('No result file to unblock', 400);

  doc.paymentBlocked = false;
  doc.blockedAt = undefined;
  doc.blockedBy = undefined;
  await doc.save();

  res.json({ success: true, data: doc });
};

export const updateNotes = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;
  const { notes } = req.body;

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  doc.notes = notes;
  await doc.save();

  res.json({ success: true, data: doc });
};

export const downloadFile = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  const { type } = req.query;

  if (type === 'result') {
    if (doc.paymentBlocked) {
      throw new AppError('Result file is blocked until payment is completed.', 403);
    }
    if (doc.resultFileDeletedFromStorage) {
      throw new AppError('The requested result file has been purged from storage.', 410);
    }
  }
  if (type !== 'result') {
    if (doc.fileDeletedFromStorage) {
      throw new AppError('The requested submission file has been purged from storage.', 410);
    }
  }

  const filePath = type === 'result' && doc.resultFile ? doc.resultFile.storedPath : doc.storedPath;
  const fileName = type === 'result' && doc.resultFile ? doc.resultFile.originalName : doc.originalName;

  if (!filePath) throw new AppError('File not found', 404);
  const url = await storageService.getDownloadUrl(filePath, fileName);
  if (!url) throw new AppError('File not found on storage', 404);

  res.redirect(url);
};

export const departmentPurgeDocumentFiles = async (req, res) => {
  const deptId = req.user.departmentId;
  const { id } = req.params;

  const doc = await Document.findOne({ _id: id, departmentId: deptId });
  if (!doc) throw new AppError('Document not found', 404);

  let docsToPurge = [doc];
  if (doc.groupId) {
    docsToPurge = await Document.find({ groupId: doc.groupId, departmentId: deptId });
  }

  let totalFilesDeleted = 0;

  for (const item of docsToPurge) {
    let itemModified = false;
    if (item.storedPath && !item.fileDeletedFromStorage) {
      try {
        await storageService.deleteFile(item.storedPath);
        item.fileDeletedFromStorage = true;
        itemModified = true;
        totalFilesDeleted++;
      } catch (err) {
        console.error(`Failed to delete file ${item.storedPath}:`, err);
      }
    }
    if (item.resultFile?.storedPath && !item.resultFileDeletedFromStorage) {
      try {
        await storageService.deleteFile(item.resultFile.storedPath);
        item.resultFileDeletedFromStorage = true;
        itemModified = true;
        totalFilesDeleted++;
      } catch (err) {
        console.error(`Failed to delete result file ${item.resultFile.storedPath}:`, err);
      }
    }

    if (itemModified) {
      item.purgedAt = new Date();
      item.purgedBy = req.user._id;
      await item.save();
    }
  }

  const updatedDoc = await Document.findOne({ _id: id, departmentId: deptId });
  res.json({
    success: true,
    message: `Successfully purged files across the request group (Deleted ${totalFilesDeleted} files).`,
    data: updatedDoc
  });
};

export const renameCustomer = async (req, res) => {
  if (!req.user.canRename) {
    throw new AppError('You do not have permission to rename', 403);
  }

  const deptId = req.user.departmentId;
  const { customerId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Name is required', 400);
  }

  // Verify this customer has documents in this department
  const doc = await Document.findOne({ customerId, departmentId: deptId });
  if (!doc) throw new AppError('Customer not found in your department', 404);

  const updated = await User.findByIdAndUpdate(customerId, { name: name.trim() }, { new: true }).select('name email');
  if (!updated) throw new AppError('Customer not found', 404);

  res.json({ success: true, data: updated });
};

export const departmentBatchDocuments = async (req, res) => {
  const { ids, action, status } = req.body;
  const deptId = req.user.departmentId;

  if (!ids || !Array.isArray(ids)) {
    throw new AppError('Document IDs array is required', 400);
  }

  if (action === 'status') {
    if (!status || !['pending', 'processing', 'completed', 'blocked'].includes(status)) {
      throw new AppError('Valid status is required', 400);
    }
    const updatePayload = { status };
    if (status === 'blocked') {
      updatePayload.paymentBlocked = true;
      updatePayload.blockedAt = new Date();
      updatePayload.blockedBy = req.user._id;
    } else {
      updatePayload.paymentBlocked = false;
    }

    for (const id of ids) {
      const doc = await Document.findOne({ _id: id, departmentId: deptId });
      if (doc) {
        if (doc.groupId) {
          if (status !== 'blocked') {
            await Document.updateMany(
              { groupId: doc.groupId, departmentId: deptId },
              { $set: updatePayload, $unset: { blockedAt: 1, blockedBy: 1 } }
            );
          } else {
            await Document.updateMany({ groupId: doc.groupId, departmentId: deptId }, updatePayload);
          }
        } else {
          doc.status = status;
          if (status === 'blocked') {
            doc.paymentBlocked = true;
            doc.blockedAt = new Date();
            doc.blockedBy = req.user._id;
          } else {
            doc.paymentBlocked = false;
            doc.blockedAt = undefined;
            doc.blockedBy = undefined;
          }
          await doc.save();
        }
      }
    }
  } else if (action === 'block') {
    for (const id of ids) {
      const doc = await Document.findOne({ _id: id, departmentId: deptId });
      if (doc) {
        if (doc.groupId) {
          await Document.updateMany(
            { groupId: doc.groupId, departmentId: deptId, resultFile: { $exists: true } },
            { paymentBlocked: true, status: 'blocked', blockedAt: new Date(), blockedBy: req.user._id }
          );
        } else if (doc.resultFile) {
          doc.paymentBlocked = true;
          doc.status = 'blocked';
          doc.blockedAt = new Date();
          doc.blockedBy = req.user._id;
          await doc.save();
        }
      }
    }
  } else if (action === 'unblock') {
    for (const id of ids) {
      const doc = await Document.findOne({ _id: id, departmentId: deptId });
      if (doc) {
        if (doc.groupId) {
          await Document.updateMany(
            { groupId: doc.groupId, departmentId: deptId, resultFile: { $exists: true } },
            { paymentBlocked: false, $unset: { blockedAt: 1, blockedBy: 1 } }
          );
        } else if (doc.resultFile) {
          doc.paymentBlocked = false;
          doc.blockedAt = undefined;
          doc.blockedBy = undefined;
          await doc.save();
        }
      }
    }
  } else if (action === 'delete') {
    if (!req.user.canDelete) {
      throw new AppError('You do not have permission to delete files or folders', 403);
    }
    for (const id of ids) {
      const doc = await Document.findOne({ _id: id, departmentId: deptId });
      if (doc) {
        let docsToPurge = [doc];
        if (doc.groupId) {
          docsToPurge = await Document.find({ groupId: doc.groupId });
        }
        for (const item of docsToPurge) {
          if (item.storedPath && !item.fileDeletedFromStorage) {
            try { await storageService.deleteFile(item.storedPath); } catch (_) {}
          }
          if (item.resultFile?.storedPath && !item.resultFileDeletedFromStorage) {
            try { await storageService.deleteFile(item.resultFile.storedPath); } catch (_) {}
          }
          item.isDeleted = true;
          item.purgedAt = new Date();
          item.purgedBy = req.user._id;
          await item.save();
        }
      }
    }
  } else {
    throw new AppError('Invalid action', 400);
  }

  res.json({ success: true, message: 'Batch operation completed successfully' });
};
