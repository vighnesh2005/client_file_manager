'use client';
import { useState, useEffect, useMemo } from 'react';
import { customerAPI } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTime, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Building2,
  FolderOpen,
  FileText,
  Download,
  CheckCircle,
  Lock,
  Clock,
  ChevronRight,
  ArrowLeft,
  Folder,
} from 'lucide-react';

export default function CustomerCategoriesPage() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    customerAPI.getCategories()
      .then(res => setGrouped(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadResult = async (doc) => {
    if (doc.paymentBlocked) {
      toast.error('Payment is due. Please contact the firm.');
      return;
    }
    if (doc.resultFileDeletedFromStorage) {
      toast.error('The result file has been removed from storage.');
      return;
    }
    try {
      const res = await customerAPI.downloadDocument(doc._id, 'result');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.resultFile?.originalName || 'result';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const sortedDocs = useMemo(() => {
    if (!selectedCat?.documents) return [];
    const docs = [...selectedCat.documents];
    docs.sort((a, b) => {
      let comp = 0;
      if (sortField === 'date') {
        comp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortField === 'name') {
        comp = (a.title || a.originalName || '').localeCompare(b.title || b.originalName || '');
      } else if (sortField === 'status') {
        comp = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'size') {
        comp = (a.fileSize || 0) - (b.fileSize || 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
    return docs;
  }, [selectedCat, sortField, sortOrder]);

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}</div>;

  const deptNames = Object.keys(grouped);

  if (selectedCat) {
    return (
      <div>
        <button
          onClick={() => setSelectedCat(null)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Categories
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50 rounded-t-lg">
            <Folder className="w-5 h-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-800">{selectedCat.name}</h1>
              {selectedCat.description && <p className="text-xs text-gray-500">{selectedCat.description}</p>}
            </div>
            <span className="ml-auto text-xs text-gray-400">{sortedDocs.length} document{sortedDocs.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="px-5 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="text-xs border rounded px-2 py-1 outline-none bg-white"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="size">Size</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border rounded text-xs bg-white hover:bg-gray-50 font-medium"
            >
              {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
            </button>
          </div>

          <div className="divide-y">
            {sortedDocs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Clock className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No documents in this category yet</p>
              </div>
            ) : (
              sortedDocs.map((doc) => (
                <div key={doc._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.title || doc.originalName}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatDateTime(doc.createdAt)}
                        {doc.fileSize ? ` • ${formatFileSize(doc.fileSize)}` : ''}
                        {doc.departmentId?.name ? ` • ${doc.departmentId.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.paymentBlocked ? 'blocked' : doc.status} size="sm" />
                    {doc.resultFile && !doc.resultFileDeletedFromStorage && !doc.paymentBlocked && (
                      <button
                        onClick={() => handleDownloadResult(doc)}
                        className="p-1.5 bg-green-50 border border-green-200 rounded text-green-700 hover:bg-green-100 transition"
                        title="Download Result"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {doc.resultFile && doc.paymentBlocked && (
                      <button
                        onClick={() => toast.error('Payment is due. Please contact the firm.')}
                        className="p-1.5 text-red-400 hover:text-red-600 transition"
                        title="Blocked - Payment Due"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!doc.resultFile && doc.status === 'completed' && (
                      <span className="text-green-500" title="Completed - No result file">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Document Categories</h1>
      <p className="text-gray-500 mb-6">Click a category to view its documents</p>

      {deptNames.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No categories available yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {deptNames.map((deptName) => (
            <div key={deptName} className="bg-white rounded-lg shadow">
              <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50 rounded-t-lg">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-700">{deptName}</h2>
              </div>
              <div className="divide-y">
                {grouped[deptName].map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCat(cat)}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-blue-50/50 transition text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-800">{cat.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {cat.documents?.length || 0} document{(cat.documents?.length || 0) !== 1 ? 's' : ''}
                          {cat.description ? ` • ${cat.description}` : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
