// RewardsScreen.js - Fixed version for iOS modal issue
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  getRewardsAPI,
  createRewardAPI,
  updateRewardAPI,
  deleteRewardAPI,
} from "../../services/Api";
import FitnessLoader from "../../components/ui/FitnessLoader";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { router } from "expo-router";
import { showToast } from "../../utils/Toaster";

import RewardCard from "../../components/reward/RewardCard";
import AddEditRewardModal from "../../components/reward/AddEditRewardModal";
import RewardDetailsModal from "../../components/reward/RewardDetailsModal";
import DuplicateXPConfirmationModal from "../../components/reward/DuplicateXPConfirmationModal";
import { ShimmerNewsArticle } from "../../components/shimmerUI/ShimmerComponentsPreview";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const RewardsScreen = () => {
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [multipleRewardsInput, setMultipleRewardsInput] = useState([
    { xp: "", gift: "" },
  ]);
  const [editIndex, setEditIndex] = useState(null);

  const [duplicateInfo, setDuplicateInfo] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Missing gym information" });
        return;
      }
      const response = await getRewardsAPI(gymId);
      if (response?.status === 200) {
        setRewards(response?.data || []);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch rewards",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({ type: "error", title: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleShowDetails = useCallback((item) => {
    setSelectedReward(item);
    setIsDetailModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  const handleEditReward = useCallback((item, index) => {
    setEditIndex(index);
    setSelectedReward(item);
    setMultipleRewardsInput([{ xp: item.xp.toString(), gift: item.gift }]);
    setIsAddEditModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  const handleDeleteReward = useCallback(async (item) => {
    Alert.alert(
      "Delete Reward",
      "Are you sure you want to delete this reward?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            setIsLoading(true);
            try {
              const gymId = await getToken("gym_id");
              if (!gymId) {
                showToast({ type: "error", title: "Missing gym information" });
                setIsLoading(false);
                return;
              }
              const response = await deleteRewardAPI(item.id);
              if (response?.status === 200 || response?.status === 204) {
                setRewards((prevRewards) =>
                  prevRewards.filter((reward) => reward.id !== item.id)
                );
                showToast({
                  type: "success",
                  title: "Reward deleted successfully",
                });
              } else {
                showToast({
                  type: "error",
                  title: response?.detail || "Failed to delete reward",
                });
              }
            } catch (error) {
              showToast({ type: "error", title: "Failed to delete reward" });
              console.error("Delete reward error:", error);
            } finally {
              setIsLoading(false);
              setOpenDropdownId(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditIndex(null);
    setMultipleRewardsInput([{ xp: "", gift: "" }]);
    setIsAddEditModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  const handleCloseAddEditModal = useCallback(() => {
    setIsAddEditModalVisible(false);
    setEditIndex(null);
    setMultipleRewardsInput([{ xp: "", gift: "" }]);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedReward(null);
  }, []);

  // Updated handleUpdateReward function
  const handleUpdateReward = useCallback(
    async (updatedRewardPayload, showSuccessToast = true) => {
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) {
          showToast({ type: "error", title: "GymId is not available" });
          return false;
        }

        const payload = {
          gym_id: gymId,
          record_id: updatedRewardPayload.id,
          updated_reward: {
            xp: updatedRewardPayload.xp,
            gift: updatedRewardPayload.gift,
          },
        };

        const response = await updateRewardAPI(payload);

        if (response?.status === 200) {
          setRewards((prev) =>
            prev.map((r) =>
              r?.id === updatedRewardPayload?.id ? response.data : r
            )
          );
          if (showSuccessToast) {
            showToast({
              type: "success",
              title: "Reward updated successfully",
            });
          }
          return true;
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Failed to update reward",
          });
          return false;
        }
      } catch (error) {
        showToast({ type: "error", title: "Failed to update reward" });
        console.error("Update reward error:", error);
        return false;
      }
    },
    []
  );

  const handleSubmitRewards = useCallback(async () => {
    setIsLoading(true);
    const gymId = await getToken("gym_id");
    if (!gymId) {
      showToast({ type: "error", title: "Missing gym information" });
      setIsLoading(false);
      return;
    }

    const validRewardEntries = multipleRewardsInput.filter(
      (reward) => String(reward.xp).trim() !== "" && reward.gift.trim() !== ""
    );

    if (validRewardEntries.length === 0) {
      showToast({
        type: "error",
        title: "Please fill in at least one reward completely",
      });
      setIsLoading(false);
      return;
    }

    const newRewardsToAdd = [];
    const duplicatesFoundForModal = [];

    if (editIndex !== null && selectedReward) {
      const rewardToUpdate = {
        ...validRewardEntries[0],
        id: selectedReward.id,
      };

      const existingConflictingReward = rewards.find(
        (r) =>
          String(r.xp).trim() === String(rewardToUpdate.xp).trim() &&
          r.id !== rewardToUpdate.id
      );

      if (existingConflictingReward) {
        Alert.alert(
          "XP Already Exists",
          `A reward with ${rewardToUpdate.xp} XP already exists ("${existingConflictingReward.gift}"). Do you want to replace it with "${rewardToUpdate.gift}" and delete the original reward ("${selectedReward.gift}")?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsLoading(false),
            },
            {
              text: "Replace & Delete Original",
              onPress: async () => {
                setIsLoading(true);
                try {
                  const updateConflictingSuccess = await handleUpdateReward(
                    {
                      id: existingConflictingReward.id,
                      xp: existingConflictingReward.xp,
                      gift: rewardToUpdate.gift,
                    },
                    false
                  );

                  if (updateConflictingSuccess) {
                    const deleteOriginalSuccess = await deleteRewardAPI(
                      selectedReward.id
                    );

                    if (
                      deleteOriginalSuccess?.status === 200 ||
                      deleteOriginalSuccess?.status === 204
                    ) {
                      showToast({
                        type: "success",
                        title: `Reward updated and original deleted successfully!`,
                      });
                    } else {
                      showToast({
                        type: "error",
                        title:
                          deleteOriginalSuccess?.detail ||
                          "Failed to delete original reward after update.",
                      });
                    }
                  } else {
                    showToast({
                      type: "error",
                      title:
                        "Failed to update existing reward with new gift. Original not deleted.",
                    });
                  }
                } catch (error) {
                  showToast({
                    type: "error",
                    title: "Error processing XP conflict.",
                  });
                  console.error("XP conflict error:", error);
                } finally {
                  handleCloseAddEditModal();
                  await fetchRewards();
                  setIsLoading(false);
                }
              },
              style: "destructive",
            },
          ]
        );
        setIsLoading(false);
        return;
      } else {
        const success = await handleUpdateReward(rewardToUpdate, true);
        if (success) {
          handleCloseAddEditModal();
          await fetchRewards();
        }
        setIsLoading(false);
        return;
      }
    } else {
      for (const newReward of validRewardEntries) {
        const existingDuplicateInDB = rewards.find(
          (r) => String(r.xp).trim() === String(newReward.xp).trim()
        );

        if (existingDuplicateInDB) {
          duplicatesFoundForModal.push({
            newReward: newReward,
            existingReward: existingDuplicateInDB,
            type: "existingDuplicateInDB",
          });
        } else {
          newRewardsToAdd.push(newReward);
        }
      }
    }

    // Create new rewards that don't have duplicates
    for (const reward of newRewardsToAdd) {
      try {
        const payload = { gym_id: gymId, reward: reward };
        const response = await createRewardAPI(payload);
        if (response?.status === 201 || response?.status === 200) {
          setRewards((prev) => [...prev, response.data]);
        } else {
          showToast({
            type: "error",
            title: `Failed to create reward ${reward.gift}: ${
              response?.detail || "Unknown error"
            }`,
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: `Failed to create reward ${reward.gift}`,
        });
        console.error("Create reward API error:", error);
      }
    }

    setIsLoading(false);

    // Handle duplicates - CRITICAL FIX: Close AddEdit modal FIRST, then show duplicate modal
    if (duplicatesFoundForModal.length > 0) {
      setDuplicateInfo(duplicatesFoundForModal);
      // Close the AddEdit modal first
      setIsAddEditModalVisible(false);
      // Then show the duplicate modal with a delay to ensure proper modal transition
      setTimeout(() => {
        setIsDuplicateModalVisible(true);
      }, 300);
    } else {
      handleCloseAddEditModal();
      if (newRewardsToAdd.length > 0) {
        await fetchRewards();
      }
    }
  }, [
    multipleRewardsInput,
    editIndex,
    selectedReward,
    rewards,
    fetchRewards,
    handleCloseAddEditModal,
    handleUpdateReward,
  ]);

  const handleDuplicateAction = useCallback(
    async (actionType, rewardPair) => {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Gym ID is not available" });
        setIsLoading(false);
        return;
      }

      const { newReward, existingReward, type } = rewardPair;

      if (actionType === "replace") {
        if (type === "existingDuplicateInDB") {
          const updatedRewardPayload = { ...newReward, id: existingReward.id };
          await handleUpdateReward(updatedRewardPayload);
        } else {
          showToast({
            type: "error",
            title: "Cannot replace a non-existent reward or unknown type.",
          });
        }
      } else if (actionType === "addAnyway") {
        try {
          const payload = { gym_id: gymId, reward: newReward };
          const response = await createRewardAPI(payload);
          if (response?.status === 201 || response?.status === 200) {
            setRewards((prev) => [...prev, response.data]);
          } else {
            showToast({
              type: "error",
              title: `Failed to create duplicate reward ${newReward.gift}: ${
                response?.detail || "Unknown error"
              }`,
            });
          }
        } catch (error) {
          showToast({
            type: "error",
            title: `Failed to create duplicate reward ${newReward.gift}`,
          });
          console.error("Create duplicate reward API error:", error);
        }
      }

      // Remove the processed duplicate from the list
      setDuplicateInfo((prevInfo) =>
        prevInfo.filter((item) => item !== rewardPair)
      );

      // If this was the last duplicate, close the modal and refresh
      if (duplicateInfo.length === 1) {
        setIsDuplicateModalVisible(false);
        setDuplicateInfo([]);
        await fetchRewards();
      }
      setIsLoading(false);
    },
    [fetchRewards, handleUpdateReward, duplicateInfo]
  );

  const handleToggleCardDropdown = useCallback((rewardId) => {
    setOpenDropdownId((prevId) => (prevId === rewardId ? null : rewardId));
  }, []);

  // Handle duplicate modal close
  const handleCloseDuplicateModal = useCallback(async () => {
    setIsDuplicateModalVisible(false);
    setDuplicateInfo([]);
    await fetchRewards();
  }, [fetchRewards]);

  if (isLoading) {
    // You can keep a loader here, or display shimmers if you prefer.
    // return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Manage Fitness Rewards"}
      />

      {rewards.length === 0 && !isLoading ? (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="fitness" size={80} color="#007AFF" />
            <View style={styles.emptyIconOverlay}>
              <Ionicons name="trophy" size={40} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.emptyStateText}>No Rewards Yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create exciting rewards to keep your members motivated!
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleOpenAddModal();
            }}
          >
            <Text style={styles.startButtonText}>Create First Reward</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          {openDropdownId && (
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => setOpenDropdownId(null)}
              activeOpacity={1}
            />
          )}

          <Pressable
            onPress={() => setOpenDropdownId(null)}
            style={{ height: "100%", paddingBottom: 50 }}
          >
            <FlatList
              data={isLoading ? [1, 2, 3, 4, 5] : rewards}
              renderItem={({ item, index }) => {
                return isLoading ? (
                  <ShimmerNewsArticle
                    showImage={true}
                    imagePosition="left"
                    style={styles.newsShimmer}
                  />
                ) : (
                  <RewardCard
                    item={item}
                    index={index}
                    onPress={() => handleShowDetails(item)}
                    onEdit={handleEditReward}
                    onDelete={handleDeleteReward}
                    isDropdownOpen={openDropdownId === item?.id}
                    onToggleDropdown={handleToggleCardDropdown}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                  />
                );
              }}
              keyExtractor={(item, index) =>
                isLoading ? `shimmer-${index}` : item?.id?.toString()
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </>
      )}

      {((!isLoading && rewards.length > 0) ||
        (!isLoading && rewards.length === 0 && isAddEditModalVisible)) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleOpenAddModal();
          }}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* AddEdit Modal */}
      <AddEditRewardModal
        visible={isAddEditModalVisible}
        onClose={handleCloseAddEditModal}
        rewardsInput={multipleRewardsInput}
        setRewardsInput={setMultipleRewardsInput}
        onSubmit={handleSubmitRewards}
        isEditing={editIndex !== null}
        isLoading={isLoading}
      />

      {/* Detail Modal */}
      <RewardDetailsModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        reward={selectedReward}
      />

      {/* CRITICAL FIX: Platform-specific modal rendering */}
      {Platform.OS === "ios" ? (
        // iOS Modal - with overlay handling for proper modal hierarchy
        <Modal
          visible={isDuplicateModalVisible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          presentationStyle="overFullScreen"
          onRequestClose={handleCloseDuplicateModal}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseDuplicateModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <DuplicateXPConfirmationModal
                visible={isDuplicateModalVisible}
                duplicatePairs={duplicateInfo}
                onAction={handleDuplicateAction}
                onClose={handleCloseDuplicateModal}
                isLoading={isLoading}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        // Android Modal - simple rendering without overlay conflicts
        isDuplicateModalVisible && (
          <DuplicateXPConfirmationModal
            visible={isDuplicateModalVisible}
            duplicatePairs={duplicateInfo}
            onAction={handleDuplicateAction}
            onClose={handleCloseDuplicateModal}
            isLoading={isLoading}
          />
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  emptyIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    padding: 5,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    elevation: 3,
  },
  startButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 500,
  },
  newsShimmer: {
    marginVertical: 8,
    marginHorizontal: 4,
  },
  // Enhanced modal overlay for both iOS and Android compatibility
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RewardsScreen;
