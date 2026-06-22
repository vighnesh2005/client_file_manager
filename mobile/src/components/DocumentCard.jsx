import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';
import { formatDateTime, truncateText } from '../lib/utils';

export default function DocumentCard({ document, onPress }) {
  const doc = document || {};
  const title = doc.title || doc.originalName || 'Untitled';
  const department = doc.departmentId?.name || '';
  const date = formatDateTime(doc.createdAt);
  const displayStatus = doc.paymentBlocked ? 'blocked' : doc.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>
            {truncateText(title, 45)}
          </Text>
          {department ? (
            <Text style={styles.department}>{department}</Text>
          ) : null}
        </View>
        <StatusBadge status={displayStatus} />
      </View>
      <Text style={styles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleArea: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  department: {
    fontSize: 12,
    color: '#64748b',
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
