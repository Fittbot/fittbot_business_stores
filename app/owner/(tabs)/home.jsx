import React, { lazy, Suspense, useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  getGymHomeDataAPI,
  getGymLocationAPI,
  getProfileDataAPI,
  updateGymLocationAPI,
} from "../../../services/Api";
import FitnessLoader from "../../../components/ui/FitnessLoader";
// import useBackHandler from '../../../components/UseBackHandler ';
import { getToken } from "../../../utils/auth";
import { useNavigation } from "../../../context/NavigationContext";
import MenuItems from "../../../components/ui/Header/tabs";
import Rewards from "../../../components/home/rewards";
import { registerForPushNotificationsAsync } from "../../../components/usePushNotifications";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import { addPunchOutAPI } from "../../../services/clientApi";
import useBackHandler from "../../../hooks/useBackHandler";
import { showToast } from "../../../utils/Toaster";

const RenderAnalyticsTab = lazy(() =>
  import("../../../components/home/LiveAnalyticsTab")
);
const OverViewTabs = lazy(() =>
  import("../../../components/home/OverViewTabs")
);
const RenderFinancesTab = lazy(() =>
  import("../../../components/home/RenderFinanceTab")
);
const RenderMembersTabs = lazy(() =>
  import("../../../components/home/RenderMembersTabs")
);
const UpdateGymLocationModal = lazy(() =>
  import("../../../components/home/UpdateGymLocationModal")
);
const HeaderComponent = lazy(() =>
  import("../../../components/ui/Header/HeaderComponent")
);
const SideNavigation = lazy(() =>
  import("../../../components/ui/Header/SideNavigation")
);
const MyLeaderboard = lazy(() =>
  import("../../../components/home/myleaderboard")
);

// Pre-load images
const BACKGROUND_IMAGES = {
  home: require("../../../assets/images/background/home.png"),
};

// Move constants outside component
const { width, height } = Dimensions.get("window");
const CONTAINER_HEIGHT = height * 0.2;
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

// Move tab headers configuration outside
const TAB_HEADERS = [
  {
    title: "All",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/progress.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },
  {
    title: "My Gym",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/my_gym.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },
  {
    title: "Newbies",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/newbies.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },
  {
    title: "Ledger",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/finance.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },
  {
    title: "Rewards",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/rewards.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },

  {
    title: "Leaderboard",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/leaderboard.png"),
    bgImage: BACKGROUND_IMAGES.home,
  },
];

export default function AllDashboard(props) {
  const [gymId, setGymId] = React.useState(null);
  React.useEffect(() => {
    getToken("gym_id").then((id) => setGymId(Number(id)));
  }, []);
  if (!gymId) return null;
  const url1 = "websocket_live";
  const url2 = "live";
  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <Dashboard {...props} />
    </WebSocketProvider>
  );
}

