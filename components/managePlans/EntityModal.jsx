import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { showToast } from "../../utils/Toaster";

const EntityModal = ({
  visible,
  onClose,
  onSave,
  entityType,
  isEditMode = false,
  initialData = {},
  //   styles,
}) => {
  const isPlan = entityType === "plans";

  // Initialize state based on entity type
  const [name, setName] = useState(
    isPlan ? initialData.plans || "" : initialData.batch_name || ""
  );

  const [amount, setAmount] = useState(
    isPlan && initialData.amount ? String(initialData.amount) : ""
  );

  const [duration, setDuration] = useState(
    isPlan && initialData.duration ? String(initialData.duration) : ""
  );

  const [timing, setTiming] = useState(
    !isPlan && initialData.timing ? initialData.timing : ""
  );

  const [description, setDescription] = useState(initialData.description || "");

  // Reset form when modal is opened/closed or entity type changes
  useEffect(() => {
    if (visible) {
      setName(isPlan ? initialData.plans || "" : initialData.batch_name || "");
      setAmount(isPlan && initialData.amount ? String(initialData.amount) : "");
      setDuration(
        isPlan && initialData.duration ? String(initialData.duration) : ""
      );
      setTiming(!isPlan && initialData.timing ? initialData.timing : "");
      setDescription(initialData.description || "");
    }
  }, [visible, entityType, initialData, isPlan]);

  const handleSave = useCallback(() => {
    Keyboard.dismiss();

    // Validate required fields
    if (!name.trim()) {
      showToast({
        type: "error",
        title: `Please enter ${isPlan ? "plan" : "batch"} name`,
      });
      return;
    }

    if (isPlan && (!amount.trim() || !duration.trim())) {
      showToast({
        type: "error",
        title: "Please fill in all required fields",
      });
      return;
    }

    if (!isPlan && !timing.trim()) {
      showToast({
        type: "error",
        title: "Please enter batch timing",
      });
      return;
    }

    // Create payload based on entity type
    const payload = isPlan
      ? {
          plans: name,
          amount: amount,
          duration: parseInt(duration, 10),
          description: description,
          ...(isEditMode && initialData.id ? { id: initialData.id } : {}),
        }
      : {
          ...(isEditMode ? { batch_id: initialData.id } : {}),
          batch_name: name,
          timing: timing,
          description: description,
        };

    onSave(payload);
  }, [
    name,
    amount,
    duration,
    timing,
    description,
    isPlan,
    isEditMode,
    initialData,
    onSave,
  ]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "Edit" : "Create New"} {isPlan ? "Plan" : "Batch"}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isPlan ? "Plan" : "Batch"} Name
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${isPlan ? "plan" : "batch"} name`}
                  placeholderTextColor={"#aaa"}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />
              </View>

              {/* Plan-specific fields */}
              {isPlan && (
                <>
                  {/* Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter amount"
                      placeholderTextColor={"#aaa"}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                      returnKeyType="next"
                    />
                  </View>

                  {/* Duration */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter duration in months"
                      placeholderTextColor={"#aaa"}
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                      returnKeyType="next"
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Add Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter description"
                      placeholderTextColor={"#aaa"}
                      multiline={true}
                      numberOfLines={4}
                      value={description}
                      onChangeText={setDescription}
                      returnKeyType="done"
                    />
                  </View>
                </>
              )}

              {/* Batch-specific fields */}
              {!isPlan && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Batch Timing{" "}
                      <Text style={styles.inputLabelMuted}>
                        (Ex: 7AM - 9AM)
                      </Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter batch timing"
                      placeholderTextColor={"#aaa"}
                      value={timing}
                      onChangeText={setTiming}
                      returnKeyType="done"
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Add Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter description"
                      placeholderTextColor={"#aaa"}
                      multiline={true}
                      numberOfLines={4}
                      value={description}
                      onChangeText={setDescription}
                      returnKeyType="done"
                    />
                  </View>
                </>
              )}

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {isEditMode ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EntityModal;
