import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  SafeAreaView,
  Modal,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import {
  addTrainerAPI,
  updateTrainerAPI,
  getTrainersAPI,
  deleteTrainerAPI,
} from "../../services/Api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import FitnessLoader from "../../components/ui/FitnessLoader";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import TabHeader from "../../components/home/finances/TabHeader";
import { showToast } from "../../utils/Toaster";
import NoDataComponent from "../../utils/noDataComponent";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import axiosInstance from "../../services/axiosInstance";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const AddTrainerScreen = () => {
  const [form, setForm] = useState({
    id: null,
    fullName: "",
    gender: "Male",
    contact: "",
    email: "",
    specialization: "",
    experience: "",
    certifications: "",
    availability: "Full-Time",
    profileImage: null,
  });

  const router = useRouter();
  const [showTrainersList, setShowTrainersList] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("view_trainers");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [optionsPosition, setOptionsPosition] = useState({ top: 0, right: 0 });
  const [imageUploadModalVisible, setImageUploadModalVisible] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
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
      const response = await getTrainersAPI(gymId);
      if (response?.status === 200) {
        setTrainers(response.data.trainers);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching trainers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (imageAsset) => {
    if (imageAsset && imageAsset.uri) {
      setImageUploading(true);
      try {
        const imageUri = imageAsset.uri;
        const uriParts = imageUri?.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileNameParts = fileName.split(".");
        const extension =
          fileNameParts.length > 1
            ? fileNameParts[fileNameParts.length - 1]
            : "";

        const gym_id = await getToken("gym_id");
        if (!gym_id) {
          showToast({
            type: "error",
            title: "Gym ID not found",
          });
          return;
        }

        showToast({
          type: "info",
          title: "Uploading image...",
        });

        const { data: uploadResp } = await axiosInstance.get(
          "/trainers/upload-url",
          {
            params: {
              gym_id: gym_id,
              extension: extension,
              scope: "profile_image",
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

        const s3Resp = await fetch(upload.url, {
          method: "POST",
          body: form,
        });

        if (s3Resp.status !== 204 && s3Resp.status !== 201) {
          showToast({
            type: "error",
            title: "Failed to upload image. Please try again.",
          });
          return;
        }

        const res = await axiosInstance.post("/trainers/confirm", {
          cdn_url,
          gym_id: gym_id,
          scope: "profile_image",
        });

        if (res?.status === 200) {
          handleInputChange("profileImage", cdn_url);

          showToast({
            type: "success",
            title: "Image uploaded successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Failed to confirm upload. Please try again.",
          });
        }
      } catch (error) {
        console.error("Image upload error:", error);

        let errorMessage = "Failed to upload image. Please try again.";

        if (error.response) {
          errorMessage =
            error.response.data?.detail ||
            error.response.data?.message ||
            errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }

        showToast({
          type: "error",
          title: errorMessage,
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const showImagePickerOptions = () => {
    if (imageUploading) {
      showToast({
        type: "info",
        title: "Please wait for current upload to complete",
      });
      return;
    }
    setImageUploadModalVisible(true);
  };

  const removeImage = () => {
    if (imageUploading) {
      showToast({
        type: "info",
        title: "Cannot remove image while uploading",
      });
      return;
    }

    Alert.alert(
      "Remove Picture",
      "Are you sure you want to remove the profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleInputChange("profileImage", null),
        },
      ]
    );
  };

  const handleOptionsPress = (item, event) => {
    setSelectedItemForOptions(item);
    const { pageX, pageY } = event.nativeEvent;

    setOptionsPosition({
      top: pageY + 20,
      right: 50,
    });

    setOptionsVisible(true);
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const resetForm = () => {
    setForm({
      id: null,
      fullName: "",
      gender: "Male",
      contact: "",
      email: "",
      specialization: "",
      experience: "",
      certifications: "",
      availability: "Full-Time",
      profileImage: null,
    });
    setIsEditing(false);
    setActiveTab("view_trainers");
  };

  const handleEdit = (trainer) => {
    setForm({
      trainer_id: trainer.trainer_id,
      fullName: trainer.full_name,
      gender: trainer.gender,
      contact: trainer.contact,
      email: trainer.email,
      specialization: trainer.specialization,
      experience: trainer?.experience?.toString() || 0,
      certifications: trainer.certifications,
      availability: trainer.availability,
      profileImage: trainer.profile_image,
    });
    setIsEditing(true);
    setShowTrainersList(false);
  };

  const handleDelete = async (trainerId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this trainer?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const gym_id = await getToken("gym_id");

              if (!gym_id) {
                showToast({
                  type: "error",
                  title: "Gym Id is not there",
                });
                return;
              }
              const response = await deleteTrainerAPI(trainerId, gym_id);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Trainer deleted successfully!",
                });
                setShowTrainersList(false);
                fetchTrainers();
              } else {
                showToast({
                  type: "error",
                  title: "Failed to delete trainer.",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "An error occurred while deleting trainer.",
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const submitForm = async () => {
    if (!form.fullName || !form.contact || !form.specialization) {
      showToast({
        type: "error",
        title: "Please fill all mandatory fields.",
      });
      return;
    }

    if (imageUploading) {
      showToast({
        type: "info",
        title: "Please wait for image upload to complete.",
      });
      return;
    }

    try {
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym Id is not there",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        full_name: form.fullName,
        gender: form.gender,
        contact: form.contact,
        email: form.email,
        specialization: form.specialization,
        experience: form.experience || 0,
        certifications: form.certifications,
        availability: form.availability,
        profile_image: form.profileImage,
        trainer_id: form.trainer_id,
      };

      const response = isEditing
        ? await updateTrainerAPI(payload)
        : await addTrainerAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditing
            ? "Trainer updated successfully!"
            : "Trainer added successfully!",
        });

        resetForm();
        Keyboard.dismiss();
        await fetchTrainers();
        setActiveTab("view_trainers");
      } else {
        let errorMessage = "Failed to save trainer";

        if (response?.detail) {
          errorMessage = response.detail;
        } else if (!isEditing) {
          errorMessage = "Failed to add trainer";
        } else {
          errorMessage = "Failed to update trainer";
        }

        showToast({
          type: "error",
          title: errorMessage,
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);

      let errorMessage = "An error occurred";

      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const handleEditPress = (item) => {
    setOptionsVisible(false);
    handleEdit(item);
    setActiveTab("add_trainer");
  };

  const handleDeletePress = (item) => {
    setOptionsVisible(false);
    handleDelete(item.trainer_id);
  };

  const renderOptionsDropdown = () => {
    if (!optionsVisible) {
      return null;
    }

    return (
      <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
        <View style={styles.optionsOverlay}>
          <View
            style={[
              styles.optionsContainer,
              {
                position: "absolute",
                top: optionsPosition.top,
                right: optionsPosition.right,
                zIndex: 1001,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleEditPress(selectedItemForOptions)}
            >
              <MaterialIcons name="edit" size={18} color="#333" />
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleDeletePress(selectedItemForOptions)}
            >
              <MaterialIcons name="delete" size={18} color="#FF5757" />
              <Text style={[styles.optionText, { color: "#FF5757" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const TrainerListModal = ({ item }) => (
    <ScrollView
      style={styles.innerContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
      {trainers.length ? (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {trainers?.map((trainer) => (
              <View key={trainer.trainer_id} style={styles.trainerCard}>
                <View style={styles.trainerInfo}>
                  <View style={styles.trainerImageContainer}>
                    {trainer.profile_image ? (
                      <Image
                        source={{ uri: trainer.profile_image }}
                        style={styles.trainerImage}
                      />
                    ) : (
                      <View style={styles.trainerImagePlaceholder}>
                        <Text style={styles.trainerInitials}>
                          {trainer.full_name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.trainerDetails}>
                    <Text style={styles.trainerName}>{trainer.full_name}</Text>
                    <Text style={styles.trainerSpecialization}>
                      {trainer.specialization}
                    </Text>
                    <Text style={styles.trainerContact}>{trainer.contact}</Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0)",
                      padding: 10,
                      paddingRight: 4,
                    }}
                    onPress={(event) => handleOptionsPress(trainer, event)}
                  >
                    <Ionicons size={16} name="ellipsis-vertical" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 50 }}>
          <NoDataComponent
            icon={"user"}
            title={"No Trainers Available"}
            message="Looks like there is no data here yet."
            buttonText={"Add Trainer"}
            onButtonPress={() => setActiveTab("add_trainer")}
          />
        </View>
      )}
    </ScrollView>
  );

  const ImageUploadModal = ({
    isVisible,
    onClose,
    onImageSelect,
    title,
    aspectRatio = [1, 1],
  }) => {
    const selectImage = async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          showToast({
            type: "error",
            title:
              "Please allow access to your photo library to upload images.",
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
              <TouchableOpacity
                style={[
                  styles.uploadOption,
                  imageUploading && styles.disabledOption,
                ]}
                onPress={selectImage}
                disabled={imageUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="images-outline" size={24} color="#3498db" />
                </View>
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                {imageUploading && (
                  <ActivityIndicator size="small" color="#3498db" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadOption,
                  imageUploading && styles.disabledOption,
                ]}
                onPress={takePhoto}
                disabled={imageUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="camera-outline" size={24} color="#3498db" />
                </View>
                <Text style={styles.uploadOptionText}>Take Photo</Text>
                {imageUploading && (
                  <ActivityIndicator size="small" color="#3498db" />
                )}
              </TouchableOpacity>
            </View>

            {imageUploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.uploadingText}>Uploading image...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const tabs = [
    { id: "view_trainers", label: "View Trainers", icon: "" },
    {
      id: "add_trainer",
      label: isEditing ? "Update Trainer Details" : "Add Trainer",
      icon: "",
    },
  ];

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Manage Trainers"}
      />

      <TabHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "view_trainers" && <TrainerListModal />}

      {activeTab === "add_trainer" && (
        <ScrollView
          style={styles.innerContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Picture (Optional)</Text>
              <View style={styles.imageContainer}>
                {form.profileImage ? (
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: form.profileImage }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                    {!imageUploading && (
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeImage}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF5757"
                        />
                      </TouchableOpacity>
                    )}
                    {imageUploading && (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.uploadOverlayText}>
                          Uploading...
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.imagePlaceholderContainer,
                      imageUploading && styles.disabledPlaceholder,
                    ]}
                    onPress={showImagePickerOptions}
                    disabled={imageUploading}
                  >
                    {imageUploading ? (
                      <>
                        <ActivityIndicator size={30} color="#007AFF" />
                        <Text style={styles.imagePlaceholder}>
                          Uploading image...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="camera" size={30} color="#A0A0A0" />
                        <Text style={styles.imagePlaceholder}>
                          Tap to add profile picture
                        </Text>
                        <Text style={styles.imageAspectText}>
                          (1:1 ratio recommended)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {form.profileImage && !imageUploading && (
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={showImagePickerOptions}
                  >
                    <Ionicons name="camera" size={16} color="#007AFF" />
                    <Text style={styles.changeImageText}>Change Picture</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#a0a0a0"
                value={form.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender*</Text>
              <View style={styles.radioGroup}>
                {["Male", "Female", "Other"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioButton,
                      form.gender === option && styles.radioSelected,
                    ]}
                    onPress={() => handleInputChange("gender", option)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        form.gender === option && styles.radioTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                placeholderTextColor="#a0a0a0"
                keyboardType="phone-pad"
                value={form.contact}
                onChangeText={(value) => handleInputChange("contact", value)}
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#a0a0a0"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(value) => handleInputChange("email", value)}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialization*</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Strength Training"
                placeholderTextColor="#a0a0a0"
                value={form.specialization}
                onChangeText={(value) =>
                  handleInputChange("specialization", value)
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience (in years)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter years of experience"
                placeholderTextColor="#a0a0a0"
                keyboardType="phone-pad"
                maxLength={2}
                value={form.experience}
                onChangeText={(value) => handleInputChange("experience", value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Certifications</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter certifications"
                placeholderTextColor="#a0a0a0"
                value={form.certifications}
                onChangeText={(value) =>
                  handleInputChange("certifications", value)
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Availability</Text>
              <View style={styles.pickerContainerWithIcon}>
                <RNPickerSelect
                  value={form.availability}
                  onValueChange={(value) =>
                    handleInputChange("availability", value)
                  }
                  pickerProps={{
                    itemStyle: {
                      color: "#000000",
                    },
                  }}
                  style={pickerSelectStyles}
                  items={[
                    { label: "Full-Time", value: "Full-Time" },
                    { label: "Part-Time", value: "Part-Time" },
                    { label: "Freelance", value: "Freelance" },
                  ]}
                  placeholder={{ label: "Select Availability", value: null }}
                  Icon={() => (
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#666666"
                    />
                  )}
                  useNativeAndroidPickerStyle={false}
                  fixAndroidTouchableBug={true}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isEditing && styles.updateButton,
                imageUploading && styles.disabledButton,
              ]}
              onPress={submitForm}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing
                    ? "Update Trainer Details"
                    : "Submit Trainer Details"}
                </Text>
              )}
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  imageUploading && styles.disabledButton,
                ]}
                onPress={resetForm}
                disabled={imageUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {renderOptionsDropdown()}

      <ImageUploadModal
        isVisible={imageUploadModalVisible}
        onClose={() => setImageUploadModalVisible(false)}
        onImageSelect={handleImageSelect}
        title="Select Profile Picture"
        aspectRatio={[1, 1]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    marginTop: 15,
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
  imageContainer: {
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: height * 0.01,
  },
  profileImage: {
    width: width * 0.6,
    height: width * 0.6 * (9 / 16),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadOverlayText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholderContainer: {
    width: width * 0.5,
    height: width * 0.5 * (1 / 1),
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D0D0D0",
    marginBottom: height * 0.01,
  },
  disabledPlaceholder: {
    backgroundColor: "#F0F0F0",
    borderColor: "#C0C0C0",
  },
  imagePlaceholder: {
    color: "#A0A0A0",
    textAlign: "center",
    fontSize: width * 0.035,
    marginTop: 8,
    fontWeight: "500",
  },
  imageAspectText: {
    color: "#C0C0C0",
    textAlign: "center",
    fontSize: width * 0.03,
    marginTop: 4,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  changeImageText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: width * 0.01,
    borderRadius: 10,
    backgroundColor: "#F1F4F8",
    marginHorizontal: width * 0.01,
    alignItems: "center",
  },
  radioSelected: {
    backgroundColor: "#007AFF",
  },
  radioText: {
    color: "#2C3E50",
    fontSize: 16,
  },
  radioTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#F1F4F8",
    borderRadius: 10,
  },
  pickerContainerWithIcon: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: height * 0.07,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0.1,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  headerContainer: {
    paddingHorizontal: width * 0.05,
    marginVertical: height * 0.02,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-end",
  },
  viewAllButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  modalContent: {
    width: width * 0.9,
    height: Platform.OS === "ios" ? height * 1 : height * 1.1,
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#FF5757",
  },
  closeButton: {
    padding: 5,
  },
  trainersList: {
    flex: 1,
  },
  trainerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trainerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  trainerImageContainer: {
    marginRight: width * 0.04,
  },
  trainerImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
  },
  trainerImagePlaceholder: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: "100%",
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  trainerInitials: {
    color: "#FFFFFF",
    fontSize: width * 0.05,
    fontWeight: "700",
  },
  trainerDetails: {
    flex: 1,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 3,
  },
  trainerSpecialization: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  trainerContact: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: height * 0.015,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: 6,
    marginLeft: width * 0.02,
  },
  actionButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#E74C3C",
  },
  updateButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#95A5A6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: height * 0.02,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: height * 0.02,
  },

  optionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  optionsContainer: {
    width: responsiveWidth(35),
    backgroundColor: "#FFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(3),
  },
  optionText: {
    fontSize: responsiveFontSize(14),
    color: "#333",
    marginLeft: responsiveWidth(2),
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    width: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageUploadModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: width * 0.85,
    maxWidth: 400,
  },
  passwordModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  uploadOptionsContainer: {
    gap: 15,
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  disabledOption: {
    backgroundColor: "#F0F0F0",
    borderColor: "#D0D0D0",
    opacity: 0.6,
  },
  uploadOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    flex: 1,
  },
  uploadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    marginTop: 15,
  },
  uploadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    fontWeight: "500",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0,
    borderRadius: 8,
    color: "#2C3E50",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: 45,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
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

export default AddTrainerScreen;
