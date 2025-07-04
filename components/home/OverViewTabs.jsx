import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import MaskedView from "@react-native-masked-view/masked-view";
import Footer from "../ui/Home/footer";
import MembershipDashboard from "./MembershipDashboard";
import useBackHandler from "../UseBackHandler ";

const { width, height } = Dimensions.get("window");

const CircularProgress = ({ percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
      </View>
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <Defs>
          <SvgLinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#5B2B9B" />
            <Stop offset="100%" stopColor="#FF3C7B" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90, 50, 50)"
        />
      </Svg>
    </View>
  );
};

const AttendanceCard = ({ attendanceData, toggleAttendanceModal }) => {
  const percentage =
    attendanceData?.expected > 0
      ? Math.round((attendanceData.current / attendanceData.expected) * 100)
      : 0;

  return (
    <TouchableOpacity
      style={styles.attendanceCard}
      onPress={toggleAttendanceModal}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderTitle}>Attendance</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.attendanceLeftSection}>
          <View style={styles.circularProgressContainer}>
            <CircularProgress
              percentage={percentage}
              radius={40}
              strokeWidth={10}
              activeColor="#8A2BE2"
              inactiveColor="#E0E0E0"
            />
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <Image
                source={require("../../assets/images/trophy.png")}
                style={styles.trophyIcon}
              />
              <Text style={styles.statLabel}>Present</Text>
              <Text style={styles.statValue}>
                {attendanceData?.current || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Image
                source={require("../../assets/images/trophy.png")}
                style={styles.trophyIcon}
              />
              <Text style={styles.statLabel}>Expected</Text>
              <Text style={styles.statValue}>
                {attendanceData?.expected || 0}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.attendanceRightSection}>
          <Image
            source={require("../../assets/images/admin attendance.png")}
            style={styles.attendanceImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AttendanceSection = ({ attendanceData, toggleAttendanceModal }) => {
  const router = useRouter();
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.attendanceContainer}>
        {!attendanceData || attendanceData?.expected === 0 ? (
          <TouchableOpacity
            style={[styles.attendanceCard, styles.noDataCard]}
            onPress={() => router.push("/owner/clientform")}
          >
            <Text style={styles.noDataText}>
              Please <Text style={styles.noClientLink}>Add Clients </Text>
              to view attendance
            </Text>
          </TouchableOpacity>
        ) : (
          <AttendanceCard
            attendanceData={attendanceData}
            toggleAttendanceModal={toggleAttendanceModal}
          />
        )}
      </View>
    </View>
  );
};

