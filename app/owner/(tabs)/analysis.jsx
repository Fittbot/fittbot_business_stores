import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart, BarChart } from "react-native-chart-kit";
import PieChart from "react-native-pie-chart";
import OwnerHeader from "../../../components/ui/OwnerHeader";
import { getAnalysisAPI, getProfileDataAPI } from "../../../services/Api";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getToken } from "../../../utils/auth";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import TabHeader from "../../../components/home/finances/TabHeader";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { useNavigation } from "../../../context/NavigationContext";
import MenuItems from "../../../components/ui/Header/tabs";
import EmptyStateCard from "../../../components/ui/EmptyDataComponent";
import { showToast } from "../../../utils/Toaster";

const screenWidth = Dimensions.get("window").width;
const { width, height } = Dimensions.get("window");

const GymAnalysis = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [entrantsModalVisible, setEntrantsModalVisible] = useState(false);
  const [hourlyAggData, setHourlyAggData] = useState({});
  const [analysisData, setAnalysisData] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Hourly");
  const tabScrollViewRef = useRef(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];
  const [gymName, setGymName] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("Hourly");
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [profile, setProfile] = useState("");
  const { isSideNavVisible, closeSideNav } = useNavigation();
  const { toggleSideNav } = useNavigation();
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);

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

  const handleHeaderTabChange = (tab) => {
    setActiveTabHeader(tab);
    scrollY.setValue(0);
  };

  const userData = {
    name: "Yesh Singh",
    email: "Yeshsingh@gmail.com",
  };

  useEffect(() => {
    getToken("gym_name").then(setGymName);
  }, []);

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const fetchData = async () => {
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
      const response = await getAnalysisAPI(gymId);
      if (response?.status === 200) {
        setHourlyAggData(response.data.hourly_agg || {});
        setAnalysisData(response.data.analysis || {});
        setMonthlyData(response.data.monthly_data || {});
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const renderHourlyModalContent = () => {
    return Object.keys(hourlyAggData).map((timeRange, index) => (
      <View key={index} style={styles.modalTextContainer}>
        <Text style={styles.modalTimeText}>{timeRange}</Text>
        <Text style={styles.modalDataText}>
          {hourlyAggData[timeRange]} attendees
        </Text>
      </View>
    ));
  };

  const chartConfig = {
    backgroundGradient: true,
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `#4266BD`,
    labelColor: (opacity = 1) => `#4266BD`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: "#4266BD",
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: "#4266BD",
    },
  };

  const getSections = () => {
    if (!analysisData) return [];

    const sections = [
      {
        id: "gender",
        title: "Gender Distribution",
        data: Object.entries(analysisData.gender || {}).map(
          ([name, value]) => ({
            name,
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "members",
      },
      {
        id: "goal_data",
        title: "Member Goals",
        data: Object.entries(analysisData.goal_data || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "members",
      },
      {
        id: "expenditure",
        title: "Expenditure Distribution",
        data: Object.entries(analysisData.expenditure || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "finance",
      },
      {
        id: "goal_income",
        title: "Income by Goal",
        data: Object.entries(analysisData.goal_income || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "finance",
      },
      {
        id: "training_data",
        title: "Training Types",
        data: Object.entries(analysisData.training_data || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "members",
      },
      {
        id: "training_income",
        title: "Income by Training Type",
        data: Object.entries(analysisData.training_income || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "finance",
      },
      {
        id: "expenditure_data",
        title: "Detailed Expenditure",
        data: Object.entries(analysisData.expenditure_data || {}).map(
          ([name, value]) => ({
            name: formatName(name),
            value: Number(value), // Ensure value is a number
          })
        ),
        category: "finance",
      },
    ];

    // Filter out any sections with no data
    return sections.filter(
      (section) => section.data && section.data.length > 0
    );
  };

  function formatName(name) {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const renderPieChart = (data, title, key) => {
    // Add more defensive checks

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const chartWidth = Dimensions.get("window").width - 60;

    // Make sure all values are numbers and none are NaN
    const values = data.map((item) => {
      const val = Number(item.value);
      return isNaN(val) ? 0 : val;
    });

    // Don't render if all values are 0
    if (values.every((v) => v === 0)) {
      return null;
    }

    // Ensure we don't exceed our color array length
    const colors = [
      "#AAC6FF",
      "#6395FF",
      "#3677FF",
      "#0E5CFF",
      "#0E5CFF",
      "#2F69E4",
      "#0035A4",
    ];
    // const colors = [
    //   '#33817B',
    //   'rgba(0, 47, 43, 0.8)',
    //   '#80B0AC',
    //   '#597371',
    //   '#ACB9B8',
    //   '#00625A',
    //   '#00A897',
    // ];
    // const colors = [
    //   '#FF7043',
    //   '#FFA726',
    //   '#FFCC80',
    //   '#FFD54F',
    //   '#64B5F6',
    //   '#4FC3F7',
    //   '#81C784',
    // ];

    return (
      <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        {/* <Text style={styles.sectionTitle}>{title}</Text> */}
        <MaskedView
          maskElement={
            <Text style={[styles.sectionTitle, { paddingLeft: 10 }]}>
              {title}
            </Text>
          }
        >
          <LinearGradient
            colors={["#7397E1", "#2159D0"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.sectionTitle]}>{title}</Text>
          </LinearGradient>
        </MaskedView>

        <View style={styles.chartContainer}>
          <PieChart
            widthAndHeight={chartWidth * 0.6}
            series={values}
            sliceColor={colors.slice(0, values.length)}
          />

          <View style={styles.legendContainer}>
            {data.map((item, index) => (
              <View key={`${key}-${index}`} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: colors[index % colors.length] },
                  ]}
                />
                <Text style={styles.legendText}>
                  {item.name}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
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

  useFocusEffect(
    useCallback(() => {
      getProfileData();
    }, [])
  );
  const renderLineChart = (title, dataKey) => {
    const currentYear = new Date().getFullYear().toString();
    const previousYear = (new Date().getFullYear() - 1).toString();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentYearData = Array(12).fill(0);
    const previousYearData = Array(12).fill(0);

    if (monthlyData[currentYear]) {
      monthlyData[currentYear].forEach((entry) => {
        const monthIndex = parseInt(entry.month_year.split("-")[1], 10) - 1;
        currentYearData[monthIndex] = entry[dataKey] || 0;
      });
    }

    if (monthlyData[previousYear]) {
      monthlyData[previousYear].forEach((entry) => {
        const monthIndex = parseInt(entry.month_year.split("-")[1], 10) - 1;
        previousYearData[monthIndex] = entry[dataKey] || 0;
      });
    }

    const validChartData = [...currentYearData, ...previousYearData].filter(
      (item) => item !== null && item !== undefined
    );

    const data = {
      labels: months,
      datasets: [
        {
          data: currentYearData,
          color: (opacity = 1) => `rgba(66, 103, 189, 0.513)`,
          strokeWidth: 2,
          legend: `${title} (Current Year)`,
        },
        {
          data: previousYearData,
          color: (opacity = 1) => `#4266BD`,
          strokeWidth: 2,
          legend: `${title} (Previous Year)`,
        },
      ],
    };

    const chartWidth = Math.max(screenWidth * 1, months.length * 60);

    return (
      <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        <MaskedView
          maskElement={
            <Text style={[styles.sectionTitle, { paddingLeft: 10 }]}>
              {title}
            </Text>
          }
        >
          <LinearGradient
            colors={["#7397E1", "#2159D0"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.sectionTitle]}>{title}</Text>
          </LinearGradient>
        </MaskedView>

        <View style={styles.chartContainer}>
          {validChartData.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
            >
              <LineChart
                data={data}
                chartConfig={chartConfig}
                style={{
                  marginTop: 15,
                  borderRadius: 16,
                }}
                width={chartWidth}
                bezier={true}
                height={220}
                withInnerLines={false}
                withOuterLines={true}
                fromZero={false}
                yAxisInterval={1}
                verticalLabelRotation={0}
                segments={4}
                withDots={true}
                withShadow={false}
              />
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No data available</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <FitnessLoader />;
  }

  const tabs = [
    { id: "hourly", label: "Hourly", icon: "add-circle" },
    { id: "finance", label: "Finance", icon: "time" },
    { id: "members", label: "Members", icon: "checkmark-done" },
  ];

  const tabHeaders = [
    {
      title: "Hourly",
      iconType: "png",
      iconSource: require("../../../assets/images/header-icons/analysis.png"),
      bgImage: require("../../../assets/images/analysis/analysis_bg_2.png"),
    },
    {
      title: "Finance",
      iconType: "png",
      iconSource: require("../../../assets/images/header-icons/finance.png"),
      bgImage: require("../../../assets/images/analysis/analysis_bg_2.png"),
    },
    {
      title: "Members",
      iconType: "png",
      iconSource: require("../../../assets/images/header-icons/clients.png"),
      bgImage: require("../../../assets/images/analysis/analysis_bg_2.png"),
    },
  ];

  return (
    <View style={styles.container}>
      <HeaderComponent
        showHeader={true}
        headerTranslateY={headerTranslateY}
        gymName={gymName}
        tabHeaders={tabHeaders}
        activeTabHeader={activeTabHeader}
        setActiveTabHeader={handleHeaderTabChange}
        setShowHeader={() => {}}
        isMenuVisible={isMenuVisible}
        setIsMenuVisible={setIsMenuVisible}
        setShowBadgeSummary={setShowBadgeSummary}
        menuItems={menuItems}
        profile={profile}
        width={width}
        tabScrollViewRef={tabScrollViewRef}
        tabIndex={["Hourly", "Finance", "Members"]}
        color2={"#2159D0"}
        color1={"#7397E1"}
        toggleSideNav={toggleSideNav}
        headerName={"analysis"}
        gymlogo={gymLogo}
      />

      {isSideNavVisible && (
        <SideNavigation
          isVisible={isSideNavVisible}
          onClose={closeSideNav}
          userData={userData}
          color2={"#2159D0"}
          color1={"#7397E1"}
          profileData={profileData}
          gymLogo={gymLogo}
        />
      )}

      <Animated.View
        style={[styles.contentContainer, { paddingTop: contentPaddingTop }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <>
          {activeTabHeader === "Hourly" && (
            <>
              {Object.keys(hourlyAggData).length > 0 ? (
                <>
                  <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
                    <MaskedView
                      maskElement={
                        <Text
                          style={[styles.sectionTitle, { paddingLeft: 10 }]}
                        >
                          Hourly Analysis
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#7397E1", "#2159D0"]}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text style={[{ opacity: 0 }, styles.sectionTitle]}>
                          Hourly Analysis
                        </Text>
                      </LinearGradient>
                    </MaskedView>

                    <View style={styles.chartContainer}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <BarChart
                          data={{
                            labels: Object.keys(hourlyAggData),
                            datasets: [
                              {
                                data: Object.values(hourlyAggData),
                              },
                            ],
                          }}
                          width={Object.keys(hourlyAggData).length * 80}
                          height={280}
                          chartConfig={{
                            // backgroundColor: '#fff',
                            // backgroundGradientFrom: '#fff',
                            // backgroundGradientTo: '#fff',
                            // decimalPlaces: 0,
                            // color: (opacity = 1) => `rgba(0, 98, 90, 0.441)`,
                            // labelColor: (opacity = 1) =>
                            //   `rgba(0, 98, 90, 0.941)`,
                            // style: {
                            //   borderRadius: 16,
                            // },
                            // barPercentage: 0.7,
                            backgroundGradient: true,
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `#4266BD`,
                            labelColor: (opacity = 1) => `#4266BD`,
                            style: {
                              borderRadius: 16,
                            },
                            propsForDots: {
                              r: "3",
                              strokeWidth: "2",
                              stroke: "#4266BD",
                            },
                            propsForBackgroundLines: {
                              strokeWidth: 1,
                              stroke: "#4266BD",
                            },
                          }}
                          style={styles.chartStyle}
                          // width={chartWidth}
                          bezier={true}
                          // height={220}
                          withInnerLines={true}
                          withOuterLines={false}
                          fromZero={true}
                          yAxisInterval={0.7}
                          verticalLabelRotation={0}
                          segments={4}
                          withDots={true}
                          withShadow={false}
                        />
                      </ScrollView>
                    </View>
                  </View>
                </>
              ) : (
                <View>
                  <Text style={styles.noHourTitle}>
                    No Hourly Data Available
                  </Text>
                  <Text style={styles.noHourSubTitle}>
                    Check back later for updates...
                  </Text>
                </View>
              )}
            </>
          )}

          {activeTabHeader === "Finance" && (
            <>
              {/* {Object.keys(monthlyData)?.length > 0 ? (
                <>
                  <FlatList
                    data={getSections()}
                    renderItem={({ item, index }) => {
                      return (
                        <View>
                          {index === 0 &&
                            renderLineChart(
                              'Income vs Time',
                              'income',
                              incomeModalVisible,
                              setIncomeModalVisible
                            )}
                          {item.category === 'finance' &&
                            renderPieChart(item.data, item.title, item.id)}
                        </View>
                      );
                    }}
                    keyExtractor={(item) => item?.id || index}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContainer}
                  />
                </>
              ) : (
                <EmptyStateCard />
              )} */}

              <ScrollView>
                {Object.keys(monthlyData).length > 0 ? (
                  renderLineChart("Income vs Time", "income")
                ) : (
                  <EmptyStateCard
                    title={"No Financial Data Available"}
                    message={
                      "We couldn't find any financial records to display. This could be because no transactions have been recorded yet or there might be an issue with data synchronization."
                    }
                  />
                )}

                {getSections().length > 0 ? (
                  getSections()?.map((item, index) => {
                    return (
                      <View key={index}>
                        {item.category === "finance" &&
                          renderPieChart(item.data, item.title, item.id)}
                      </View>
                    );
                  })
                ) : (
                  <EmptyStateCard
                    title={"No Financial Charts Available"}
                    message={
                      "We don't have enough financial data to generate charts. This could be because no financial categories have been set up or there's no transaction history yet."
                    }
                  />
                )}
              </ScrollView>
            </>
          )}

          {activeTabHeader === "Members" && (
            <ScrollView>
              {/* <FlatList
                data={getSections()}
                renderItem={({ item, index }) => {
                  return (
                    <View>
                      {index === 0 &&
                        renderLineChart(
                          'New Entrants vs Time',
                          'new_entrants',
                          entrantsModalVisible,
                          setEntrantsModalVisible
                        )}
                      {item.category === 'members' &&
                        renderPieChart(item.data, item.title, item.id)}
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContainer}
              /> */}

              {Object.keys(monthlyData).length > 0 ? (
                renderLineChart("New Entrants vs Time", "new_entrants")
              ) : (
                <EmptyStateCard
                  title={"No Member Data Available"}
                  message={
                    "We couldn't find any member data to display. This could be because no members have been added yet or there might be an issue with data synchronization."
                  }
                />
              )}

              {getSections().length > 0 ? (
                getSections()?.map((item, index) => {
                  return (
                    <View key={index}>
                      {item.category === "members" &&
                        renderPieChart(item.data, item.title, item.id)}
                    </View>
                  );
                })
              ) : (
                <EmptyStateCard
                  title={"No Member Charts Available"}
                  message={
                    "We don't have enough member data to generate demographic charts. This could be because member profiles are incomplete or we haven't collected enough information yet."
                  }
                />
              )}
            </ScrollView>
          )}
        </>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingBottom: 80,
  },
  header: {
    marginVertical: 16,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
  },
  flatListContainer: {
    paddingHorizontal: 10,
    paddingTop: 15,
    // backgroundColor: 'red',
    // marginTop: 5,
  },
  chartContainer: {
    width: Dimensions.get("window").width - 40,
    margin: 10,
    padding: 15,
    // paddingLeft: 5
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  sectionContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeaderContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 0,
  },
  chartWrapper: {
    alignItems: "center",
    marginVertical: 10,
  },
  actionContainer: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  linkText: {
    color: "#FF5757",
    fontWeight: "bold",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  legendContainer: {
    marginTop: 15,
    width: "100%",
    alignItems: "flex-start",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalScrollContent: {
    width: "100%",
  },
  modalTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FF5757",
  },
  modalTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalDataText: {
    fontSize: 15,
    color: "#666",
  },
  incomeDetailsContainer: {
    alignItems: "flex-end",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  chartStyle: {
    marginTop: 20,
    borderRadius: 10,
  },
  yearMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  yearMarkerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5757",
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  noHourTitle: {
    marginTop: 80,
    textAlign: "center",
    fontSize: 18,
    // color:""
  },
  noHourSubTitle: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 10,
  },
});

export default GymAnalysis;
