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
import { dateUtils } from "../../utils/date";

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
  const [invoiceData, setInvoiceData] = useState({ send: [], unsend: [] }); 
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Sent"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedMonth, setLocalSelectedMonth] = useState(
    monthList[date.getMonth()]
  );
  const [localSelectedYear, setLocalSelectedYear] = useState(
    date.getFullYear()
  );
  const [showMonthModal, setShowMonthModal] = useState(false);

  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const flatListRef = useRef(null);

  const searchInputRef = useRef(null);

  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);

  const router = useRouter();

  const fetchUnpaidMembersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID is not available." });
        return;
      }

      const response = await getmembersDataAPI(
        gym_id,
        localSelectedMonth,
        localSelectedYear
      );

      if (response?.status === 200) {
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

  useFocusEffect(
    useCallback(() => {
      fetchUnpaidMembersData();
    }, [fetchUnpaidMembersData])
  );

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
    setCurrentPage(1); 
  }, [activeTab, invoiceData, searchQuery]);

  const handleMonthSelection = useCallback((month) => {
    setLocalSelectedMonth(month);
  }, []);

  const handleYearSelection = useCallback((year) => {
    setLocalSelectedYear(year);
  }, []);

  const handleApplyMonthFilter = useCallback(() => {
    setShowMonthModal(false);
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
          showFilter={true} 
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
          fetchInvoiceData={fetchUnpaidMembersData} 
          activeTab={activeTab}
          heading={"Unpaid Members List"}
          title={"Unpaid Members"} 
          allUsers={filteredAndSearchedUsers}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          flatListRef={flatListRef}
          localSelectedMonth={localSelectedMonth}
          localSelectedYear={localSelectedYear}
          isAboutToExpireModalOpen={isAboutToExpireModalOpen} 
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal} 
        />
      )}

    
      <InvoiceModal
        visible={showInvoice}
        onClose={() => SetShowInvoice(false)}
        RedButtonText="Send Invoice"
        gymData={{
          name: particularInvoiceData?.gym_name,
          location: particularInvoiceData?.gym_location,
          logo: particularInvoiceData?.gym_logo,
          gst_number: particularInvoiceData?.gst_number,
          account_holdername: particularInvoiceData?.account_holder_name,
          account_number: particularInvoiceData?.account_number || "XXXXXXXXXX",
          account_ifsccode: particularInvoiceData?.ifsc_code || "",
          account_branch: particularInvoiceData?.branch || "",
          upi_id: particularInvoiceData?.upi_id || "",
        }}
        invoice={{
          invoice_number:particularInvoiceData?.invoice_number||"",
          name: particularInvoiceData?.account_holder_name || "Client Name",
          contact: particularInvoiceData?.client_contact || "+91 XXXXXXXXXX",
          paymentReferenceNumber: particularInvoiceData?.payment_reference_number || "",
          bankDetails: particularInvoiceData?.bank_details, 
          IFSC: particularInvoiceData?.ifsc_code,
          fees:particularInvoiceData?.fees,
          discount: particularInvoiceData?.discount || 0,
          discountedFees: particularInvoiceData?.discounted_fees || particularInvoiceData?.fees,
          gymName: particularInvoiceData?.gym_name || "Fitness Gym",
          gymAddress: particularInvoiceData?.gym_location || "Gym Address",
          gstType: "inclusive", 
          gstPercentage: 18, 
          items: [
            {
              date: particularInvoiceData?.due_date?.split(" ")[0] || dateUtils.getCurrentDateFormatted(),
              description: particularInvoiceData?.plan_description || "Gym Membership",
              method: "Bank Transfer",
              amount: particularInvoiceData?.fees || 0,
            },
          ],
        }}
      />
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", 
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