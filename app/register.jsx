import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerAPI } from "../services/Api";
import { FontFamily } from "../GlobalStyles";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const register = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    mobile: "",
    gyms: [{ name: "", location: "" }],
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const [submitted, setSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  const removeGymField = (index) => {
    if (form.gyms.length > 1) {
      setForm((prevForm) => ({
        ...prevForm,
        gyms: prevForm.gyms.filter((_, i) => i !== index),
      }));
    }
  };

  const handleGymChange = (index, field, value) => {
    const updatedGyms = [...form.gyms];
    updatedGyms[index] = { ...updatedGyms[index], [field]: value };
    setForm((prevForm) => ({ ...prevForm, gyms: updatedGyms }));

    const fieldId = `gym${index}${field}`;

    setTouchedFields((prev) => ({
      ...prev,
      [fieldId]: true,
    }));

    if (submitted || touchedFields[fieldId]) {
      validateGymField(index, field, value);
    }
  };

  const validateGymField = (index, field, value) => {
    const fieldId = `gym${index}${field}`;
    let hasError = false;

    if (!value || !value.trim()) {
      hasError = true;
      setErrors((prev) => ({
        ...prev,
        [fieldId]: `Gym ${field} is required`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    return hasError;
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    if (field.startsWith("gym")) {
      const matches = field.match(/gym(\d+)(name|location)/);
      if (matches && matches.length === 3) {
        const index = parseInt(matches[1]);
        const fieldName = matches[2];
        const value = form.gyms[index][fieldName];
        validateGymField(index, fieldName, value);
      }
    } else {
      validateField(field, form[field]);
    }
  };

  const handleGymFieldBlur = (index, field) => {
    const fieldId = `gym${index}${field}`;

    setTouchedFields((prev) => ({
      ...prev,
      [fieldId]: true,
    }));

    validateGymField(index, field, form.gyms[index][field]);
  };
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.dob) newErrors.dob = "Date of birth is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(form.mobile)) {
      newErrors.mobile = "Invalid mobile number";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    form.gyms.forEach((gym, index) => {
      if (!gym || !gym.name || !gym.name.trim()) {
        newErrors[`gym${index}name`] = "Gym name is required";
      }
      if (!gym || !gym.location || !gym.location.trim()) {
        newErrors[`gym${index}location`] = "Gym location is required";
      }
    });

    return newErrors;
  };

  const validateField = (field, value) => {
    let error = null;

    switch (field) {
      case "name":
        if (!value.trim()) error = "Name is required";
        break;
      case "dob":
        if (!value) error = "Date of birth is required";
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "mobile":
        if (!value.trim()) {
          error = "Mobile number is required";
        } else if (!/^\d{10}$/.test(value)) {
          error = "Invalid mobile number";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 8) {
          error = "Password must be at least 6 characters";
        }
        break;
      case "confirmPassword":
        if (value !== form.password) {
          error = "Passwords do not match";
        }
        break;
      default:
        if (field.startsWith("gym") && field.endsWith("name")) {
          if (!value || !value.trim()) error = "Gym name is required";
        } else if (field.startsWith("gym") && field.endsWith("location")) {
          if (!value || !value.trim()) error = "Gym location is required";
        }
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return error;
  };

  const addGymField = () => {
    setForm((prevForm) => ({
      ...prevForm,
      gyms: [...prevForm.gyms, { name: "", location: "" }],
    }));
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    if (submitted) {
      validateField(field, value);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        dob: selectedDate?.toISOString()?.split("T")[0],
      }));
      setTouchedFields((prev) => ({ ...prev, dob: true }));

      if (submitted) {
        validateField("dob", selectedDate?.split("T")[0]);
      }
    }
  };

  useEffect(() => {
    logoOpacity.setValue(0);
    logoTranslateY.setValue(-20);

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = async () => {
    setSubmitted(true);
    const formErrors = validateForm();

    const allTouched = {};
    Object.keys(form).forEach((key) => {
      allTouched[key] = true;
    });
    form.gyms.forEach((_, index) => {
      allTouched[`gym${index}name`] = true;
      allTouched[`gym${index}location`] = true;
    });
    setTouchedFields(allTouched);

    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await registerAPI(form);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Registration successful!",
          });
          router.push({
            pathname: "/verificationowner",
            params: {
              contact: form.mobile,
              email: form.email,
              id: response.data,
              verification: JSON.stringify({ mobile: false, email: false }),
            },
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail,
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: error,
        });
      }
    } else {
      setErrors(formErrors);
    }
  };

  const shouldShowError = (fieldName) => {
    return (submitted || touchedFields[fieldName]) && errors[fieldName];
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        // colors={['#202020', '#303030', '#404040']}
        colors={["#000000", "#000000", "#000000"]}
        style={styles.background}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }],
              },
            ]}
          >
            <Text style={styles.logoText}>
              <Text style={styles.logoFirstPart}>Fitt</Text>
              <Text style={styles.logoSecondPart}>bot</Text>
              <Text style={styles.logoSecondPart}>&nbsp;Business</Text>
            </Text>
            <View style={styles.logoUnderline} />
            <Text style={styles.tagline}>
              Your all in one Gym management Solution
            </Text>
          </Animated.View>

          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.card}
          >
            <Text style={styles.title}>Registration</Text>

            <Animated.View
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Full Name"
                  style={styles.input}
                  placeholderTextColor="#888888"
                  value={form.name}
                  onChangeText={(value) => handleFieldChange("name", value)}
                  onBlur={() => handleFieldBlur("name")}
                />
              </View>
              {shouldShowError("name") && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <Text
                  style={[styles.input, !form.dob && styles.placeholderText]}
                >
                  {form.dob ? form.dob : "Date of Birth"}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={20}
                  color="#888888"
                />
              </TouchableOpacity>
              {shouldShowError("dob") && (
                <Text style={styles.errorText}>{errors.dob}</Text>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={form.dob ? new Date(form.dob) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  themeVariant="dark"
                />
              )}

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Email Address"
                  style={styles.input}
                  placeholderTextColor="#888888"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(value) => handleFieldChange("email", value)}
                  onBlur={() => handleFieldBlur("email")}
                />
              </View>
              {shouldShowError("email") && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Mobile Number"
                  style={styles.input}
                  placeholderTextColor="#888888"
                  keyboardType="phone-pad"
                  value={form.mobile}
                  onChangeText={(value) => handleFieldChange("mobile", value)}
                  onBlur={() => handleFieldBlur("mobile")}
                  maxLength={10}
                />
              </View>
              {shouldShowError("mobile") && (
                <Text style={styles.errorText}>{errors.mobile}</Text>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Password"
                  style={styles.input}
                  placeholderTextColor="#888888"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(value) => handleFieldChange("password", value)}
                  onBlur={() => handleFieldBlur("password")}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </View>
              {shouldShowError("password") && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.input}
                  placeholderTextColor="#888888"
                  secureTextEntry={!showConfirmPassword}
                  value={form.confirmPassword}
                  onChangeText={(value) =>
                    handleFieldChange("confirmPassword", value)
                  }
                  onBlur={() => handleFieldBlur("confirmPassword")}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIconContainer}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </View>
              {shouldShowError("confirmPassword") && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              <Text style={styles.sectionTitle}>Gym Details</Text>

              {form.gyms.map((gym, index) => (
                <View key={index} style={styles.gymSection}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="fitness-outline"
                      size={20}
                      color="#888888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Gym Name"
                      style={styles.input}
                      placeholderTextColor="#888888"
                      value={gym.name}
                      onChangeText={(value) =>
                        handleGymChange(index, "name", value)
                      }
                      onBlur={() => handleGymFieldBlur(index, "name")}
                    />
                  </View>
                  {shouldShowError(`gym${index}name`) && (
                    <Text style={styles.errorText}>
                      {errors[`gym${index}name`]}
                    </Text>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#888888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Gym Location"
                      style={styles.input}
                      placeholderTextColor="#888888"
                      value={gym.location}
                      onChangeText={(value) =>
                        handleGymChange(index, "location", value)
                      }
                      onBlur={() => handleGymFieldBlur(index, "location")}
                    />
                  </View>
                  {shouldShowError(`gym${index}location`) && (
                    <Text style={styles.errorText}>
                      {errors[`gym${index}location`]}
                    </Text>
                  )}

                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeGymField(index)}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={18}
                        color="#FF4444"
                        style={styles.removeGymIcon}
                      />
                      <Text style={styles.removeButtonText}>Remove Gym</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addButton} onPress={addGymField}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color="#00c91b"
                  style={styles.addGymIcon}
                />
                <Text style={styles.addButtonText}>Add Another Gym</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleSubmit}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                {/* <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View> */}

                {/* <TouchableOpacity
                  style={styles.loginLinkButton}
                  onPress={() => router.push('/')}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0)',
                      'rgba(255, 255, 255, 0)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={20}
                      color="#FFFFFF"
                      style={styles.loginIcon}
                    />
                    <Text style={styles.loginLinkText}>LOGIN</Text>
                  </LinearGradient>
                </TouchableOpacity> */}

                <View
                  style={{
                    marginVertical: 25,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 14, textAlign: "center" }}
                  >
                    Do you have an account already?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/")}
                    // disabled={isLoading}
                  >
                    <Text
                      style={[styles.loginButtonText, { color: "#ff5757" }]}
                    >
                      Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </Animatable.View>

          <View style={styles.footerSpacer} />
        </ScrollView>

        {!keyboardVisible && (
          <Animatable.View
            animation="fadeIn"
            duration={1000}
            delay={600}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              © 2025 NFCTech Fitness Private Limited
            </Text>
          </Animatable.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: height * 0.05,
    paddingBottom: height * 0.1,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  logoText: {
    fontSize: 30,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontWeight: "500",
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#FFFFFF",
  },
  logoUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#FF5757",
    borderRadius: 2,
    marginTop: 5,
  },
  tagline: {
    color: "#DDDDDD",
    fontSize: 14,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  card: {
    // backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    // paddingHorizontal: 20,
    // paddingTop: 20,
    // paddingBottom: 30,
    marginTop: height * 0.02,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 10 },
    //     shadowOpacity: 0.3,
    //     shadowRadius: 15,
    //   },
    //   android: {
    //     elevation: 10,
    //   },
    // }),
  },
  title: {
    // fontSize: 24,
    // fontWeight: '700',
    // color: '#FF5757',
    // textAlign: 'center',
    // marginBottom: 20,
    // fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',

    fontSize: 18,
    fontWeight: "600",
    color: "#FF5757",
    marginTop: 10,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    // borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontFamily: FontFamily.urbanistMedium,
  },
  placeholderText: {
    color: "#888888",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
    fontFamily: FontFamily.urbanistMedium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5757",
    marginTop: 10,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  gymSection: {
    marginBottom: 15,
    paddingBottom: 5,
  },
  addButton: {
    // backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00c91b",
    // width: '75%',
    // maxWidth: '300',
    // margin: 'auto',
  },
  addButtonText: {
    // color: '#FF5757',
    color: "#00c91b",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  addGymIcon: {
    marginRight: 8,
  },
  removeButton: {
    // backgroundColor: '#FFE5E5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
    // borderColor: '#FFE5E5',
    borderColor: "#FF4444",
    borderWidth: 1,
  },
  removeButtonText: {
    color: "#FF4444",
    // color: '#FFE5E5',
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  removeGymIcon: {
    marginRight: 8,
  },
  eyeIconContainer: {
    padding: 8,
  },
  registerButton: {
    marginTop: 50,
    backgroundColor: "#FF5757",
    width: "75%",
    maxWidth: "300",
    height: 45,
    margin: "auto",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  registerButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    // fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  loginContainer: {
    marginTop: 20,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#888",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#888888",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  loginLinkButton: {
    backgroundColor: "#FF5757",
    width: "75%",
    maxWidth: "300",
    height: 45,
    margin: "auto",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loginIcon: {
    marginRight: 10,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#FFFFFF",
    // fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(32, 32, 32, 0.9)",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 20,
    zIndex: 1000,
  },
  footerText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  footerSpacer: {
    height: 50,
  },
});

export default register;
