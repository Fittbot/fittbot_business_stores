import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ImageBackground,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  MaterialIcons,
  Ionicons,
  Entypo,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Image from "expo-image";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { router, useRouter, useLocalSearchParams } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import { postGymOffersAPI, updateGymOffersAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Available categories and tags
const CATEGORIES = [
  { id: "membership", name: "Membership", icon: "id-card" },
  { id: "guest", name: "Guest Pass", icon: "user-friends" },
  { id: "training", name: "Training", icon: "dumbbell" },
  { id: "nutrition", name: "Nutrition", icon: "utensils" },
  { id: "merchandise", name: "Merchandise", icon: "tshirt" },
];

const TAGS = [
  { id: "new", name: "New" },
  { id: "popular", name: "Popular" },
  { id: "limited", name: "Limited Time" },
  { id: "exclusive", name: "Exclusive" },
  { id: "sale", name: "On Sale" },
];

// Extract OfferPreview as a reusable component
const OfferPreview = ({ offer, isEven = true, onPress }) => {
  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.icon : "tag";
  };

  return (
    <TouchableOpacity
      style={[
        styles.offerContainer,
        isEven ? styles.offerEven : styles.offerOdd,
      ]}
      onPress={() => onPress && onPress(offer)}
      activeOpacity={0.9}
    >
      <View style={styles.offerImageContainer}>
        <ImageBackground
          source={offer.image}
          style={styles.offerImage}
          imageStyle={styles.offerImageStyle}
        >
          <LinearGradient
            colors={
              isEven
                ? ["rgba(255, 87, 87, 0.85)", "rgba(255, 87, 87, 0.95)"]
                : ["rgba(83, 82, 237, 0.85)", "rgba(83, 82, 237, 0.95)"]
            }
            style={styles.offerGradient}
          >
            <View style={styles.offerTag}>
              <Text style={styles.offerTagText}>{offer.tag}</Text>
            </View>
            <View style={styles.offerIconContainer}>
              <FontAwesome5
                name={getCategoryIcon(offer.category)}
                size={responsiveFontSize(20)}
                color="#FFF"
              />
            </View>
            <Text style={styles.offerDiscount}>{offer.discount}%</Text>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerSubtitle}>{offer.subdescription}</Text>
            <View style={styles.offerValidUntil}>
              <Ionicons
                name="time-outline"
                size={responsiveFontSize(14)}
                color="#FFF"
              />
              <Text style={styles.offerValidText}>
                Valid until {formatDate(offer.validity)}
              </Text>
            </View>
            <View style={styles.offerFooter}>
              <Text style={styles.offerCode}>Code: {offer.code}</Text>
              <View style={styles.viewDetailsContainer}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Entypo
                  name="chevron-right"
                  size={responsiveFontSize(14)}
                  color="#FFF"
                />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  );
};

// Extract FormField as a reusable component
const FormField = ({
  label,
  placeholder,
  iconName,
  value,
  onChangeText,
  keyboardType,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  onFocus,
  rightIcon,
  style = {},
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.textAreaWrapper,
          style,
        ]}
      >
        {iconName && (
          <MaterialIcons
            name={iconName}
            size={20}
            color="#8E8E93"
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={onFocus}
        />
        {rightIcon}
      </View>
    </View>
  );
};

