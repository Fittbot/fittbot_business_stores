import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import RenderAboutToExpirePage from "../../components/home/AboutToExpirePage";
import { showToast } from "../../utils/Toaster";
import { getmembersDataAPI } from "../../services/Api";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import TabHeader from "../../components/home/finances/TabHeader";
import SearchBarWithFilterButton from "../../components/ui/SearchBarWithMonthFilter";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import InvoiceModal from "../../components/home/Invoice";
import { getToken } from "../../utils/auth";

const monthList = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const UnpaidMembersListPage = () => {
  const date = new Date();
  const [showInvoice, SetShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ send: [], unsend: [] }); // Initialize with send/unsend arrays
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Sent"); // Retain tabs, assuming 'Sent' and 'Unsent' for unpaid
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedMonth, setLocalSelectedMonth] = useState(
    monthList[date.getMonth()]
  );
  const [localSelectedYear, setLocalSelectedYear] = useState(
    date.getFullYear()
  );
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Filtered and paginated data states
  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const flatListRef = useRef(null);

  const searchInputRef = useRef(null);

  // This state was in ClientEstimate but not used in UnpaidMembersListPage for its own logic.
  // Including it for structural consistency as requested, but it might not be functionally needed here.
  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);

  const router = useRouter();

  const fetchUnpaidMembersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Gym ID is not available." });
        return;
      }

      // API call for unpaid members data, including month/year filters
      const response = await getmembersDataAPI(
        gymId,
        localSelectedMonth,
        localSelectedYear
      );

      if (response?.status === 200) {
        // Assuming the API returns unpaid_data with send/unsend structure
        setInvoiceData(response?.data?.unpaid_data || { send: [], unsend: [] });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch unpaid members data.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching data",
        desc: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [localSelectedMonth, localSelectedYear]);

  // Fetch data on component mount and when month/year changes
  useFocusEffect(
    useCallback(() => {
      fetchUnpaidMembersData();
    }, [fetchUnpaidMembersData])
  );

  // Effect for filtering and searching data
  useEffect(() => {
    const dataToFilter =
      activeTab === "Sent" ? invoiceData.send : invoiceData.unsend;

    const filtered = dataToFilter.filter(
      (user) =>
        user.account_holder_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.client_contact?.includes(searchQuery)
    );
    setFilteredAndSearchedUsers(filtered);
    setCurrentPage(1); // Reset to first page whenever filters or search change
  }, [activeTab, invoiceData, searchQuery]);

  const handleMonthSelection = useCallback((month) => {
    setLocalSelectedMonth(month);
  }, []);

  const handleYearSelection = useCallback((year) => {
    setLocalSelectedYear(year);
  }, []);

  const handleApplyMonthFilter = useCallback(() => {
    setShowMonthModal(false);
    fetchUnpaidMembersData(); // Re-fetch data with new month/year
  }, [fetchUnpaidMembersData]);

  const tabs = [
    { id: "Sent", label: "Sent" },
    { id: "Unsent", label: "Unsent" },
  ];

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  // This handler was in ClientEstimate but not strictly needed for UnpaidMembersListPage's core logic
  // as isAboutToExpireModalOpen is always true. Included for structural consistency.
  const handleOpenAboutToExpireModal = () => {
    setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Unpaid Members List"}
      />

      <TabHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabPress}
      />

      <View style={styles.searchAndFilterContainer}>
        <SearchBarWithFilterButton
          placeholder="Search by name or contact"
          style={styles.searchContainer}
          inputStyle={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClearText={handleClearSearch}
          onFilterPress={() => setShowMonthModal(true)}
          selectedMonth={localSelectedMonth}
          selectedYear={localSelectedYear}
          ref={searchInputRef}
        />
      </View>

      <MonthSelectorModal
        visible={showMonthModal}
        onClose={() => setShowMonthModal(false)}
        onSelectMonth={handleMonthSelection}
        selectedMonth={localSelectedMonth}
        selectedYear={localSelectedYear}
        onSelectYear={handleYearSelection}
        handleApply={handleApplyMonthFilter}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10A0F6" />
          <Text style={styles.loadingText}>Loading Unpaid Members...</Text>
        </View>
      ) : (
        <RenderAboutToExpirePage
          SetShowInvoice={SetShowInvoice}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchInvoiceData={fetchUnpaidMembersData} // Use the specific fetch function for this page
          activeTab={activeTab}
          heading={"Unpaid Members List"}
          title={"Unpaid Members"} // Title for the RenderAboutToExpirePage, adjusted
          allUsers={filteredAndSearchedUsers}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          flatListRef={flatListRef}
          localSelectedMonth={localSelectedMonth}
          localSelectedYear={localSelectedYear}
          isAboutToExpireModalOpen={isAboutToExpireModalOpen} // Included for consistency
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal} // Included for consistency
        />
      )}

      <InvoiceModal
        visible={showInvoice}
        onClose={() => SetShowInvoice(false)}
        invoice={{
          id: particularInvoiceData?.invoice_number,
          name: particularInvoiceData?.account_holder_name,
          contact: particularInvoiceData?.client_contact,
          paymentMethod: "Stripe / Bank Transfer",
          bankDetails: `${particularInvoiceData?.bank_details}, IFSC: ${particularInvoiceData?.ifsc_code}`,
          discount: particularInvoiceData?.discount,
          total: particularInvoiceData?.discounted_fees,
          gymName: particularInvoiceData?.gym_name,
          gymAddress: "123 Fitness St, Gym City, USA", // Placeholder
          gymLogo: particularInvoiceData?.gym_logo,
          items: [
            {
              date: particularInvoiceData?.due_date,
              description: particularInvoiceData?.plan_description,
              amount: particularInvoiceData?.fees,
            },
          ],
        }}
        // onDownload prop can be passed if download functionality is implemented for unpaid invoices.
        // Keeping it commented out for now as per ClientEstimate example.
        // onDownload={() => { /* implement download logic if needed */ }}
      />
    </SafeAreaView>
  );
};

// Styles copied directly from ClientEstimate.js
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // Adjusted to match ClientEstimate
  },
  searchAndFilterContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    borderRadius: 8,
    height: 50,
  },
  searchInput: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default UnpaidMembersListPage;
