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

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

// Mock data for the member cards
const memberData1 = [
  {
    id: 1,
    name: "Michael Chen",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
  {
    id: 2,
    name: "Hayley Kim",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
  {
    id: 3,
    name: "Getty",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
  {
    id: 4,
    name: "John",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Isolated Protein Shaker",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
  {
    id: 5,
    name: "Valery Sysoev",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
  {
    id: 6,
    name: "Emily Sea",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: false,
  },
];

const memberData2 = [
  {
    id: 1,
    name: "Michael Chen",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: true,
  },

  {
    id: 6,
    name: "Emily Sea",
    memberId: "MM0045",
    date: "21 May 2025",
    xp: "1503",
    prize: "Free Protein Shake",
    imageUrl: "/api/placeholder/80/80",
    given_date: "21 May 2025",
    is_given: true,
  },
];

const Prizes = () => {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
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
        id: selectedPrize.id,
        given_date: today,
        is_given: true,
      };
      const response = await updateGivenPrizeAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response?.message,
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

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPrizeList = async () => {
    // setIsLoading(true);
    // try {
    //   const gymId = await getToken("gym_id");
    //   if (!gymId) {
    //     showToast({
    //       type: "error",
    //       title: "GymId is not available",
    //     });
    //     return;
    //   }
    //   const response = await getPrizeListAPI(gymId);
    //   if (response?.status === 200) {
    //     setActivePrizes(response?.data.active_prizes);
    //     setPrizeHistory(response?.data.prize_history);
    //   } else {
    //     showToast({
    //       type: "error",
    //       title: response?.detail || "Failed to fetch Prize lists",
    //     });
    //   }
    // } catch (error) {
    //   const errorMessage = "Something went wrong, please try again.";
    //   showToast({
    //     type: "error",
    //     title: errorMessage,
    //   });
    // } finally {
    //   setIsLoading(false);
    // }
  };

  useFocusEffect(
    useCallback(() => {
      getPrizeList();
    }, [])
  );
  const showDetailsAlert = (item) => {
    setSelectedReward(item);
    setDetailModalVisible(true);
  };

  const showHistoryDetailsAlert = (item) => {
    setSelectedHistoryReward(item);
    setDetailHistoryModalVisible(true);
  };

  const renderActiveItem = ({ item }) => (
    <TouchableOpacity onPress={() => showDetailsAlert(item)}>
      <View style={styles.prizeCard}>
        <View style={styles.prizeInfo}>
          <View style={styles.prizeTop}>
            <View style={styles.nameContainer}>
              <Text style={styles.prizeName} numberOfLines={1}>
                {item.client_name}
              </Text>
              <Text style={styles.prizeDate}>
                Achieved on: {item.achieved_date.replace("T", " ")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleGiftAction(item)}
            >
              <Feather name="check-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.prizeDetails}>
            <View style={styles.pointsContainer}>
              <MaterialCommunityIcons
                name="star-circle"
                size={20}
                color="#FF5757"
              />
              <Text style={styles.pointsText} numberOfLines={1}>
                {item.xp.toLocaleString()} Pts
              </Text>
            </View>

            <FontAwesome5 name="gift" size={18} color="#FF5757" />
            <Text style={styles.giftText} numberOfLines={1}>
              {truncateText(item.gift, 50)}
              {item.gift.length > 50 && (
                <Text style={styles.viewMoreText}> (View More)</Text>
              )}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity onPress={() => showHistoryDetailsAlert(item)}>
      <View style={styles.historyCard}>
        <View style={styles.prizeInfo}>
          <View style={styles.prizeTop}>
            <View style={styles.nameContainer}>
              <Text style={styles.prizeName} numberOfLines={1}>
                {item.client_name}
              </Text>
              <Text style={styles.prizeDate}>
                Achieved: {item.achieved_date.replace("T", " ")}
              </Text>
              <Text style={styles.prizeDate}>
                Given: {item.given_date.replace("T", " ")}
              </Text>
            </View>
            <View style={styles.completedButton}>
              <Feather name="check-circle" size={20} color="#4CAF50" />
            </View>
          </View>

          <View style={styles.prizeDetails}>
            <View style={styles.pointsContainer}>
              <MaterialCommunityIcons
                name="star-circle"
                size={20}
                color="#FF5757"
              />
              <Text style={styles.pointsText} numberOfLines={1}>
                {item.xp.toLocaleString()} Pts
              </Text>
            </View>

            <FontAwesome5 name="gift" size={18} color="#FF5757" />
            <Text style={styles.giftText} numberOfLines={1}>
              {truncateText(item.gift, 50)}
              {item.gift.length > 50 && (
                <Text style={styles.viewMoreText}> (View More)</Text>
              )}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyStateView = ({ message }) => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons
        name="trophy-outline"
        size={responsiveWidth(20)}
        color="#FF5757"
      />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubText}>
        Achievements will appear here when members earn rewards
      </Text>
    </View>
  );

  const tabs = [
    { id: "active_prize", label: "Active Prize", icon: "add-circle" },
    { id: "given_prize", label: "Given Prize", icon: "time" },
  ];

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* <OwnerHeader /> */}
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text="Prize Management"
      />

      <TabHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* <View style={styles.header}>
        <Text style={styles.title}>
          {showHistory ? 'Prize History' : 'Active Prizes'}
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.toggleButtonText}>
            {showHistory ? 'View Active' : 'View History'}
          </Text>
        </TouchableOpacity>
      </View> */}

      {activeTab === "active_prize" && (
        <ScrollView style={styles.container}>
          <View style={styles.cardGrid}>
            {memberData1.map((member) => (
              <PrizeMemberCard key={member.id} member={member} />
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === "given_prize" && (
        // <FlatList
        //   data={prizeHistory}
        //   renderItem={renderHistoryItem}
        //   keyExtractor={(item) => item.id}
        //   contentContainerStyle={styles.listContainer}
        //   ListEmptyComponent={<EmptyStateView message="No Prize History" />}
        // />
        <ScrollView style={styles.container}>
          <View style={styles.cardGrid}>
            {memberData2.map((member) => (
              <PrizeMemberCard key={member.id} member={member} />
            ))}
          </View>
        </ScrollView>
      )}

      {/* {showHistory ? (
        <FlatList
          data={prizeHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<EmptyStateView message="No Prize History" />}
        />
      ) : (
        <FlatList
          data={activePrizes}
          renderItem={renderActiveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<EmptyStateView message="No Active Prizes" />}
        />
      )} */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Prize Delivery</Text>
            <Text style={styles.modalText}>
              Has the {selectedPrize?.gift} been given to{" "}
              {selectedPrize?.client_name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmGiftGiven}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.detailModalTitle}>Prize Details</Text>
              <View style={styles.detailModalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedReward?.client_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Achieved On:</Text>
                  <Text style={styles.detailValue}>
                    {selectedReward?.achieved_date.replace("T", " ")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Points Achieved:</Text>
                  <Text style={styles.detailValue}>{selectedReward?.xp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prize:</Text>
                  <Text style={styles.detailValue}>{selectedReward?.gift}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.detailModalTitle}>Prize Details</Text>
              <View style={styles.detailModalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryReward?.client_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Achieved On:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryReward?.achieved_date.replace("T", " ")}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prize Given On:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryReward?.given_date.replace("T", " ")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Points Achieved:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryReward?.xp}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prize:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistoryReward?.gift}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailHistoryModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
    justifyContent: "space-around",
    padding: 10,
  },
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
  prizeCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
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
  pointsText: {
    marginLeft: 4,
    fontSize: responsiveFontSize(14),
    color: "#FF5757",
    fontWeight: "600",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: responsiveWidth(5),
    width: responsiveWidth(80),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: responsiveFontSize(16),
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: "40%",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  confirmButton: {
    backgroundColor: "#FF5757",
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(4),
  },
  emptyText: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#FF5757",
    marginTop: responsiveHeight(2),
    textAlign: "center",
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
  prizeCard: {
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

  prizeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  nameContainer: {
    flex: 1,
    marginRight: 12,
  },

  prizeName: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: 4,
  },

  actionButton: {
    backgroundColor: "#FF5757",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  prizeDetails: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },

  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    minWidth: responsiveWidth(25),
    maxWidth: responsiveWidth(35),
    flexShrink: 0,
  },

  pointsText: {
    marginLeft: 4,
    fontSize: responsiveFontSize(14),
    color: "#FF5757",
    fontWeight: "600",
    flex: 1,
  },

  giftContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  giftText: {
    marginLeft: 4,
    fontSize: responsiveFontSize(14),
    color: "#333",
    flex: 1,
    flexWrap: "wrap",
  },

  viewMoreText: {
    color: "#FF5757",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },
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

  completedButton: {
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  detailModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  detailModalBody: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  closeButton: {
    backgroundColor: "#FF5757",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end", // This will push the content to the bottom
  },

  detailModalContainer: {
    width: "100%",
    backgroundColor: "transparent",
  },

  detailModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: responsiveWidth(5),
    width: "100%",
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },

  detailModalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveHeight(2.5),
    textAlign: "center",
  },

  detailModalBody: {
    marginBottom: responsiveHeight(2.5),
  },

  detailRow: {
    marginBottom: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(2),
  },

  detailLabel: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginBottom: responsiveHeight(0.5),
  },

  detailValue: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    fontWeight: "500",
  },

  closeButton: {
    backgroundColor: "#FF5757",
    padding: responsiveHeight(1.8),
    borderRadius: 12,
    alignItems: "center",
    marginTop: responsiveHeight(1),
    marginHorizontal: responsiveWidth(2),
  },

  closeButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
  },
});

export default Prizes;