const OfferForm = ({
  initialFormData = {},
  onSubmit,
  onCancel,
  headerComponent,
  submitButtonText = "Create Offer",
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { offer } = useLocalSearchParams();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUploading, setIsUploading] = useState(false);
  const [offerId, setOfferId] = useState(null);
  const [formData, setFormData] = useState({
    gym_id: "",
    title: "",
    subdescription: "",
    description: "",
    discount: "",
    validity: "",
    code: "",
    tag: "",
    category: "membership",
    // bannerImage: null,
    ...initialFormData,
  });

  // Parse and set offer data from params if available
  useEffect(() => {
    if (offer) {
      try {
        const offerData = JSON.parse(offer);

        setOfferId(offerData.id);

        setFormData({
          title: offerData.title || "",
          subdescription: offerData.subdescription || "",
          description: offerData.description || "",
          discount: offerData.discount
            ? offerData.discount.toString().replace("%", "")
            : "",
          validity: offerData.validity || "",
          code: offerData.code || "",
          tag: offerData.tag || "",
          category: offerData.category || "membership",
          // bannerImage: offerData.image || null,
        });

        if (offerData.validity) {
          setSelectedDate(new Date(offerData.validity));
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Could not load offer data for editing",
        });
      }
    }
  }, [offer]);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Camera roll permissions are required to upload images!",
        });
      }
    })();
  }, []);

  // Handle image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 2],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData({
          ...formData,
          bannerImage: { uri: result.assets[0].uri },
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error picking image. Please try again.",
      });
    }
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, validity: formattedDate });
    }
  };

  // Handle category selection
  const selectCategory = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    setShowCategoryModal(false);
  };

  // Get category name from ID
  const getCategoryName = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.name : "Select Category";
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Form validation
  const validateForm = () => {
    const requiredFields = ["title", "subdescription", "validity", "category"];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (
        !formData[field] ||
        (typeof formData[field] === "string" && formData[field].trim() === "")
      ) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      showToast({
        type: "error",
        title: "Missing Information",
        desc: `Please fill in all required fields: ${missingFields.join(", ")}`,
      });
      return false;
    }

    if (formData.validity) {
      const today = new Date();
      const validDate = new Date(formData.validity);

      if (validDate < today) {
        showToast({
          type: "error",
          title: "Invalid Date",
          desc: "Please select a future date for the offer validity.",
        });
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      showToast({
        type: "error",
        title: "Please enter a title for your offer",
      });
      return;
    }

    if (!formData.validity) {
      showToast({
        type: "error",
        title: "Please select a valid until date",
      });
      return;
    }

    setIsUploading(true);

    const gymId = await getToken("gym_id");
    formData.gym_id = gymId;

    try {
      let response;

      if (offerId) {
        formData.offer_id = offerId;
        response = await updateGymOffersAPI(formData);
      } else {
        response = await postGymOffersAPI(formData);
      }

      if (response.status === 200) {
        showToast({
          type: "success",
          title: offerId
            ? "Offer updated successfully!"
            : "Offer created successfully!",
        });
        router.push({
          pathname: "/owner/(tabs)/feed",
          params: { refresh: true, activeTab: "Gym Offers" },
        });
        // router.back();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: `An error occurred while ${
          offerId ? "updating" : "posting"
        } the offer. Please try again.`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Preview offer data
  const previewData = {
    id: "1",
    image: formData.bannerImage || require("../../../assets/images/offer.jpg"),
    tag: formData.tag || "Limited Time",
    title: formData.title || "New Offer",
    subdescription: formData.subdescription || "Sub Description",
    description: formData.description || "Description",
    discount: formData.discount || "0%",
    validity: formData.validity || "2025-12-31",
    category: formData.category || "membership",
    code: formData.code || "CODE",
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
      ]}
    >
      {headerComponent}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <NewOwnerHeader
          onBackButtonPress={() =>
            router.push({
              pathname: "/owner/(tabs)/feed",
              params: { refresh: true, activeTab: "Gym Offers" },
            })
          }
          text={offer ? "Update Offer Details" : "Add New Offer Details"}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Preview Section */}
            <OfferPreview
              offer={previewData}
              isEven={true}
              onPress={() => {}}
            />

            {/* Form Fields */}
            <FormField
              label="Offer Title"
              placeholder="E.g., Summer Special"
              iconName="local-offer"
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
            />

            <FormField
              label="Subtitle"
              placeholder="E.g., Limited Time Offer"
              iconName="subtitles"
              value={formData.subdescription}
              onChangeText={(text) => handleInputChange("subdescription", text)}
            />

            <FormField
              label="Description"
              placeholder="Describe your offer in detail..."
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline={true}
              numberOfLines={4}
            />

            <FormField
              label="Tag"
              placeholder="E.g., Limited Time, Popular, New"
              iconName="local-offer"
              value={formData.tag}
              onChangeText={(text) => handleInputChange("tag", text)}
            />

            {/* Banner Image Upload */}
            {/* <View style={styles.inputContainer}>
              <Text style={styles.label}>Banner Image</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, styles.uploadContainer]}
                onPress={pickImage}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                <MaterialIcons
                  name="add-photo-alternate"
                  size={24}
                  color="#8E8E93"
                  style={styles.uploadIcon}
                />
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadText}>
                    {formData.bannerImage
                      ? 'Change Banner Image'
                      : 'Upload Banner Image'}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    {formData.bannerImage
                      ? 'Tap to change'
                      : 'Recommended: 800x400px'}
                  </Text>
                </View>
                {formData.bannerImage && formData.bannerImage.uri ? (
                  <Image
                    source={require('../../../assets/images/offer.jpg')}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : null}
              </TouchableOpacity>
            </View> */}

            <FormField
              label="Discount"
              placeholder="E.g., 20% or $50"
              iconName="discount"
              value={formData.discount}
              onChangeText={(text) => handleInputChange("discount", text)}
              keyboardType="numeric"
            />

            <FormField
              label="Valid Until"
              placeholder="Select end date"
              iconName="date-range"
              value={formatDate(formData.validity)}
              onChangeText={(text) => handleInputChange("validity", text)}
              onFocus={() => setShowDatePicker(true)}
              rightIcon={
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#8E8E93"
                />
              }
            />

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.label}>Category</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="category"
                  size={20}
                  color="#8E8E93"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    {
                      color: formData.category ? "#000" : "#8E8E93",
                      marginTop: 35,
                    },
                  ]}
                >
                  {getCategoryName(formData.category)}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#8E8E93"
                />
              </View>
            </TouchableOpacity>

            <FormField
              label="Promo Code (Optional)"
              placeholder="E.g., SUMMER20"
              iconName="confirmation-number"
              value={formData.code}
              onChangeText={(text) => handleInputChange("code", text)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={styles.modalScrollView}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.id &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => selectCategory(category.id)}
                >
                  <FontAwesome5
                    name={category.icon}
                    size={20}
                    color={
                      formData.category === category.id ? "#FF5757" : "#8E8E93"
                    }
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === category.id &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleFormSubmit}
          activeOpacity={0.8}
          disabled={isUploading}
        >
          <LinearGradient
            colors={["#1DA1F2", "#1DA1F2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.submitButtonText}>
              {isUploading
                ? "Saving..."
                : offer
                ? "Update Offer"
                : submitButtonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Wrapper component to handle route params
const AddOfferFormPage = () => {
  const router = useRouter();

  const handleCancel = () => {
    // Navigate back on cancel
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* <NewOwnerHeader title="Offer" showBackButton={true} /> */}
      <OfferForm onCancel={handleCancel} />
    </View>
  );
};

export default AddOfferFormPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Space for the submit button
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D2D2D",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  inputIcon: {
    marginRight: 12,
  },
  uploadContainer: {
    padding: 15,
    height: "auto",
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
  },
  uploadIcon: {
    marginRight: 15,
  },
  uploadTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  uploadText: {
    fontSize: 16,
    color: "#2D2D2D",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#8E8E93",
  },
  previewImage: {
    width: 80,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#2D2D2D",
    fontSize: 16,
  },
  textAreaWrapper: {
    height: 120,
    alignItems: "flex-start",
    paddingTop: 16,
  },
  textArea: {
    textAlignVertical: "top",
    paddingRight: 16,
  },
  buttonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 20,
    right: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    marginRight: responsiveWidth(1),
  },

  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    width: "85%",
    maxHeight: "70%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryItemSelected: {
    backgroundColor: "#FFF5F5",
  },
  categoryIcon: {
    width: 24,
    textAlign: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: "#555",
  },
  categoryTextSelected: {
    color: "#FF5757",
    fontWeight: "500",
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },

  //------------ Offer Card Styling --------------------
  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: responsiveHeight(30),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    padding: responsiveWidth(4),
    justifyContent: "space-between",
    borderRadius: responsiveWidth(3),
  },
  offerTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  offerTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  offerDiscount: {
    color: "#FFF",
    fontSize: responsiveFontSize(28),
    fontWeight: "bold",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    marginLeft: responsiveWidth(1),
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerCode: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
});
