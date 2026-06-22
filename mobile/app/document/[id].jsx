import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerAPI } from '../../src/lib/api';
import StatusBadge from '../../src/components/StatusBadge';
import { formatDateTime, formatFileSize } from '../../src/lib/utils';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (id) {
      customerAPI
        .getDocuments()
        .then((res) => {
          const docs = res.data.data || [];
          const found = docs.find((d) => d._id === id);
          if (found) {
            setDoc(found);
          } else {
            Alert.alert('Error', 'Document not found');
            router.back();
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load document');
          router.back();
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDownload = async (type) => {
    setDownloading(true);
    setDownloadType(type);
    try {
      const response = await customerAPI.downloadDocument(id, type);
      const blob = response.data;

      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const fileName = type === 'result'
          ? (doc.resultFile?.originalName || 'result.pdf')
          : (doc.originalName || 'submission.pdf');
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri);
        } else {
          Alert.alert('Downloaded', `File saved to: ${localUri}`);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      if (err.response?.status === 403) {
        Alert.alert('Blocked', 'This document is blocked. Please contact the firm regarding payment.');
      } else if (err.response?.status === 410) {
        Alert.alert('File Removed', 'This file has been purged from storage.');
      } else {
        Alert.alert('Download Failed', err.response?.data?.message || 'Could not download the file');
      }
    } finally {
      setDownloading(false);
      setDownloadType(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!doc) return null;

  const displayStatus = doc.paymentBlocked ? 'blocked' : doc.status;
  const hasResult = doc.resultFile && doc.resultFile.originalName;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>
            {doc.title || doc.originalName || 'Document'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <StatusBadge status={displayStatus} />
        </View>

        {doc.paymentBlocked && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedTitle}>Document Blocked</Text>
            <Text style={styles.blockedText}>
              This document has been blocked due to payment. Please contact the firm to resolve this.
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <InfoRow label="Department" value={doc.departmentId?.name || '-'} />
          <InfoRow label="Category" value={doc.categoryId?.name || '-'} />
          <InfoRow label="Created" value={formatDateTime(doc.createdAt)} />
          <InfoRow label="Last Updated" value={formatDateTime(doc.updatedAt)} />
          {doc.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.descriptionText}>{doc.description}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Files</Text>

          <TouchableOpacity
            style={[styles.fileButton, { borderColor: '#2563eb' }]}
            onPress={() => handleDownload('submission')}
            disabled={downloading}
            activeOpacity={0.7}
          >
            <View style={styles.fileButtonLeft}>
              <Text style={styles.fileButtonIcon}>{'\u25A1'}</Text>
              <View>
                <Text style={styles.fileButtonTitle}>Submission File</Text>
                <Text style={styles.fileButtonSize}>
                  {formatFileSize(doc.fileSize)}
                </Text>
              </View>
            </View>
            {downloading && downloadType === 'submission' ? (
              <ActivityIndicator color="#2563eb" size="small" />
            ) : (
              <Text style={styles.downloadIcon}>{'\u25BC'}</Text>
            )}
          </TouchableOpacity>

          {hasResult && (
            <TouchableOpacity
              style={[styles.fileButton, { borderColor: '#16a34a', opacity: doc.paymentBlocked ? 0.5 : 1 }]}
              onPress={() => handleDownload('result')}
              disabled={downloading || doc.paymentBlocked}
              activeOpacity={0.7}
            >
              <View style={styles.fileButtonLeft}>
                <Text style={[styles.fileButtonIcon, { color: '#16a34a' }]}>{'\u25A0'}</Text>
                <View>
                  <Text style={styles.fileButtonTitle}>Result File</Text>
                  <Text style={styles.fileButtonSize}>
                    {formatFileSize(doc.resultFile?.fileSize)}
                  </Text>
                </View>
              </View>
              {downloading && downloadType === 'result' ? (
                <ActivityIndicator color="#16a34a" size="small" />
              ) : (
                <Text style={[styles.downloadIcon, { color: '#16a34a' }]}>{'\u25BC'}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backArrow: {
    fontSize: 22,
    color: '#2563eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  statusRow: {
    marginBottom: 16,
  },
  blockedBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  blockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  blockedText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  descriptionSection: {
    paddingTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 4,
  },
  filesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  fileButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  fileButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileButtonIcon: {
    fontSize: 18,
    color: '#2563eb',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  fileButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  fileButtonSize: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  downloadIcon: {
    fontSize: 14,
    color: '#2563eb',
  },
});
