import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import FoodCard from "../../../components/Diet/FoodCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GradientButton from "../../../components/ui/GradientButton";
import {
  addClientDietAPI,
  searchClientFoodAPI,
  getCommonFooodAPI,
} from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import { format } from "date-fns";
import GradientButton2 from "../../../components/ui/GradientButton2";
import MissedMealsModal from "../../../components/Diet/MissedMealsModal";
import { useLocalSearchParams } from "expo-router";
import { editDietTemplateAPI, getDietTemplateAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const FoodSearchScreen = () => {
  const router = useRouter();
  const inputRef = useRef(null);

  // Params from the previous screen
  const {
    date,
    templateTitle,
    mealTitle,
    mealTimeRange,
    mealId,
    templateId,
    templateData,
    variantId,
    variantName,
  } = useLocalSearchParams();

  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [parsedTemplateData, setParsedTemplateData] = useState({});
  const [templates, setTemplates] = useState([]);

  const handleDateSelect = (date) => {
    setDateAdd(date);
    setSelectedDate(date);
  };

  const getTemplates = async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await getDietTemplateAPI(gymId);
      if (response?.status === 200) {
        setTemplates(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to fetch templates",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong, please try again.",
      });
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  useEffect(() => {
    if (templateData) {
      try {
        const parsed = JSON.parse(templateData);
        setParsedTemplateData(parsed);
      } catch (error) {
        showToast({
          type: "error",
          title: "Error parsing template data",
        });
      }
    }
  }, [templateData]);

  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
      setMissedMealsModalVisible(true);
    }
  }, [date]);

  const fetchCommonDiet = async () => {
    setLoading(true);
    try {
      const response = await getCommonFooodAPI();
      if (response?.status === 200) {
        setAllFoods(response?.data || []);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query) => {
    if (query.length > 1) {
      try {
        const response = await searchClientFoodAPI(query);
        if (response?.status === 200) {
          setAllFoods(response?.data);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } else {
      await fetchCommonDiet();
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchFoods(query);
  };

  const filteredData = allFoods?.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSearchQuery("");
    searchFoods("");
    Keyboard.dismiss();
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    fetchCommonDiet();
  }, []);

  const toggleFoodSelection = (food) => {
    if (selectedFoods.find((f) => f.id === food.id)) {
      setSelectedFoods(selectedFoods.filter((f) => f.id !== food.id));
    } else {
      setSelectedFoods([...selectedFoods, { ...food, quantity: "1" }]);
    }
  };

  const updateFoodQuantity = (foodId, quantity) => {
    setSelectedFoods(
      selectedFoods.map((food) =>
        food.id === foodId ? { ...food, quantity } : food
      )
    );
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
        title: "Error updating template",
      });
      throw error;
    }
  };

  const saveFoods = async () => {
    if (!dateAdd && !templateId) {
      return;
    }

    if (selectedFoods.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    try {
      const gymId = await getToken("gym_id");

      // Prepare new foods with proper formatting
      const newFoods = selectedFoods.map((food) => {
        const quantity = parseInt(food.quantity) || 1;
        return {
          ...food,
          id: `${food.id}-${Date.now()}-${Math.random()}`,
          quantity,
          calories: food.calories * quantity,
          protein: food.protein * quantity,
          carbs: food.carbs * quantity,
          fat: food.fat * quantity,
          date: format(dateAdd, "yyyy-MM-dd"),
          timeAdded: format(new Date(), "HH:mm"),
        };
      });

      // Handle template meal update
      if (templateId && mealId && variantName) {
        try {
          // Find the current template from templates state
          const currentTemplate = templates.find(
            (template) => template.id.toString() === templateId.toString()
          );

          if (!currentTemplate) {
            throw new Error("Template not found");
          }

          // Create a deep copy of the current template's dietPlan
          const updatedDietPlan = JSON.parse(
            JSON.stringify(currentTemplate.dietPlan)
          );

          // Check if the variant exists
          if (!updatedDietPlan[variantName]) {
            throw new Error(
              `Variant "${variantName}" not found in template. Available variants: ${Object.keys(
                updatedDietPlan
              ).join(", ")}`
            );
          }

          // Check if the variant has meals
          // if (
          //   !Array.isArray(updatedDietPlan[variantName]) ||
          //   updatedDietPlan[variantName].length === 0
          // ) {
          //   throw new Error(
          //     `Variant "${variantName}" is empty. Please add meals to this variant first.`
          //   );
          // }

          // Find the meal by ID in the specified variant
          const mealIndex = updatedDietPlan[variantName].findIndex(
            (meal) => meal.id.toString() === mealId.toString()
          );

          if (mealIndex === -1) {
            const availableMealIds = updatedDietPlan[variantName].map(
              (meal) => meal.id
            );
            throw new Error(
              `Meal with ID "${mealId}" not found in variant "${variantName}". Available meal IDs: ${availableMealIds.join(
                ", "
              )}`
            );
          }

          // Add new foods to the existing foodList
          const existingFoodList =
            updatedDietPlan[variantName][mealIndex].foodList || [];
          updatedDietPlan[variantName][mealIndex].foodList = [
            ...existingFoodList,
            ...newFoods,
          ];

          // Update the items count
          updatedDietPlan[variantName][mealIndex].itemsCount =
            updatedDietPlan[variantName][mealIndex].foodList.length;

          // Call the API to update the template
          const response = await handleTheUpdateTemplate(updatedDietPlan);

          if (response?.status === 200) {
            showToast({
              type: "success",
              title: "Foods added to meal successfully",
            });

            setSelectedFoods([]);

            // Update local templates state
            setTemplates((prevTemplates) =>
              prevTemplates.map((template) =>
                template.id.toString() === templateId.toString()
                  ? { ...template, dietPlan: updatedDietPlan }
                  : template
              )
            );

            setTimeout(() => {
              router.push({
                pathname: "/owner/addTemplateCategoryPage",
                params: {
                  variantId: variantId,
                  variantName: variantName,
                  templateTitle: templateTitle,
                  templateId: templateId,
                },
              });
            }, 1000);

            return response;
          } else {
            throw new Error(response?.detail || "Failed to update template");
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: error.message || "Failed to add foods to meal",
          });
          return;
        }
      }
      // Handle regular diet log (existing functionality)
      else {
        const clientId = await getToken("client_id");

        const payload = {
          client_id: clientId,
          date: dateAdd?.toISOString().split("T")[0],
          diet_data: newFoods,
          gym_id: gymId,
        };

        const response = await addClientDietAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Diet added successfully",
          });

          setSelectedFoods([]);
          setDateAdd(new Date());

          setTimeout(() => {
            router.push({
              pathname: "/client/myListedFoodLogs",
            });
          }, 1000);

          return response;
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  return (
    <View style={styles.container}>
      <HardwareBackHandler
        routePath="/owner/addTemplateCategoryPage"
        enabled={true}
        params={{
          variantId: variantId,
          variantName: variantName,
          templateTitle: templateTitle,
          templateId: templateId,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/owner/addTemplateCategoryPage",
              params: {
                variantId: variantId,
                variantName: variantName,
                templateTitle: templateTitle,
                templateId: templateId,
              },
            });
          }}
        >
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <View
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 30,
          }}
        >
          {date && <Text>Log Your Food</Text>}
          {templateTitle && mealTitle && (
            <Text numberOfLines={1} style={styles.headerText}>
              Add Food To {mealTitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.search_bar}>
        <TouchableOpacity onPress={focusInput}>
          <Ionicons name="search-outline" size={20} color="#888" />
        </TouchableOpacity>

        <TextInput
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Type here..."
          style={styles.searchInput}
          ref={inputRef}
        />

        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {selectedDate && (
        <View
          style={{
            marginTop: 10,
            marginBottom: 5,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GradientButton2
            title={
              selectedDate
                ? format(selectedDate, "MMMM dd, yyyy")
                : "yyyy-MM-dd"
            }
            fromColor="#28A745"
            toColor="#007BFF"
            containerStyle={{ marginTop: 0 }}
            textStyle={{ fontSize: 12 }}
            onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading foods...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index}
          renderItem={({ item }) => (
            <FoodCard
              id={item.id}
              image={item.image}
              title={item.name}
              calories={item.calories}
              carbs={item.carbs}
              fat={item.fat}
              protein={item.protein}
              quantity={item?.quantity}
              isSelected={selectedFoods.some((f) => f.id === item.id)}
              onAdd={() => toggleFoodSelection(item)}
              updateFoodQuantity={updateFoodQuantity}
            />
          )}
          contentContainerStyle={styles.foodListContainer}
        />
      )}

      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""}{" "}
          selected
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton
          title={templateTitle || templateId ? "Add to Meal" : "Log Your Food"}
          fromColor="#28A745"
          toColor="#007BFF"
          mainContainerStyle={{
            width: "100%",
            alignItems: "flex",
          }}
          containerStyle={{ marginTop: 0, width: "100%", paddingVertical: 18 }}
          textStyle={{ fontSize: 12 }}
          onPress1={saveFoods}
          disabled={loading || selectedFoods.length === 0}
        />
      </View>

      <MissedMealsModal
        onClose={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
        visible={missedMealsModalVisible}
        date={selectedDate}
        onChangeDate={(date) => setSelectedDate(date)}
        onSubmit={handleDateSelect}
      />
    </View>
  );
};

export default FoodSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 40,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 5,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  foodListContainer: {
    paddingBottom: 10,
    paddingTop: 0,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 0,
  },
});
