import React, { useState } from "react";
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

const { width } = Dimensions.get("window");

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
            {/* <View>
              <Text style={styles.comparisonText}>
                "12% higher than yesterday!"
              </Text>
            </View> */}
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
              Please{" "}
              <Link style={styles.noClientLink} href="/owner/clientform">
                <Text>Add Clients</Text>
              </Link>{" "}
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

const AttendanceModal = ({ isVisible, toggleAttendanceModal, names = [] }) => (
  <Modal
    visible={isVisible}
    animationType="fade"
    transparent
    onRequestClose={toggleAttendanceModal}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Attendance List</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>Name</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>In</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Out</Text>
        </View>

        <FlatList
          data={names}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.clientRow}>
              <View style={styles.nameSection}>
                <View style={styles.greenDot} />
                <Text style={styles.clientName} numberOfLines={1}>
                  {item.name || "N/A"}
                </Text>
              </View>
              <Text style={styles.timeText}>{item.in_time || "N/A"}</Text>
              <Text style={styles.timeText}>{item.out_time || "N/A"}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={toggleAttendanceModal}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

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
  let memberIcon, peopleIcon, enquiryIcon;
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
    console.error("Failed to load enquiry icon");
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
      title: "Plans & Batches",
      icon: require("../../assets/images/ASSAIGNMENT 1.png"),
      path: "/owner/manageplans",
    },
    {
      id: 4,
      title: "Assignments",
      icon: require("../../assets/images/ASSIGNMENT01 2.png"),
      path: "/owner/assigntrainer",
    },
    {
      id: 5,
      title: "Brochures",
      icon: require("../../assets/images/3 peprs 2 2.png"),
      path: "/owner/gymPlans",
    },
    ,
    {
      id: 6,
      title: "Receipts",
      icon: require("../../assets/images/RECEPT 1.png"),
      path: "/owner/paidMembersReceiptListPage",
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
}) => {
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    useState(false);
  const router = useRouter();

  const toggleAttendanceModal = () => {
    setIsAttendanceModalVisible(!isAttendanceModalVisible);
  };

  const attendanceDataToUse = attendanceData || {
    current: 80,
    expected: 200,
    names: Array(10)
      .fill()
      .map((_, i) => ({
        name: `Member ${i + 1}`,
        in_time: "9:00 AM",
        out_time: "10:30 AM",
      })),
  };

  const membersDataToUse = membersData || {
    totalMembers: 240,
    activeMembers: 100,
    trainers: 20,
    enquiries: 100,
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
        names={attendanceDataToUse?.names}
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
        // expiringMembers={yourExpiringMembersData}
        // expiredMembers={yourExpiredMembersData}
        // trendData={yourAttendanceTrendData}
        // onNavigateToExpiringList={() => navigate('/your-custom-path')}
        // onNavigateToExpiredList={() => navigate('/your-custom-path')}
      />

      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    // paddingBottom: 20,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontWeight: "bold",
    color: "#555",
  },
  clientRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  nameSection: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#50C878",
    marginRight: 8,
  },
  clientName: {
    flex: 1,
  },
  timeText: {
    flex: 1,
    textAlign: "center",
  },
  listContainer: {
    paddingVertical: 8,
  },
  closeButton: {
    backgroundColor: "#8A2BE2",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
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
});

export default OverViewTabs;
