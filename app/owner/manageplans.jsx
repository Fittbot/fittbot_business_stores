import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OwnerHeader from "../../components/ui/OwnerHeader";
import {
  addBatchAPI,
  addPlanAPI,
  checkBatchAssignmentsAPI,
  checkPlanAssignmentsAPI,
  deleteBatchAPI,
  deletePlanAPI,
  editBatchAPI,
  editPlanAPI,
  getPlansandBatchesAPI,
} from "../../services/Api";
import FitnessLoader from "../../components/ui/FitnessLoader";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// import CarouselComponent from '../../components/ui/Carousel';
import Swiper from "react-native-swiper";
import { getToken } from "../../utils/auth";
import TabHeader from "../../components/home/finances/TabHeader";
import PlanCard from "../../components/managePlans/PlanCard";
import AddPlanModal from "../../components/managePlans/AddPlanModal";
import { showToast } from "../../utils/Toaster";
import EntityModal from "../../components/managePlans/EntityModal";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const AssignmentWarningModal = ({
  visible,
  onClose,
  assignedUsers,
  entityType,
  entityName,
  onRedirect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="warning" size={28} color="#FFA500" />
            <Text style={styles.modalTitle}>Cannot Delete {entityType}</Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalText}>
              The following users are assigned to this{" "}
              {entityType.toLowerCase()} "{entityName}":
            </Text>

            {assignedUsers.map((user, index) => (
              <View key={index} style={styles.userItem}>
                <Icon name="person" size={20} color="#666" />
                <Text style={styles.userName}>{user.name}</Text>
              </View>
            ))}

            <Text style={styles.modalWarning}>
              Please reassign these users to a different{" "}
              {entityType.toLowerCase()} before deleting.
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={onClose}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={onRedirect}
            >
              <Text style={styles.modalPrimaryButtonText}>
                Go to Assignment Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const GymManagementPage = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [entityToDelete, setEntityToDelete] = useState({
    type: "",
    name: "",
    id: null,
  });

  const router = useRouter();

  // Fetch plans and batches from API
  const fetchPlansAndBatches = async () => {
    try {
      setIsLoading(true);
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
          title: response?.detail || "Error fetching data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Error fetching plans and batches",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndBatches();
  }, []);

  // Open modal for adding new entity
  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setIsModalVisible(true);
  };

  // Open modal for editing entity
  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
    setIsEditMode(false);
  };

  // Handle adding or editing plan
  const handleSavePlan = async (planData) => {
    try {
      let response;

      if (isEditMode) {
        // Edit existing plan
        response = await editPlanAPI(planData);
      } else {
        // Add new plan
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
          plan_name: planData.plans,
          amount: Number(planData.amount),
          duration: Number(planData.duration),
          description: planData.description || "",
        };

        response = await addPlanAPI(payload);
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditMode
            ? "Plan updated successfully"
            : response.message || "Plan added successfully",
        });
        await fetchPlansAndBatches();
        closeModal();
      } else {
        showToast({
          type: "error",
          title: isEditMode ? "Failed to update plan" : "Failed to add plan",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: isEditMode ? "Error updating plan" : "Error adding plan",
      });
    }
  };

  // Handle adding or editing batch
  const handleSaveBatch = async (batchData) => {
    try {
      let response;

      if (isEditMode) {
        // Edit existing batch
        response = await editBatchAPI(batchData);
      } else {
        // Add new batch
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
          batch_name: batchData.batch_name,
          timing: batchData.timing,
          description: batchData.description || "",
        };

        response = await addBatchAPI(payload);
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditMode
            ? "Batch updated successfully"
            : "Batch added successfully",
        });
        await fetchPlansAndBatches();
        closeModal();
      } else {
        showToast({
          type: "error",
          title: isEditMode ? "Failed to update batch" : "Failed to add batch",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: isEditMode ? "Error updating batch" : "Error adding batch",
      });
    }
  };

  // Handle save action based on active tab
  const handleSave = (data) => {
    if (activeTab === "plans") {
      handleSavePlan(data);
    } else {
      handleSaveBatch(data);
    }
  };

  // Check if plan has assigned users before deletion
  const handleDeletePlan = async (id, planName) => {
    try {
      setIsLoading(true);
      const response = await checkPlanAssignmentsAPI(id);
      setIsLoading(false);

      if (response?.status === 200) {
        const assignedUsers = response.data;

        if (assignedUsers && assignedUsers.length > 0) {
          setAssignedUsers(assignedUsers);
          setEntityToDelete({ type: "Plan", name: planName, id });

          // Check if there are alternative plans for reassignment
          if (plans.length <= 1) {
            Alert.alert(
              "Cannot Delete Plan",
              "This plan has assigned users and it's your only plan. Please add another plan before deleting this one.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add New Plan",
                  onPress: () => {
                    setActiveTab("plans");
                    openAddModal();
                  },
                },
              ]
            );
          } else {
            setWarningModalVisible(true);
          }
        } else {
          showDeleteConfirmation(id, "Plan");
        }
      } else {
        showToast({
          type: "error",
          title: "Failed to check plan assignments",
        });
      }
    } catch (error) {
      setIsLoading(false);
      showToast({
        type: "error",
        title: "Error checking plan assignments",
      });
    }
  };

  // Check if batch has assigned users before deletion
  const handleDeleteBatch = async (id, batchName) => {
    try {
      setIsLoading(true);
      const response = await checkBatchAssignmentsAPI(id);
      setIsLoading(false);

      if (response?.status === 200) {
        const assignedUsers = response.data;

        if (assignedUsers && assignedUsers.length > 0) {
          setAssignedUsers(assignedUsers);
          setEntityToDelete({ type: "Batch", name: batchName, id });

          // Check if there are alternative batches for reassignment
          if (batches.length <= 1) {
            Alert.alert(
              "Cannot Delete Batch",
              "This batch has assigned users and it's your only batch. Please add another batch before deleting this one.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add New Batch",
                  onPress: () => {
                    setActiveTab("batches");
                    openAddModal();
                  },
                },
              ]
            );
          } else {
            setWarningModalVisible(true);
          }
        } else {
          showDeleteConfirmation(id, "batch");
        }
      } else {
        showToast({
          type: "error",
          title: "Failed to check batch assignments",
        });
      }
    } catch (error) {
      setIsLoading(false);
      showToast({
        type: "error",
        title: "Error checking batch assignments",
      });
    }
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (id, type) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete this ${type}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setIsLoading(true);
              const response =
                type === "Plan"
                  ? await deletePlanAPI(id)
                  : await deleteBatchAPI(id);

              setIsLoading(false);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: `${
                    type.charAt(0).toUpperCase() + type.slice(1)
                  } deleted successfully!`,
                });
                await fetchPlansAndBatches();
              } else {
                showToast({
                  type: "error",
                  title: `Failed to delete ${type}`,
                });
              }
            } catch (error) {
              setIsLoading(false);
              showToast({
                type: "error",
                title: `Failed to delete ${type}`,
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Navigate to assignment page
  const navigateToAssignment = () => {
    setWarningModalVisible(false);

    // Check if there are enough alternative plans/batches for reassignment
    if (entityToDelete.type === "Plan" && plans.length <= 1) {
      // Show alert that at least one more plan is needed
      Alert.alert(
        "Cannot Reassign Users",
        "You only have one plan available. Please add another plan before deleting this one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add New Plan",
            onPress: () => {
              setActiveTab("plans");
              openAddModal();
            },
          },
        ]
      );
    } else if (entityToDelete.type === "Batch" && batches.length <= 1) {
      // Show alert that at least one more batch is needed
      Alert.alert(
        "Cannot Reassign Users",
        "You only have one batch available. Please add another batch before deleting this one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add New Batch",
            onPress: () => {
              setActiveTab("batches");
              openAddModal();
            },
          },
        ]
      );
    } else {
      // There are multiple plans/batches, navigate to assignment page
      router.push({
        pathname: "/owner/assignplans",
        params: {
          tab: activeTab === "plans" ? "Plan" : "Batch",
        },
      });
    }
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  const tabs = [
    { id: "plans", label: "Plans" },
    { id: "batches", label: "Batches" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* <OwnerHeader /> */}

      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        text={"Manage Plans and Batches"}
        onBackButtonPress={() => router.push("/owner/home")}
      />

      <TabHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <TouchableOpacity
        style={styles.reassignButton}
        onPress={() =>
          router.push({
            pathname: "/owner/assignplans",
            params: {
              tab: activeTab === "plans" ? "Plan" : "Batch",
            },
          })
        }
      >
        <Text style={styles.reassignButtonText}>
          Reassign {activeTab === "plans" ? "Plans" : "Batches"}
        </Text>
      </TouchableOpacity>
      <View style={styles.listContainer}>
        <FlatList
          data={activeTab === "plans" ? plans : batches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PlanCard
              item={item}
              name={activeTab === "plans" ? item.plans : item.batch_name}
              type={activeTab}
              onEdit={openEditModal}
              onDelete={
                activeTab === "plans" ? handleDeletePlan : handleDeleteBatch
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsList}
          ListEmptyComponent={
            <View style={styles.noFeedContainer}>
              <MaterialCommunityIcons
                name="card-account-details"
                size={80}
                color="#CBD5E0"
              />
              <Text style={styles.noFeedTitle}>
                No {activeTab === "plans" ? "Plans" : "Batches"} to Show
              </Text>
              <Text style={styles.noFeedSubtitle}>
                Add {activeTab === "plans" ? "Plans" : "Batches"} to Start.
              </Text>
              {/* <TouchableOpacity
                style={styles.noFeedRefreshButton}
                onPress={openAddModal}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.noFeedButtonText}>
                  Add {activeTab === "plans" ? "Plan" : "Batch"}
                </Text>
              </TouchableOpacity> */}
            </View>
          }
        />

        <TouchableOpacity style={styles.addNewButton} onPress={openAddModal}>
          <Ionicons name="add-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addNewButtonText}>
            Add New {activeTab === "plans" ? "Plan" : "Batch"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Unified Modal for both Plans and Batches */}
      <EntityModal
        visible={isModalVisible}
        onClose={closeModal}
        onSave={handleSave}
        entityType={activeTab}
        isEditMode={isEditMode}
        initialData={selectedItem || {}}
        styles={styles}
      />

      {/* Warning Modal for deletion with assigned users */}
      <AssignmentWarningModal
        visible={warningModalVisible}
        onClose={() => setWarningModalVisible(false)}
        assignedUsers={assignedUsers}
        entityType={entityToDelete.type}
        entityName={entityToDelete.name}
        onRedirect={navigateToAssignment}
        styles={styles}
      />
    </SafeAreaView>
  );
};

