import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
  Image,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
  Feather,
} from "@expo/vector-icons";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { getPrizeListAPI, updateGivenPrizeAPI } from "../../services/Api";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FitnessLoader from "../../components/ui/FitnessLoader";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../components/home/finances/TabHeader";
import PrizeMemberCard from "../../components/prize/PrizeMemberCard";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import NoDataComponent from "../../utils/noDataComponent";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const Prizes = () => {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [activePrizes, setActivePrizes] = useState([]);
  const [prizeHistory, setPrizeHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailHistoryModalVisible, setDetailHistoryModalVisible] =
    useState(false);
  const [selectedHistoryReward, setSelectedHistoryReward] = useState(null);
  const handleGiftAction = (item) => {
    setSelectedPrize(item);
    setModalVisible(true);
  };
  const [activeTab, setActiveTab] = useState("active_prize");
  const filterValidPrizes = (prizes) => {
    return prizes.filter(
      (prize) =>
        prize &&
        prize.gift !== null &&
        prize.gift !== undefined &&
        prize.gift.trim() !== "" &&
        prize.client_name &&
        prize.client_name.trim() !== ""
    );
  };

  const confirmGiftGiven = async () => {
    const today = new Date().toISOString().split(".")[0];
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

      const payload = {
        reward_id: selectedPrize.id,
      };
      const response = await updateGivenPrizeAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Prize list updated successfully",
        });
        getPrizeList();
        setModalVisible(false);
        setSelectedPrize(null);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch Prize lists",
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

  const getPrizeList = async () => {
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
      const response = await getPrizeListAPI(gymId, status);
      if (response?.status === 200) {
        const data = Array.isArray(response?.data) ? response.data : [];

        // Filter out invalid entries
        const validData = filterValidPrizes(data);

        if (status === "pending") {
          setActivePrizes(validData);
          setPrizeHistory([]);
        } else {
          setPrizeHistory(validData);
          setActivePrizes([]);
        }
      } else {
        // Set empty arrays on error
        setActivePrizes([]);
        setPrizeHistory([]);
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch Prize lists",
        });
      }
    } catch (error) {
      // Set empty arrays on error
      setActivePrizes([]);
      setPrizeHistory([]);
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      getPrizeList();
    }, [status, activeTab])
  );
  const showDetailsAlert = (item) => {
    setSelectedReward(item);
    setDetailModalVisible(true);
  };

  const showHistoryDetailsAlert = (item) => {
    setSelectedHistoryReward(item);
    setDetailHistoryModalVisible(true);
  };

  const handleActiveTab = (tab) => {
    setActiveTab(tab);
    if (tab == "active_prize") {
      setStatus("pending");
    } else {
      setStatus("given");
    }
  };

  const tabs = [
    { id: "active_prize", label: "Active Prize", icon: "add-circle" },
    { id: "given_prize", label: "Given Prize", icon: "time" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProfileImage = (member) => {
    return member?.image_url || member?.client_name?.charAt(0) || "U";
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text="Prize Management"
      />

      <TabHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleActiveTab}
      />

      {activeTab === "active_prize" && (
        <ScrollView style={styles.container}>
          {activePrizes && activePrizes.length > 0 ? (
            <View style={styles.cardGrid}>
              {activePrizes.map((member) => (
                <PrizeMemberCard
                  key={member.id}
                  member={member}
                  onButtonClick={() => handleGiftAction(member)}
                  onCardClick={() => showDetailsAlert(member)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.ZeroDataContainer}>
              <NoDataComponent icon="gift" />
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === "given_prize" && (
        <ScrollView style={styles.container}>
          {prizeHistory && prizeHistory.length > 0 ? (
            <View style={styles.cardGrid}>
              {prizeHistory.map((member) => (
                <PrizeMemberCard
                  key={member.id}
                  member={member}
                  onButtonClick={() => showHistoryDetailsAlert(member)}
                  onCardClick={() => showHistoryDetailsAlert(member)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.ZeroDataContainer}>
              <NoDataComponent icon="gift" />
            </View>
          )}
        </ScrollView>
      )}

      {/* Enhanced Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="gift" size={32} color="#FF5757" />
              </View>
              <Text style={styles.enhancedModalTitle}>
                Confirm Prize Delivery
              </Text>
            </View>

            <View style={styles.memberInfoContainer}>
              {selectedPrize?.image_url ? (
                <Image
                  source={{ uri: getProfileImage(selectedPrize) }}
                  style={styles.memberAvatar}
                />
              ) : (
                <View style={styles.avatarRound}>
                  <Text style={styles.avatarText}>
                    {selectedPrize?.client_name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {selectedPrize?.client_name}
                </Text>
                <Text style={styles.memberSubtitle}>Prize Recipient</Text>
              </View>
            </View>

            <View style={styles.prizeInfoBox}>
              <Text style={styles.prizeLabel}>Prize Item</Text>
              <Text style={styles.prizeValue}>{selectedPrize?.gift}</Text>
            </View>

            <Text style={styles.confirmationText}>
              Have you delivered this prize to the member?
            </Text>

            <View style={styles.enhancedModalButtons}>
              <TouchableOpacity
                style={[styles.enhancedModalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={18} color="#666" />
                <Text style={styles.cancelButtonText}>Not Yet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.enhancedModalButton, styles.confirmButton]}
                onPress={confirmGiftGiven}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Yes, Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Active Prize Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <View style={styles.enhancedDetailModalContainer}>
            <View style={styles.enhancedDetailModalContent}>
              <View style={styles.modalHandle} />

              {/* Header Section */}
              <View style={styles.detailModalHeader}>
                <View style={styles.headerLeft}>
                  {selectedReward?.image_url ? (
                    <Image
                      source={{ uri: getProfileImage(selectedReward) }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.avatarRound}>
                      <Text style={styles.avatarText}>
                        {selectedReward?.client_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailMemberName}>
                      {selectedReward?.client_name}
                    </Text>
                    <View style={styles.statusBadge}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color="#FF5757"
                      />
                      <Text style={styles.statusText}>Pending Delivery</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <FontAwesome5 name="star" size={16} color="#FFD700" />
                  <Text style={styles.pointsText}>{selectedReward?.xp} XP</Text>
                </View>
              </View>

              {/* Achievement Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Achievement Details</Text>
                </View>
                <View style={styles.achievementCard}>
                  <View style={styles.achievementRow}>
                    <Text style={styles.achievementLabel}>Achieved On</Text>
                    <Text style={styles.achievementValue}>
                      {formatDate(selectedReward?.achieved_date)}
                    </Text>
                  </View>
                  <View style={styles.achievementRow}>
                    <Text style={styles.achievementLabel}>Points Earned</Text>
                    <View style={styles.pointsRow}>
                      <FontAwesome5 name="star" size={14} color="#FFD700" />
                      <Text style={styles.achievementValue}>
                        {selectedReward?.xp} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Prize Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Prize Information</Text>
                </View>
                <View style={styles.prizeCard}>
                  <View style={styles.prizeHeader}>
                    <MaterialCommunityIcons
                      name="gift-outline"
                      size={24}
                      color="#FF5757"
                    />
                    <Text style={styles.prizeTitle}>
                      {selectedReward?.gift}
                    </Text>
                  </View>
                  <Text style={styles.prizeDescription}>
                    Reward earned for exceptional performance and dedication to
                    fitness goals.
                  </Text>
                  <View style={styles.deliveryStatus}>
                    <MaterialCommunityIcons
                      name="truck-delivery"
                      size={16}
                      color="#FF9800"
                    />
                    <Text style={styles.deliveryText}>Awaiting Delivery</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.enhancedCloseButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.enhancedCloseButtonText}>
                  Close Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Enhanced History Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailHistoryModalVisible}
        onRequestClose={() => setDetailHistoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailHistoryModalVisible(false)}
        >
          <View style={styles.enhancedDetailModalContainer}>
            <View style={styles.enhancedDetailModalContent}>
              <View style={styles.modalHandle} />

              {/* Header Section */}
              <View style={styles.detailModalHeader}>
                <View style={styles.headerLeft}>
                  {selectedHistoryReward?.image_url ? (
                    <Image
                      source={{ uri: getProfileImage(selectedHistoryReward) }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.avatarRound}>
                      <Text style={styles.avatarText}>
                        {selectedHistoryReward?.client_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailMemberName}>
                      {selectedHistoryReward?.client_name}
                    </Text>
                    <View style={[styles.statusBadge, styles.completedBadge]}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={[styles.statusText, styles.completedText]}>
                        Delivered
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <FontAwesome5 name="star" size={16} color="#FFD700" />
                  <Text style={styles.pointsText}>
                    {selectedHistoryReward?.xp} XP
                  </Text>
                </View>
              </View>

              {/* Timeline Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="timeline"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Timeline</Text>
                </View>
                <View style={styles.timelineContainer}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIcon}>
                      <MaterialCommunityIcons
                        name="trophy"
                        size={16}
                        color="#FF5757"
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>
                        Achievement Unlocked
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(selectedHistoryReward?.achieved_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineIcon, styles.deliveredIcon]}>
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#4CAF50"
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Prize Delivered</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(selectedHistoryReward?.given_date)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Prize Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Prize Information</Text>
                </View>
                <View style={styles.prizeCard}>
                  <View style={styles.prizeHeader}>
                    <MaterialCommunityIcons
                      name="gift-outline"
                      size={24}
                      color="#FF5757"
                    />
                    <Text style={styles.prizeTitle}>
                      {selectedHistoryReward?.gift}
                    </Text>
                  </View>
                  <Text style={styles.prizeDescription}>
                    Successfully delivered reward for outstanding fitness
                    achievement.
                  </Text>
                  <View
                    style={[styles.deliveryStatus, styles.completedDelivery]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text
                      style={[
                        styles.deliveryText,
                        styles.completedDeliveryText,
                      ]}
                    >
                      Successfully Delivered
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.enhancedCloseButton}
                onPress={() => setDetailHistoryModalVisible(false)}
              >
                <Text style={styles.enhancedCloseButtonText}>
                  Close Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
    paddingHorizontal: 20,
  },

  ZeroDataContainer: {
    paddingVertical: 70,
  },

  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  enhancedModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: responsiveWidth(6),
    width: responsiveWidth(85),
    maxHeight: responsiveHeight(70),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: responsiveHeight(3),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  enhancedModalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  memberInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 15,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  avatarRound: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: responsiveFontSize(18),
    fontWeight: "600",
    color: "#ff5757",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
  },
  memberSubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginTop: 2,
  },
  prizeInfoBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  prizeLabel: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  prizeValue: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    fontWeight: "bold",
    marginTop: 4,
  },
  confirmationText: {
    fontSize: responsiveFontSize(16),
    textAlign: "center",
    color: "#333",
    marginBottom: responsiveHeight(3),
    lineHeight: 24,
  },
  enhancedModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  enhancedModalButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveHeight(1.8),
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#FF5757",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },

  // Enhanced Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  enhancedDetailModalContainer: {
    width: "100%",
    backgroundColor: "transparent",
  },
  enhancedDetailModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: responsiveWidth(5),
    width: "100%",
    maxHeight: responsiveHeight(80),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: responsiveHeight(3),
  },
  headerLeft: {
    flexDirection: "row",
    flex: 1,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  detailMemberName: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: "flex-start",
    gap: 4,
  },
  completedBadge: {
    backgroundColor: "#F1F8E9",
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    color: "#FF5757",
    fontWeight: "500",
  },
  completedText: {
    color: "#4CAF50",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    color: "#FF8F00",
  },
  sectionContainer: {
    marginBottom: responsiveHeight(2.5),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
  },
  achievementCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
  },
  achievementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementLabel: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  achievementValue: {
    fontSize: responsiveFontSize(14),
    color: "#333",
    fontWeight: "600",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prizeCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: responsiveWidth(4),
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  prizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  prizeTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  prizeDescription: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedDelivery: {
    gap: 6,
  },
  deliveryText: {
    fontSize: responsiveFontSize(13),
    color: "#FF9800",
    fontWeight: "500",
  },
  completedDeliveryText: {
    color: "#4CAF50",
  },
  timelineContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deliveredIcon: {
    backgroundColor: "#F1F8E9",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    color: "#333",
  },
  timelineDate: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 15,
    marginVertical: 8,
  },
  enhancedCloseButton: {
    backgroundColor: "#FF5757",
    padding: responsiveHeight(2),
    borderRadius: 15,
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enhancedCloseButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
  },

  // Legacy styles for compatibility
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(4),
  },
  title: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#FF5757",
  },
  toggleButton: {
    backgroundColor: "#FF5757",
    padding: responsiveWidth(2),
    borderRadius: 8,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: responsiveWidth(4),
  },
  // prizeCard: {
  //   backgroundColor: "white",
  //   borderRadius: 12,
  //   padding: responsiveWidth(4),
  //   marginBottom: responsiveHeight(2),
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   elevation: 3,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeName: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: 4,
  },
  prizeDate: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginBottom: 4,
  },
  prizeDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    width: "30%",
  },
  giftContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "65%",
  },
  giftText: {
    marginLeft: 4,
    fontSize: responsiveFontSize(14),
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#FF5757",
    padding: 6,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFontSize(16),
    color: "#666",
    marginTop: responsiveHeight(4),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(4),
  },
  emptySubText: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(10),
  },
  viewMoreText: {
    color: "#FF5757",
    fontSize: responsiveFontSize(12),
  },
  prizeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  completedButton: {
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
});

export default Prizes;
