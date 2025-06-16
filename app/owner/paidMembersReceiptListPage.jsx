import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
} from "react-native";
import RenderAboutToExpirePage from "../../components/home/AboutToExpirePage";
import { showToast } from "../../utils/Toaster";
import { GetReceiptForPaidMembers } from "../../services/Api";
import { getToken } from "../../utils/auth";
import ReceiptModal from "../../components/client/Receipt";
import { dateUtils } from "../../utils/date";
import { useRouter } from "expo-router";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../components/home/finances/TabHeader";
import SearchBarWithFilterButton from "../../components/ui/SearchBarWithMonthFilter";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";

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

const PaidMembersReceiptListPage = () => {
  const date = new Date();
  const [showInvoice, SetShowInvoice] = useState(false);
  const [receiptData, setReceiptData] = useState([]);
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Sent");
  const router = useRouter();

  // Get current month and year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    [
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
    ][currentDate.getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

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

  const handleOpenAboutToExpireModal = () => {
    setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
  };

  const fetchAttendanceData = async (
    month = selectedMonth,
    year = selectedYear
  ) => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymID is not found",
        });
        return;
      }

      const response = await GetReceiptForPaidMembers(gymId, month, year);

      if (response.status === 200) {
        setReceiptData(response.data || []);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update data when month or year changes
  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // fetchAttendanceData(month, year);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceData();
    }, [])
  );

  const handleMonthSelection = useCallback((month) => {
    setLocalSelectedMonth(month);
  }, []);

  const handleYearSelection = useCallback((year) => {
    setLocalSelectedYear(year);
  }, []);

  const handleApplyMonthFilter = useCallback(() => {
    setShowMonthModal(false);
    // fetchUnpaidMembersData(); // Re-fetch data with new month/year
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <NewOwnerHeader
        text={"Receipt List"}
        onBackButtonPress={() => {
          router.push("/owner/home");
        }}
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
          isAboutToExpireModalOpen={isAboutToExpireModalOpen}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
          SetShowInvoice={SetShowInvoice}
          showInvoice={showInvoice}
          setShowModifyModal={setShowModifyModal}
          showModifyModal={showModifyModal}
          // users={activeTab === "Sent" ? receiptData.send : receiptData.unsend}
          onUpdateDiscount={(id, newDiscount, newFee, newDescription) => {}}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchAttendanceData={fetchAttendanceData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          heading={"Paid Members Receipt List"}
          title={"Receipt"}
          onMonthYearChange={handleMonthYearChange}
          isLoading={isLoading}
          flatListRef={flatListRef}
          allUsers={filteredAndSearchedUsers}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          localSelectedMonth={localSelectedMonth}
          localSelectedYear={localSelectedYear}
        />
      )}

      <ReceiptModal
        visible={showInvoice}
        onClose={() => {
          SetShowInvoice(false);
        }}
        RedButtonText={"Close"}
        onShare={() => {}}
        onDownload={() => {}}
        invoice={{
          id: particularInvoiceData?.invoice_number,
          name: particularInvoiceData?.client_name,
          contact: particularInvoiceData?.client_contact,
          paymentMethod: particularInvoiceData?.payment_method,
          bankDetails: `${particularInvoiceData?.bank_details}, IFSC: ${particularInvoiceData?.ifsc_code}`,
          discount: particularInvoiceData?.discount,
          total: particularInvoiceData?.discounted_fees,
          gymName: particularInvoiceData?.gym_name,
          gymAddress: "123 Fitness St, Gym City, USA",
          gymLogo: particularInvoiceData?.gym_logo,
          items: [
            {
              date: dateUtils.formatToDateOnly(
                particularInvoiceData?.payment_date
              ),
              description: particularInvoiceData?.plan_description,
              amount: particularInvoiceData?.fees,
              method: particularInvoiceData?.payment_method,
            },
          ],
          gst_number: particularInvoiceData?.gst_number,
        }}
      />
    </SafeAreaView>
  );
};

export default PaidMembersReceiptListPage;

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
