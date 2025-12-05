import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "../contexts/LanguageContext";

const OpenPage: React.FC = () => {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = async (lang: 'en' | 'ro') => {
    await setLanguage(lang);
  };

  return (
    <View style={styles.container}>
      {/* Language Selection */}
      <View style={styles.languageContainer}>
        <Text style={styles.languageLabel}>{t('open.selectLanguage')}</Text>
        <View style={styles.flagContainer}>
          <TouchableOpacity
            style={[styles.flagButton, language === 'en' && styles.flagButtonActive]}
            onPress={() => handleLanguageSelect('en')}
            activeOpacity={0.7}
          >
            <Text style={styles.flagEmoji}>🇬🇧</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flagButton, language === 'ro' && styles.flagButtonActive]}
            onPress={() => handleLanguageSelect('ro')}
            activeOpacity={0.7}
          >
            <Text style={styles.flagEmoji}>🇷🇴</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>{t('open.welcome')}</Text>
        <Text style={styles.appName}>{t('open.appName')}</Text>
        <Text style={styles.tagline}>{t('open.tagline')}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.signupText}>{t('open.register')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginText}>{t('open.login')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  languageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    fontWeight: "500",
  },
  flagContainer: {
    flexDirection: "row",
    gap: 20,
  },
  flagButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flagButtonActive: {
    borderColor: "#A2E884",
    backgroundColor: "#F0FFF0",
  },
  flagEmoji: {
    fontSize: 36,
  },
  welcomeContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "#999",
    marginBottom: 8,
    fontWeight: "400",
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#A2E884",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  signupButton: {
    backgroundColor: "#A2E884",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    marginBottom: 16,
    width: "80%",
    alignItems: "center",
    shadowColor: "#A2E884",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signupText: {
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#A2E884",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    width: "80%",
    alignItems: "center",
  },
  loginText: {
    color: "#A2E884",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OpenPage;
