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
    // name: `Alone+${Math.random().toString(36).substring(7)}`,
    // contact: `${Math.floor(Math.random() * 10000000000)}`,
    // convenientTime: `${Math.floor(Math.random() * 12)}am-${Math.floor(
    //   Math.random() * 12
    // )}pm`,
    // email: `${Math.random().toString(36).substring(7)}@example.com`,
    // message: generateRandomSentence(),
    // date: new Date().toISOString(),

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

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        setFormData({
          name: "",
          contact: "",
          convenientTime: "",
          email: "",
          message: "",
        });
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

        {showStartTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowStartTimePicker(false);
              if (selectedDate) {
                handleChange(
                  "startTime",
                  getFormattedTime(selectedDate.getTime())
                );
              }
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowEndTimePicker(false);
              if (selectedDate) {
                handleChange(
                  "endTime",
                  getFormattedTime(selectedDate.getTime())
                );
              }
            }}
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
            onPress={() => setShowStartTimePicker(!showStartTimePicker)}
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
            onPress={() => setShowEndTimePicker(!showEndTimePicker)}
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
    // fontWeight: 'bold',
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
    // backgroundColor: '#FF5757',
    // paddingVertical: 14,
    // borderRadius: 5,
    // alignItems: 'center',
    // marginTop: 10,
    // marginBottom: 30,

    // flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    // color: '#fff',
    // fontSize: 16,
    // fontWeight: 'bold',

    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: '#F8F8F8',
    borderRadius: 5,
    // marginBottom: 15,
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
});
