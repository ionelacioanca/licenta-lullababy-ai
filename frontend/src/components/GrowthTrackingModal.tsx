import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GrowthRecord, updateGrowthRecord } from "../services/growthService";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

type GrowthEntry = {
  date: string;
  weight: string;
  length: string;
  age: string;
  weightGain?: string;
  lengthGain?: string;
};

type GrowthTrackingModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: string, length: string) => void;
  growthRecords: GrowthRecord[];
  birthWeight: number | null;
  birthLength: number | null;
  birthDate: Date | null;
};

const GrowthTrackingModal: React.FC<GrowthTrackingModalProps> = ({
  visible,
  onClose,
  onSave,
  growthRecords,
  birthWeight,
  birthLength,
  birthDate,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newLength, setNewLength] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editLength, setEditLength] = useState("");

  // Get the latest weight to determine if we should use grams or kg
  const getLatestWeight = (): number => {
    if (growthRecords.length > 0) {
      return typeof growthRecords[0].weight === 'number' ? growthRecords[0].weight : parseFloat(String(growthRecords[0].weight));
    }
    return birthWeight || 0;
  };

  const latestWeight = getLatestWeight();
  const useGrams = latestWeight < 5; // Use grams if under 5kg

  // Convert growth records to display format
  const formatGrowthHistory = (): GrowthEntry[] => {
    console.log("Formatting growth history with:", {
      birthWeight,
      birthLength,
      birthDate,
      recordsCount: growthRecords.length
    });
    
    const history: GrowthEntry[] = [];

    // Add growth records (sorted by date, NEWEST first)
    const sortedRecords = [...growthRecords].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedRecords.forEach((record) => {
      const recordDate = new Date(record.date);
      const formattedDate = recordDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      const weightInKg = typeof record.weight === 'number' ? record.weight : parseFloat(String(record.weight));
      const weightDisplay = `${(weightInKg * 1000).toFixed(0)} g`;

      history.push({
        date: formattedDate,
        weight: weightDisplay,
        length: `${record.length} cm`,
        age: record.age || calculateAge(recordDate),
      });
    });

    // Add birth data as the LAST entry (oldest) if we have at least weight or length
    if (birthDate && (birthWeight || birthLength)) {
      console.log("Adding birth entry to history");
      const birthWeightDisplay = birthWeight ? `${(birthWeight * 1000).toFixed(0)} g` : '--';
      history.push({
        date: birthDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        weight: birthWeightDisplay,
        length: birthLength ? `${birthLength} cm` : '--',
        age: "Birth",
      });
    } else {
      console.log("Birth data missing - not adding birth entry. birthDate:", birthDate, "birthWeight:", birthWeight, "birthLength:", birthLength);
    }

    return history;
  };

  const calculateAge = (date: Date): string => {
    if (!birthDate) return "";
    
    const ageInMs = date.getTime() - birthDate.getTime();
    const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30));
    
    if (ageInMonths === 0) return "Birth";
    if (ageInMonths === 1) return "1 month";
    return `${ageInMonths} months`;
  };

  const growthHistory = formatGrowthHistory();

  const handleSave = () => {
    if (newWeight && newLength) {
      // Always convert grams to kg when saving
      const weightToSave = (parseFloat(newWeight) / 1000).toString();
      onSave(weightToSave, newLength);
      setNewWeight("");
      setNewLength("");
      setShowAddForm(false);
    }
  };

  const handleCancel = () => {
    setNewWeight("");
    setNewLength("");
    setShowAddForm(false);
  };

  const handleEdit = (record: GrowthRecord) => {
    setEditingRecordId(record._id);
    // Convert kg to grams for editing
    setEditWeight((parseFloat(record.weight.toString()) * 1000).toString());
    setEditLength(record.length.toString());
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditWeight("");
    setEditLength("");
  };

  const handleSaveEdit = async () => {
    if (editingRecordId && editWeight && editLength) {
      try {
        // Convert grams to kg when saving
        const weightInKg = parseFloat(editWeight) / 1000;
        const lengthInCm = parseFloat(editLength);
        await updateGrowthRecord(editingRecordId, { weight: weightInKg, length: lengthInCm });
        // Trigger onClose to refresh parent component
        handleCancelEdit();
        onClose();
      } catch (error) {
        console.error("Error updating growth record:", error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="fitness" size={24} color={theme.primary} />
              <View>
                <Text style={[styles.title, { color: theme.text }]}>{t('growth.title')}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('growth.history')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.icon} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Add New Measurement Button */}
            {!showAddForm && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add-circle" size={24} color={theme.primary} />
                <Text style={[styles.addButtonText, { color: theme.primary }]}>Add New Measurement</Text>
              </TouchableOpacity>
            )}

            {/* Add Form */}
            {showAddForm && (
              <View style={[styles.addForm, { backgroundColor: theme.card }]}>
                <Text style={[styles.formTitle, { color: theme.text }]}>New Measurement</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Weight (g)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                      placeholder="e.g., 4500"
                      keyboardType="decimal-pad"
                      value={newWeight}
                      onChangeText={setNewWeight}
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Length (cm)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                      placeholder="e.g., 65"
                      keyboardType="decimal-pad"
                      value={newLength}
                      onChangeText={setNewLength}
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={handleCancel}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* History */}
            <Text style={[styles.historyTitle, { color: theme.text }]}>Measurement History</Text>

            {growthHistory.map((entry, index) => {
              const isEditing = growthRecords[index] && editingRecordId === growthRecords[index]._id;
              const isBirthEntry = entry.age === "Birth";
              
              return (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.dateSection}>
                    <Text style={styles.dateLabel}>{entry.date}</Text>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageText}>{entry.age}</Text>
                    </View>
                  </View>
                  <View style={styles.headerActions}>
                    {index === 0 && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentText}>Current</Text>
                      </View>
                    )}
                    {!isBirthEntry && !isEditing && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(growthRecords[index])}
                      >
                        <Ionicons name="pencil" size={18} color="#A2E884" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {isEditing ? (
                  <View style={styles.editForm}>
                    <View style={styles.editInputRow}>
                      <View style={styles.editInputGroup}>
                        <Text style={styles.editLabel}>Weight (g)</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editWeight}
                          onChangeText={setEditWeight}
                          keyboardType="decimal-pad"
                          placeholder="e.g., 4500"
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={styles.editInputGroup}>
                        <Text style={styles.editLabel}>Length (cm)</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editLength}
                          onChangeText={setEditLength}
                          keyboardType="decimal-pad"
                          placeholder="e.g., 55"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={styles.editCancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.editCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editSaveButton}
                        onPress={handleSaveEdit}
                      >
                        <Text style={styles.editSaveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                <View style={styles.measurementsRow}>
                  <View style={styles.measurementItem}>
                    <View style={styles.measurementIcon}>
                      <Ionicons name="scale-outline" size={20} color="#A2E884" />
                    </View>
                    <View>
                      <Text style={styles.measurementLabel}>Weight</Text>
                      <Text style={styles.measurementValue}>{entry.weight}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.measurementItem}>
                    <View style={styles.measurementIcon}>
                      <Ionicons name="resize-outline" size={20} color="#A2E884" />
                    </View>
                    <View>
                      <Text style={styles.measurementLabel}>Length</Text>
                      <Text style={styles.measurementValue}>{entry.length}</Text>
                    </View>
                  </View>
                </View>

                {index < growthHistory.length - 1 && (() => {
                  const currentWeight = parseFloat(entry.weight);
                  const previousWeight = parseFloat(growthHistory[index + 1].weight);
                  const currentLength = parseFloat(entry.length);
                  const previousLength = parseFloat(growthHistory[index + 1].length);
                  
                  const weightDiff = currentWeight - previousWeight;
                  const lengthDiff = currentLength - previousLength;
                  
                  // Determine if we're showing grams or kg based on the magnitude
                  const isGrams = entry.weight.includes('g');
                  const weightDiffDisplay = isGrams 
                    ? `+${weightDiff.toFixed(0)} g` 
                    : `+${weightDiff.toFixed(1)} kg`;
                  
                  return (
                    <View style={styles.growthIndicator}>
                      <Ionicons name="trending-up" size={16} color="#36c261" />
                      <Text style={styles.growthText}>
                        {weightDiffDisplay}, +{lengthDiff} cm
                      </Text>
                    </View>
                  );
                })()}
                </>
                )}
              </View>
            );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF8F0",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addForm: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#A2E884",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  ageBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  currentBadge: {
    backgroundColor: "#A2E884",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  measurementsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  measurementItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  measurementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F6FFF2",
    justifyContent: "center",
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 12,
  },
  growthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6FFF2",
    padding: 8,
    borderRadius: 12,
    gap: 6,
  },
  growthText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#36c261",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F6FFF2",
  },
  editForm: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  editInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  editInputGroup: {
    flex: 1,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  editButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  editSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#A2E884",
    alignItems: "center",
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default GrowthTrackingModal;
