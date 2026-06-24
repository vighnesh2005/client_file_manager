'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { departmentAPI } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Search, X, Filter, FileText, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, CheckCircle, Ban,
} from 'lucide-react';

const PAGE_SIZES = [10, 25, 50, 100];

function getSla(doc) {
  if (doc.status === 'completed') return { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' };
  if (doc.status === 'blocked') return { label: 'Blocked', color: 'text-red-600', bg: 'bg-red-50' };

  const now = Date.now();
  const created = new Date(doc.createdAt).getTime();
  const elapsed = now - created;
  const SLA_MS = 48 * 60 * 60 * 1000;
  const WARN_MS = 12 * 60 * 60 * 1000;

  if (elapsed >= SLA_MS) return { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50' };
  if (elapsed >= SLA_MS - WARN_MS) return { label: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-50' };
  return { label: 'Within SLA', color: 'text-green-700', bg: 'bg-green-50' };
}

export default function DepartmentSubmissionsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const res = await departmentAPI.getDocuments(params);
      setDocs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToDoc = (doc) => {
    const customerId = doc.customerId?._id || doc.customerId;
    if (!customerId) return;
    let path = `/department/customers/${customerId}`;
    const params = new URLSearchParams();
    if (doc.groupId) params.set('openGroup', doc.groupId);
    params.set('selectFile', doc._id);
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search and browse all customer submissions</p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, document title, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 outline-none bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <span className="text-xs text-gray-400 ml-auto">
          {total} submission{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
          <FileText className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-medium">
            {debouncedSearch || statusFilter ? 'No submissions match your search' : 'No submissions yet'}
          </p>
          <p className="text-xs">
            {debouncedSearch || statusFilter
              ? 'Try adjusting your search or filters'
              : 'When customers upload documents, they will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold w-1/3">Customer</th>
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">SLA</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => {
                  const sla = getSla(doc);
                  return (
                    <tr
                      key={doc._id}
                      onClick={() => goToDoc(doc)}
                      className="hover:bg-blue-50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                            {doc.customerId?.name?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[200px]">
                              {doc.customerId?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                              {doc.customerId?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[250px]">
                              {doc.title || doc.originalName}
                            </p>
                            {doc.description && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[250px]">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={doc.paymentBlocked ? 'blocked' : doc.status} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sla.bg} ${sla.color}`}>
                          {sla.label === 'Overdue' && <AlertTriangle className="w-3 h-3" />}
                          {sla.label === 'At Risk' && <Clock className="w-3 h-3" />}
                          {sla.label === 'Within SLA' && <CheckCircle className="w-3 h-3" />}
                          {sla.label === 'Completed' && <CheckCircle className="w-3 h-3" />}
                          {sla.label === 'Blocked' && <Ban className="w-3 h-3" />}
                          {sla.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(doc.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          onClick={(e) => { e.stopPropagation(); goToDoc(doc); }}
                          className="inline-block px-3 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition cursor-pointer"
                        >
                          Open
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="border rounded px-2 py-1 outline-none bg-white text-xs"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>
                {total === 0 ? '0' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} of {total}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded text-xs font-medium transition ${page === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
