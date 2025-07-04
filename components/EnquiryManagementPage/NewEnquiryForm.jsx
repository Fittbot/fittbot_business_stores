import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { generateRandomSentence } from "../../utils/generateRandomData";
import {
  createValidationSchema,
  validateForm,
  validationRules,
} from "../../utils/validation";
import { showToast } from "../../utils/Toaster";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { getFormattedTime } from "../../utils/time";

const enquiryFormSchema = createValidationSchema({
  name: {
    validations: [
      { rule: validationRules.required, message: "Name is required" },
      {
        rule: validationRules.maxLength(50),
        message: "Name must be less than 50 characters",
      },
      {
        rule: validationRules.minLength(2),
        message: "Name must be more than 2 characters",
      },
    ],
  },
  contact: {
    validations: [
      { rule: validationRules.required, message: "Contact is required" },
      {
        rule: validationRules.phone,
        message: "Please enter a valid phone number",
      },
    ],
  },
  email: {
    validations: [
      {
        rule: validationRules.email,
        message: "Please enter a valid email address",
      },
    ],
  },
  startTime: {
    validations: [
      {
        rule: validationRules.required,
        message: "Start time is required",
      },
    ],
  },
  endTime: {
    validations: [
      {
        rule: validationRules.required,
        message: "End time is required",
      },
    ],
  },
});

