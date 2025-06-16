import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
// import { getClientRewardsAPI } from '../../../services/clientApi';
import AsyncStorage from "@react-native-async-storage/async-storage";
// import FitnessLoader from '../FitnessLoader';
// import { BadgeSummaryModal, BadgeDetailsModal } from '../badgedetails';
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import EarnXP from "./EarnXp";
// import { showToast } from '../../../utils/Toaster';
import FitnessLoader from "../ui/FitnessLoader";
import { BadgeDetailsModal, BadgeSummaryModal } from "../ui/badgedetails";
import { showToast } from "../../utils/Toaster";
import TabHeader from "./finances/TabHeader";
import BadgeDetailsPage from "./BadgeDetailsPage";
import { getGymRewardsQuestAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";

const Rewards = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("earnXp");

  const fetchRewardDetails = async () => {
    setLoading(true);
    try {
      const response = await getGymRewardsQuestAPI();

      if (response?.status === 200) {
        setQuests(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error fetching rewards",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong 111. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardDetails();
  }, []);

  if (loading) {
    return <FitnessLoader />;
  }

  const tabs = [
    { id: "earnXp", label: "User XP Quests" },
    { id: "badges", label: "User Badges" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TabHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "earnXp" ? (
          <EarnXP quest={quests} />
        ) : (
          <BadgeDetailsPage />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    marginTop: -20,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FB",
    padding: 16,
    borderRadius: 8,
  },
  infoIcon: {
    width: "10%",
  },
  infoText: {
    fontSize: 12,
    color: "#0154A0",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#0154A0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777",
  },
  activeTabText: {
    color: "#0154A0",
    fontWeight: "600",
  },
  badgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    marginTop: 10,
  },
  badgeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgeIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  xpIcon: {
    width: 25,
    height: 25,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "absolute",
    left: 0,
    top: 20,
    fontSize: 12,
  },
  xpText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    position: "relative",
    height: 10,
    marginBottom: 16,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0154A0",
    borderRadius: 5,
  },
  nextLevelXp: {
    position: "absolute",
    right: 0,
    top: 20,
    fontSize: 14,
    color: "#0154A0",
  },
  nextBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextBadgeText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },
  smallBadgeIcon: {
    width: 45,
    height: 50,
  },
  // New reward cards styling
  rewardsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  rewardsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  rewardCard: {
    width: 145,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  selectedRewardCard: {
    // borderWidth: 2,
    // borderColor: '#0154A0',
  },
  rewardImageContainer: {
    height: 120,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  rewardImageBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
  rewardInfoContainer: {
    padding: 8,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardXpIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardXp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0154A0",
  },
  historyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    marginRight: 12,
  },
  rewardItemTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  rewardItemDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  rewardItemPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 12,
    color: "#0154A0",
    fontWeight: "500",
  },
  monthlyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  monthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  monthName: {
    fontSize: 12,
    fontWeight: "500",
  },
  monthPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  workoutText: {
    paddingTop: 5,
    color: "rgba(0,0,0,0.3)",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    flex: 1,
  },
  historyPoints: {
    flex: 1,
    textAlign: "center",
  },
  historyReward: {
    flex: 1,
    textAlign: "right",
  },
  rewardTitleNo: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5,
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredModalContent: {
    width: "60%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  rewardDetailContainer: {
    alignItems: "center",
    paddingBottom: 15,
    borderWidth: 2,
    borderRadius: 25,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  rewardDetailImage: {
    width: "100%",
    height: 150,
    marginBottom: 16,
  },
  rewardDetailTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
});

export default Rewards;
