import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerAPI } from '../../src/lib/api';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadScreen() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    customerAPI
      .getDepartments()
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => Alert.alert('Error', 'Failed to load departments'))
      .finally(() => setLoading(false));
  }, []);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick files');
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedDept) {
      Alert.alert('Required', 'Please select a department');
      return;
    }
    if (selectedFiles.length === 0) {
      Alert.alert('Required', 'Please select at least one file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('departmentId', selectedDept._id);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      selectedFiles.forEach((file) => {
        const fileExt = file.name?.split('.').pop() || 'file';
        formData.append('files', {
          uri: file.uri,
          type: file.mimeType || `application/${fileExt}`,
          name: file.name || `file.${fileExt}`,
        });
      });

      await customerAPI.uploadDocument(formData);
      Alert.alert('Success', 'Documents uploaded successfully', [
        {
          text: 'View Documents',
          onPress: () => router.push('/(tabs)/documents'),
        },
        { text: 'Upload More', style: 'cancel' },
      ]);
      setSelectedFiles([]);
      setDescription('');
      setSelectedDept(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const wordCount = description.trim() ? description.trim().split(/\s+/).filter(Boolean).length : 0;
  const wordLimitReached = wordCount >= 500;

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading departments...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Upload Documents</Text>

          <Text style={styles.label}>Department</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDeptPicker(!showDeptPicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectorText, !selectedDept && styles.placeholder]}>
              {selectedDept ? selectedDept.name : 'Select a department'}
            </Text>
            <Text style={styles.selectorArrow}>{showDeptPicker ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>

          {showDeptPicker && (
            <View style={styles.pickerList}>
              {departments.length === 0 ? (
                <Text style={styles.pickerEmpty}>No departments available</Text>
              ) : (
                departments.map((dept) => (
                  <TouchableOpacity
                    key={dept._id}
                    style={[
                      styles.pickerItem,
                      selectedDept?._id === dept._id && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setSelectedDept(dept);
                      setShowDeptPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedDept?._id === dept._id && styles.pickerItemTextActive,
                      ]}
                    >
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you need..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!wordLimitReached}
          />
          <Text style={styles.wordCount}>
            {wordCount}/500 words
            {wordLimitReached ? ' (Limit reached)' : ''}
          </Text>

          <Text style={styles.label}>Files</Text>
          <TouchableOpacity
            style={styles.pickButton}
            onPress={pickFiles}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Text style={styles.pickButtonText}>+ Select Files</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name || `File ${index + 1}`}
                    </Text>
                    {file.size ? (
                      <Text style={styles.fileSize}>
                        {(file.size / 1024).toFixed(0)} KB
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => removeFile(index)} disabled={uploading}>
                    <Text style={styles.removeFile}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (uploading || selectedFiles.length === 0 || !selectedDept) &&
                styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !selectedDept}
            activeOpacity={0.8}
          >
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.uploadButtonText}>  Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: '#0f172a',
  },
  placeholder: {
    color: '#94a3b8',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  pickerList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerEmpty: {
    padding: 16,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 100,
  },
  wordCount: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  pickButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  pickButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  fileList: {
    marginBottom: 8,
  },
  fileItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  fileSize: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  removeFile: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
