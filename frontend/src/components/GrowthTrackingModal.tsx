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
import { GrowthRecord } from "../services/growthService";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newLength, setNewLength] = useState("");

  // Get the latest weight to determine if we should use grams or kg
  const getLatestWeight = (): number => {
    if (growthRecords.length > 0) {
      return parseFloat(growthRecords[0].weight); // Records are sorted by date desc
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

      const weightInKg = parseFloat(record.weight);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="fitness" size={24} color="#A2E884" />
              <View>
                <Text style={styles.title}>Growth Tracking</Text>
                <Text style={styles.subtitle}>Weight & Length History</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#666" />
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
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add-circle" size={24} color="#A2E884" />
                <Text style={styles.addButtonText}>Add New Measurement</Text>
              </TouchableOpacity>
            )}

            {/* Add Form */}
            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.formTitle}>New Measurement</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Weight (g)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 4500"
                      keyboardType="decimal-pad"
                      value={newWeight}
                      onChangeText={setNewWeight}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Length (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 65"
                      keyboardType="decimal-pad"
                      value={newLength}
                      onChangeText={setNewLength}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* History */}
            <Text style={styles.historyTitle}>Measurement History</Text>

            {growthHistory.map((entry, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.dateSection}>
                    <Text style={styles.dateLabel}>{entry.date}</Text>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageText}>{entry.age}</Text>
                    </View>
                  </View>
                  {index === 0 && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentText}>Current</Text>
                    </View>
                  )}
                </View>

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
              </View>
            ))}
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
});

export default GrowthTrackingModal;
