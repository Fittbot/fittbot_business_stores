import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import FitnessLoader from "../../components/ui/FitnessLoader";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import QRCodeScanner from "../../components/ui/qrcode";
import WorkoutCard from "../../components/ui/workout/WorkoutCard";
import {
  addClientAPI,
  getClientFromQRAPI,
  getPlansandBatchesAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const AddClientScreen = () => {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    contact: "",
    email: "",
    dateOfBirth: new Date(),
    height: "",
    weight: "",
    bmi: "",
    jobNature: "",
    fitnessGoal: "",
    trainingType: "",
    admissionFee: "",
    discountedFee: "",
    batchType: "",
    expiry: "",
    paymentMethod: "",
    paymentReferenceNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQRScannerVisible, setQRScannerVisible] = useState(false);
  const [isDataFromQR, setIsDataFromQR] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Format date to SQL format (YYYY-MM-DD)
  const formatDateForSQL = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchPlansAndBatches = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);
      if (response?.status === 200) {
        setPlans(response.data.plans);
        setBatches(response.data.batches);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching plans and batches",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndBatches();
  }, []);

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "fullName":
        if (!value.trim()) error = "Full name is required";
        else if (value.trim().length < 3)
          error = "Name must be at least 3 characters";
        else if (!/^[a-zA-Z\s]+$/.test(value))
          error = "Name can only contain letters";
        break;

      case "contact":
        if (!value) error = "Phone number is required";
        else if (!/^[6-9]\d{9}$/.test(value))
          error = "Enter valid 10-digit mobile number";
        break;

      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Enter valid email address";
        break;

      case "dateOfBirth":
        if (!value) error = "Date of birth is required";
        else {
          const age = calculateAge(value);
          if (age < 18 || age > 100) error = "Age must be between 18-100 years";
        }
        break;

      case "height":
        if (!value) error = "Height is required";
        else if (parseFloat(value) < 50 || parseFloat(value) > 300)
          error = "Height must be between 50-300 cm";
        break;

      case "weight":
        if (!value) error = "Weight is required";
        else if (parseFloat(value) < 20 || parseFloat(value) > 500)
          error = "Weight must be between 20-500 kg";
        break;

      case "place":
        if (value && !/^[a-zA-Z\s]+$/.test(value))
          error = "Place can only contain letters";
        break;

      case "admissionFee":
        if (!value) error = "Admission fee is required";
        else if (isNaN(value) || parseFloat(value) < 0)
          error = "Enter valid amount";
        break;

      case "discountedFee":
        if (!value) error = "Discounted fee is required";
        else if (isNaN(value) || parseFloat(value) < 0)
          error = "Enter valid amount";
        break;
    }

    return error;
  };

  const handleInputChange = (field, value) => {
    setForm((prevForm) => {
      const updatedForm = { ...prevForm, [field]: value };

      if (field === "height" || field === "weight") {
        const heightInMeters =
          field === "height"
            ? parseFloat(value) / 100
            : parseFloat(updatedForm.height) / 100;
        const weight =
          field === "weight"
            ? parseFloat(value)
            : parseFloat(updatedForm.weight);

        if (weight && heightInMeters && heightInMeters > 0) {
          const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(
            2
          );
          updatedForm.bmi = isNaN(bmiValue) ? "" : bmiValue;
        }
      }

      return updatedForm;
    });

    // Validate field on change
    const error = validateField(field, value);
    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.dateOfBirth;
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      handleInputChange("dateOfBirth", currentDate);
    }
  };

  const fetchQRData = async (qrData) => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      const response = await getClientFromQRAPI(qrData);

      if (response?.status === 200) {
        // Convert date_of_birth string to Date object if available
        let dateOfBirth = new Date();
        if (response.data.date_of_birth) {
          dateOfBirth = new Date(response.data.date_of_birth);
        } else if (response.data.age) {
          // If age is provided instead of date_of_birth, calculate approximate date_of_birth
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - parseInt(response.data.age);
          dateOfBirth = new Date(birthYear, 0, 1); // January 1st of birth year
        }

        setForm({
          ...form,
          fullName: response.data.full_name || "",
          gender: response.data.gender || "",
          contact: response.data.contact || "",
          email: response.data.email || "",
          dateOfBirth: dateOfBirth,
          height: response.data.height ? response.data.height.toString() : "",
          weight: response.data.weight ? response.data.weight.toString() : "",
          bmi: response.data.bmi ? response.data.bmi.toString() : "",
          jobNature: response.data.lifestyle || "",
          fitnessGoal: response.data.goals || "",
          trainingType: "",
          batchType: "",
          admissionFee: "",
          discountedFee: "",
          expiry: "",
          paymentMethod: "",
          paymentReferenceNumber: "",
        });

        setIsDataFromQR(true);
        setShowForm(true);
        showToast({
          type: "success",
          title:
            "Client data retrieved successfully. Please complete training details.",
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to retrieve client data",
        });
        setShowForm(true);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to process QR code data",
      });
      setShowForm(true);
    } finally {
      setIsLoading(false);
      setQRScannerVisible(false);
    }
  };

  const handleQRCodeScanned = (type, data) => {
    fetchQRData(data);
  };

  const validateStep1 = () => {
    const requiredFields = [
      "fullName",
      "contact",
      "email",
      "dateOfBirth",
      "height",
      "weight",
      "gender",
      "fitnessGoal",
      "jobNature",
    ];
    let isValid = true;

    for (let field of requiredFields) {
      const error = validateField(field, form[field]);
      if (error) {
        isValid = false;
      }
    }

    return isValid;
  };

  const validateStep2 = () => {
    const requiredFields = [
      "batchType",
      "trainingType",
      "admissionFee",
      "discountedFee",
      "paymentMethod",
    ];
    let isValid = true;

    for (let field of requiredFields) {
      if (!form[field]) {
        isValid = false;
      }
    }

    return isValid;
  };

  const isStep1Valid = validateStep1();
  const isStep2Valid = validateStep2();

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setErrors({});
      setTouched({});
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setErrors({});
    setTouched({});
  };

  const showConfirmationModal = () => {
    if (validateStep2()) {
      setIsConfirmationModalVisible(true);
    }
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        full_name: form.fullName,
        date_of_birth: formatDateForSQL(form.dateOfBirth),
        gender: form.gender,
        contact: form.contact,
        email: form.email,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        bmi: parseFloat(form.bmi),
        job_nature: form.jobNature,
        fitness_goal: form.fitnessGoal,
        training_type: parseInt(form.trainingType),
        admission_fee: parseInt(form.admissionFee),
        discounted_fee: parseInt(form.discountedFee),
        batch_type: parseInt(form.batchType),
        expiry: form.expiry,
        payment_method: form.paymentMethod,
        payment_reference_number: form.paymentReferenceNumber || null,
      };

      const response = await addClientAPI(payload);

      if (response.status === 200) {
        setLoading(false);

        showToast({
          type: "success",
          title: "Client data added successfully!",
        });
        setForm({
          fullName: "",
          gender: "",
          contact: "",
          email: "",
          dateOfBirth: new Date(),
          height: "",
          weight: "",
          bmi: "",
          jobNature: "",
          fitnessGoal: "",
          trainingType: "",
          batchType: "",
          admissionFee: "",
          discountedFee: "",
          expiry: "",
          paymentMethod: "",
          paymentReferenceNumber: "",
        });
        setErrors({});
        setTouched({});
        setCurrentStep(1);
        setShowForm(false);
        setIsDataFromQR(false);
        setIsConfirmationModalVisible(false);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to add client data.",
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      showToast({
        type: "error",
        title: "An error occurred while submitting client data.",
      });
      setLoading(false);
    }
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  if (plans?.length === 0 || batches?.length === 0) {
    return (
      <>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"Add Clients"}
        />
        <View style={styles.noFeedContainer}>
          <Text style={styles.headerTitle}>Add Clients</Text>
          <MaterialCommunityIcons
            name="account-clock"
            size={50}
            color="#CBD5E0"
          />

          <Text style={styles.noFeedTitle}>No Plans or Batches Found</Text>
          <Text style={styles.noFeedSubTitle}>
            You need to add plans and batches initially to start adding clients
            in your gym.
          </Text>

          <TouchableOpacity
            style={styles.noFeedRefreshButton}
            onPress={() => router.push("/owner/manageplans")}
          >
            <MaterialCommunityIcons
              name="account-clock"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.noFeedButtonText}>Add Plans or Batches</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const renderHeader = () => {
    if (!showForm) {
      return (
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"Add Clients"}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <NewOwnerHeader
          onBackButtonPress={() => {
            setShowForm(false);
            setIsDataFromQR(false);
            setCurrentStep(1);
          }}
          text={"Add Clients"}
        />
      );
    }

    return (
      <NewOwnerHeader
        onBackButtonPress={handlePreviousStep}
        text={"Add Clients"}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler
        routePath="/owner/home"
        enabled={true}
        onBackPress={() => {
          if (showForm) {
            setShowForm(false);
            return true;
          }
          return false;
        }}
      />
      {renderHeader()}

      {!showForm ? (
        <View style={styles.selectionContainer}>
          <WorkoutCard
            key={"scan"}
            title={"Scan QR & Add"}
            subtitle={
              "Scan the Unique QR code of the client and add them in a single tap"
            }
            buttonText={"Add"}
            imagePath={require("../../assets/images/SCANNER TOO.png")}
            onPress={() => setQRScannerVisible(true)}
            textColor={"#297DB3"}
            bg1={"rgba(41, 125, 179, 0.15)"}
            bg2={"#fff"}
            border1={"rgba(41, 125, 179, 0.5)"}
            border2={"#fff"}
            charWidth={140}
            charHeight={110}
          />

          <WorkoutCard
            key={"manual"}
            title={"Manual Addition"}
            subtitle={"Manually add a client by entering his basic details"}
            buttonText={"Add"}
            imagePath={require("../../assets/images/TRAINER 1.png")}
            onPress={() => setShowForm(true)}
            textColor={"#297DB3"}
            bg1={"rgba(41, 125, 179, 0.15)"}
            bg2={"#fff"}
            border1={"rgba(41, 125, 179, 0.5)"}
            border2={"#fff"}
            charWidth={110}
            charHeight={140}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.innerContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 ? (
            <>
              <Text style={styles.title}>Client Details</Text>

              {/* Basic Details */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Basic Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isDataFromQR && styles.disabledInput,
                      touched.fullName && errors.fullName && styles.errorInput,
                    ]}
                    placeholder="Enter name"
                    placeholderTextColor="#a0a0a0"
                    value={form.fullName}
                    onChangeText={(value) =>
                      handleInputChange("fullName", value)
                    }
                    onBlur={() => handleBlur("fullName")}
                    editable={!isDataFromQR}
                  />
                  {touched.fullName && errors.fullName && (
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isDataFromQR && styles.disabledInput,
                      touched.contact && errors.contact && styles.errorInput,
                    ]}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#a0a0a0"
                    keyboardType="phone-pad"
                    value={form.contact}
                    onChangeText={(value) =>
                      handleInputChange("contact", value)
                    }
                    onBlur={() => handleBlur("contact")}
                    maxLength={10}
                    editable={!isDataFromQR}
                  />
                  {touched.contact && errors.contact && (
                    <Text style={styles.errorText}>{errors.contact}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Id</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isDataFromQR && styles.disabledInput,
                      touched.email && errors.email && styles.errorInput,
                    ]}
                    placeholder="Enter email address"
                    placeholderTextColor="#a0a0a0"
                    keyboardType="email-address"
                    value={form.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    onBlur={() => handleBlur("email")}
                    editable={!isDataFromQR}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      value={form.gender}
                      onValueChange={(value) =>
                        !isDataFromQR && handleInputChange("gender", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      style={pickerSelectStyles}
                      disabled={isDataFromQR}
                      items={[
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                      ]}
                      placeholder={{ label: "Select Gender", value: null }}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color={isDataFromQR ? "#999999" : "#666666"}
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      isDataFromQR && styles.disabledInput,
                      touched.dateOfBirth &&
                        errors.dateOfBirth &&
                        styles.errorInput,
                    ]}
                    onPress={() => !isDataFromQR && setShowDatePicker(true)}
                    disabled={isDataFromQR}
                  >
                    <Text
                      style={[
                        styles.datePickerText,
                        isDataFromQR && styles.disabledText,
                      ]}
                    >
                      {formatDateForDisplay(form.dateOfBirth)}
                      <Text style={styles.ageText}>
                        {" "}
                        (Age: {calculateAge(form.dateOfBirth)} years)
                      </Text>
                    </Text>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color={isDataFromQR ? "#999999" : "#666666"}
                    />
                  </TouchableOpacity>
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                  )}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={form.dateOfBirth}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()} // Can't select future dates
                    minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)} // 100 years ago
                  />
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Place</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isDataFromQR && styles.disabledInput,
                      touched.place && errors.place && styles.errorInput,
                    ]}
                    placeholder="Enter place"
                    placeholderTextColor="#a0a0a0"
                    value={form.place || ""}
                    onChangeText={(value) => handleInputChange("place", value)}
                    onBlur={() => handleBlur("place")}
                    editable={!isDataFromQR}
                  />
                  {touched.place && errors.place && (
                    <Text style={styles.errorText}>{errors.place}</Text>
                  )}
                </View>
              </View>

              {/* Physical Attributes */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Physical Attributes</Text>

                <View style={styles.doubleInputRow}>
                  <View style={styles.halfInputGroup}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.inputWithSuffixField,
                          isDataFromQR && styles.disabledInput,
                          touched.height && errors.height && styles.errorInput,
                        ]}
                        placeholder=""
                        placeholderTextColor="#a0a0a0"
                        keyboardType="phone-pad"
                        value={form.height}
                        onChangeText={(value) =>
                          handleInputChange("height", value)
                        }
                        onBlur={() => handleBlur("height")}
                        editable={!isDataFromQR}
                      />
                      <Text style={styles.suffix}>cm</Text>
                    </View>
                    {touched.height && errors.height && (
                      <Text style={styles.errorText}>{errors.height}</Text>
                    )}
                  </View>

                  <View style={styles.halfInputGroup}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.inputWithSuffixField,
                          isDataFromQR && styles.disabledInput,
                          touched.weight && errors.weight && styles.errorInput,
                        ]}
                        placeholder=""
                        placeholderTextColor="#a0a0a0"
                        keyboardType="phone-pad"
                        value={form.weight}
                        onChangeText={(value) =>
                          handleInputChange("weight", value)
                        }
                        onBlur={() => handleBlur("weight")}
                        editable={!isDataFromQR}
                      />
                      <Text style={styles.suffix}>kg</Text>
                    </View>
                    {touched.weight && errors.weight && (
                      <Text style={styles.errorText}>{errors.weight}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bmi (Auto Calculated)</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    editable={false}
                    value={form.bmi.toString() || ""}
                    placeholder="Your BMI Appear Here"
                    placeholderTextColor="#a0a0a0"
                  />
                </View>
              </View>

              {/* Lifestyle & Goals */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Lifestyle & Goals</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Lifestyle</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      value={form.jobNature}
                      onValueChange={(value) =>
                        !isDataFromQR && handleInputChange("jobNature", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      style={pickerSelectStyles}
                      disabled={isDataFromQR}
                      placeholder={{ label: "Select Lifestyle", value: null }}
                      items={[
                        { label: "Sedentary", value: "sedentary" },
                        { label: "Lightly Active", value: "lightly_active" },
                        {
                          label: "Moderately Active",
                          value: "moderately_active",
                        },
                        { label: "Very Active", value: "very_active" },
                        { label: "Super Active", value: "super_active" },
                      ]}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color={isDataFromQR ? "#999999" : "#666666"}
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Fitness Goal</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      value={form.fitnessGoal}
                      onValueChange={(value) =>
                        !isDataFromQR && handleInputChange("fitnessGoal", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      style={pickerSelectStyles}
                      disabled={isDataFromQR}
                      placeholder={{ label: "Select Goal", value: null }}
                      items={[
                        { label: "Weight Loss", value: "weight_loss" },
                        { label: "Weight Gain", value: "weight_gain" },
                        { label: "Body Recomp", value: "maintain" },
                      ]}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color={isDataFromQR ? "#999999" : "#666666"}
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isStep1Valid && styles.disabledButton,
                ]}
                onPress={handleNextStep}
                disabled={!isStep1Valid}
              >
                <Text style={styles.submitButtonText}>Next →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Training and Batch Details</Text>

              {/* Training & Batch */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Training & Batch</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Training Type</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleInputChange("trainingType", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      value={form.trainingType}
                      style={pickerSelectStyles}
                      placeholder={{
                        label: "Select Training Type",
                        value: null,
                      }}
                      items={plans.map((plan) => ({
                        label: plan.plans,
                        value: plan.id,
                      }))}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                  {touched.trainingType && errors.trainingType && (
                    <Text style={styles.errorText}>{errors.trainingType}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Batch Type</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleInputChange("batchType", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      value={form.batchType}
                      style={pickerSelectStyles}
                      placeholder={{ label: "Select Batch Type", value: null }}
                      items={batches.map((batch) => ({
                        label: batch.batch_name,
                        value: batch.id,
                      }))}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                  {touched.batchType && errors.batchType && (
                    <Text style={styles.errorText}>{errors.batchType}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Fee Collection</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleInputChange("expiry", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      value={form.expiry || ""}
                      style={pickerSelectStyles}
                      placeholder={{
                        label: "Select Fee Collection",
                        value: null,
                      }}
                      items={[
                        {
                          label: "Start of the Month",
                          value: "start_of_the_month",
                        },
                        { label: "Joining Date", value: "joining_date" },
                      ]}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Admission Fees</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.admissionFee &&
                        errors.admissionFee &&
                        styles.errorInput,
                    ]}
                    placeholder="Enter Admission Fees"
                    placeholderTextColor="#a0a0a0"
                    keyboardType="numeric"
                    value={form.admissionFee}
                    onChangeText={(value) =>
                      handleInputChange("admissionFee", value)
                    }
                    onBlur={() => handleBlur("admissionFee")}
                  />
                  {touched.admissionFee && errors.admissionFee && (
                    <Text style={styles.errorText}>{errors.admissionFee}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Discounted Fees</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.discountedFee &&
                        errors.discountedFee &&
                        styles.errorInput,
                    ]}
                    placeholder="Enter Discounted Monthly Fees"
                    placeholderTextColor="#a0a0a0"
                    keyboardType="numeric"
                    value={form.discountedFee}
                    onChangeText={(value) =>
                      handleInputChange("discountedFee", value)
                    }
                    onBlur={() => handleBlur("discountedFee")}
                  />
                  {touched.discountedFee && errors.discountedFee && (
                    <Text style={styles.errorText}>{errors.discountedFee}</Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={styles.pickerContainerWithIcon}>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleInputChange("paymentMethod", value)
                      }
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      value={form.paymentMethod || ""}
                      style={pickerSelectStyles}
                      placeholder={{
                        label: "Select Payment Method",
                        value: null,
                      }}
                      items={[
                        { label: "Cash", value: "cash" },
                        { label: "Card", value: "card" },
                        { label: "UPI", value: "upi" },
                        { label: "Bank Transfer", value: "bank_transfer" },
                        { label: "Cheque", value: "cheque" },
                      ]}
                      Icon={() => (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                  {touched.paymentMethod && errors.paymentMethod && (
                    <Text style={styles.errorText}>{errors.paymentMethod}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Payment Reference Number (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.paymentReferenceNumber &&
                        errors.paymentReferenceNumber &&
                        styles.errorInput,
                    ]}
                    placeholder="Enter reference number if applicable"
                    placeholderTextColor="#a0a0a0"
                    value={form.paymentReferenceNumber}
                    onChangeText={(value) =>
                      handleInputChange("paymentReferenceNumber", value)
                    }
                    onBlur={() => handleBlur("paymentReferenceNumber")}
                  />
                  {touched.paymentReferenceNumber &&
                    errors.paymentReferenceNumber && (
                      <Text style={styles.errorText}>
                        {errors.paymentReferenceNumber}
                      </Text>
                    )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isStep2Valid && styles.disabledButton,
                ]}
                onPress={showConfirmationModal}
                disabled={!isStep2Valid}
              >
                <Text style={styles.submitButtonText}>Submit Details</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {isQRScannerVisible && (
        <QRCodeScanner
          isVisible={isQRScannerVisible}
          onClose={() => setQRScannerVisible(false)}
          onCodeScanned={handleQRCodeScanned}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isConfirmationModalVisible}
        onRequestClose={() => setIsConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Please Verify Client Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{form.fullName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{form.contact}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{form.email}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth:</Text>
              <Text style={styles.detailValue}>
                {formatDateForDisplay(form.dateOfBirth)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>
                {calculateAge(form.dateOfBirth)} years
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Training Type:</Text>
              <Text style={styles.detailValue}>
                {plans.find((p) => p.id === form.trainingType)?.plans ||
                  "Not selected"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Batch:</Text>
              <Text style={styles.detailValue}>
                {batches.find((b) => b.id === form.batchType)?.batch_name ||
                  "Not selected"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>
                {form.paymentMethod
                  ? form.paymentMethod.charAt(0).toUpperCase() +
                    form.paymentMethod.slice(1).replace("_", " ")
                  : "Not selected"}
              </Text>
            </View>

            {form.paymentReferenceNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference Number:</Text>
                <Text style={styles.detailValue}>
                  {form.paymentReferenceNumber}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsConfirmationModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={submitForm}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  innerContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.05,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
    textAlign: "center",
    marginVertical: height * 0.02,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: height * 0.02,
  },
  inputGroup: {
    marginBottom: height * 0.02,
  },
  label: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666666",
    paddingLeft: 5,
    marginBottom: height * 0.01,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.04,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#999999",
  },
  disabledText: {
    color: "#999999",
  },
  errorInput: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 5,
  },
  datePickerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: width * 0.04,
    color: "#2C3E50",
    flex: 1,
  },
  ageText: {
    fontSize: width * 0.035,
    color: "#666666",
    fontWeight: "normal",
  },
  doubleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInputGroup: {
    width: "48%",
    marginBottom: 0,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  inputWithSuffixField: {
    flex: 1,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.04,
    color: "#2C3E50",
  },
  suffix: {
    paddingRight: width * 0.04,
    fontSize: width * 0.035,
    color: "#666666",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: height * 0.018,
    alignItems: "center",
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
    fontWeight: "600",
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  noFeedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubTitle: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 10,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  headerTitle: {
    color: "#2C3E50",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  pickerContainerWithIcon: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  pickerIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#666666",
    fontSize: 14,
  },
  detailValue: {
    color: "#2C3E50",
    fontSize: 14,
    maxWidth: "60%",
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#666666",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 8,
    color: "#2C3E50",
    paddingRight: 40, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 45,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 8,
    color: "#2C3E50",
    paddingRight: 40,
    backgroundColor: "transparent",
  },
  placeholder: {
    color: "#a0a0a0",
    fontSize: 14,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 15 : 12,
    right: 15,
  },
});

export default AddClientScreen;
