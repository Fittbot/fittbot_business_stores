import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CreateTemplateModal from "../../../components/Diet/createTemplateModal";
import GradientButton from "../../../components/ui/GradientButton";
const { width, height } = Dimensions.get("window");

import FitnessLoader from "../../../components/ui/FitnessLoader";
import { showToast } from "../../../utils/Toaster";
import {
  editDietTemplateAPI,
  getSingleDietTemplate,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import Icon from "react-native-vector-icons/MaterialIcons";
import TemplateFoodCard2 from "../../../components/Diet/TemplateFoodCard2";
import { Alert } from "react-native";
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

const PRIMARY_COLOR = "#ffffff";
const SELECTED_COLOR = "#f0f9fe"; // Light blue background for selected variant
const ACCENT_COLOR = "#007BFF"; // Accent color for border of selected variant

const dietVariant = (props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateTemplateModal, setOpenCreateTemplateModal] = useState(false);
  const [variantsList, setVariantsList] = useState();
  const [variantName, setVariantName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [dietPlan, setDietPlan] = useState({});

  const [addNewVariantModalVisible, setAddNewVariantModalVisible] =
    useState(false);

  const [templateTitle, setTemplateTitle] = useState("");

  const { templateId } = useLocalSearchParams();

  const [formattedDietList, setFormattedDietList] = useState([]);

  const handleUpdateVariantName = async () => {
    if (!variantName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter a variant name",
      });
      return;
    }

    const updatedList = variantsList.map((item) => {
      if (item.id === selectedVariant.id) {
        return { ...item, title: variantName };
      }
      return item;
    });

    // Update the dietPlan keys
    const oldKey = selectedVariant.title;
    const newKey = variantName;
    const updatedDietPlan = { ...dietPlan };

    if (oldKey !== newKey && updatedDietPlan.hasOwnProperty(oldKey)) {
      updatedDietPlan[newKey] = updatedDietPlan[oldKey]; // copy the value
      delete updatedDietPlan[oldKey]; // delete old key
    }

    // Update state
    setVariantsList(updatedList);
    setDietPlan(updatedDietPlan);
    setSelectedVariant({});
    setVariantName("");
    setOpenCreateTemplateModal(false);

    // Update backend
    try {
      await handleTheUpdateTemplate(updatedDietPlan);
      singleDietTemplateData();
      showToast({
        type: "success",
        title: "Variant updated successfully",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating variant",
        desc: "Failed to update variant. Please try again.",
      });
    }
  };

  const handleVariantSelection = (variant) => {
    if (selectedVariant && selectedVariant === variant) {
      setSelectedVariant(null);
    } else {
      setSelectedVariant(variant);

      const variantName = variant.title || variant;
      setCurrentVariant(variantName);
    }
  };

  if (isLoading) {
    return <FitnessLoader page="diet" />;
  }

  useEffect(() => {
    if (templateId) singleDietTemplateData();
  }, [templateId]);

  const singleDietTemplateData = async () => {
    const gymId = await getToken("gym_id");

    if (!gymId || !templateId) {
      showToast({
        type: "error",
        title: "GymId or templateId is not available",
      });
      return;
    }
    const response = await getSingleDietTemplate(gymId, templateId);

    const { dietPlan, id: templateeId, name } = response.data;

    handleVariantList(dietPlan);

    if (response?.status === 200) {
      setVariantsList(
        Object.keys(dietPlan)?.map((item, index) => {
          return { title: item, id: index };
        })
      );
      setDietPlan(dietPlan);
      setTemplateTitle(name);
    } else {
      showToast({
        type: "error",
        title: response?.detail,
      });
    }
  };

  const updateTheTemplate = async () => {
    if (!variantName.trim()) {
      showToast({
        type: "error",
        title: "Please enter a variant name",
      });
      return;
    }

    // Check if variant name already exists (case-insensitive)
    const variantExists = variantsList.some((v) => {
      const existingName = typeof v === "string" ? v : v.title;
      return existingName.toLowerCase() === variantName.trim().toLowerCase();
    });

    if (variantExists) {
      showToast({
        type: "error",
        title: "Variant already exists",
        desc: "A variant with this name already exists. Please choose a different name.",
      });
      return;
    }

    const newVariant = {
      title: variantName.trim(),
      id: Date.now(),
    };

    const updatedDietPlan = { ...dietPlan, [variantName.trim()]: mockData };
    const updatedVariantsList = Array.isArray(variantsList)
      ? [...variantsList, newVariant]
      : [newVariant];

    // Update state
    setVariantsList(updatedVariantsList);
    setVariantName("");
    setAddNewVariantModalVisible(false);
    setDietPlan(updatedDietPlan);

    // Update backend
    try {
      await handleTheUpdateTemplate(updatedDietPlan);
      showToast({
        type: "success",
        title: "Variant added successfully",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error adding variant",
        desc: "Failed to add variant. Please try again.",
      });
    }
  };

  const deleteVariant = async (variant) => {
    if (!variant) return;

    const variantName = variant.title || variant;

    // Show confirmation alert
    Alert.alert(
      "Delete Variant",
      `Are you sure you want to delete "${variantName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await performDelete(variant, variantName);
          },
        },
      ]
    );
  };

  const performDelete = async (variant, variantName) => {
    const updatedDietPlan = { ...dietPlan };

    // Remove the variant from dietPlan
    if (updatedDietPlan.hasOwnProperty(variantName)) {
      delete updatedDietPlan[variantName];
    }

    // Update variants list
    const updatedVariantsList = variantsList.filter(
      (v) => (v.title || v) !== variantName
    );

    // Update state
    setVariantsList(updatedVariantsList);
    setDietPlan(updatedDietPlan);

    if (
      selectedVariant &&
      (selectedVariant.title === variantName || selectedVariant === variantName)
    ) {
      setSelectedVariant(null);
    }

    // Update backend
    try {
      await handleTheUpdateTemplate(updatedDietPlan);
      singleDietTemplateData();
      showToast({
        type: "success",
        title: "Variant deleted successfully",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error deleting variant",
        desc: "Failed to delete variant. Please try again.",
      });
    }
  };

  const handleTheUpdateTemplate = async (dietPlanToUse) => {
    try {
      const gymId = await getToken("gym_id");

      const payload = {
        gym_id: gymId,
        id: templateId,
        dietPlan: dietPlanToUse,
      };

      const response = await editDietTemplateAPI(payload);

      if (response?.status !== 200) {
        throw new Error(response?.detail || "Failed to update template");
      }

      return response;
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: error.message || "Failed to update template. Please try again.",
      });
      throw error;
    }
  };

  const handleVariantList = (dietPlan) => {
    let currentVariant = Object.entries(dietPlan).map(([key, value], index) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      value.forEach((cat) => {
        cat.foodList.forEach((item) => {
          totalCalories += item.calories;
          totalProtein += item.protein;
          totalCarbs += item.carbs;
          totalFat += item.fat;
        });
      });

      return {
        title: key,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      };
    });

    setFormattedDietList(currentVariant);
  };

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler
          routePath="/owner/(diet)/personalTemplate"
          enabled={true}
        />
        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            router.push("/owner/(diet)/personalTemplate");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>{templateTitle}</Text>
        </TouchableOpacity>

        <ScrollView style={styles.variantsContainer}>
          <View style={[styles.variantButtonsContainer, { flex: 1 }]}>
            {formattedDietList?.map((item, index) => {
              return (
                // <View key={index} style={styles.variantButtonWrapper}>
                //   <TouchableOpacity
                //     style={[
                //       styles.variantButton,

                //       {
                //         // flex: 1,
                //         flexDirection: 'column',
                //         backgroundColor:
                //           selectedVariant === item
                //             ? SELECTED_COLOR
                //             : PRIMARY_COLOR,
                //         borderColor:
                //           selectedVariant === item ? ACCENT_COLOR : 'transparent',
                //         borderWidth: selectedVariant === item ? 1 : 0,
                //       },
                //     ]}
                //     onPress={() => {
                //       router.push({
                //         pathname: '/owner/addTemplateCategoryPage',
                //         params: {
                //           variantId: item.id,
                //           variantName: item.title,
                //           templateTitle: templateTitle,
                //           templateId: templateId,
                //         },
                //       });
                //     }}
                //   >
                //     <View
                //       style={{
                //         // flex: 1,
                //         width: '100%',
                //         flexDirection: 'row',
                //         alignItems: 'center',
                //         justifyContent: 'space-between',
                //       }}
                //     >
                //       <Text
                //         style={[
                //           styles.variantButtonText,
                //           {
                //             fontWeight:
                //               selectedVariant?.id === item.id ? '700' : '500',
                //           },
                //         ]}
                //       >
                //         {item.title || item}
                //       </Text>

                //       <View style={styles.actionTemplates}>
                //         <TouchableOpacity
                //           onPress={() => {
                //             setOpenCreateTemplateModal(!openCreateTemplateModal);
                //             setSelectedVariant(item);
                //             setVariantName(item.title);
                //           }}
                //           style={{
                //             padding: 10,
                //             backgroundColor: 'rgba(40, 167, 70, 0.10)',
                //             borderRadius: '100%',
                //           }}
                //         >
                //           <Icon name="edit" size={20} color="#28A745" />
                //         </TouchableOpacity>
                //         <TouchableOpacity
                //           onPress={() => deleteVariant(item)}
                //           style={{
                //             padding: 10,
                //             backgroundColor: 'rgba(220, 53, 70, 0.1)',
                //             borderRadius: '100%',
                //           }}
                //         >
                //           <Icon name="delete" size={20} color="#dc3545" />
                //         </TouchableOpacity>
                //       </View>
                //     </View>

                //     <View style={{ width: '100%' }}>
                //       <Text style={styles.variantButtonText}>{item.title}</Text>
                //     </View>
                //   </TouchableOpacity>
                // </View>

                <TemplateFoodCard2
                  key={index}
                  id={index}
                  title={item.title}
                  calories={item.calories}
                  carbs={item.carbs}
                  fat={item.fat}
                  protein={item.protein}
                  // quantity={formattedDietList.length || 0}
                  onEdit={() => {
                    setOpenCreateTemplateModal(!openCreateTemplateModal);
                    setSelectedVariant(item);
                    setVariantName(item.title);
                  }}
                  onDelete={() => {
                    deleteVariant(item);
                  }}
                  onPress={() => {
                    router.push({
                      pathname: "/owner/addTemplateCategoryPage",
                      params: {
                        variantId: item.id,
                        variantName: item.title,
                        templateTitle: templateTitle,
                        templateId: templateId,
                      },
                    });
                  }}
                />
              );
            })}
          </View>
        </ScrollView>

        <CreateTemplateModal
          title={"Change Variant Name"}
          placeholder={"Enter the name"}
          buttonText={"Update Name"}
          onClose={() => setOpenCreateTemplateModal(!openCreateTemplateModal)}
          value={variantName}
          visible={openCreateTemplateModal}
          onChange={(text) => {
            setVariantName(text);
          }}
          onSubmit={() => {
            if (variantName) {
              handleUpdateVariantName(variantName);
              setOpenCreateTemplateModal(!openCreateTemplateModal);
            } else {
              showToast({
                type: "error",
                title: "Enter the name first",
              });
            }
          }}
        />

        <CreateTemplateModal
          title={"Enter New Variant Name"}
          placeholder={"Enter the name"}
          buttonText={"Add Variant"}
          onClose={() =>
            setAddNewVariantModalVisible(!addNewVariantModalVisible)
          }
          value={variantName}
          visible={addNewVariantModalVisible}
          onChange={(text) => {
            setVariantName(text);
          }}
          onSubmit={() => {
            updateTheTemplate();
          }}
        />
      </View>

      <View style={{ marginBottom: 0 }}>
        <GradientButton
          title={"Add a new variant"}
          fromColor="#28A745"
          toColor="#007BFF"
          mainContainerStyle={{
            width: "100%",
            backgroundColor: "#fff",
            alignItems: "flex",
          }}
          containerStyle={{
            marginTop: 0,
            width: "100%",
            paddingVertical: 18,
          }}
          textStyle={{ fontSize: 12 }}
          onPress1={() => {
            setAddNewVariantModalVisible(!addNewVariantModalVisible);
          }}
        />
      </View>
    </>
  );
};

export default dietVariant;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
  backButtonContainer2: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 0,
    // marginBottom: height * 0.02,
    // marginTop: height * 0.04,
  },
  foodList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
  variantsContainer: {
    padding: 16,
    paddingTop: 0,
    flex: 1,
    marginBottom: 15,
  },
  variantsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  variantButtonsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  variantButtonWrapper: {
    width: "100%",
  },
  variantButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  variantButtonText: {
    color: "#070707",
    fontSize: 16,
  },
  nextButtonContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    padding: 16,
    backgroundColor: "#fff",
    // Add shadow to create visual separation from content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nextButton: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 15,
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
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 16,
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
});
