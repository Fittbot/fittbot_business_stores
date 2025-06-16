import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  FlatList,
  Animated,
  Image,
  TextInput,
} from "react-native";
import {
  FontAwesome,
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  deleteFeeStatusAPI,
  getClientsAPI,
  getFeeDetailsAPI,
  getPlansandBatchesAPI,
  getProfileDataAPI,
  updateFeeStatusAPI,
} from "../../../services/Api";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import { paymentOptions } from "../../../components/home/data";
import ReceiptModal from "../../../components/client/Receipt";
import { dateUtils } from "../../../utils/date";
import { getToken } from "../../../utils/auth";
import FeeDetailsModal from "../../../components/client/FeeDetailsModal";
import { showToast } from "../../../utils/Toaster";
import FeeStatusModal from "../../../components/client/FeeStatusModal";
import FilterModal from "../../../components/home/newbies/FilterModal";
import * as Animatable from "react-native-animatable";
import { exportClientsToExcel } from "../../../components/client/excelUtils";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { useNavigation } from "../../../context/NavigationContext";
import ClientsManagement from "../clientsManagement";
import NoDataComponent from "../../../utils/noDataComponent";
import useBackHandler from "../../../hooks/useBackHandler";

const { width, height } = Dimensions.get("window");
const BOTTOM_NAV_HEIGHT = 80;

// GST type options
const gstTypeOptions = [
  { label: "Inclusive", value: "inclusive" },
  { label: "Exclusive", value: "exclusive" },
  { label: "No GST", value: "no_gst" },
];

