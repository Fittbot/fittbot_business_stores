import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { FontFamily, Color } from "../GlobalStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { changePasswordAPI } from "../services/Api";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const ChangePassword = () => {
  const { mail, mobile } = useLocalSearchParams();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validatePasswords = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const formErrors = validatePasswords();

    if (Object.keys(formErrors).length === 0) {
      submitNewPassword();
    } else {
      setErrors(formErrors);
      shakeInputs();
    }
  };

  const submitNewPassword = async () => {
    setIsLoading(true);
    try {
      const payload = {
        type: mail ? "email" : "mobile",
        data: mail ? mail : mobile,
        password: newPassword,
      };

      const response = await changePasswordAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Password changed successfully",
        });
        router.push("/");
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#0a0a0a"]}
        style={styles.background}
      >
        {/* <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidContainer}
                > */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
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
            <View>
              <Text style={styles.heading}>Change Password</Text>
            </View>

            <View style={styles.formContainer}>
              <Animated.View
                style={[
                  styles.inputWrapper,
                  errors.newPassword
                    ? { transform: [{ translateX: shakeAnimation }] }
                    : {},
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: null });
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </Animated.View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}

              <Animated.View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword
                    ? { transform: [{ translateX: shakeAnimation }] }
                    : {},
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: null });
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </Animated.View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={
                  isLoading ? styles.loginButtonDisabled : styles.loginButton
                }
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
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
        {/* </KeyboardAvoidingView> */}
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
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: height * 0.2,
    paddingBottom: height * 0.1,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.04,
  },
  logoText: {
    fontSize: 30,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontWeight: 500,
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
    // backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    // paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: height * 0.02,
  },
  heading: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: height * 0.03,
    color:'#fff'
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderColor: "#EEEEEE",
  },
  inputIcon: {
    marginRight: 10,
    color:'#fff'
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.urbanistMedium,
    color: "#fff",
  },
  errorText: {
    color: "#FF0000",
    fontSize: width * 0.03,
    marginBottom: 10,
  },
  eyeIconContainer: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#FF5757",
    // height: 55,
    padding:13,
    borderRadius: 12,
    width:'70%',
    marginHorizontal:'auto',
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
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
  loginButtonDisabled: {
    backgroundColor: "#FF5757",
    // height: 55,
    borderRadius: 12,
    width:'70%',
    marginHorizontal:'auto',
    opacity: 0.5,
    justifyContent: "center",
    padding:13,
    alignItems: "center",
    marginTop: 20,
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
  loginButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.urbanistSemiBold,
    color: Color.white,
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
});

export default ChangePassword;
