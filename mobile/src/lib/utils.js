import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screenWidth = width;
export const screenHeight = height;
export const isSmallDevice = width < 375;

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return '#d97706';
    case 'processing':
      return '#9333ea';
    case 'completed':
      return '#16a34a';
    case 'blocked':
      return '#dc2626';
    default:
      return '#64748b';
  }
}

export function getStatusBg(status) {
  switch (status) {
    case 'pending':
      return '#fef3c7';
    case 'processing':
      return '#f3e8ff';
    case 'completed':
      return '#dcfce7';
    case 'blocked':
      return '#fee2e2';
    default:
      return '#f1f5f9';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}
