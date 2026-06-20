'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { departmentAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function DocumentRedirectPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    departmentAPI.getDocumentDetail(id)
      .then(res => {
        const docData = res.data.data;
        if (docData && docData.customerId?._id) {
          router.replace(
            `/department/customers/${docData.customerId._id}?openGroup=${docData.groupId || docData._id}&selectFile=${docData._id}`
          );
        } else {
          toast.error('Customer data missing on document');
          router.replace('/department/customers');
        }
      })
      .catch(err => {
        console.error(err);
        toast.error(err.response?.data?.message || 'Document not found');
        router.replace('/department/customers');
      });
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-sm font-semibold">Opening file in Customer Document Explorer...</p>
    </div>
  );
}
