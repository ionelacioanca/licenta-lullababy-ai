import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{t('about.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Developer Section */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.developerHeader}>
                <Image 
                  source={require('../../assets/images/profile_about.png')}
                  style={styles.profileImage}
                />
                <View style={styles.developerInfo}>
                  <Text style={[styles.developerName, { color: theme.text }]}>
                    Ionela Secman
                  </Text>
                  <Text style={[styles.developerAge, { color: theme.textSecondary }]}>
                    {t('about.born')}: {t('about.birthdate')}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={20} color={theme.primary} />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    {t('about.university')}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {t('about.universityName')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="book-outline" size={20} color={theme.primary} />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    {t('about.faculty')}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {t('about.facultyName')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="code-slash-outline" size={20} color={theme.primary} />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    {t('about.specialization')}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {t('about.specializationName')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    {t('about.project')}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {t('about.projectType')}
                  </Text>
                </View>
              </View>
            </View>

            {/* App Section */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.appHeader}>
                <View style={[styles.appIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="heart" size={32} color="white" />
                </View>
                <Text style={[styles.appName, { color: theme.text }]}>LullaBaby AI</Text>
                <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
                  {t('about.version')} 1.0.0
                </Text>
              </View>

              <Text style={[styles.appDescription, { color: theme.textSecondary }]}>
                {t('about.description')}
              </Text>

              <Text style={[styles.featuresTitle, { color: theme.text }]}>
                {t('about.features')}
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="videocam" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature1')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="chatbubbles" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature2')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="stats-chart" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature3')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="calendar" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature4')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="journal" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature5')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="musical-notes" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature6')}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="people" size={18} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    {t('about.feature7')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.appFooter, { color: theme.textTertiary }]}>
                {t('about.footer')}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  developerAge: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  appHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  appDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'justify',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  appFooter: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