const AttendanceModal = ({
  isVisible,
  toggleAttendanceModal,
  names = [],
  onLoadMore,
  hasMoreData = false,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}) => {
  const [page, setPage] = useState(1);

  const handleLoadMore = useCallback(() => {
    if (hasMoreData && !isLoading && onLoadMore) {
      setPage((prevPage) => prevPage + 1);
      onLoadMore(page + 1);
    }
  }, [hasMoreData, isLoading, onLoadMore, page]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      setPage(1);
      onRefresh();
    }
  }, [onRefresh]);

  const formatTime = (timeString) => {
    if (!timeString || timeString === "N/A") return timeString;

    try {
      const [hours, minutes] = timeString.split(":");
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const renderAttendanceItem = ({ item, index }) => (
    <View style={styles.modernAttendanceItem}>
      <View style={styles.modernProfileContainer}>
        <View style={styles.modernAvatarWrapper}>
          <LinearGradient
            colors={["#e5383b", "#7b2cbf"]}
            style={styles.modernAvatarGradient}
          >
            {item.profile_pic ? (
              <Image
                source={{ uri: item.profile_pic }}
                style={styles.modernAvatar}
              />
            ) : (
              <View style={styles.modernAvatarDefault}>
                <Text style={styles.modernAvatarText}>
                  {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
        <View style={styles.modernNameSection}>
          <Text style={styles.modernMemberName} numberOfLines={1}>
            {item.name || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.modernTimeContainer}>
        <View style={styles.modernTimeCard}>
          <View style={styles.modernTimeHeader}>
            <View
              style={[styles.modernStatusDot, { backgroundColor: "#10B981" }]}
            />
            <Text style={styles.modernTimeTitle}>Entry</Text>
          </View>
          <Text style={styles.modernTimeValue}>
            {formatTime(item.in_time) || "N/A"}
          </Text>
        </View>

        <View style={styles.modernTimeCard}>
          <View style={styles.modernTimeHeader}>
            <View
              style={[
                styles.modernStatusDot,
                { backgroundColor: item.out_time ? "#EF4444" : "#94A3B8" },
              ]}
            />
            <Text style={styles.modernTimeTitle}>Exit</Text>
          </View>
          <Text
            style={[
              styles.modernTimeValue,
              !item.out_time && styles.modernPendingText,
            ]}
          >
            {item.out_time ? formatTime(item.out_time) : "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.modernFooterLoader}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.modernLoadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.modernEmptyState}>
      <View style={styles.modernEmptyIcon}>
        <Text style={styles.modernEmptyIconText}>📊</Text>
      </View>
      <Text style={styles.modernEmptyTitle}>No Attendance Today</Text>
      <Text style={styles.modernEmptySubtitle}>
        Members will appear here once they check in
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={toggleAttendanceModal}
      statusBarTranslucent
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />
      <LinearGradient
        colors={["#7b2cbf", "#e5383b"].reverse()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernHeader}
      >
        <View style={styles.modernHeaderContent}>
          <TouchableOpacity
            style={styles.modernBackButton}
            onPress={toggleAttendanceModal}
          >
            <Text style={styles.modernBackIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.modernHeaderInfo}>
            <Text style={styles.modernHeaderTitle}>Today's Attendance</Text>
            <View style={styles.modernStatsRow}>
              <View style={styles.modernStatBadge}>
                <Text style={styles.modernStatNumber}>{names.length}</Text>
                <Text style={styles.modernStatLabel}>Present</Text>
              </View>
              <View style={styles.modernStatBadge}>
                <Text style={styles.modernStatNumber}>
                  {names.filter((item) => item.out_time).length}
                </Text>
                <Text style={styles.modernStatLabel}>Checked Out</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.modernContent}>
        <FlatList
          data={names}
          keyExtractor={(item, index) => `${item.id || index}-${index}`}
          renderItem={renderAttendanceItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.modernList,
            names.length === 0 && styles.modernEmptyList,
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#667eea", "#764ba2"]}
              tintColor="#667eea"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.modernSeparator} />}
        />
      </View>
    </Modal>
  );
};

const StatCard = ({ title, value, description, icon, color }) => {
  const colorArray = color || ["#8A2BE2", "#FF1493"];

  return (
    <View style={styles.statCard}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={colorArray}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <MaskedView
            maskElement={
              <Text style={styles.cardTitle}>{title || "Title"}</Text>
            }
          >
            <LinearGradient
              colors={["#5B2B9B", "#FF3C7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ justifyContent: "center" }}
            >
              <Text style={[{ opacity: 0 }, styles.cardTitle]}>
                {title || "Title"}
              </Text>
            </LinearGradient>
          </MaskedView>
        </LinearGradient>
      </View>

      <Text style={styles.cardDescription}>{description || ""}</Text>
      <View style={styles.cardBody}>
        <MaskedView
          maskElement={<Text style={styles.cardValue}>{value || 0}</Text>}
        >
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.cardValue]}>{value || 0}</Text>
          </LinearGradient>
        </MaskedView>
        <View style={styles.iconContainer}>
          {icon ? (
            <Image
              source={icon}
              style={styles.cardIcon}
              defaultSource={require("../../assets/images/trophy.png")}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </View>
      <View style={styles.navigationIconContainer}>
        <LinearGradient
          colors={["#8A2BE2", "#FF1493"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.navIconBackground}
        >
          <View style={styles.navIconWrapper}>
            <Image
              source={require("../../assets/images/chevron-right.png")}
              style={styles.navigationIcon}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const MembershipOverview = ({ membersData }) => {
  let memberIcon, peopleIcon, enquiryIcon, trainerIcon;
  const router = useRouter();

  try {
    memberIcon = require("../../assets/images/MEMBERS_F 1.png");
  } catch (err) {
    console.error("Failed to load member icon");
  }

  try {
    peopleIcon = require("../../assets/images/icon people left.png");
  } catch (err) {
    console.error("Failed to load people icon");
  }

  try {
    enquiryIcon = require("../../assets/images/ENQUIRY (1) 1.png");
  } catch (err) {
    console.error("Failed to load enquiry icon");
  }

  try {
    trainerIcon = require("../../assets/images/home/TRAINER.png");
  } catch (err) {
    console.error("Failed to load trainer icon");
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.cardRow}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/owner/client",
              params: {
                is_active: false,
              },
            })
          }
        >
          <StatCard
            title="Total Members"
            value={membersData?.total_members}
            description="Total Clients Paid & Unpaid"
            icon={memberIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/owner/client",
              params: {
                is_active: true,
              },
            })
          }
        >
          <StatCard
            title="Active Members"
            value={membersData?.active_members}
            description="Current Month Total Paid Clients"
            icon={peopleIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity onPress={() => router.push("/owner/trainerform")}>
          <StatCard
            title="Total Trainers"
            value={membersData?.total_trainers}
            description="Total Number of Available Trainers"
            icon={trainerIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/owner/addEnquiry")}>
          <StatCard
            title="Active Enquiries"
            value={membersData?.total_pending_enquiries}
            description="Total Number of pending Enquiries"
            icon={enquiryIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickLinks = ({ router }) => {
  const quickLinks = [
    {
      id: 1,
      title: "Add Clients",
      icon: require("../../assets/images/icon people 2.png"),
      path: "/owner/clientform",
    },
    {
      id: 2,
      title: "Templates",
      icon: require("../../assets/images/paper 2 1.png"),
      path: "/owner/manageNutritionAndWorkoutTemplate",
    },
    {
      id: 3,
      title: "Receipts",
      icon: require("../../assets/images/RECEPT 1.png"),
      path: "/owner/paidMembersReceiptListPage",
    },
    {
      id: 4,
      title: "Plans & Batches",
      icon: require("../../assets/images/ASSAIGNMENT 1.png"),
      path: "/owner/manageplans",
    },
    {
      id: 5,
      title: "Assignments",
      icon: require("../../assets/images/ASSIGNMENT01 2.png"),
      path: "/owner/assigntrainer",
    },
    {
      id: 6,
      title: "Brochures",
      icon: require("../../assets/images/3 peprs 2 2.png"),
      path: "/owner/gymPlans",
    },
  ];

  return (
    <View>
      <LinearGradient
        colors={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quickLinksContainer}
      >
        <MaskedView
          maskElement={<Text style={styles.quickLinksTitle}>Quick Links</Text>}
        >
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.quickLinksTitle]}>
              Quick Links
            </Text>
          </LinearGradient>
        </MaskedView>
      </LinearGradient>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {quickLinks.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkItem}
            onPress={() => router.push(link.path)}
          >
            <View style={styles.iconContainer2}>
              <Image source={link.icon} style={styles.icon2} />
              <Text style={styles.linkTitle}>{link.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const OverViewTabs = ({
  attendanceData,
  membersData,
  invoiceData,
  aboutToExpireList,
  expiredMembersList,
  attendanceChartData,
  onLoadMoreAttendance,
  hasMoreAttendanceData = false,
  isLoadingAttendance = false,
  onRefreshAttendance,
  isRefreshingAttendance = false,
}) => {
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    useState(false);
  const router = useRouter();

  const toggleAttendanceModal = () => {
    setIsAttendanceModalVisible(!isAttendanceModalVisible);
  };

  const attendanceDataToUse = attendanceData || {
    current: 0,
    expected: 0,
    names: [],
  };

  const membersDataToUse = membersData || {
    totalMembers: 0,
    activeMembers: 0,
    trainers: 0,
    enquiries: 0,
  };

  const invoiceDataToUse = invoiceData || { send: [], unsend: [] };

  useBackHandler();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContent}
    >
      <AttendanceSection
        attendanceData={attendanceDataToUse}
        toggleAttendanceModal={toggleAttendanceModal}
      />

      <AttendanceModal
        isVisible={isAttendanceModalVisible}
        toggleAttendanceModal={toggleAttendanceModal}
        names={attendanceDataToUse?.names || []}
        onLoadMore={onLoadMoreAttendance}
        hasMoreData={hasMoreAttendanceData}
        isLoading={isLoadingAttendance}
        onRefresh={onRefreshAttendance}
        isRefreshing={isRefreshingAttendance}
      />

      <MembershipOverview
        membersData={membersData}
        invoiceData={invoiceDataToUse}
      />

      <QuickLinks router={router} />

      <MembershipDashboard
        aboutToExpireList={aboutToExpireList}
        expiredMembersList={expiredMembersList}
        attendanceChartData={attendanceChartData}
      />

      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  attendanceContainer: {
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    marginTop: -20,
  },
  attendanceLeftSection: {
    width: "60%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  attendanceRightSection: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
  },
  circularProgressContainer: {
    width: "35%",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  progressTextContainer: {
    width: 80,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8A2BE2",
  },
  attendanceStats: {
    flexDirection: "column",
    marginLeft: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 5,
    borderRadius: 8,
    width: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: "white",
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  trophyIcon: {
    width: 15,
    height: 15,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  comparisonText: {
    fontSize: 12,
    color: "#aaa",
    fontStyle: "italic",
    fontWeight: "500",
  },
  attendanceImage: {
    width: 130,
    height: 120,
  },
  noDataCard: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
  },
  noClientLink: {
    color: "#8A2BE2",
    fontWeight: "bold",
  },
  fullScreenHeader: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "white",
    transform: [{ rotate: "180deg" }],
  },
  headerTitleContainer: {
    flex: 1,
  },
  fullScreenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  titleMask: {
    justifyContent: "center",
  },
  attendanceCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  attendanceList: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  attendanceListItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImageGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  defaultProfileContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultProfileText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8A2BE2",
  },
  nameContainer: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: "#666",
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeIconContainer: {
    marginRight: 8,
  },
  timeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeDetails: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pendingTime: {
    color: "#999",
    fontStyle: "italic",
  },
  separator: {
    height: 12,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.5,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  cardHeader: {
    height: 40,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
    height: 40,
  },
  cardTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  cardBody: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 500,
    color: "#333",
  },
  cardDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
    paddingHorizontal: 15,
  },
  cardIcon: {
    width: 60,
    height: 60,
  },
  quickLinksContainer: {
    marginTop: 16,
    backgroundColor: "#f8f0ff",
    borderRadius: 0,
    padding: 16,
  },
  quickLinksTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  linkItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 110,
  },
  iconContainer2: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  icon2: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  linkTitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
  },
  navigationIconContainer: {
    position: "absolute",
    top: 80,
    right: -18,
    alignSelf: "center",
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  navIconBackground: {
    width: 35,
    height: 35,
    borderRadius: 50,
  },
  navIconWrapper: {
    width: 35,
    height: 35,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  navigationIcon: {
    width: 20,
    height: 20,
  },
  modernHeader: {
    paddingTop: StatusBar.currentHeight + 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 50,
    // marginTop: 50,
  },
  modernHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernBackButton: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: Platform.OS === "ios" ? 0 : 5,
    // elevation: 3,
  },
  modernBackIcon: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  modernHeaderInfo: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  modernStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernStatBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modernStatNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  modernStatLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  modernContent: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  modernList: {
    padding: 16,
  },
  modernEmptyList: {
    flex: 1,
    justifyContent: "center",
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernAvatarWrapper: {
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modernAvatarDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5383b",
  },
  modernNameSection: {
    flex: 1,
  },
  modernMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modernMemberSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  modernTimeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  modernTimeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    minWidth: 75,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimeTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalise",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  modernSeparator: {
    height: 12,
  },
  modernFooterLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modernLoadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modernEmptyIconText: {
    fontSize: 32,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default OverViewTabs;
