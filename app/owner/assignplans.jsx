import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import FitnessLoader from "../../components/ui/FitnessLoader";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

// Import your API functions
// These are placeholders - replace with your actual API functions
import {
  getPlansandBatchesAPI,
  getUsersWithPlansAndBatchesAPI,
  updateUserPlanAPI,
  updateUserBatchAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

const ReassignmentPage = () => {
  const [activeTab, setActiveTab] = useState("Plan");
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Fetch plans, batches and users
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error fetching Assignments",
        });
        return;
      }

      // Fetch plans and batches
      const plansAndBatchesResponse = await getPlansandBatchesAPI(gymId);
      if (plansAndBatchesResponse?.status === 200) {
        setPlans(plansAndBatchesResponse.data.plans);
        setBatches(plansAndBatchesResponse.data.batches);
      } else {
        showToast({
          type: "error",
          title: "Failed to load plans and batches",
        });
      }

      // Fetch users with their assigned plans and batches
      const usersResponse = await getUsersWithPlansAndBatchesAPI(gymId);
      if (usersResponse?.status === 200) {
        setUsers(usersResponse.data);
      } else {
        showToast({
          type: "error",
          title: "Failed to load users",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "An error occurred while fetching data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReassignModal = (user) => {
    setSelectedUser(user);
    setSelectedPlanId(activeTab === "Plan" ? user.plan_id : null);
    setSelectedBatchId(activeTab === "Batch" ? user.batch_id : null);
    setReassignModalVisible(true);
  };

  const handleReassign = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);

      if (activeTab === "Plan") {
        if (selectedPlanId === selectedUser.plan_id) {
          showToast({
            type: "error",
            title: "No Change",
          });
          setIsSubmitting(false);
          return;
        }

        const response = await updateUserPlanAPI({
          user_id: selectedUser.id,
          plan_id: selectedPlanId,
        });

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "User plan updated successfully",
          });
          setReassignModalVisible(false);
          await fetchData();
        } else {
          showToast({
            type: "error",
            title: "Failed to update user plan",
          });
        }
      } else {
        if (selectedBatchId === selectedUser.batch_id) {
          showToast({
            type: "error",
            title: "No Change",
          });
          setIsSubmitting(false);
          return;
        }

        const response = await updateUserBatchAPI({
          user_id: selectedUser.id,
          batch_id: selectedBatchId,
        });

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "User batch updated successfully",
          });
          setReassignModalVisible(false);
          await fetchData();
        } else {
          showToast({
            type: "error",
            title: "Failed to update user batch",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "An error occurred during reassignment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterUsersByActiveTab = () => {
    if (activeTab === "Plan") {
      return users.filter((user) => user.plan_id);
    } else {
      return users.filter((user) => user.batch_id);
    }
  };

  const getEntityName = (id, entityType) => {
    if (!id) return "None";

    if (entityType === "plan") {
      const plan = plans.find((p) => p.id === id);
      return plan ? plan.plans : "Unknown Plan";
    } else {
      const batch = batches.find((b) => b.id === id);
      return batch ? batch.batch_name : "Unknown Batch";
    }
  };

  // Render the reassignment modal
  const renderReassignModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={reassignModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReassignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="swap-horiz" size={28} color="#0078FF" />
              <Text style={styles.modalTitle}>
                Reassign {activeTab === "Plan" ? "Plan" : "Batch"}
              </Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                Reassigning {activeTab === "Plan" ? "plan" : "batch"} for:{" "}
                <Text style={styles.highlightText}>{selectedUser.name}</Text>
              </Text>

              <View style={styles.currentAssignmentContainer}>
                <Text style={styles.currentAssignmentLabel}>
                  Current {activeTab === "Plan" ? "Plan" : "Batch"}:
                </Text>
                <Text style={styles.currentAssignmentValue}>
                  {activeTab === "Plan"
                    ? getEntityName(selectedUser.plan_id, "plan")
                    : getEntityName(selectedUser.batch_id, "batch")}
                </Text>
              </View>

              <Text style={styles.pickerLabel}>
                Select New {activeTab === "Plan" ? "Plan" : "Batch"}:
              </Text>

              <View style={styles.pickerContainer}>
                {activeTab === "Plan" ? (
                  <Picker
                    selectedValue={selectedPlanId}
                    onValueChange={(itemValue) => setSelectedPlanId(itemValue)}
                    style={styles.picker}
                  >
                    {plans.map((plan) => (
                      <Picker.Item
                        key={plan.id.toString()}
                        label={`${plan.plans} (${plan.duration} months - ₹${plan.amount})`}
                        value={plan.id}
                      />
                    ))}
                  </Picker>
                ) : (
                  <Picker
                    selectedValue={selectedBatchId}
                    onValueChange={(itemValue) => setSelectedBatchId(itemValue)}
                    style={styles.picker}
                  >
                    {batches.map((batch) => (
                      <Picker.Item
                        key={batch.id.toString()}
                        label={`${batch.batch_name} (${batch.timing})`}
                        value={batch.id}
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setReassignModalVisible(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleReassign}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Reassign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Navigate back to the gym management page
  const navigateBack = () => {
    router.push("/owner/manageplans");
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  const filteredUsers = filterUsersByActiveTab();

  return (
    <SafeAreaView style={styles.container}>
      <NewOwnerHeader
        text={"Assign Plans"}
        onBackButtonPress={() => {
          router.push("/owner/manageplans");
        }}
      />

      {/* <View style={styles.headerContainer}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Management</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Reassign Users</Text>
      </View> */}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Plan" ? styles.activeTab : null]}
          onPress={() => setActiveTab("Plan")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Plan" ? styles.activeTabText : null,
            ]}
          >
            Plan Reassignment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Batch" ? styles.activeTab : null]}
          onPress={() => setActiveTab("Batch")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Batch" ? styles.activeTabText : null,
            ]}
          >
            Batch Reassignment
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {activeTab === "Plan"
              ? "Reassign User Plans"
              : "Reassign User Batches"}
          </Text>
          {activeTab === "Plan" && plans.length < 2 && (
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => {
                Alert.alert(
                  "Warning",
                  "You need at least two plans to reassign users.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Icon name="warning" size={16} color="#fff" />
              <Text style={styles.warningButtonText}>Need More Plans</Text>
            </TouchableOpacity>
          )}
          {activeTab === "Batch" && batches.length < 2 && (
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => {
                Alert.alert(
                  "Warning",
                  "You need at least two batches to reassign users.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Icon name="warning" size={16} color="#fff" />
              <Text style={styles.warningButtonText}>Need More Batches</Text>
            </TouchableOpacity>
          )}
        </View>

        {(activeTab === "Plan" && plans.length < 2) ||
        (activeTab === "Batch" && batches.length < 2) ? (
          <View style={styles.noFeedContainer}>
            <MaterialCommunityIcons
              name="account-alert"
              size={80}
              color="#CBD5E0"
            />
            <Text style={styles.noFeedTitle}>
              Cannot Reassign {activeTab === "Plan" ? "Plans" : "Batches"}
            </Text>
            <Text style={styles.noFeedSubtitle}>
              You need at least two {activeTab === "Plan" ? "plans" : "batches"}{" "}
              to reassign users.
            </Text>
            <TouchableOpacity
              style={styles.noFeedRefreshButton}
              onPress={navigateBack}
            >
              <Icon name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.noFeedButtonText}>
                Add {activeTab === "Plan" ? "Plans" : "Batches"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.noFeedContainer}>
            <MaterialCommunityIcons
              name="account-group"
              size={80}
              color="#CBD5E0"
            />
            <Text style={styles.noFeedTitle}>
              No Users with {activeTab === "Plan" ? "Plans" : "Batches"} Found
            </Text>
            <Text style={styles.noFeedSubtitle}>
              There are no users with assigned{" "}
              {activeTab === "Plan" ? "plans" : "batches"}.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.userAvatar}>
                    {item.profile ? (
                      <Image
                        source={{ uri: item.profile }}
                        style={styles.userAvatarImage}
                      />
                    ) : (
                      <Text style={styles.userAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userMeta}>
                      {item.email || item.phone}
                    </Text>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentLabel}>
                        Current {activeTab === "Plan" ? "Plan" : "Batch"}:
                      </Text>
                      <Text style={styles.assignmentValue}>
                        {activeTab === "Plan"
                          ? getEntityName(item.plan_id, "plan")
                          : getEntityName(item.batch_id, "batch")}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.reassignButton}
                  onPress={() => openReassignModal(item)}
                  disabled={
                    (activeTab === "Plan" && plans.length < 2) ||
                    (activeTab === "Batch" && batches.length < 2)
                  }
                >
                  <Icon name="swap-horiz" size={20} color="#0078FF" />
                  <Text style={styles.reassignButtonText}>Reassign</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {renderReassignModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  headerContainer: {
    padding: 15,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0078FF",
    textAlign: "center",
    marginVertical: 10,
  },
  backButton: {
    marginBottom: 5,
  },
  backButtonText: {
    fontSize: 12,
    color: "#0078FF",
    fontWeight: "bold",
  },
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
    borderBottomColor: "#0078FF",
  },
  tabText: {
    color: "#888",
    fontSize: 12,
  },
  activeTabText: {
    color: "#0078FF",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0078FF",
  },
  warningButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA500",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  warningButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "bold",
  },
  listItem: {
    backgroundColor: "white",
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0078FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  userMeta: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5,
  },
  assignmentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  assignmentLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 5,
  },
  assignmentValue: {
    fontSize: 12,
    color: "#0078FF",
    fontWeight: "bold",
  },
  reassignButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  reassignButtonText: {
    color: "#0078FF",
    marginLeft: 5,
    fontWeight: "bold",
    fontSize: 12,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noFeedTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubtitle: {
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0078FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 12,
  },
  // Modal Styles
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
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  modalBody: {
    padding: 15,
    maxHeight: height * 0.4,
  },
  modalText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 15,
  },
  highlightText: {
    fontWeight: "bold",
    color: "#0078FF",
  },
  currentAssignmentContainer: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  currentAssignmentLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 5,
  },
  currentAssignmentValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  pickerLabel: {
    fontSize: 12,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
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
    minWidth: 100,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#80BCFF",
  },
  modalPrimaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  modalSecondaryButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 12,
  },
});

export default ReassignmentPage;
