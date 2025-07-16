import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

const OpenPage: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BabyCare App</Text>

      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0", // Alb cald
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#555555", // Gri charcoal
    marginBottom: 40,
  },
  signupButton: {
    backgroundColor: "#A2E884", // Verde mentă
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    marginBottom: 16,
    width: "80%",
    alignItems: "center",
  },
  signupText: {
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#ffffff", // Alb
    borderWidth: 1,
    borderColor: "#DFF5E1", // Verde mentă contur
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    width: "80%",
    alignItems: "center",
  },
  loginText: {
    color: "#555555", // Gri charcoal
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OpenPage;
