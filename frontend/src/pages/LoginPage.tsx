import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

const LoginPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // verificare token
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("http://192.168.1.10:5000/api/verify-token", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            router.replace("/dashboard");
          } else {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("parentId");
            await AsyncStorage.removeItem("parentName");
            setChecking(false);
          }
        } catch (error) {
          console.error("Token verification error:", error);
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("parentId");
          await AsyncStorage.removeItem("parentName");
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };
    checkLoggedIn();
  }, []);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // funcție separată pentru salvarea datelor în AsyncStorage
  const saveUserData = async (data: any) => {
    try {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("parentName", data.name || "User");

      if (data.parentId) {
        await AsyncStorage.setItem("parentId", data.parentId.toString());
        console.log("Saved parentId:", data.parentId);
      } else {
        console.warn("No parentId received from API");
      }
    } catch (e) {
      console.error("Error saving user data:", e);
      throw e; // Re-throw to handle in calling function
    }
  };


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting login with email:", email);
      
  const response = await fetch("http://192.168.1.10:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Login response data:", JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log("Login successful, checking data...");
        
        if (!data.token) {
          throw new Error("No token received from server");
        }
        if (!data.parentId) {
          throw new Error("No parentId received from server");
        }

        await saveUserData(data);
        setMessage("Login successful!");
        
        // Navigate to dashboard after a brief delay to ensure storage is complete
        setTimeout(() => {
          router.replace("/dashboard");
        }, 100);
      } else {
        const errorMsg = data.message || data.error || "Login failed";
        console.error("Login failed with message:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      setMessage("Error: " + err.message);
      Alert.alert("Login Error", err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A2E884" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subheader}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in with your email and password</Text>

      <View style={{ height: 40 }} />

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#777777"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setMessage("");
          }}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#777"
          style={styles.icon}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#777777"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setMessage("");
          }}
        />
      </View>

      <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>Or continue with</Text>

      <View style={styles.authButtons}>
        <TouchableOpacity style={styles.circleButton}>
          <Ionicons name="logo-apple" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#1877F2" }]}
        >
          <Ionicons name="logo-facebook" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#DB4437" }]}
        >
          <Ionicons name="logo-google" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#FFF8F0",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
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
  forgotPasswordText: {
    textAlign: "right",
    color: "#00BFD8",
    textDecorationLine: "underline",
    marginBottom: 24,
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
  authButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  circleButton: {
    backgroundColor: "#000",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    color: "#777",
    fontWeight: "500",
  },
});

export default LoginPage;
