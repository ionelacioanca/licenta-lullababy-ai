import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useRouter } from "expo-router";

const BabyDetailsPage: React.FC = () => {
  const [parentName, setParentName] = useState("");

  useEffect(() => {
    const loadName = async () => {
      const name = await AsyncStorage.getItem("parentName");
      if (name) setParentName(name);
    };
    loadName();
  }, []);

  const router = useRouter();
  // Dropdowns
  const [sexOpen, setSexOpen] = useState(false);
  const [sexValue, setSexValue] = useState<string | null>(null);
  const [sexItems, setSexItems] = useState([
    { label: "Boy", value: "Boy" },
    { label: "Girl", value: "Girl" },
  ]);

  const [birthTypeOpen, setBirthTypeOpen] = useState(false);
  const [birthTypeValue, setBirthTypeValue] = useState<string | null>(null);
  const [birthTypeItems, setBirthTypeItems] = useState([
    { label: "Natural", value: "Natural" },
    { label: "C-Section", value: "C-Section" },
  ]);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [birthWeight, setBirthWeight] = useState("");
  const [birthLength, setBirthLength] = useState("");
  const [gestationalWeeks, setGestationalWeeks] = useState("");
  const [knownAllergies, setKnownAllergies] = useState("");

  const onSexOpen = () => setBirthTypeOpen(false);
  const onBirthTypeOpen = () => setSexOpen(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const showDatePicker = () => {
    setSexOpen(false);
    setBirthTypeOpen(false);
    setDatePickerVisibility(true);
  };
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date: Date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setMinutes(adjustedDate.getMinutes() + adjustedDate.getTimezoneOffset());
    setBirthDate(adjustedDate);
    hideDatePicker();
  };

  const showTimePicker = () => {
    setSexOpen(false);
    setBirthTypeOpen(false);
    setTimePickerVisibility(true);
  };
  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirmTime = (time: Date) => {
    const newTime = new Date(2000, 0, 1, time.getHours(), time.getMinutes(), 0, 0);
    newTime.setHours(time.getHours());
    newTime.setMinutes(time.getMinutes());
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);
    setBirthTime(newTime);
    hideTimePicker();
  };

  const handleSave = async () => {
    if (!name || !sexValue || !birthDate) {
      Alert.alert("Error", "Please fill out required fields");
      return;
    }

    const parentId = await AsyncStorage.getItem("parentId");
      if (!parentId) {
        console.log("Error", "Parent ID not found, please log in again.");
        return;
    }

    try {
      console.log("👉 Trimitem parentId:", parentId);
      const response = await fetch("http://192.168.1.50:5000/api/babyDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sex: sexValue,
          birthDate: birthDate ? formatDate(birthDate) : "",
          birthTime: birthTime ? formatTime(birthTime) : "",
          birthWeight: Number(birthWeight),
          birthLength: Number(birthLength),
          birthType: birthTypeValue,
          gestationalWeeks: Number(gestationalWeeks),
          knownAllergies,
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newBabyId = data.baby?._id || data._id || data.id; // Get the new baby's ID from response
        
        await AsyncStorage.setItem("babyName", name);
        
        // Set the newly created baby as the selected baby
        if (newBabyId) {
          await AsyncStorage.setItem("selectedBabyId", newBabyId);
          console.log("New baby selected:", newBabyId);
        }
        
        Alert.alert("Success", "Baby details saved!");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Something went wrong");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={20}
      enableOnAndroid={true}
    >
      <Text style={styles.subheader}>Hello, {parentName}!</Text>
      <Text style={styles.subtitle}>Tell us more about your baby.</Text>

      <View style={{ height: 40 }} />

      {/* Name */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Baby's Name"
          placeholderTextColor="#777"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Dropdowns */}
     <View style={styles.sexSelector}>
      <TouchableOpacity
        style={[
          styles.sexButton,
          sexValue === "Boy" && styles.sexButtonActive,
        ]}
        onPress={() => setSexValue("Boy")}
      >
        <Ionicons name="man-outline" size={20} color={sexValue === "Boy" ? "#fff" : "#333"} />
        <Text style={[styles.sexButtonText, sexValue === "Boy" && styles.sexButtonTextActive]}>
          Male
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sexButton,
          sexValue === "Girl" && styles.sexButtonActive,
        ]}
        onPress={() => setSexValue("Girl")}
      >
        <Ionicons name="woman-outline" size={20} color={sexValue === "Girl" ? "#fff" : "#333"} />
        <Text style={[styles.sexButtonText, sexValue === "Girl" && styles.sexButtonTextActive]}>
          Female
        </Text>
      </TouchableOpacity>
    </View>



      <View style={[styles.dropdownWrapper, { zIndex: birthTypeOpen ? 999 : 0 }]}>
        <DropDownPicker
          open={birthTypeOpen}
          value={birthTypeValue}
          items={birthTypeItems}
          setOpen={setBirthTypeOpen}
          setValue={setBirthTypeValue}
          setItems={setBirthTypeItems}
          onOpen={onBirthTypeOpen}
          placeholder="Select Birth Type"
          style={styles.dropdown}
          zIndex={1000}
          zIndexInverse={3000}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            nestedScrollEnabled: true,
          }}
        />
      </View>

      {/* Date Picker */}
      <TouchableOpacity onPress={showDatePicker}>
        <View style={styles.inputContainer}>
           <Ionicons name="calendar-outline" size={20} color="#777" style={styles.icon} />
              <Text style={styles.input}>
                {birthDate ? formatDate(birthDate) : "Select Birth Date"}
              </Text>
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
        date={birthDate || new Date()}
      />

      {/* Time Picker */}
      <TouchableOpacity onPress={showTimePicker}>
        <View style={styles.inputContainer}>
          <Ionicons name="time-outline" size={20} color="#777" style={styles.icon} />
          <Text style={styles.input}>
            {birthTime ? formatTime(birthTime) : "Select Birth Time"}
          </Text>
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={hideTimePicker}
        is24Hour={true}
        date={birthTime || new Date(2000, 0, 1, 0, 0, 0)}
        minuteInterval={1}
      />

      {/* Other Inputs */}
      <View style={styles.inputContainer}>
        <Ionicons name="fitness-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Birth Weight (g)"
          placeholderTextColor="#777"
          style={styles.input}
          keyboardType="numeric"
          value={birthWeight}
          onChangeText={setBirthWeight}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="body-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Birth Length (cm)"
          placeholderTextColor="#777"
          style={styles.input}
          keyboardType="numeric"
          value={birthLength}
          onChangeText={setBirthLength}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="hourglass-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Gestational Weeks"
          placeholderTextColor="#777"
          style={styles.input}
          keyboardType="numeric"
          value={gestationalWeeks}
          onChangeText={setGestationalWeeks}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="alert-circle-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Known Allergies"
          placeholderTextColor="#777"
          style={styles.input}
          value={knownAllergies}
          onChangeText={setKnownAllergies}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Baby Details</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 50,
    backgroundColor: "#FFF8F0",
    flexGrow: 1,
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
  sexSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  sexButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 32,
    backgroundColor: "#F2F2F2",
  },
  sexButtonActive: {
    backgroundColor: "#8EE26B", // sau culoarea ta verde preferată
  },
  sexButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  sexButtonTextActive: {
    color: "#fff",
  },
});

export default BabyDetailsPage;
