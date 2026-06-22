import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ label, value, color = '#2563eb' }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});
