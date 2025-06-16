import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  changeGymLocationAPI,
  getProfileDataAPI,
  updateProfileAPI,
} from "../../services/Api";
import FitnessLoader from "../../components/ui/FitnessLoader";
import UpiQRCode from "../../components/UPIQRCode";
import { getToken, saveToken } from "../../utils/auth";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image, ImageBackground } from "expo-image";
import { FullImageModal } from "../../components/profile/FullImageModal";
import * as ImagePicker from "expo-image-picker";
import axiosInstance from "../../services/axiosInstance";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const ImageUploadModal = ({
  isVisible,
  onClose,
  onImageSelect,
  title,
  aspectRatio = [16, 9], // Default aspect ratio for cover, [1, 1] for logo
}) => {
  const selectImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your photo library to upload images.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled) {
        onImageSelect(result.assets[0]);
        onClose();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Failed to select Image",
      });
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your camera to take photos.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled) {
        onImageSelect(result.assets[0]);
        onClose();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Failed to take photo",
      });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.imageUploadModalContainer}>
          <View style={styles.passwordModalHeader}>
            <Text style={styles.passwordModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.uploadOptionsContainer}>
            <TouchableOpacity style={styles.uploadOption} onPress={selectImage}>
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="images-outline" size={24} color="#3498db" />
              </View>
              <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="camera-outline" size={24} color="#3498db" />
              </View>
              <Text style={styles.uploadOptionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OwnerProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [gymData, setGymData] = useState(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Tab Management
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [gymList, setGymList] = useState([]);
  const [gymCount, setGymCount] = useState(0);

  // Password Change
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Show/Hide Password
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Data
  const [personalDetails, setPersonalDetails] = useState([]);
  const [gymDetails, setGymDetails] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [gymID, setGymID] = useState(null);
  const [accountID, setaccountID] = useState(null);
  const [isFullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);

  // New states for image upload modals
  const [isLogoUploadModalVisible, setLogoUploadModalVisible] = useState(false);
  const [isCoverUploadModalVisible, setCoverUploadModalVisible] =
    useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleImageClick = (imageSource) => {
    setFullImageSource(imageSource);
    setFullImageModalVisible(true);
  };

  const handleLogoUpload = async (imageAsset) => {
    setIsUploadingLogo(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      // Get presigned URL for logo upload
      const { data: uploadResp } = await axiosInstance.get(
        "/gym_profile/upload-url",
        {
          params: {
            gym_id: gym_id,
            extension: extension,
            scope: "logo",
          },
        }
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      // Upload to S3
      const s3Resp = await fetch(upload.url, {
        method: "POST",
        body: form,
      });

      if (s3Resp.status !== 204 && s3Resp.status !== 201) {
        showToast({
          type: "error",
          title: "Failed to upload logo. Please try again.",
        });
        return;
      }

      // Confirm upload
      const res = await axiosInstance.post("/gym_profile/confirm", {
        cdn_url,
        gym_id: gym_id,
        scope: "logo",
      });

      if (res?.status === 200) {
        await getProfileData();
        showToast({
          type: "success",
          title: "Logo updated successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to upload logo. Please try again.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (imageAsset) => {
    setIsUploadingCover(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      // Get presigned URL for cover upload
      const { data: uploadResp } = await axiosInstance.get(
        "/gym_profile/upload-url",
        {
          params: {
            gym_id: gym_id,
            extension,
            scope: "cover_pic",
          },
        }
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      // Upload to S3
      const s3Resp = await fetch(upload.url, {
        method: "POST",
        body: form,
      });

      if (s3Resp.status !== 204 && s3Resp.status !== 201) {
        showToast({
          type: "error",
          title: "Failed to upload cover photo. Please try again.",
        });
        return;
      }

      // Confirm upload
      const res = await axiosInstance.post("/gym_profile/confirm", {
        cdn_url,
        gym_id: gym_id,
        scope: "cover_pic",
      });

      if (res?.status === 200) {
        await getProfileData();
        showToast({
          type: "success",
          title: "Cover photo updated successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to upload cover photo. Please try again.",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Edit Data
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    contact_number: "",
    dob: "",
    age: "",
    // Gym data
    gymName: "",
    location: "",
    // Payment data
    account_number: "",
    account_holdername: "",
    account_ifsccode: "",
    account_branch: "",
    account_id: "",
    upi_id: "",
    gst_number: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dob, setDob] = useState(null);

  const handleEditPress = () => {
    setEditData({
      name: personalDetails.find((item) => item.key === "name")?.value || "",
      email: personalDetails.find((item) => item.key === "email")?.value || "",
      contact_number:
        personalDetails.find((item) => item.key === "contact_number")?.value ||
        "",
      dob: personalDetails.find((item) => item.key === "dob")?.value || "",
      // Gym data
      gymName: gymDetails.find((item) => item.key === "gymName")?.value || "",
      location: gymDetails.find((item) => item.key === "location")?.value || "",
      // Payment data
      account_number:
        paymentDetails.find((item) => item.key === "account_number")?.value ||
        "",
      account_holdername:
        paymentDetails.find((item) => item.key === "account_holdername")
          ?.value || "",
      account_ifsccode:
        paymentDetails.find((item) => item.key === "account_ifsccode")?.value ||
        "",
      account_branch:
        paymentDetails.find((item) => item.key === "account_branch")?.value ||
        "",
      account_id:
        paymentDetails.find((item) => item.key === "account_id")?.value || "",
      upi_id: paymentDetails.find((item) => item.key === "upi_id")?.value || "",
      gst_number:
        paymentDetails.find((item) => item.key === "gst_number")?.value || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = async () => {
    try {
      const owner_id = await getToken("owner_id");
      if (!owner_id) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
        return;
      }
      if (!gymID) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
        return;
      }

      // Format date to SQL format if needed
      let formattedDob = editData.dob;
      if (editData.dob && editData.dob.includes("/")) {
        const [day, month, year] = editData.dob.split("/");
        formattedDob = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      }

      const owner_data = {
        name: editData.name,
        email: editData.email,
        contact_number: editData.contact_number,
        dob: formattedDob,
      };

      const gym_data = {
        gym_id: gymID,
        gymName: editData.gymName,
        location: editData.location,
        account_number: editData.account_number,
        account_holdername: editData.account_holdername,
        account_ifsccode: editData.account_ifsccode,
        account_branch: editData.account_branch,
        account_id: accountID,
        upi_id: editData.upi_id,
        gst_number: editData.gst_number,
      };

      const payload = {
        owner_id,
        method: "profile",
        role: "owner",
        owner_data: owner_data,
        gym_data: gym_data,
      };

      const response = await updateProfileAPI(payload);
      if (response?.status === 200) {
        if (response?.is_changed) {
          router.push("/");
        }
        showToast({
          type: "success",
          title: "Profile updated successfully",
        });
        setIsEditing(false);
        await getProfileData();
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update profile",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating profile",
      });
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmNewPassword
    ) {
      showToast({
        type: "error",
        title: "Please fill all the fields",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToast({
        type: "error",
        title: "New passwords do not match",
      });
      return;
    }

    const owner_id = await getToken("owner_id");
    delete passwordData.confirmNewPassword;
    const payload = {
      ...passwordData,
      role: "owner",
      method: "password",
      owner_id: owner_id,
    };

    try {
      const response = await updateProfileAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Password changed successfully",
        });
        setPasswordModalVisible(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to change password",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong. Please try again later",
      });
    }
  };

  const getGymLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== "granted") {
        setIsLocationLoading(false);

        if (!canAskAgain) {
          Alert.alert(
            "Permission Blocked",
            "Location access has been blocked. Please enable it manually from your phone's settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ]
          );
        } else {
          showToast({
            type: "error",
            title:
              "Location permission is required to set your gym's location.",
          });
        }

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setIsLocationLoading(false);
      return location.coords;
    } catch (error) {
      setIsLocationLoading(false);
      showToast({
        type: "error",
        title: "Could not get your current location. Please try again.",
      });
    }
  };

  const updateGymLocation = async () => {
    try {
      setIsLocationLoading(true);
      const coords = await getGymLocation();
      if (!coords) {
        setIsLocationLoading(false);
        return;
      }

      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setIsLocationLoading(false);
        return;
      }

      const payload = {
        gym_id: gymId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const response = await changeGymLocationAPI(payload);
      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Your gym location has been updated!",
        });
      } else {
        showToast({
          type: "error",
          title: response.detail || "Failed to update location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating your gym location",
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleGymChangeRouting = async () => {
    router.push({
      pathname: "/owner/selectgym",
      params: {
        gyms: JSON.stringify(gymList),
        owner_id: await getToken("owner_id"),
        access_token: await getToken("access_token"),
        refresh_token: await getToken("refresh_token"),
        name: await getToken("name"),
      },
    });
  };

  const getProfileData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "Something went wrong, please try again later.",
        });
        return;
      }

      const response = await getProfileDataAPI(gymId, ownerId, null, "owner");
      console.log(response);
      let { name, email, contact_number, dob, age } =
        response?.data?.owner_data;
      setGymData(response?.data?.gym_data);
      setGymList(response?.data?.gyms);
      setGymCount(response?.data?.gyms_count);
      setProfileData(response?.data?.owner_data);

      let {
        gym_id,
        name: gymName,
        location,
        total_members,
        account_number,
        account_holdername,
        account_ifsccode,
        account_branch,
        account_id,
        upi_id,
        gst_number,
        logo,
      } = response?.data?.gym_data;

      await saveToken("gym_logo", logo ? logo : "");

      setGymID(gym_id);
      setaccountID(account_id);

      const personalDetailsData = [
        {
          id: 0,
          icon: "person-outline",
          label: "Name",
          key: "name",
          value: name,
        },
        {
          id: 1,
          icon: "mail-outline",
          label: "Email",
          key: "email",
          value: email,
        },
        {
          id: 2,
          icon: "call-outline",
          label: "Contact Number",
          key: "contact_number",
          value: contact_number,
        },
        {
          id: 3,
          icon: "calendar-outline",
          label: "Date of Birth",
          key: "dob",
          value: dob,
        },
        {
          id: 4,
          icon: "hourglass-outline",
          label: "Age",
          key: "age",
          value: age,
        },
      ];

      const gymDetailsData = [
        {
          key: "gymName",
          label: "Name",
          icon: "business-outline",
          value: gymName,
        },
        {
          key: "location",
          label: "Location",
          icon: "location-outline",
          value: location,
        },
        {
          key: "total_members",
          label: "Total Members",
          icon: "accessibility-outline",
          value: total_members,
        },
      ];

      const paymentDetailsData = [
        {
          icon: "apps-outline",
          label: "Account No.",
          key: "account_number",
          value: account_number || "Not Added",
        },
        {
          icon: "person-outline",
          label: "Account Holder Name",
          key: "account_holdername",
          value: account_holdername || "Not Added",
        },
        {
          icon: "card-outline",
          label: "UPI ID",
          key: "upi_id",
          value: upi_id || "Not Added",
        },
        {
          icon: "barcode-outline",
          label: "IFSC",
          key: "account_ifsccode",
          value: account_ifsccode || "Not Added",
        },
        {
          icon: "git-branch-outline",
          label: "Branch",
          key: "account_branch",
          value: account_branch || "Not Added",
        },
        {
          icon: "git-branch-outline",
          label: "GST No.",
          key: "gst_number",
          value: gst_number || "Not Added",
        },
      ];

      if (response?.status === 200) {
        setProfileData(response?.data);
        setPersonalDetails(personalDetailsData);
        setGymDetails(gymDetailsData);
        setPaymentDetails(paymentDetailsData);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getProfileData();
    }, [])
  );

  const renderPersonalDetailsTab = () => {
    if (isEditing) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={editData.name}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editData.contact_number}
              onChangeText={(text) =>
                setEditData({ ...editData, contact_number: text })
              }
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email ID</Text>
            <TextInput
              style={styles.input}
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {editData.dob || "Select Date of Birth"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#777" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dob ? new Date(dob) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate && event.type !== "dismissed") {
                    const day = String(selectedDate.getDate()).padStart(2, "0");
                    const month = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const year = selectedDate.getFullYear();
                    const formattedDate = `${year}-${month}-${day}`;
                    setDob(selectedDate);
                    setEditData({ ...editData, dob: formattedDate });
                  }
                }}
              />
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {personalDetails.map((item, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={item.icon} size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        ))}

        <View style={styles.actionsContainer}>
          <View style={styles.compactButtonsRow}>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.compactActionButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.compactActionButton,
                { backgroundColor: "#34495e" },
              ]}
              onPress={() => setPasswordModalVisible(true)}
            >
              <Ionicons name="key-outline" size={16} color="#fff" />
              <Text style={styles.compactActionButtonText}>
                Change Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderGymDetailsTab = () => {
    if (isEditing) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gym Name</Text>
            <TextInput
              style={styles.input}
              value={editData.gymName}
              onChangeText={(text) =>
                setEditData({ ...editData, gymName: text })
              }
              placeholder="Enter your gym name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editData.location}
              onChangeText={(text) =>
                setEditData({ ...editData, location: text })
              }
              placeholder="Enter gym location"
            />
          </View>

          <View style={styles.locationButtonContainer}>
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={updateGymLocation}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="locate" size={16} color="#fff" />
                  <Text style={styles.updateLocationText}>
                    Update Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {gymCount > 1 && (
          <TouchableOpacity
            style={styles.switchGymButton}
            onPress={handleGymChangeRouting}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
            <Text style={styles.switchGymText}>Switch Gym</Text>
          </TouchableOpacity>
        )}

        {gymDetails.map((item, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={item.icon} size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        ))}

        <View style={styles.actionsContainer}>
          <View style={styles.compactButtonsRow}>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.compactActionButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.compactActionButton,
                { backgroundColor: "#34495e" },
              ]}
              onPress={updateGymLocation}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={16} color="#fff" />
                  <Text style={styles.compactActionButtonText}>
                    Update Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentDetailsTab = () => {
    if (isEditing) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={editData.account_number}
              onChangeText={(text) =>
                setEditData({ ...editData, account_number: text })
              }
              keyboardType="numeric"
              placeholder="Enter account number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              value={editData.account_holdername}
              onChangeText={(text) =>
                setEditData({ ...editData, account_holdername: text })
              }
              placeholder="Enter account holder name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={editData.account_ifsccode}
              onChangeText={(text) =>
                setEditData({ ...editData, account_ifsccode: text })
              }
              placeholder="Enter IFSC code"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Branch</Text>
            <TextInput
              style={styles.input}
              value={editData.account_branch}
              onChangeText={(text) =>
                setEditData({ ...editData, account_branch: text })
              }
              placeholder="Enter branch name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI ID</Text>
            <TextInput
              style={styles.input}
              value={editData.upi_id}
              onChangeText={(text) =>
                setEditData({ ...editData, upi_id: text })
              }
              placeholder="Enter UPI ID"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>GST Number</Text>
            <TextInput
              style={styles.input}
              value={editData.gst_number}
              onChangeText={(text) =>
                setEditData({ ...editData, gst_number: text })
              }
              placeholder="Enter GST number"
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {paymentDetails.map((item, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={item.icon} size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        ))}

        {/* {paymentDetails.find(item => item.key === 'upi_id')?.value && ( 
          <View style={styles.upiQRContainer}>
            <Text style={styles.upiQRTitle}>UPI QR Code</Text>
            <UpiQRCode 
              upi_id={paymentDetails.find(item => item.key === 'upi_id')?.value} 
              account_holdername={paymentDetails.find(item => item.key === 'account_holdername')?.value} 
            />
          </View>
        )}*/}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleEditPress}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.compactActionButtonText}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalDetailsTab();
      case "gym":
        return renderGymDetailsTab();
      case "payment":
        return renderPaymentDetailsTab();
      default:
        return renderPersonalDetailsTab();
    }
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/owner/home")}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.gymCoverContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            handleImageClick(
              gymData?.cover_pic
                ? { uri: gymData.cover_pic }
                : require("../../assets/images/offer.jpg")
            )
          }
        >
          <ImageBackground
            source={
              gymData?.cover_pic
                ? { uri: gymData.cover_pic }
                : require("../../assets/images/offer.jpg")
            }
            style={styles.coverPhoto}
            contentPosition="top"
            contentFit="contain"
          >
            <View style={styles.gymProfileHeader}>
              <View style={styles.gymAvatarContainer}>
                <TouchableOpacity
                  onPress={() =>
                    handleImageClick(
                      gymData?.logo
                        ? { uri: gymData.logo }
                        : require("../../assets/images/header/gym_logo.png")
                    )
                  }
                >
                  <Image
                    source={
                      gymData?.logo
                        ? { uri: gymData.logo }
                        : require("../../assets/images/header/gym_logo.png")
                    }
                    style={styles.gymAvatarImage}
                  />
                </TouchableOpacity>

                {/* Logo edit icon */}
                <TouchableOpacity
                  style={styles.logoEditButton}
                  onPress={() => setLogoUploadModalVisible(true)}
                  disabled={isUploadingLogo}
                >
                  <View style={styles.logoEditIconBackground}>
                    {isUploadingLogo ? (
                      <Ionicons
                        name="hourglass-outline"
                        size={12}
                        color="white"
                      />
                    ) : (
                      <Ionicons name="pencil" size={12} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cover photo edit icon */}
            <TouchableOpacity
              style={styles.coverEditButton}
              onPress={() => setCoverUploadModalVisible(true)}
              disabled={isUploadingCover}
            >
              <View style={styles.coverEditIconBackground}>
                {isUploadingCover ? (
                  <Ionicons name="hourglass-outline" size={16} color="white" />
                ) : (
                  <Ionicons name="pencil" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </ImageBackground>
        </TouchableOpacity>
      </View>
      <Text style={styles.gymProfileName}>
        {gymData?.name || profileData?.gym_data?.name}
      </Text>

      {!isEditing ? (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "personal" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("personal")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "personal" && styles.activeTabText,
              ]}
            >
              Personal Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "gym" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("gym")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "gym" && styles.activeTabText,
              ]}
            >
              Gym Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "payment" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("payment")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "payment" && styles.activeTabText,
              ]}
            >
              Payment Details
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.editingHeaderContainer}>
          <Text style={styles.editingHeaderText}>
            {activeTab === "personal"
              ? "Edit Personal Details"
              : activeTab === "gym"
              ? "Edit Gym Details"
              : "Edit Payment Details"}
          </Text>
        </View>
      )}

      <ScrollView style={styles.contentContainer}>
        {renderActiveTabContent()}
      </ScrollView>

      {isEditing && (
        <View style={styles.editActionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleEditSubmit}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All Modals */}
      <FullImageModal
        isVisible={isFullImageModalVisible}
        imageSource={fullImageSource}
        onClose={() => setFullImageModalVisible(false)}
      />

      {/* New Upload Modals */}
      <ImageUploadModal
        isVisible={isLogoUploadModalVisible}
        onClose={() => setLogoUploadModalVisible(false)}
        onImageSelect={handleLogoUpload}
        title="Upload Gym Logo"
        aspectRatio={[1, 1]} // Square aspect ratio for logo
      />

      <ImageUploadModal
        isVisible={isCoverUploadModalVisible}
        onClose={() => setCoverUploadModalVisible(false)}
        onImageSelect={handleCoverUpload}
        title="Upload Cover Photo"
        aspectRatio={[16, 9]} // Wide aspect ratio for cover
      />

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPasswordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.passwordModalContainer}>
            <View style={styles.passwordModalHeader}>
              <Text style={styles.passwordModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordInputLabel}>Current Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  secureTextEntry={!showOldPassword}
                  value={passwordData.oldPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, oldPassword: text }))
                  }
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Ionicons
                    name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordInputLabel}>New Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: text }))
                  }
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordInputLabel}>
                Confirm New Password
              </Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  value={passwordData.confirmNewPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmNewPassword: text,
                    }))
                  }
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveChangesButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.saveChangesText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 30,
  },
  profileHeader: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    overflow: "hidden",
  },
  gymCoverContainer: {
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e1e1e1",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  editAvatarIconBackground: {
    backgroundColor: "#3498db",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#777",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  tabContent: {
    padding: 15,
  },
  detailItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  switchGymButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 15,
  },
  switchGymText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  actionsContainer: {
    marginTop: 15,
    gap: 10,
  },
  compactButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  compactActionButton: {
    backgroundColor: "#3498db",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  compactActionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  editingHeaderContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    alignItems: "center",
  },
  editingHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  editActionsContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    padding: 20,
    maxHeight: "80%",
  },
  passwordModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  passwordInputContainer: {
    marginBottom: 15,
  },
  passwordInputLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  saveChangesButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveChangesText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  locationButtonContainer: {
    marginTop: 10,
  },
  updateLocationButton: {
    backgroundColor: "#3498db",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateLocationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  upiQRContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upiQRTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  gymProfileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  gymAvatarContainer: {
    position: "relative",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gymAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#fff",
  },
  gymProfileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    paddingVertical: 10,
  },
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  // New styles for image upload modal
  imageUploadModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    padding: 20,
  },
  uploadOptionsContainer: {
    paddingVertical: 20,
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  uploadOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  uploadOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  // New styles for edit buttons on gym images
  logoEditButton: {
    position: "absolute",
    bottom: -5,
    right: -5,
  },
  logoEditIconBackground: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  coverEditButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  coverEditIconBackground: {
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
});

export default OwnerProfile;
