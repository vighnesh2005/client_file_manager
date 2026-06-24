import mongoose from 'mongoose';

const fileCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File category name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

fileCategorySchema.index({ name: 1, departmentId: 1 }, { unique: true });

export default mongoose.model('FileCategory', fileCategorySchema);
