import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");
import AsyncStorage from "@react-native-async-storage/async-storage";
import CreateTemplateModal from "../../../components/Diet/createTemplateModal";
import { FlatList } from "react-native-gesture-handler";
import TemplateFoodCard from "../../../components/Diet/TemplateFoodCard";
import GradientButton from "../../../components/ui/GradientButton";

import EditTemplateNameModal from "../../../components/Diet/EditTemplateNameModal";
import { showToast } from "../../../utils/Toaster";
import EmptyStateCard from "../../../components/workout/EmptyDataComponent";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import {
  addDietTemplateAPI,
  deleteDietTemplateAPI,
  editAllDietTemplateAPI,
  editDietTemplateAPI,
  getDietTemplateAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import Icon from "react-native-vector-icons/MaterialIcons";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const mockData = [
  {
    id: "1",
    title: "Early Morning Detox",
    timeRange: "6:00 am - 7:00 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "2",
    title: "Pre-Breakfast / Pre-Meal Starter",
    timeRange: "7:30 am - 8:00 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "3",
    title: "Breakfast",
    timeRange: "8:00 am - 9:30 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "4",
    title: "Mid-Morning Snack",
    timeRange: "10:30 am - 11:30 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "5",
    title: "Lunch",
    timeRange: "12:30 pm - 2:00 pm",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "6",
    title: "Evening Snack",
    timeRange: "4:00 pm - 6:00 pm",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "7",
    title: "Dinner",
    timeRange: "7:00 pm - 8:30 pm",
    foodList: [],
    itemsCount: 0,
  },
];

const personalTemplate = (props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateTemplateModal, setOpenCreateTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [templateId, setTemplateId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTemp, setEditTemp] = useState(null);
  const [editModal, setEditModal] = useState(false);

  const method = "personal";

  const getTemplates = async () => {
    setIsLoading(true);
    const gymId = await getToken("gym_id");
    try {
      const response = await getDietTemplateAPI(gymId);
      if (response?.status === 200) {
        setTemplates(response?.data);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  const editTemplate = (template) => {
    setEditId(template.id);
    setEditTemp(template.name);
    setEditModal(true);
  };

  const deleteTemplate = (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this template?",
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
                  title: "GymId is not available",
                });
                return;
              }
              const response = await deleteDietTemplateAPI(id, gym_id);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Template deleted successfully",
                });
                getTemplates();
              } else {
                showToast({
                  type: "error",
                  title: response?.detail,
                });
              }
            } catch (error) {
              const errorMessage = "Something went wrong, please try again.";
              showToast({
                type: "error",
                title: errorMessage,
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEditName = async () => {
    if (!newTemplateName.trim()) {
      showToast({
        type: "error",
        title: "Please enter a template name",
      });
      return;
    }

    if (newTemplateName.trim()) {
      const payload = {
        id: templateId,
        template_name: newTemplateName,
      };

      try {
        const response = await editDietTemplateAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: response?.message,
          });
          await getTemplates();
          setEditNameModalVisible(false);
          setNewTemplateName("");
        } else {
          showToast({
            type: "error",
            title:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
      }
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Please enter a template name",
      });
      return;
    }

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
        name: templateName,
        dietPlan: {
          variant1: mockData,
          variant2: mockData,
          variant3: mockData,
          variant4: mockData,
          variant5: mockData,
        },
        gym_id: gymId,
      };

      const response = await addDietTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Template created successfully",
        });
        getTemplates();
        setModalVisible(false);
        setTemplateName("");
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: error || errorMessage,
      });
    }
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler
          routePath="/owner/manageNutritionAndWorkoutTemplate"
          enabled={true}
        />

        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            method === "personal"
              ? router.push("/owner/manageNutritionAndWorkoutTemplate")
              : router.push("/owner/manageNutritionAndWorkoutTemplate");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {method === "personal" ? "Gym Diet Plans" : "Trainer Template"}
          </Text>
        </TouchableOpacity>

        {templates?.length === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() => setModalVisible(!modalVisible)}
            buttonText={"Start Fresh"}
            message={
              "Looks like you have not created any template yet!\nTap below to create your diet templates and assign to clients"
            }
            belowButtonText={""}
            onButtonPress2={() => {}}
          />
        )}

        <View style={{ flex: 1 }}>
          {templates?.map((template, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={styles.templateButton}
                onPress={() => {
                  router.push({
                    pathname: "/owner/dietVariant",
                    params: {
                      templateId: template.id,
                    },
                  });
                }}
              >
                <View style={{ flexDirection: "column" }}>
                  <Text style={styles.templateButtonText}>{template.name}</Text>
                  <Text style={styles.variantText}>
                    No. of Variants: {Object.keys(template.dietPlan).length}
                  </Text>
                </View>

                <View style={styles.actionTemplates}>
                  <TouchableOpacity
                    onPress={() => {
                      editTemplate(template);
                      setTemplateName(template.name);
                    }}
                    style={{
                      padding: 10,
                      backgroundColor: "rgba(40, 167, 70, 0.10)",
                      borderRadius: "100%",
                    }}
                  >
                    <Icon name="edit" size={20} color="#28A745" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteTemplate(template.id)}
                    style={{
                      padding: 10,
                      backgroundColor: "rgba(220, 53, 70, 0.1)",
                      borderRadius: "100%",
                    }}
                  >
                    <Icon name="delete" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginBottom: 0 }}>
          <GradientButton
            title="Add Templates"
            fromColor="#28A745"
            toColor="#007BFF"
            mainContainerStyle={{
              width: "100%",
              backgroundColor: "pink",
              alignItems: "flex",
            }}
            containerStyle={{
              marginTop: 0,
              width: "100%",
              paddingVertical: 18,
            }}
            textStyle={{ fontSize: 12 }}
            onPress1={() =>
              // setOpenCreateTemplateModal(!openCreateTemplateModal)
              setModalVisible(!modalVisible)
            }
          />
        </View>

        <CreateTemplateModal
          onClose={() => setOpenCreateTemplateModal(!openCreateTemplateModal)}
          value={templateName}
          visible={openCreateTemplateModal}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={() => {
            if (templateName) {
              router.push({
                pathname: "/owner/dietVariant",
                params: { templateTitle: templateName, method: method },
              });
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
        />

        <CreateTemplateModal
          onClose={() => setModalVisible(!modalVisible)}
          value={templateName}
          visible={modalVisible}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={() => {
            if (templateName) {
              createTemplate();
              // setTimeout(() => {
              //   router.push({
              //     pathname: '/owner/dietVariant',
              //     params: { templateTitle: templateName, method: method },
              //   });
              // }, 1000);
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
          title={"Create a New Template"}
          placeholder={"Ex:Weight Gain Diet Plan"}
        />

        <CreateTemplateModal
          onClose={() => setEditModal(false)}
          value={templateName}
          visible={editModal}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={async () => {
            if (templateName) {
              if (!editTemp.trim()) {
                showToast({
                  type: "error",
                  title: "Please enter a template name",
                });
                return;
              }

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
                  id: editId,
                  name: templateName,
                  gym_id: gymId,
                };

                const response = await editAllDietTemplateAPI(payload);

                if (response?.status === 200) {
                  showToast({
                    type: "success",
                    title: "Template updated successfully",
                  });
                  setEditModal(false);
                  getTemplates();
                } else {
                  showToast({
                    type: "error",
                    title: response?.detail,
                  });
                }
              } catch (error) {
                const errorMessage =
                  error.response?.detail ||
                  "Something went wrong, please try again.";
                showToast({
                  type: "error",
                  title: errorMessage,
                });
              }

              // setTimeout(() => {
              //   router.push({
              //     pathname: '/owner/dietVariant',
              //     params: { templateTitle: templateName, method: method },
              //   });
              // }, 1000);
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
          title={"Create a New Template"}
          placeholder={"Enter the Template Name"}
        />

        {/* <EditTemplateNameModal
          visible={isEditNameModalVisible}
          newTemplateName={newTemplateName}
          setNewTemplateName={setNewTemplateName}
          onClose={() => setEditNameModalVisible(false)}
          onSave={handleEditName}
        />
         */}
      </View>
    </>
  );
};

export default personalTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    // padding: width * 0.04,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  foodList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
  templateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  variantText: {
    paddingTop: 5,
    fontSize: 14,
    // fontWeight: '500',
    color: "#666",
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#FF5757",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
  },
});