function NewEnquiryForm({ addNewEnquiry }) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    convenientTime: "",
    email: "",
    message: "",
    startTime: getFormattedTime(new Date().getTime()),
    endTime: getFormattedTime(new Date().getTime()),
  });

  const [formErrors, setFormErrors] = useState({});

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Store actual Date objects for the pickers
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());

  // Add temporary time states for iOS picker
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Updated time change handlers for iOS/Android compatibility
  const handleStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowStartTimePicker(false);
      if (selectedTime) {
        setStartTimeDate(selectedTime);
        handleChange("startTime", getFormattedTime(selectedTime.getTime()));
      }
    } else {
      // iOS - just update temp time
      if (selectedTime) {
        setTempStartTime(selectedTime);
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowEndTimePicker(false);
      if (selectedTime) {
        setEndTimeDate(selectedTime);
        handleChange("endTime", getFormattedTime(selectedTime.getTime()));
      }
    } else {
      // iOS - just update temp time
      if (selectedTime) {
        setTempEndTime(selectedTime);
      }
    }
  };

  // iOS picker confirmation handlers
  const confirmStartTimeSelection = () => {
    setStartTimeDate(tempStartTime);
    handleChange("startTime", getFormattedTime(tempStartTime.getTime()));
    setShowStartTimePicker(false);
  };

  const confirmEndTimeSelection = () => {
    setEndTimeDate(tempEndTime);
    handleChange("endTime", getFormattedTime(tempEndTime.getTime()));
    setShowEndTimePicker(false);
  };

  // Cancel handlers for iOS
  const cancelStartTimeSelection = () => {
    setShowStartTimePicker(false);
  };

  const cancelEndTimeSelection = () => {
    setShowEndTimePicker(false);
  };

  // Functions to open time pickers
  const openStartTimePicker = () => {
    setTempStartTime(startTimeDate); // Use the current selected time, not new Date()
    setShowStartTimePicker(true);
  };

  const openEndTimePicker = () => {
    setTempEndTime(endTimeDate); // Use the current selected time, not new Date()
    setShowEndTimePicker(true);
  };

  const handleSubmit = async () => {
    const { isValid, errors } = validateForm(formData, enquiryFormSchema);

    if (isValid) {
      let SDate = formData.startTime;
      let EDate = formData.endTime;
      let time = `${SDate} - ${EDate}`;

      let data = { ...formData, convenientTime: time };

      delete data.startTime;
      delete data.endTime;

      let response = await addNewEnquiry(data);

      if (response?.status === 400) {
        showToast({
          type: "error",
          title: response?.message,
          visibilityTime: 1500,
        });
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response?.message,
          visibilityTime: 1500,
        });

        // Reset form including Date objects
        const currentTime = new Date();
        setFormData({
          name: "",
          contact: "",
          convenientTime: "",
          email: "",
          message: "",
          startTime: getFormattedTime(currentTime.getTime()),
          endTime: getFormattedTime(currentTime.getTime()),
        });
        setStartTimeDate(currentTime);
        setEndTimeDate(currentTime);
        setFormErrors({});
      }
    } else {
      setFormErrors(errors);

      // You can also show an alert with the first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast({
          type: "error",
          title: firstError,
          visibilityTime: 1500,
        });
      }
    }
  };

  // Validate a single field on blur
  const validateField = (fieldName) => {
    if (!enquiryFormSchema[fieldName]) return;

    const fieldSchema = {
      [fieldName]: enquiryFormSchema[fieldName],
    };

    const { errors } = validateForm(formData, fieldSchema);

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: errors[fieldName] || null,
    }));
  };

  return (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>New Client Enquiry</Text>

      <View style={styles.formField}>
        <Text style={styles.label}>
          Client Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
          placeholder="Enter client name"
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>
          Contact <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={formData.contact}
          onChangeText={(text) => handleChange("contact", text)}
          placeholder="Enter contact number"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>
          Convenient Time (from-to) <Text style={styles.required}>*</Text>
        </Text>

        {/* iOS Start Time Picker Modal */}
        {Platform.OS === "ios" && showStartTimePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showStartTimePicker}
            onRequestClose={cancelStartTimeSelection}
          >
            <TouchableWithoutFeedback onPress={cancelStartTimeSelection}>
              <View style={styles.pickerModalContainer}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={cancelStartTimeSelection}>
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Select Start Time</Text>
                      <TouchableOpacity onPress={confirmStartTimeSelection}>
                        <Text style={styles.pickerConfirmText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempStartTime}
                      mode="time"
                      display="spinner"
                      themeVariant="light"
                      textColor="#000000"
                      onChange={handleStartTimeChange}
                      style={styles.iosPickerStyle}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* iOS End Time Picker Modal */}
        {Platform.OS === "ios" && showEndTimePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showEndTimePicker}
            onRequestClose={cancelEndTimeSelection}
          >
            <TouchableWithoutFeedback onPress={cancelEndTimeSelection}>
              <View style={styles.pickerModalContainer}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={cancelEndTimeSelection}>
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Select End Time</Text>
                      <TouchableOpacity onPress={confirmEndTimeSelection}>
                        <Text style={styles.pickerConfirmText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempEndTime}
                      mode="time"
                      display="spinner"
                      themeVariant="light"
                      textColor="#000000"
                      onChange={handleEndTimeChange}
                      style={styles.iosPickerStyle}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Android Time Pickers */}
        {Platform.OS === "android" && showStartTimePicker && (
          <DateTimePicker
            value={startTimeDate}
            mode="time"
            themeVariant="light"
            textColor="#000000"
            display="default"
            onChange={handleStartTimeChange}
          />
        )}
        {Platform.OS === "android" && showEndTimePicker && (
          <DateTimePicker
            value={endTimeDate}
            mode="time"
            themeVariant="light"
            textColor="#000000"
            display="default"
            onChange={handleEndTimeChange}
          />
        )}

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={openStartTimePicker}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color="#888888"
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.input2,
                !formData.startTime && styles.placeholderText,
              ]}
            >
              {formData.startTime ? formData?.startTime : "Select Start Time"}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={openEndTimePicker}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color="#888888"
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.input2,
                !formData.endTime && styles.placeholderText,
              ]}
            >
              {formData.endTime ? formData.endTime : "Select End Time"}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.message}
          onChangeText={(text) => handleChange("message", text)}
          placeholder="Enter message or notes"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default NewEnquiryForm;

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 14,
    marginBottom: 20,
    color: "#007AFF",
  },
  formField: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    color: "#171A1F",
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 5,
    padding: 12,
    fontSize: 12,
    backgroundColor: "#fff",
    marginRight: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 0.5,
    borderColor: "#bdc3c7",
    marginRight: 1,
    flex: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input2: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  placeholderText: {
    color: "#888888",
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
});
