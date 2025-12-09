import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface GoogleRoleSelectionModalProps {
  visible: boolean;
  googleData: {
    name: string;
    email: string;
  };
  onRoleSelected: (role: string, customRole?: string) => Promise<void>;
  onCancel: () => void;
}

const GoogleRoleSelectionModal: React.FC<GoogleRoleSelectionModalProps> = ({
  visible,
  googleData,
  onRoleSelected,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { key: 'mother', label: t('auth.mother'), icon: 'woman-outline' },
    { key: 'father', label: t('auth.father'), icon: 'man-outline' },
    { key: 'nanny', label: t('auth.nanny'), icon: 'people-outline' },
    { key: 'other', label: t('auth.other'), icon: 'person-outline' },
  ];

  const handleConfirm = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      const roleValue = selectedRole === 'other' && customRole ? customRole : selectedRole;
      await onRoleSelected(roleValue, selectedRole === 'other' ? customRole : undefined);
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons name="logo-google" size={32} color="#DB4437" />
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{googleData.name}</Text>
            <Text style={styles.userEmail}>{googleData.email}</Text>
          </View>

          <Text style={styles.selectLabel}>{t('auth.selectRole')}</Text>

          <ScrollView style={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleButton,
                  selectedRole === role.key && styles.roleButtonSelected,
                ]}
                onPress={() => setSelectedRole(role.key)}
              >
                <Ionicons
                  name={role.icon as any}
                  size={24}
                  color={selectedRole === role.key ? '#fff' : '#333'}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role.key && styles.roleTextSelected,
                  ]}
                >
                  {role.label}
                </Text>
                {selectedRole === role.key && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedRole === 'other' && (
            <TextInput
              style={styles.customRoleInput}
              placeholder={t('auth.yourRolePlaceholder')}
              placeholderTextColor="#999"
              value={customRole}
              onChangeText={setCustomRole}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (!selectedRole || (selectedRole === 'other' && !customRole) || loading) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={
                !selectedRole || (selectedRole === 'other' && !customRole) || loading
              }
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>{t('auth.createAccount')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  userInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  rolesContainer: {
    maxHeight: 250,
    marginBottom: 16,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  roleButtonSelected: {
    backgroundColor: '#A2E884',
  },
  roleText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  customRoleInput: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F2',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#A2E884',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default GoogleRoleSelectionModal;
