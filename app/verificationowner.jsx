import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import OTPInput from "../components/ui/OTPInput";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  forgotpasswordAPI,
  resendOTPAPI,
  sendEmailVerificationOTPAPI,
  updateVerificationStatusAPI,
  VerifyOTPAPI,
} from "../services/Api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { FontFamily, Color } from "../GlobalStyles";
import { saveToken } from "../utils/auth";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const VerificationStepCircle = ({ step, currentStep, completed }) => {
  return (
    <View style={styles.stepCircleContainer}>
      <View
        style={[
          styles.stepCircle,
          currentStep === step && styles.activeStepCircle,
          completed && styles.completedStepCircle,
        ]}
      >
        <Text
          style={[
            styles.stepCircleText,
            currentStep === step && styles.activeStepCircleText,
            completed && styles.completedStepCircleText,
          ]}
        >
          {step}
        </Text>
      </View>
    </View>
  );
};

const VerificationOwner = () => {
  const router = useRouter();
  const { contact, email, id, verification } = useLocalSearchParams();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);
  const [mailOtp, setMailOtp] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(
    verification ? JSON.parse(verification) : { mobile: false, email: false }
  );

  const [currentStep, setCurrentStep] = useState(verifyStatus.mobile ? 2 : 1);
  const [phoneOTP, setPhoneOTP] = useState(null);
  const [emailOTP, setEmailOTP] = useState(null);
  const [newEmail, setNewEmail] = useState(email || "");

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

  const handleMobileVerification = async () => {
    setIsLoading(true);
    try {
      const response = await VerifyOTPAPI(contact, phoneOTP);
      if (response?.status === 200) {
        const payload = {
          id,
          verification: {
            mobile: true,
            email: verifyStatus?.email,
          },
          role: "owner",
        };
        const res = await updateVerificationStatusAPI(payload);

        if (res.status === 200) {
          setVerifyStatus((prev) => ({ ...prev, mobile: true }));
          if (verifyStatus.email) {
            router.push("/owner/selectgym");
            showToast({
              type: "success",
              title: "Mobile Number Verified Successfully",
            });
            setPhoneOTP(null);
          } else {
            setCurrentStep(2);
            showToast({
              type: "success",
              title: "Mobile Number Verified Successfully",
            });
            setPhoneOTP(null);
          }
        } else {
          showToast({
            type: "error",
            title: response?.detail,
          });
        }
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    try {
      const response = await VerifyOTPAPI(newEmail, emailOTP);

      if (response?.status === 200) {
        const payload = {
          id,
          verification: {
            mobile: true,
            email: true,
          },
          email: newEmail,
          role: "owner",
        };

        const res = await updateVerificationStatusAPI(payload);

        if (res?.data?.gyms?.length > 1) {
          router.push({
            pathname: "/owner/selectgym",
            params: {
              gyms: JSON.stringify(res.data.gyms),
              owner_id: res.data.owner_id.toString(),
              access_token: res.data?.access_token.toString(),
              refresh_token: res.data?.refresh_token.toString(),
              name: res?.data?.name,
            },
          });
        } else {
          try {
            await saveToken("gym_id", res.data.gyms.gym_id.toString());
            await saveToken("owner_id", res.data.owner_id.toString());
            await saveToken("role", "owner");
            await saveToken("gym_name", res?.data?.gyms?.name);
            await saveToken("access_token", res.data.access_token);
            await saveToken("refresh_token", res.data.refresh_token);
            await saveToken("name", res?.data?.name);
            await saveToken("gym_logo", res?.data?.gyms?.logo);
            router.push("/owner/home");
          } catch (error) {
            showToast({
              type: "error",
              title: error,
            });
          }
        }
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
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSend = async () => {
    setIsLoading(true);
    try {
      const payload = {
        email: newEmail,
        id,
        role: "owner",
      };
      const response = await sendEmailVerificationOTPAPI(payload);
      if (response?.status === 200) {
        setMailOtp(true);
        showToast({
          type: "success",
          title: "OTP sent to email",
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (currentStep === 2) {
        const response = await resendOTPAPI(newEmail, "email", "owner", id);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "OTP resent successfully",
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail,
          });
        }
      } else if (currentStep === 1) {
        const response = await resendOTPAPI(contact, "mobile", "owner", id);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "OTP resent successfully",
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail,
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#000000", "#000000", "#000000"]}
        style={styles.background}
      >
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
            <Text style={styles.tagline}>Your Personal Fitness Companion</Text>
          </Animated.View>

          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.card}
          >
            <View style={styles.stepsHeader}>
              <VerificationStepCircle
                step={1}
                currentStep={currentStep}
                completed={verifyStatus.mobile}
              />
              <VerificationStepCircle
                step={2}
                currentStep={currentStep}
                completed={verifyStatus.email}
              />
            </View>

            <Animated.View
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {/* Mobile Verification Step */}
              {currentStep === 1 && (
                <View>
                  <Text style={styles.heading}>Mobile Verification</Text>
                  <Text style={styles.label}>Enter OTP sent to {contact}</Text>
                  <OTPInput
                    onComplete={(otp) => {
                      setPhoneOTP(otp);
                    }}
                    onResendOTP={handleResendOTP}
                  />
                  <TouchableOpacity
                    // style={
                    //   phoneOTP == null
                    //     ? styles.loginButtonDisabled
                    //     : styles.loginButton
                    // }
                    style={[
                      styles.verifyButton,
                      !phoneOTP
                        ? styles.verifyButtonDisabled
                        : styles.verifyButtonEnabled,
                    ]}
                    onPress={handleMobileVerification}
                    disabled={phoneOTP == null}
                  >
                    {isLoading ? (
                      <Animatable.View
                        animation="pulse"
                        easing="ease-out"
                        iterationCount="infinite"
                      >
                        <Ionicons name="fitness" size={24} color="#FFFFFF" />
                      </Animatable.View>
                    ) : (
                      <Text style={styles.loginButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Email Verification Step */}
              {currentStep === 2 && (
                <View>
                  <Text style={styles.heading}>Email Verification</Text>
                  {!mailOtp && (
                    <>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="mail-unread"
                          size={20}
                          color="#888888"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            newEmail !== "" &&
                              !isValidEmail(newEmail) &&
                              styles.invalidInput,
                          ]}
                          placeholder="Enter your email"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={newEmail}
                          onChangeText={setNewEmail}
                          onBlur={() => {
                            if (newEmail !== "" && !isValidEmail(newEmail)) {
                              showToast({
                                type: "error",
                                title: "Please enter a valid email address",
                              });
                            }
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.loginButton,
                          !isValidEmail(newEmail) && styles.disabledButton,
                        ]}
                        onPress={handleEmailSend}
                        disabled={!isValidEmail(newEmail)}
                      >
                        {isLoading ? (
                          <ActivityIndicator />
                        ) : (
                          <Text
                            style={[
                              styles.loginButtonText,
                              !isValidEmail(newEmail) &&
                                styles.disabledButtonText,
                            ]}
                          >
                            Send OTP
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  {mailOtp && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.label}>
                        Enter OTP sent to {newEmail}
                      </Text>
                      <OTPInput
                        onComplete={(otp) => setEmailOTP(otp)}
                        onResendOTP={handleResendOTP}
                      />

                      <TouchableOpacity
                        // style={
                        //   emailOTP == null
                        //     ? styles.loginButtonDisabled
                        //     : styles.loginButton
                        // }
                        style={[
                          styles.verifyButton,
                          !emailOTP
                            ? styles.verifyButtonDisabled
                            : styles.verifyButtonEnabled,
                        ]}
                        onPress={handleEmailVerification}
                        disabled={emailOTP == null}
                      >
                        {isLoading ? (
                          <Animatable.View
                            animation="pulse"
                            easing="ease-out"
                            iterationCount="infinite"
                          >
                            <Ionicons
                              name="fitness"
                              size={24}
                              color="#FFFFFF"
                            />
                          </Animatable.View>
                        ) : (
                          //   <Text style={styles.loginButtonText}>Submit</Text>
                          <Text style={styles.verifyButtonText}>Submit</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
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
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: height * 0.1,
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
    fontWeight: "bold",
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
    // borderRadius: 20,
    // width: '100%',
    // maxWidth: 400,
    // paddingHorizontal: 20,
    // paddingTop: 20,
    // paddingBottom: 30,
    // marginTop: height * 0.02,
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
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: height * 0.02,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  stepsHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  stepCircleContainer: {
    marginHorizontal: 10,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStepCircle: {
    backgroundColor: "#FF5757",
  },
  completedStepCircle: {
    backgroundColor: "#4CAF50",
  },
  stepCircleText: {
    color: "#666",
    fontWeight: "bold",
  },
  activeStepCircleText: {
    color: "white",
  },
  completedStepCircleText: {
    color: "white",
  },
  heading: {
    fontSize: 22,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: height * 0.03,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.urbanistMedium,
    color: "#333333",
  },
  label: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
    marginLeft: 15,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    color: "#DDDDDD",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  invalidInput: {
    borderColor: "#FF5757",
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#888888",
  },
  loginButton: {
    backgroundColor: "#FF5757",
    height: 50,
    borderRadius: 10,
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

    width: "70%",
    margin: "auto",
    marginTop: 20,
    // height: 50,
    // borderRadius: 10,
    // justifyContent: 'center',
    // alignItems: 'center',
    // marginBottom: 20,
  },
  loginButtonDisabled: {
    // backgroundColor: '#FF5757',
    // height: 55,
    // borderRadius: 12,
    // opacity: 0.5,
    // justifyContent: 'center',
    // alignItems: 'center',
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#FF5757',
    //     shadowOffset: { width: 0, height: 5 },
    //     shadowOpacity: 0.5,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 8,
    //   },
    // }),
    backgroundColor: "#4A4A4A",
  },
  loginButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.urbanistSemiBold,
    color: Color.white,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  //   -----------

  verifyButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  verifyButtonEnabled: {
    backgroundColor: "#FF5757",
  },
  verifyButtonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  changeNumberContainer: {
    marginTop: 10,
  },
  changeNumberText: {
    fontSize: 14,
    color: "#888",
  },
  changeButton: {
    color: "#FF5757",
    fontWeight: "600",
  },
});

export default VerificationOwner;