const Dashboard = () => {
  // State management
  const [selectedWorkoutStatsIndex, setSelectedWorkoutStatsIndex] = useState(0);
  const [selectedClientListIndex, setSelectedClientListIndex] = useState(0);
  const [attendanceData, setAttendanceData] = useState({
    current: 0,
    expected: 1,
    names: [],
  });
  const [isAttendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [activeTabHeader, setActiveTabHeader] = useState("All");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [gymName, setGymName] = useState("");
  const [aboutToExpireList, setAboutToExpireList] = useState([]);
  const [expiredMembersList, setExpiredMembersList] = useState([]);
  const [attendanceChartData, setAttendanceChartData] = useState([]);
  const [profile, setProfile] = useState("");
  const [menuItemsLoaded, setMenuItemsLoaded] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);

  const [analyticsData, setAnalyticsData] = useState({
    goalsSummary: {},
    trainingTypeSummary: {},
    muscleSummary: {},
    totalPresent: 0,
    liveCount: 0,
    present_clients: [],
    top_goal: "",
    top_training_type: "",
    top_muscle: "",
  });

  useFeedSocket(async (msg) => {
    if (
      msg.action === "get_initial_data" ||
      msg.action === "update_live_count"
    ) {
      setAnalyticsData({
        goalsSummary: msg.goals_summary || {},
        trainingTypeSummary: msg.training_type_summary || {},
        muscleSummary: msg.muscle_summary || {},
        totalPresent: msg.total_present || 0,
        liveCount: msg?.live_count || 0,
        present_clients: msg.present_clients || [],
        top_goal: msg.top_goal || "NA",
        top_training_type: msg.top_training_type || "NA",
        top_muscle: msg.top_muscle || "NA",
      });
    }
  });
  // Other state variables
  const [membersData, setMembersData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    retentionRate: 0,
    unpaidCount: 0,
    averageVisits: 0,
    averageAge: 0,
  });
  const [newEntrantData, setNewEntrantData] = useState({
    total: 0,
    averageAge: 0,
    trainingTypeSummary: {},
    batchSummary: {},
    details: [],
  });
  const [financialData, setFinancialData] = useState({
    incomeDetails: [],
    totalIncome: 0,
    expenditureDetails: [],
    totalExpenditure: 0,
    profit: 0,
  });

  const [isIncomeModalVisible, setIncomeModalVisible] = useState(false);
  const [isExpenditureModalVisible, setExpenditureModalVisible] =
    useState(false);

  // Refs and animations
  const tabScrollViewRef = useRef(null);
  const scrollY = useState(new Animated.Value(0))[0];
  const { isSideNavVisible, closeSideNav, toggleSideNav } = useNavigation();

  // User data
  const userData = {
    name: "Yesh Singh",
    email: "Yeshsingh@gmail.com",
  };

  // Animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const contentPaddingTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 20],
    extrapolate: "clamp",
  });

  const { menuItems } = MenuItems({ setIsMenuVisible });

  // Helper functions
  const toggleAttendanceModal = () =>
    setAttendanceModalVisible(!isAttendanceModalVisible);

  const getGymLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Location permission is required to set your gym's location.",
        });
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setIsLocationLoading(false);
      return location.coords;
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not get your current location. Please try again.",
      });
      setIsLocationLoading(false);
    }
  };

  const getProfileData = async () => {
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "GymID or OwnerID not found",
        });
        return;
      }

      const response = await getProfileDataAPI(gymId, ownerId, null, "owner");
      setProfileData(response?.data?.owner_data);
      setGymLogo(response?.data?.gym_data?.logo);
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    }
  };

  const updateGymLocation = async () => {
    try {
      setIsLocationLoading(true);
      const coords = await getGymLocation();
      if (!coords) {
        setIsLocationLoading(false);
        return;
      }
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setIsLocationLoading(false);
        return;
      }
      const payload = {
        gym_id: gymId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const response = await updateGymLocationAPI(payload);
      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Your gym location has been updated!",
        });
        setLocationModalVisible(false);
      } else {
        showToast({
          type: "error",
          title: response.detail || "Failed to update location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating your gym location",
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const checkGymLocation = async () => {
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym Id is not there",
        });
        return;
      }
      await registerForPushNotificationsAsync(ownerId);
      const response = await getGymLocationAPI(gymId);
      if (response.status === 200) {
        setLocationModalVisible(!response?.data);
      } else {
        showToast({
          type: "error",
          title: "Failed to check gym location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error checking gym location",
      });
    }
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Some Error Occured",
        });
        return;
      }

      const response = await getGymHomeDataAPI(gymId);

      if (response?.status === 200) {
        const data = response.data?.attendance || {};

        setAttendanceData({
          current: data.current_count || 0,
          expected: data.expected_count,
          names: data.details || [],
        });

        setInvoiceData(response.data?.invoice_data || []);

        const members = response.data?.members;
        let memberData = {
          total_members: members?.total_members,
          active_members: members?.active_members,
          total_trainers: members?.total_trainers,
          total_pending_enquiries: members?.total_pending_enquiries,
        };

        setMembersData(memberData);
        setAboutToExpireList(response.data?.expiry_list?.about_to_expire);
        setExpiredMembersList(response.data?.expiry_list?.expired);
        setAttendanceChartData(response.data?.attendance_chart);

        // const analytics = response.data?.analytics_summary || {};
        // setAnalyticsData({
        //   goalsSummary: analytics.goals_summary || {},
        //   trainingTypeSummary: analytics.training_type_summary || {},
        //   muscleSummary: analytics.muscle_summary || {},
        //   totalPresent: analytics.total_present || 0,
        // });
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again later.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // useBackHandler();

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceData();
      checkGymLocation();
      getToken("gym_name").then(setGymName);
      getProfileData();
    }, [])
  );

  const handleWorkoutStatsScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (width * 0.9));
    setSelectedWorkoutStatsIndex(index);
  };

  const handleClientListScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (width * 0.9));
    setSelectedClientListIndex(index);
  };

  const handleHeaderTabChange = (tab) => {
    setActiveTabHeader(tab);
    scrollY.setValue(0);
  };

  const renderContent = () => {
    const LoadingFallback = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5757" />
      </View>
    );

    switch (activeTabHeader) {
      case "All":
        return (
          <Suspense fallback={LoadingFallback}>
            <OverViewTabs
              styles={styles}
              attendanceData={attendanceData}
              toggleAttendanceModal={toggleAttendanceModal}
              membersData={membersData}
              isAttendanceModalVisible={isAttendanceModalVisible}
              invoiceData={invoiceData}
              members={attendanceData?.members}
              aboutToExpireList={aboutToExpireList}
              expiredMembersList={expiredMembersList}
              attendanceChartData={attendanceChartData}
            />
          </Suspense>
        );
      case "My Gym":
        return (
          <Suspense fallback={LoadingFallback}>
            <RenderAnalyticsTab
              styles={styles}
              analyticsData={analyticsData}
              attendanceData={attendanceData}
              selectedWorkoutStatsIndex={selectedWorkoutStatsIndex}
              handleWorkoutStatsScroll={handleWorkoutStatsScroll}
              handleClientListScroll={handleClientListScroll}
            />
          </Suspense>
        );
      case "Newbies":
        return (
          <Suspense fallback={LoadingFallback}>
            <RenderMembersTabs
              styles={styles}
              newEntrantData={newEntrantData}
              setBatchModal={setBatchModal}
              batchModal={batchModal}
              setModalVisible={setModalVisible}
              modalVisible={modalVisible}
              isLoading={isLoading}
            />
          </Suspense>
        );
      case "Ledger":
        return (
          <Suspense fallback={LoadingFallback}>
            <RenderFinancesTab
              styles={styles}
              fetchAttendanceData={fetchAttendanceData}
              financialData={financialData}
              isIncomeModalVisible={isIncomeModalVisible}
              setIncomeModalVisible={setIncomeModalVisible}
              isExpenditureModalVisible={isExpenditureModalVisible}
              setExpenditureModalVisible={setExpenditureModalVisible}
            />
          </Suspense>
        );
      case "Rewards":
        return (
          <Suspense fallback={LoadingFallback}>
            <Rewards />
          </Suspense>
        );
      case "Leaderboard":
        return (
          <Suspense fallback={LoadingFallback}>
            <MyLeaderboard />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={LoadingFallback}>
            <RenderAnalyticsTab
              styles={styles}
              analyticsData={analyticsData}
              attendanceData={attendanceData}
              selectedWorkoutStatsIndex={selectedWorkoutStatsIndex}
              handleWorkoutStatsScroll={handleWorkoutStatsScroll}
              handleClientListScroll={handleClientListScroll}
            />
          </Suspense>
        );
    }
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  return (
    <View style={styles.container}>
      <Suspense fallback={<View style={styles.headerPlaceholder} />}>
        <HeaderComponent
          showHeader={true}
          headerTranslateY={headerTranslateY}
          gymName={gymName}
          tabHeaders={TAB_HEADERS}
          activeTabHeader={activeTabHeader}
          setActiveTabHeader={handleHeaderTabChange}
          setShowHeader={() => {}}
          isMenuVisible={isMenuVisible}
          setIsMenuVisible={setIsMenuVisible}
          setShowBadgeSummary={setShowBadgeSummary}
          menuItems={menuItemsLoaded ? menuItems : []}
          profile={profile}
          width={width}
          tabScrollViewRef={tabScrollViewRef}
          tabIndex={[
            "All",
            "My Gym",
            "Newbies",
            "Ledger",
            "Rewards",
            "Leaderboard",
          ]}
          color1={"#7b2cbf"}
          color2={"#e5383b"}
          toggleSideNav={toggleSideNav}
          gymlogo={gymLogo}
        />
      </Suspense>

      {isSideNavVisible && (
        <Suspense fallback={null}>
          <SideNavigation
            isVisible={isSideNavVisible}
            onClose={closeSideNav}
            userData={userData}
            color1={"#5c2b9b"}
            color2={"#ff3c7a"}
            profileData={profileData}
            gymLogo={gymLogo}
          />
        </Suspense>
      )}

      <Animated.View
        style={[styles.contentContainer, { paddingTop: contentPaddingTop }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </Animated.View>

      <Suspense fallback={null}>
        <UpdateGymLocationModal
          styles={styles}
          isLocationModalVisible={isLocationModalVisible}
          updateGymLocation={updateGymLocation}
          isLocationLoading={isLocationLoading}
        />
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  contentContainer: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: "700",
    color: "#333",
  },
  navigationTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: width * 0.02,
    borderRadius: 12,
    padding: width * 0.02,
    marginBottom: height * 0.02,
  },
  navTab: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: 8,
  },
  activeNavTab: {
    backgroundColor: "#FF5757",
  },
  navTabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeNavTabText: {
    color: "#FFF",
    fontWeight: "700",
  },
  scrollViewContent: {
    paddingBottom: height * 0.1,
    backgroundColor: "#ffffff",
  },
  sectionContainer: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#FF5757",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  horizontalScrollView: {
    paddingHorizontal: width * 0.02,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
  },
  statCard: {
    width: width * 0.4,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.04,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIconContainer: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.08,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  cardTitle: {
    fontSize: width * 0.035,
    color: "#FF5757",
    marginBottom: height * 0.005,
  },
  cardValue: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#333",
  },
  halfWidthCard: {
    width: width * 0.4,
  },
  batchContainer: {
    paddingHorizontal: width * 0.05,
  },
  batchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: width * 0.04,
    borderRadius: 10,
    marginBottom: height * 0.01,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  batchName: {
    fontSize: width * 0.04,
    fontWeight: "500",
    color: "#333",
  },
  batchCount: {
    fontSize: width * 0.035,
    color: "#666",
  },
  profitContainer: {
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  profitGradient: {
    borderRadius: 15,
    padding: width * 0.05,
  },
  profitContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  profitIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: width * 0.03,
    marginBottom: height * 0.01,
  },
  profitLabel: {
    color: "#fff",
    fontSize: width * 0.04,
    textAlign: "center",
    marginBottom: height * 0.005,
  },
  profitValue: {
    color: "#fff",
    fontSize: width * 0.06,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  profitDetailsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profitDetailText: {
    color: "#fff",
    fontSize: width * 0.035,
  },
  chartPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.05,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: width * 0.05,
    height: height * 0.3,
  },
  chartPlaceholderText: {
    color: "#666",
    fontSize: width * 0.04,
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  emptyTabText: {
    fontSize: width * 0.05,
    color: "#666",
    textAlign: "center",
  },
  performanceInsightsContainer: {
    flexDirection: "column",
    paddingHorizontal: width * 0.05,
  },
  performanceInsightCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  performanceInsightTitle: {
    fontSize: width * 0.04,
    fontWeight: "600",
    marginLeft: width * 0.03,
    color: "#333",
  },
  performanceInsightValue: {
    fontSize: width * 0.06,
    fontWeight: "700",
    color: "#333",
    marginBottom: height * 0.005,
  },
  performanceInsightDescription: {
    fontSize: width * 0.035,
    color: "#666",
  },
  trainingDistributionBackground: {
    width: "100%",
    height: height * 0.3,
    borderRadius: 15,
    overflow: "hidden",
  },
  trainingScroll: {
    height: CONTAINER_HEIGHT,
  },
  trainingScrollContainer: {
    flexGrow: 1,
  },
  trainingDistributionOverlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: width * 0.01,
  },
  trainingProgressContainer: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 15,
    padding: width * 0.04,
  },
  trainingProgressItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  trainingProgressLabel: {
    flex: 2,
    fontSize: width * 0.035,
    color: "#333",
  },
  trainingProgressBar: {
    flex: 3,
    height: height * 0.02,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    marginHorizontal: width * 0.03,
  },
  trainingProgressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  trainingProgressCount: {
    fontSize: width * 0.035,
    fontWeight: "600",
    color: "#666",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: responsiveHeight(1),
  },

  flatListContainer: {
    width: "100%",
    alignItems: "center",
    textAlign: "center",
  },
  flatListContentContainer: {
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
  },
  pieChartContainer: {
    width: responsiveWidth(90),
    alignItems: "center",
    marginHorizontal: responsiveWidth(2),
  },

  greetingContainer: {
    marginTop: responsiveHeight(3),
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
    width: "100%",
  },
  greeting: {
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subGreeting: {
    fontSize: responsiveFontSize(16),
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    letterSpacing: 0.5,
  },
  sliderIndicator: {
    flexDirection: "row",
    marginTop: responsiveHeight(1),
  },
  dot: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    marginHorizontal: responsiveWidth(1),
  },
  activeDot: {
    backgroundColor: "#FF5757",
  },
  inactiveDot: {
    backgroundColor: "#E0E0E0",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    width: responsiveWidth(90),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    marginVertical: responsiveHeight(1.5),
    alignItems: "center",
    width: responsiveWidth(90),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: responsiveWidth(2),
    marginVertical: responsiveHeight(0.5),
  },
  colorDot: {
    width: responsiveWidth(3),
    height: responsiveWidth(3),
    borderRadius: responsiveWidth(1.5),
    marginRight: responsiveWidth(1),
  },
  labelText: {
    fontSize: responsiveFontSize(12),
    color: "#555",
  },
  chartConfig: {
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(255, 111, 60, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  },
  attendanceContainer: {
    flex: 1,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    paddingBottom: responsiveHeight(1),
  },
  attendanceCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    alignItems: "center",
    justifyContent: "center",
    width: responsiveWidth(90), // Maintain full width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  attendanceProgressText: {
    fontSize: responsiveFontSize(16), // Adjusted to be more responsive
    fontWeight: "bold",
    color: "#FF5757", // Optional: match the progress circle color
  },
  clientCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    width: responsiveWidth(90),
    height: responsiveHeight(30),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  clientScrollContent: {
    paddingVertical: responsiveHeight(1),
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: responsiveHeight(0.5),
    paddingVertical: responsiveHeight(0.5),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: responsiveWidth(2),
    backgroundColor: "#FFDDDD",
  },
  greenDot: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    backgroundColor: "#4CAF50",
    marginRight: responsiveWidth(2),
  },
  clientName: {
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    color: "#555",
  },

  legend: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginTop: responsiveHeight(1),
    textAlign: "center",
  },
  updatedGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#50C878",
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  updatedModalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  updatedModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
  },
  listContainer: {
    paddingVertical: 4,
  },
  updatedClientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  nameSection: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  updatedGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  updatedClientName: {
    fontSize: 15,
    color: "#333333",
    flex: 1,
  },
  timeText: {
    flex: 1,
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
  },
  updatedCloseButton: {
    backgroundColor: "#FF5757",
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updatedCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    paddingHorizontal: 16,
  },

  actionButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  viewReceiptsContainer: {
    alignItems: "center", // Center the button horizontally
    marginTop: 5, // Add some space above this button
    marginBottom: 20, // Add some space below this button
    paddingHorizontal: 16, // Match horizontal padding if needed
  },

  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 10,
  },

  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },

  // Header Row
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#FF5757",
    paddingVertical: 8,
    marginBottom: 8,
  },

  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    flex: 1, // Ensures equal spacing
    textAlign: "center",
  },

  // Table Row
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  rowText: {
    fontSize: 15,
    color: "#555",
    flex: 1, // Ensures equal spacing
    textAlign: "center",
  },

  scrollableList: {
    flexGrow: 0,
    marginBottom: 16,
  },

  closeButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  newEntrantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 120,
  },
  newEntrantIconContainer: {
    marginBottom: 12,
  },
  newEntrantTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  newEntrantValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  newEntrantModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  newEntrantModalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  // Modal Header
  newEntrantModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
    backgroundColor: "#FFFFFF",
  },
  newEntrantModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 4,
  },
  newEntrantModalSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  newEntrantHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  newEntrantHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    paddingRight: 8,
  },

  newEntrantList: {
    paddingVertical: 4,
  },
  newEntrantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  newEntrantNameCell: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  newEntrantDateCell: {
    flex: 1,
    textAlign: "left",
  },
  newEntrantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5757",
    marginRight: 8,
  },
  newEntrantText: {
    fontSize: 14,
    color: "#333333",
  },
  newEntrantCloseButton: {
    backgroundColor: "#FF5757",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  newEntrantCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  viewAllButton: {
    marginTop: 15,
  },
  viewAllText: {
    fontSize: width * 0.035,
    fontWeight: "500",
    color: "#FF5757",
    textDecorationLine: "underline",
    textAlign: "right",
  },
  modalContainerBatch: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 16,
  },
  batchItemModal: {
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  batchNameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  batchNameModal: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  batchCountModal: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  containerLive: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F7F7F7",
  },
  mainText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  noDataCard: {
    minHeight: 150,
  },
  noClient: {
    padding: 0,
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "bold",
  },
  locationInfoText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
    color: "#333",
  },
  locationUpdateButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 15,
    alignSelf: "center",
  },
  locationUpdateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  locationLoader: {
    marginVertical: 20,
  },
  addExpenseContainer: {
    alignItems: "flex-end",
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  addExpenseButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addExpenseText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
  },

  // Form styles
  formContainer: {
    width: "100%",
    marginVertical: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#FF5757",
    fontSize: 14,
    marginTop: 5,
  },

  // RNPicker styles
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
  },
  pickerPlaceholder: {
    color: "#888",
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerItemSelected: {
    backgroundColor: "#e8f5e9",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
  },
  pickerItemTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },

  // Modal button styles
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#a5d6a7",
    opacity: 0.7,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeIconButton: {
    padding: 8,
  },
  monthPickerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  monthPickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  monthPickerText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  incomeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#555",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  confirmModalText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  confirmCancelButtonText: {
    fontSize: 16,
    color: "#444",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
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
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
  },
});
