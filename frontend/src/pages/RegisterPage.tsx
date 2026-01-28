import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("mother");
  const [customRole, setCustomRole] = useState("");
  const [message, setMessage] = useState("");
  const [hasRelatedParent, setHasRelatedParent] = useState(false);
  const [relatedParentEmail, setRelatedParentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: t('auth.mother'), value: "mother" },
    { label: t('auth.father'), value: "father" },
    { label: t('auth.nanny'), value: "nanny" },
    { label: t('auth.other'), value: "others" },
  ]);

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    // Validate custom role for "others"
    if (role === "others" && !customRole.trim()) {
      Alert.alert("Error", "Please specify your role (e.g., aunt, uncle, grandma)");
      return;
    }

    // Validate related parent email if checked
    if (hasRelatedParent && !relatedParentEmail.trim()) {
      Alert.alert("Error", "Please enter the parent's email address");
      return;
    }

    try {
      // Prepare registration data
      const registrationData: any = { 
        name, 
        email, 
        password, 
        role: role === "others" ? customRole : role // Send custom role directly, backend will handle it
      };

      // Add related parent email if provided
      if (hasRelatedParent && relatedParentEmail.trim()) {
        registrationData.relatedParentEmail = relatedParentEmail.trim();
      }

      const response = await fetch("http://192.168.1.14:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("parentName", name);
        await AsyncStorage.setItem("parentId", data.parentId);
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userRole", role === "others" ? customRole : role);
        console.log("the id of the user:", data.parentId);
        setMessage("Successfully registered!");
        
        // For nanny/others, show message about link request
        if ((role === "nanny" || role === "others") && hasRelatedParent) {
          Alert.alert(
            "Welcome to LullaBaby!",
            "A link request has been sent to the parent. Once they approve it, you'll be able to access their baby information.",
            [{ text: "OK", onPress: () => router.push("/dashboard") }]
          );
          return;
        }
        
        // Ask user if they want to add a baby now or later
        Alert.alert(
          "Welcome to LullaBaby!",
          "Would you like to add your baby now?",
          [
            {
              text: "Later",
              style: "cancel",
              onPress: () => router.push("/dashboard"),
            },
            {
              text: "Add Baby",
              onPress: () => router.push("/babyDetails"),
            },
          ]
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.subheader}>{t('auth.letsGetStarted')}</Text>
      <Text style={styles.subtitle}>
        {t('auth.createAccountSubtitle')}
      </Text>

      <View style={{ height: 40 }} />
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder={t('auth.firstNamePlaceholder')}
          placeholderTextColor="#777777"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor="#777777"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#777777"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={[styles.dropdownWrapper, { zIndex: open ? 1000 : 0 }]}>
        <DropDownPicker
          open={open}
          value={role}
          items={items}
          setOpen={setOpen}
          setValue={setRole}
          setItems={setItems}
          placeholder={t('auth.selectRole')}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={1000}
          zIndexInverse={3000}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            nestedScrollEnabled: true,
          }}
          onChangeValue={(value) => {
            // Reset related states when role changes
            if (value !== "nanny" && value !== "others") {
              setHasRelatedParent(false);
              setRelatedParentEmail("");
            }
            if (value !== "others") {
              setCustomRole("");
            }
          }}
        />
      </View>

      {/* Custom Role Input for "Others" */}
      {role === "others" && (
        <View style={styles.inputContainer}>
          <Ionicons name="create-outline" size={20} color="#777" style={styles.icon} />
          <TextInput
            placeholder={t('auth.yourRolePlaceholder')}
            placeholderTextColor="#777777"
            style={styles.input}
            value={customRole}
            onChangeText={setCustomRole}
          />
        </View>
      )}

      {/* Related Parent Section for Nanny/Others */}
      {(role === "nanny" || role === "others") && (
        <View style={styles.relatedParentSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setHasRelatedParent(!hasRelatedParent)}
          >
            <View style={[styles.checkbox, hasRelatedParent && styles.checkboxChecked]}>
              {hasRelatedParent && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>{t('auth.haveRelatedParent')}</Text>
          </TouchableOpacity>

          {hasRelatedParent && (
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#777" style={styles.icon} />
              <TextInput
                placeholder={t('auth.parentEmailPlaceholder')}
                placeholderTextColor="#777777"
                style={styles.input}
                keyboardType="email-address"
                value={relatedParentEmail}
                onChangeText={setRelatedParentEmail}
                autoCapitalize="none"
              />
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>{t('auth.orContinueWith')}</Text>

      <TouchableOpacity
        style={[styles.googleButton, { opacity: 0.5 }]}
        onPress={() => Alert.alert('Coming Soon', 'Google Sign-In will be available in the production version.')}
      >
        <Ionicons name="logo-google" size={24} color="#DB4437" />
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        {t('auth.termsAgree')}{" "}
        <Text style={styles.link} onPress={() => Linking.openURL("#")}>{t('auth.termsOfUse')}</Text>,{" "}
        <Text style={styles.link} onPress={() => Linking.openURL("#")}>{t('auth.disclaimer')}</Text> {t('auth.and')}{" "}
        <Text style={styles.link} onPress={() => Linking.openURL("#")}>{t('auth.privacyPolicy')}</Text>.
      </Text>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#FFF8F0",
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    marginBottom: 12,
  },
  subheader: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#777",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 32,
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#555",
  },
  dropdownWrapper: {
    marginBottom: 24,
  },
  dropdown: {
    backgroundColor: "#F2F2F2",
    borderRadius: 32,
    borderColor: "#F2F2F2",
  },
  dropdownContainer: {
    borderColor: "#F2F2F2",
  },
  button: {
    backgroundColor: "#A2E884",
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  orText: {
    textAlign: "center",
    color: "#777",
    marginBottom: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 12,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
  },
  link: {
    color: "#00BFD8",
    textDecorationLine: "underline",
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    color: "#777",
    fontWeight: "500",
  },
  relatedParentSection: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#A2E884",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#A2E884",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
});

export default RegisterPage;