const SearchBar = React.memo(({ onPress, onChange, query }) => {
  const searchInputRef = useRef(null);

  return (
    <View style={searchBarStyles.searchContainer}>
      <View style={searchBarStyles.searchBar}>
        <Ionicons name="search-outline" size={18} color={"#666"} />
        <TextInput
          ref={searchInputRef}
          style={searchBarStyles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#666"
          onChangeText={onChange}
          value={query}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity onPress={onPress} style={searchBarStyles.filterButton}>
        <Ionicons size={20} name="filter-outline" />
      </TouchableOpacity>
    </View>
  );
});

const ClientListPage = () => {
  const { is_active } = useLocalSearchParams();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    batch: "",
    training: "",
    aim: "",
    feePaid: "",
  });

  const [activeFilter, setActiveFilter] = useState("All Clients");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeDetailsModalVisible, setFeeDetailsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalFee, setOriginalFee] = useState(0);
  const [discountedFee, setDiscountedFee] = useState(0);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");

  // New GST fields
  const [gstType, setGstType] = useState("no_gst");
  const [gstPercentage, setGstPercentage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [activeTabHeader, setActiveTabHeader] = useState("Clients");
  const tabScrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [gymName, setGymName] = useState("");
  const [gymData, setGymData] = useState(null);
  const router = useRouter();
  const flatListRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);
  useEffect(() => {
    if (is_active === "true") {
      setActiveFilter("Paid");
    } else {
      setActiveFilter("All Clients");
    }
  }, [is_active]);

  const [profile, setProfile] = useState("");

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const tabHeaders = [
    {
      title: "Clients",
      iconType: "png",
      iconSource: require("../../../assets/images/header-icons/clients.png"),
      bgImage: require("../../../assets/images/background/client.png"),
    },
    {
      title: "Import Clients",
      iconType: "png",
      iconSource: require("../../../assets/images/header-icons/import.png"),
      bgImage: require("../../../assets/images/background/client.png"),
    },
  ];

  const fetchClients = useCallback(async () => {
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
      const response = await getClientsAPI(gymId);
      if (response?.status === 200) {
        // Store gym data from response
        if (response?.gym_data) {
          setGymData(response.gym_data);
          setGymName(response.gym_data.name);
        }

        const data = response?.data.map((client, index) => ({
          id: client.client_id || index + 1,
          name: client.name || "N/A",
          age: client.age || "N/A",
          place: client.location || "N/A",
          batch: client.batch || "N/A",
          batch_id: client.batch_id || "N/A",
          training: client.training_type || "N/A",
          training_id: client.training_id || "N/A",
          feePaid: client.status === "active" ? "Paid" : "Not Paid",
          profile: client.profile || "",
          goal: client.goals || "N/A",
          contact: client.contact || "N/A",
          email: client.email || "N/A",
          lifestyle: client.lifestyle || "N/A",
          medical_issues: client.medical_issues || "N/A",
          bmi: client.bmi,
          joined_date: client.joined_date,
          gym_id: gymId,
          gym_client_id: client.gym_client_id || "",
          location: client.location || "",
          gender: client.gender || "",
          height: client.height || "N/A",
          weight: client.weight || "N/A",
          is_old_client: client.is_old_client || false,
        }));

        setClients(data);
        setFilteredClients(data);
        setIsLoading(false);
      } else if (response?.status === 201) {
        setClients([]);
        setFilteredClients([]);
        setIsLoading(false);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
        setIsLoading(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching clients",
      });
      setIsLoading(false);
    }
  }, []);

  const fetchPlansAndBatches = useCallback(async () => {
    try {
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
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching plans and batches",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlansAndBatches();
      fetchClients();
    }, [fetchPlansAndBatches, fetchClients])
  );

  const getActiveTab = () => {
    switch (activeTabHeader) {
      case "Clients":
        return "Clients";
      case "Import Clients":
        return "Import Clients";
      default:
        return "Clients";
    }
  };

  const activeTab = getActiveTab();

  const handleHeaderTabChange = useCallback(
    (tab) => {
      setActiveTabHeader(tab);
      scrollY.setValue(0);
    },
    [scrollY]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);

      const filterClients = () => {
        let filtered = clients;

        if (query.trim() !== "") {
          filtered = clients.filter(
            (client) =>
              (client.name &&
                client.name.toLowerCase().includes(query.toLowerCase())) ||
              (client.contact && client.contact.includes(query))
          );
        }

        if (activeFilter === "Paid") {
          filtered = filtered.filter((client) => client.feePaid === "Paid");
        } else if (activeFilter === "Unpaid") {
          filtered = filtered.filter((client) => client.feePaid === "Not Paid");
        }

        if (filters.batch) {
          filtered = filtered.filter(
            (client) => client.batch_id === filters.batch
          );
        }

        if (filters.training) {
          filtered = filtered.filter(
            (client) => client.training_id === filters.training
          );
        }

        if (filters.aim) {
          filtered = filtered.filter((client) => client.goal === filters.aim);
        }

        setFilteredClients(filtered);
      };

      filterClients();
    },
    [clients, activeFilter, filters]
  );

  const applyStatusFilter = useCallback(
    (status) => {
      setActiveFilter(status);

      const query = searchQuery.trim();
      let filtered = clients;

      if (query !== "") {
        filtered = clients.filter(
          (client) =>
            (client.name &&
              client.name.toLowerCase().includes(query.toLowerCase())) ||
            (client.contact && client.contact.includes(query))
        );
      }

      if (status === "Paid") {
        filtered = filtered.filter((client) => client.feePaid === "Paid");
      } else if (status === "Unpaid") {
        filtered = filtered.filter((client) => client.feePaid === "Not Paid");
      }

      setFilteredClients(filtered);
    },
    [clients, searchQuery]
  );

  const applyFilters = useCallback(() => {
    let filtered = [...clients];

    if (filters.name) {
      filtered = filtered.filter((client) =>
        client.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.batch) {
      filtered = filtered.filter((client) => client.batch_id === filters.batch);
    }

    if (filters.training) {
      filtered = filtered.filter(
        (client) => client.training_id === filters.training
      );
    }

    if (filters.aim) {
      filtered = filtered.filter((client) => client.goal === filters.aim);
    }

    if (filters.feePaid !== "") {
      filtered = filtered.filter(
        (client) => client.feePaid === filters.feePaid
      );
    }

    setFilteredClients(filtered);
    setFilterModalVisible(false);
  }, [clients, filters]);

  const resetFilters = useCallback(() => {
    setFilters({
      name: "",
      batch: "",
      training: "",
      aim: "",
      feePaid: "",
    });
    setFilteredClients(clients);
    setFilterModalVisible(false);
  }, [clients]);

  const toggleFeeStatus = useCallback((client) => {
    setSelectedClient(client);
    if (client.feePaid != "Paid" && client.is_old_client == false) {
      openFeeDetailsModal(client);
    }
  }, []);

  const openFeeDetailsModal = useCallback(async (client) => {
    try {
      const response = await getFeeDetailsAPI(client.training_id);
      if (response?.status === 200) {
        setSelectedClient(client);
        setOriginalFee(response?.data?.amount || 0);
        setSelectedPlan(response?.data);
        setDiscountedFee(response.data.amount || 0);
        setGstType("no_gst");
        setGstPercentage("");
        setFeeDetailsModalVisible(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Could not fetch fee details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch fee details",
      });
    }
  }, []);

  const handleOriginalFee = useCallback((value) => {
    if (value) {
      setOriginalFee(value);
      setDiscountedFee(0);
    }
  }, []);

  const updateFeeStatus = useCallback(async () => {
    if (selectedClient) {
      try {
        const payload = {
          client_id: selectedClient.id,
          gym_id: selectedClient.gym_id,
          type: "fees",
          plan_id: selectedPlan.id,
          fees: discountedFee ? discountedFee : originalFee,
          payment_method: selectedPaymentOption,
          payment_reference_number: paymentReferenceNumber,
          gst_type: gstType,
          gst_percentage:
            gstType !== "no_gst" ? parseFloat(gstPercentage) || 0 : 0,
        };

        const response = await updateFeeStatusAPI(payload);

        if (response?.status === 200) {
          await fetchClients();
          setFeeModalVisible(false);
          setSnackbarMessage(
            `Fee status for ${selectedClient.name} updated successfully`
          );
          showToast({
            type: "success",
            title: `Fee status for ${selectedClient?.name} updated successfully`,
          });
          setSnackbarVisible(true);
          setSelectedClient(null);
          applyStatusFilter(activeFilter);
        } else {
          showToast({
            type: "error",
            title: response?.message,
          });
        }
      } catch (error) {
        setSnackbarMessage("Failed to update fee status");
        setSnackbarVisible(true);
      }
    }
  }, [
    selectedClient,
    discountedFee,
    originalFee,
    selectedPaymentOption,
    paymentReferenceNumber,
    gstType,
    gstPercentage,
    fetchClients,
    applyStatusFilter,
    activeFilter,
  ]);

  const deleteFeeStatus = useCallback(async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await deleteFeeStatusAPI(selectedClient.id, gymId);

      if (response?.status === 200) {
        await fetchClients();
        setFeeModalVisible(false);
        setSnackbarMessage(
          `Fee status for ${selectedClient.name} updated successfully`
        );
        setSnackbarVisible(true);
        setSelectedClient(null);
        applyStatusFilter(activeFilter);
      }
    } catch (error) {
      setSnackbarMessage("Failed to update fee status");
      setSnackbarVisible(true);
    }
  }, [selectedClient, fetchClients, applyStatusFilter, activeFilter]);

  const renderClientRow = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: `/owner/client/${item.id}`,
            params: { client: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <Image
              source={{ uri: item.profile }}
              resizeMode="contain"
              style={styles.profileImage}
            />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            <View style={styles.clientDetails}>
              <View style={styles.detailItem}>
                <FontAwesome5 name="id-card" size={12} color="#666" />
                <Text style={styles.detailText}>{item.gym_client_id}</Text>
              </View>
              <View style={styles.detailItem}>
                <FontAwesome name="phone" size={12} color="#666" />
                <Text style={styles.detailText}>{item.contact}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => togglePunchOut(item.id)}
          ></TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => toggleFeeStatus(item)}
          >
            {item.feePaid === "Paid" ? (
              <View style={[styles.statusIndicator, styles.statusPaid]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
            ) : (
              <View style={[styles.statusIndicator, styles.statusUnpaid]}>
                <FontAwesome name="times" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [toggleFeeStatus]
  );

  const handleExport = useCallback(async () => {
    try {
      await exportClientsToExcel(filteredClients, "clients");
    } catch (error) {
      showToast({
        type: "error",
        title: "Export error",
        desc: error.message || "Unknown error creating Excel file",
      });
    }
  }, [filteredClients]);

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const SearchSection = useMemo(
    () => (
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search clients..."
          onChange={handleSearch}
          query={searchQuery}
          onPress={handleFilterPress}
        />
      </View>
    ),
    [searchQuery, handleSearch, handleFilterPress]
  );

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

  const FilterTabs = useMemo(
    () => (
      <View style={styles.filterTabsContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "All Clients" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("All Clients")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "All Clients" && styles.activeFilterTabText,
            ]}
          >
            All Clients
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "Paid" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("Paid")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "Paid" && styles.activeFilterTabText,
            ]}
          >
            Paid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "Unpaid" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("Unpaid")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "Unpaid" && styles.activeFilterTabText,
            ]}
          >
            Unpaid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, { flexDirection: "row" }]}
          onPress={handleExport}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#1F2937" />
          <Text style={styles.filterTabText}> Export</Text>
        </TouchableOpacity>
      </View>
    ),
    [activeFilter, applyStatusFilter, handleExport]
  );

  const EmptyMessage = useMemo(() => {
    if (filteredClients.length === 0) {
      return (
        <Text style={styles.noResults}>
          No clients match your search or filters.
        </Text>
      );
    }
    return null;
  }, [filteredClients.length]);

  const ClientsFlatList = useMemo(
    () => (
      <Animated.FlatList
        ref={flatListRef}
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClientRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.flatListContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + 70 },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {SearchSection}
            {FilterTabs}
            {EmptyMessage}
          </View>
        }
        // onScroll={Animated.event(
        //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        //   { useNativeDriver: false }
        // )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        stickyHeaderIndices={[0]}
      />
    ),
    [
      filteredClients,
      renderClientRow,
      SearchSection,
      FilterTabs,
      EmptyMessage,
      scrollY,
    ]
  );

  const renderContent = () => {
    switch (activeTabHeader) {
      case "Clients":
        if (clients.length === 0) {
          return (
            <View style={styles.noFeedContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={60}
                color="#CBD5E0"
              />
              <Text style={styles.noFeedTitle}>No Clients to Show</Text>
              <Text style={styles.noFeedSubtitle}>
                Add Clients to View their Fee status,Realtime Workout and Diet
                progress and Much more.
              </Text>
              <TouchableOpacity
                style={styles.noFeedRefreshButton}
                onPress={() => router.push("/owner/clientform")}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.noFeedButtonText}>Add Clients</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return ClientsFlatList;
      case "Import Clients":
        return <ClientsManagement />;
      default:
        return ClientsFlatList;
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <FitnessLoader />
      ) : (
        <>
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
            tabIndex={["Clients", "Import Clients"]}
            color1={"#7b2cbf"}
            color2={"#e5383b"}
            toggleSideNav={toggleSideNav}
            headerName={"client"}
            bgImage={require("../../../assets/images/feed/feed_bg.png")}
            gymlogo={gymLogo}
          />

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              color1={"#022950"}
              color2={"#0154A0"}
              profileData={profileData}
              gymLogo={gymLogo}
            />
          )}

          <View style={styles.contentContainer}>{renderContent()}</View>

          <FilterModal
            visible={filterModalVisible}
            plans={plans}
            batches={batches}
            onClose={() => setFilterModalVisible(false)}
            applyFilters={applyFilters}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
          />

          <FeeStatusModal
            visible={feeModalVisible}
            onClose={() => setFeeModalVisible(false)}
            selectedClient={selectedClient}
            onMarkPaid={updateFeeStatus}
            onMarkUnpaid={deleteFeeStatus}
          />

          <FeeDetailsModal
            visible={feeDetailsModalVisible}
            onClose={() => setFeeDetailsModalVisible(false)}
            originalFee={originalFee}
            discountedFee={discountedFee}
            setDiscountedFee={setDiscountedFee}
            selectedPaymentOption={selectedPaymentOption}
            setSelectedPaymentOption={setSelectedPaymentOption}
            paymentOptions={paymentOptions}
            plans={plans}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            handleOriginalFee={handleOriginalFee}
            setShowReceiptModal={setShowReceiptModal}
            paymentReferenceNumber={paymentReferenceNumber}
            setPaymentReferenceNumber={setPaymentReferenceNumber}
            gstType={gstType}
            setGstType={setGstType}
            gstPercentage={gstPercentage}
            setGstPercentage={setGstPercentage}
            gstTypeOptions={gstTypeOptions}
          />

          <ReceiptModal
            visible={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false);
              setFeeDetailsModalVisible(true);
            }}
            onsubmit={() => {
              setShowReceiptModal(false);
              updateFeeStatus();
            }}
            RedButtonText={"Save"}
            onShare={() => {}}
            onDownload={() => {}}
            gymData={gymData}
            invoice={{
              // id: 'INV-2025-001',
              name: selectedClient?.name || "Client Name",
              address: "228 Park Avenue, New York, USA",
              contact: selectedClient?.contact || "+1 123 456 7890",
              paymentMethod: selectedPaymentOption,
              paymentReferenceNumber: paymentReferenceNumber,
              bankDetails: "Acct No: 1234567890, IFSC: ABCD01234",
              discount:
                originalFee > 0
                  ? ((originalFee - discountedFee) / originalFee) * 100
                  : 0,
              total: discountedFee || originalFee,
              gymName: gymData?.name || "Fitness Gym",
              gymAddress: gymData?.location || "123 Fitness St, Gym City, USA",
              gstType: gstType,
              gstPercentage:
                gstType !== "no_gst" ? parseFloat(gstPercentage) || 0 : 0,
              items: [
                {
                  date: dateUtils.getCurrentDateFormatted(),
                  description: selectedPlan?.plans || "Gym Membership",
                  method: selectedPaymentOption,
                  amount: originalFee || 0,
                },
              ],
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    paddingTop: 170,
    paddingBottom: 0,
  },
  content: {
    // paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1F2937",
  },
  searchBarContainer: {
    backgroundColor: "#F9FAFB",
  },
  listHeaderContainer: {
    backgroundColor: "#F9FAFB",
    paddingBottom: 20,
    zIndex: 10,
  },
  filterTabsContainer: {
    flexDirection: "row",
    marginVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeFilterTab: {
    backgroundColor: "#e6e6e6",
    borderColor: "#d1d1d1",
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeFilterTabText: {
    color: "#1F2937",
    fontWeight: "600",
  },
  searchAndActionsContainer: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchBar: {
    elevation: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    flex: 1,
  },
  actionsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  dataTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    elevation: 2,
  },
  nameColumn: {
    flex: 1.5,
  },
  ageColumn: {
    flex: 0.5,
    justifyContent: "center",
  },
  placeColumn: {
    flex: 1,
  },
  feeColumn: {
    flex: 0.5,
    justifyContent: "center",
  },
  flatListContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
    fontSize: 16,
    paddingHorizontal: 16,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noFeedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    color: "#1F2937",
  },
  noFeedSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "600",
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  statusButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statusPaid: {
    backgroundColor: "#10B981",
  },
  statusUnpaid: {
    backgroundColor: "#EF4444",
  },
});

export default ClientListPage;

const searchBarStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
    height: 40,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
