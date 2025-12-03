import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";

interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  
  // Change Password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Change Email
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [passwordForEmail, setPasswordForEmail] = useState("");
  
  // Related Parent
  const [showRelatedParent, setShowRelatedParent] = useState(false);
  const [relatedParentEmail, setRelatedParentEmail] = useState("");
  const [relatedParentName, setRelatedParentName] = useState("");
  const [relatedParents, setRelatedParents] = useState<Array<{id: string, name: string, email: string}>>([]); // For nanny
  const [isNanny, setIsNanny] = useState(false);
  
  // Delete Account
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const API_URL = "http://192.168.1.20:5000/api";

  useEffect(() => {
    if (visible) {
      loadUserInfo();
    }
  }, [visible]);

  const loadUserInfo = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const role = await AsyncStorage.getItem("userRole");
      const name = await AsyncStorage.getItem("parentName");
      
      // If role or email not in storage, fetch from backend
      if (!email || !role) {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          try {
            const response = await fetch(`${API_URL}/user-info`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.email) {
                setUserEmail(data.email);
                await AsyncStorage.setItem("userEmail", data.email);
              }
              if (data.role) {
                setUserRole(data.role);
                await AsyncStorage.setItem("userRole", data.role);
              }
              if (data.name) {
                setUserName(data.name);
                await AsyncStorage.setItem("parentName", data.name);
              }
              return;
            }
          } catch (error) {
            console.error("Error fetching user info:", error);
          }
        }
      }
      
      if (email) setUserEmail(email);
      if (role) setUserRole(role);
      if (name) setUserName(name);
      
      // Load linked parent info
      await loadLinkedParent();
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadLinkedParent = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const role = await AsyncStorage.getItem("userRole");
      if (!token) return;

      const response = await fetch(`${API_URL}/linked-parent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Linked parent data received:", data);
        
        // Check if user is nanny with multiple parents
        if (data.isNanny) {
          console.log("User is nanny, setting related parents:", data.relatedParents);
          setIsNanny(true);
          setRelatedParents(data.relatedParents || []);
        } else {
          console.log("User is not nanny, setting single parent:", data.relatedParentName);
          setIsNanny(false);
          if (data.relatedParentName) {
            setRelatedParentName(data.relatedParentName);
          } else {
            setRelatedParentName("");
          }
        }
      } else {
        console.log("Failed to load linked parent, status:", response.status);
        setRelatedParentName("");
        setRelatedParents([]);
      }
    } catch (error) {
      console.error("Error loading linked parent:", error);
      setRelatedParentName("");
      setRelatedParents([]);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      } else {
        Alert.alert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !passwordForEmail) {
      Alert.alert("Error", "Please enter new email and your password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail,
          password: passwordForEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("userEmail", newEmail);
        setUserEmail(newEmail);
        Alert.alert("Success", "Email changed successfully");
        setNewEmail("");
        setPasswordForEmail("");
        setShowChangeEmail(false);
      } else {
        Alert.alert("Error", data.message || "Failed to change email");
      }
    } catch (error) {
      console.error("Change email error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelatedParent = async () => {
    if (!relatedParentEmail) {
      Alert.alert("Error", "Please enter the email of the parent to link");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(relatedParentEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/link-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          relatedParentEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload linked parent info from backend to ensure it's up to date
        await loadLinkedParent();
        Alert.alert("Success", `Successfully linked with ${data.relatedParentName || "parent"}`);
        setRelatedParentEmail("");
        setShowRelatedParent(false);
      } else {
        Alert.alert("Error", data.message || "Failed to link parent");
      }
    } catch (error) {
      console.error("Link parent error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkParent = (parentId?: string, parentName?: string) => {
    const nameToShow = parentName || relatedParentName;
    Alert.alert(
      "Unlink Parent",
      `Are you sure you want to unlink from ${nameToShow}? You will no longer share baby information.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/unlink-parent`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ parentId }), // Include parentId for nanny
              });

              const data = await response.json();

              if (response.ok) {
                if (isNanny && parentId) {
                  // Remove from nanny's parent list
                  setRelatedParents(prev => prev.filter(p => p.id !== parentId));
                } else {
                  setRelatedParentName("");
                }
                Alert.alert("Success", "Successfully unlinked parent");
              } else {
                Alert.alert("Error", data.message || "Failed to unlink parent");
              }
            } catch (error) {
              console.error("Unlink parent error:", error);
              Alert.alert("Error", "Network error. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm deletion");
      return;
    }

    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This will permanently delete your account and all your baby data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/delete-account`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: deletePassword }),
              });

              const data = await response.json();

              if (response.ok) {
                // Clear all stored data
                await AsyncStorage.clear();
                Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
                  {
                    text: "OK",
                    onPress: () => {
                      onClose();
                      router.replace("/open");
                    },
                  },
                ]);
              } else {
                Alert.alert("Error", data.message || "Failed to delete account");
              }
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", "Network error. Please try again.");
            } finally {
              setLoading(false);
              setDeletePassword("");
            }
          },
        },
      ]
    );
  };

  const resetAllForms = () => {
    setShowChangePassword(false);
    setShowChangeEmail(false);
    setShowRelatedParent(false);
    setShowDeleteAccount(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail("");
    setPasswordForEmail("");
    setRelatedParentEmail("");
    setDeletePassword("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        resetAllForms();
        onClose();
      }}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => {
                resetAllForms();
                onClose();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.icon} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Account Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* User Info */}
            <View style={[styles.userInfoCard, { backgroundColor: theme.card }]}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="person" size={40} color={theme.primary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userEmail}</Text>
                <Text style={[styles.userRole, { color: theme.textTertiary }]}>{userRole}</Text>
              </View>
            </View>

            {/* Change Password Section */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: theme.card }]}
              onPress={() => setShowChangePassword(!showChangePassword)}
            >
              <View style={styles.settingHeader}>
                <Ionicons name="lock-closed" size={24} color={theme.primary} />
                <Text style={[styles.settingTitle, { color: theme.text }]}>Change Password</Text>
                <Ionicons
                  name={showChangePassword ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {showChangePassword && (
              <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Current Password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="key-outline" size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="New Password"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="key-outline" size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Change Email Section */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: theme.card }]}
              onPress={() => setShowChangeEmail(!showChangeEmail)}
            >
              <View style={styles.settingHeader}>
                <Ionicons name="mail" size={24} color={theme.primary} />
                <Text style={[styles.settingTitle, { color: theme.text }]}>Change Email</Text>
                <Ionicons
                  name={showChangeEmail ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {showChangeEmail && (
              <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="New Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Current Password"
                    secureTextEntry
                    value={passwordForEmail}
                    onChangeText={setPasswordForEmail}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleChangeEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Related Parent Section - For all roles */}
            <>
              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.card }]}
                onPress={() => setShowRelatedParent(!showRelatedParent)}
              >
                <View style={styles.settingHeader}>
                  <Ionicons name="people" size={24} color={theme.primary} />
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Links</Text>
                  <Ionicons
                    name={showRelatedParent ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {showRelatedParent && (
                  <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                      {userRole !== "mother" && userRole !== "father"
                        ? "Your linked accounts. Send link requests from Settings → Request Parent Link"
                        : "Manage your linked accounts. You can link with partners, nannies, or other caregivers."}
                    </Text>

                    {/* Check actual role, not isNanny flag */}
                    {userRole !== "mother" && userRole !== "father" ? (
                      // For Nanny/Others: Show only list of linked parents (no ability to add here)
                      <View>
                        {relatedParents.length > 0 ? (
                          <View style={{ marginBottom: 16 }}>
                            {relatedParents.map((parent) => (
                              <View key={parent.id} style={{ marginBottom: 12 }}>
                                <View style={[styles.linkedParentCard, { backgroundColor: theme.card }]}>
                                  <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                                  <Text style={[styles.linkedParentText, { color: theme.text }]}>
                                    {parent.name}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.unlinkButton, { borderColor: theme.border }]}
                                  onPress={() => handleUnlinkParent(parent.id, parent.name)}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <ActivityIndicator color={theme.error} />
                                  ) : (
                                    <>
                                      <Ionicons name="unlink-outline" size={20} color={theme.error} />
                                      <Text style={[styles.unlinkButtonText, { color: theme.error }]}>Unlink</Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyStateContainer}>
                            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
                            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No linked accounts yet</Text>
                            <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
                              Go to Settings → Request Parent Link to send a link request
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      // For Mother/Father: Show list of linked users and allow adding more
                      <View>
                        {/* Show list of linked users */}
                        {relatedParents.length > 0 && (
                          <View style={{ marginBottom: 16 }}>
                            {relatedParents.map((parent) => (
                              <View key={parent.id} style={{ marginBottom: 12 }}>
                                <View style={[styles.linkedParentCard, { backgroundColor: theme.card }]}>
                                  <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                                  <Text style={[styles.linkedParentText, { color: theme.text }]}>
                                    {parent.name}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.unlinkButton, { borderColor: theme.border }]}
                                  onPress={() => handleUnlinkParent(parent.id, parent.name)}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <ActivityIndicator color="#FF6B6B" />
                                  ) : (
                                    <>
                                      <Ionicons name="unlink-outline" size={20} color="#FF6B6B" />
                                      <Text style={styles.unlinkButtonText}>Unlink</Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Show old single parent link if exists */}
                        {relatedParentName && (
                          <View style={{ marginBottom: 16 }}>
                            <View style={[styles.linkedParentCard, { backgroundColor: theme.card }]}>
                              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                              <Text style={[styles.linkedParentText, { color: theme.text }]}>
                                {relatedParentName}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.unlinkButton, { borderColor: theme.border }]}
                              onPress={() => handleUnlinkParent()}
                              disabled={loading}
                            >
                              {loading ? (
                                <ActivityIndicator color={theme.error} />
                              ) : (
                                <>
                                  <Ionicons name="unlink-outline" size={20} color={theme.error} />
                                  <Text style={[styles.unlinkButtonText, { color: theme.error }]}>Unlink</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                        
                        {/* Add new link (for parents only - direct linking without request) */}
                        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                          <Ionicons name="mail-outline" size={20} color={theme.primary} />
                          <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Partner's Email Address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={relatedParentEmail}
                            onChangeText={setRelatedParentEmail}
                            placeholderTextColor={theme.textTertiary}
                          />
                        </View>

                        <TouchableOpacity
                          style={[styles.submitButton, { backgroundColor: theme.primary }]}
                          onPress={handleAddRelatedParent}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.submitButtonText}>
                              {relatedParents.length > 0 || relatedParentName ? "Add Another Link" : "Link Partner"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
            </>

            {/* Delete Account Section */}
            <TouchableOpacity
              style={[styles.settingCard, { marginTop: 20, backgroundColor: theme.card, borderColor: theme.error }]}
              onPress={() => setShowDeleteAccount(!showDeleteAccount)}
            >
              <View style={styles.settingHeader}>
                <Ionicons name="trash" size={24} color="#FF6B6B" />
                <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>Delete Account</Text>
                <Ionicons
                  name={showDeleteAccount ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {showDeleteAccount && (
              <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.warningText, { color: theme.error }]}>
                  ⚠️ Warning: This will permanently delete your account and all associated baby data. This action cannot be undone.
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B6B" />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your password to confirm"
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Delete My Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A2E884",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E8F5E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#A2E884",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  settingCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  formContainer: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#A2E884",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  linkedParentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E0",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  linkedParentText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginLeft: 12,
  },
  unlinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  unlinkButtonText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#FF6B6B",
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AccountSettingsModal;
