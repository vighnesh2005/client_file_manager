import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerAPI } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';
import StatCard from '../../src/components/StatCard';
import DocumentCard from '../../src/components/DocumentCard';

export default function DashboardScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await customerAPI.getDocuments();
      setDocuments(res.data.data || []);
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const pending = documents.filter((d) => d.status === 'pending').length;
  const processing = documents.filter((d) => d.status === 'processing').length;
  const completed = documents.filter((d) => d.status === 'completed' && !d.paymentBlocked).length;
  const blocked = documents.filter((d) => d.paymentBlocked).length;
  const recentDocs = documents.slice(0, 5);

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {user?.name || 'User'}</Text>
          <Text style={styles.subtitle}>Document Management Dashboard</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statWrapper}>
              <StatCard label="Pending" value={pending} color="#d97706" />
            </View>
            <View style={styles.statWrapper}>
              <StatCard label="Processing" value={processing} color="#9333ea" />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statWrapper}>
              <StatCard label="Completed" value={completed} color="#16a34a" />
            </View>
            <View style={styles.statWrapper}>
              <StatCard label="Blocked" value={blocked} color="#dc2626" />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#2563eb' }]}
            onPress={() => router.push('/upload')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>+</Text>
            <View>
              <Text style={styles.actionTitle}>Upload Document</Text>
              <Text style={styles.actionDesc}>Submit files to any department</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#1e293b' }]}
            onPress={() => router.push('/(tabs)/documents')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>=</Text>
            <View>
              <Text style={styles.actionTitle}>My Documents</Text>
              <Text style={styles.actionDesc}>View status and download files</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {recentDocs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No documents yet</Text>
              <Text style={styles.emptySubtext}>Upload your first document to get started</Text>
            </View>
          ) : (
            recentDocs.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                onPress={() => router.push(`/document/${doc._id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  actions: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 14,
    width: 32,
    textAlign: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});