export default GymManagementPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  reassignButton: {
    alignSelf: "flex-end",
    backgroundColor: "#0078FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 15,
    marginTop: 5,
  },
  reassignButtonText: {
    color: "#FFFFFF",
  },
  header: {
    padding: 15,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FF5757",
    fontSize: 22,
    fontWeight: "bold",
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#FF5757",
  },
  tabText: {
    color: "#888",
    fontSize: 16,
  },
  activeTabText: {
    color: "#FF5757",
    fontWeight: "bold",
  },

  // List Styles
  listContainer: {
    flex: 1,
    padding: 15,
    paddingBottom: 60,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
    width: "90%",
  },
  addButton: {
    backgroundColor: "#FF5757",
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  listItem: {
    backgroundColor: "white",
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  cardLayout: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    maxWidth: "100%",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#FF5757",
  },
  listItemDuration: {
    paddingVertical: 4,
    fontSize: 14,
    color: "#666",
  },
  amount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  listItemDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iconTextGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 4,
  },

  // Add Screen Styles
  screenContainer: {
    flex: 1,
    backgroundColor: "#f4f4f8",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: width * 0.05,
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    color: "#333",
    fontWeight: "bold",
  },
  inputLabelMuted: {
    color: "#8888",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: width * 0.04,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#FF5757",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionButton: {
    padding: 5,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFFF",
    marginTop: 50,
  },
  noFeedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 250,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4299E1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  headerTitle: {
    color: "#FF5757",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "90%",
    maxHeight: height * 0.7,
    padding: 0,
    elevation: 5,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#F8F9FA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  modalBody: {
    padding: 15,
    maxHeight: height * 0.4,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
  },
  modalWarning: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalPrimaryButton: {
    backgroundColor: "#0078FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  modalPrimaryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalSecondaryButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  modalSecondaryButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: {
    fontSize: 16,
    marginLeft: 10,
    color: "#444",
  },
  addNewButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
