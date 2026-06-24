import User from '../models/User.model.js';
import Document from '../models/Document.model.js';

export const globalSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.json({ success: true, data: { customers: [], documents: [] } });
  }

  const searchRegex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  let customers = [];
  let documents = [];

  if (req.user.role === 'super_admin') {
    // Admin can search customers
    customers = await User.find({
      role: 'customer',
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).limit(10).lean();

    // Admin can search all documents
    documents = await Document.find({
      isDeleted: { $ne: true },
      $or: [
        { title: searchRegex },
        { originalName: searchRegex },
        { customGroupName: searchRegex },
        { notes: searchRegex }
      ]
    })
    .populate('customerId', 'name email')
    .populate('departmentId', 'name')
    .limit(20)
    .lean();
  } else if (req.user.role === 'department') {
    // Department can search customers that have documents in this department
    const deptId = req.user.departmentId;
    const docs = await Document.find({ departmentId: deptId, isDeleted: { $ne: true } }).select('customerId').lean();
    const customerIds = [...new Set(docs.map(d => d.customerId.toString()))];

    customers = await User.find({
      _id: { $in: customerIds },
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).limit(10).lean();

    // Search documents in this department
    documents = await Document.find({
      departmentId: deptId,
      isDeleted: { $ne: true },
      $or: [
        { title: searchRegex },
        { originalName: searchRegex },
        { customGroupName: searchRegex },
        { notes: searchRegex }
      ]
    })
    .populate('customerId', 'name email')
    .populate('departmentId', 'name')
    .limit(20)
    .lean();
  } else if (req.user.role === 'customer') {
    // Customer can only search their own documents
    documents = await Document.find({
      customerId: req.user._id,
      isDeleted: { $ne: true },
      $or: [
        { title: searchRegex },
        { originalName: searchRegex },
        { customGroupName: searchRegex }
      ]
    })
    .populate('departmentId', 'name')
    .limit(20)
    .lean();
  }

  res.json({
    success: true,
    data: {
      customers,
      documents
    }
  });
};
