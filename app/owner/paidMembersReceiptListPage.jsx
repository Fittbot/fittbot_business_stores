import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
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
import Icon from "react-native-vector-icons/Feather";

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
  const [receiptData, setReceiptData] = useState({ send: [], unsend: [] });
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] = useState(true);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Sent");
  const router = useRouter();
  const [viewMode, setViewMode] = useState("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedMonth, setLocalSelectedMonth] = useState(
    monthList[date.getMonth()]
  );
  const [localSelectedYear, setLocalSelectedYear] = useState(date.getFullYear());
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [backendCurrentPage, setBackendCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const backendItemsPerPage = 25;
  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [frontendCurrentPage, setFrontendCurrentPage] = useState(1);
  const frontendItemsPerPage = 25;
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleOpenAboutToExpireModal = () => {
    setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
  };

  const fetchReceiptData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID is not found",
        });
        return;
      }

      let response;
      
      if (viewMode === "monthly") {
        response = await GetReceiptForPaidMembers(
          gym_id,
          localSelectedMonth,
          localSelectedYear
        );
      } else {
        response = await GetReceiptForPaidMembers(
          gym_id,
          null, 
          null, 
          backendCurrentPage,
          backendItemsPerPage
        );
      }
      
      if (response?.status === 200) {
        setReceiptData(response?.data || { send: [], unsend: [] });
        
        if (response?.data?.pagination) {
          setPaginationInfo(response.data.pagination);
        } else {
          setPaginationInfo(null);
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch receipt data",
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
  }, [viewMode, localSelectedMonth, localSelectedYear, backendCurrentPage]);

  useFocusEffect(
    useCallback(() => {
      fetchReceiptData();
    }, [fetchReceiptData])
  );

  useEffect(() => {
    const dataToFilter = activeTab === "Sent" ? receiptData?.send : receiptData?.unsend;
    const filtered = dataToFilter?.length > 0 ? dataToFilter.filter(
      (user) =>
        user.client_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.client_contact?.includes(searchQuery)
    ) : [];
    setFilteredAndSearchedUsers(filtered);
    setFrontendCurrentPage(1);
  }, [activeTab, receiptData, searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setFrontendCurrentPage(1);
    setBackendCurrentPage(1);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [viewMode]);

  const handleMonthSelection = useCallback((month) => {
    setLocalSelectedMonth(month);
  }, []);

  const handleYearSelection = useCallback((year) => {
    setLocalSelectedYear(year);
  }, []);

  const handleApplyMonthFilter = useCallback(() => {
    setShowMonthModal(false);
  }, []);

  const handleViewModeToggle = () => {
    setViewMode(viewMode === "monthly" ? "all" : "monthly");
  };

  const handleBackendPageChange = (page) => {
    setBackendCurrentPage(page);
  };

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

  const getPaginationData = () => {
    if (viewMode === "all" && paginationInfo) {
      const totalPages = activeTab === "Sent" 
        ? paginationInfo.total_pages_sent 
        : paginationInfo.total_pages_unsent;
      const totalItems = activeTab === "Sent"
        ? paginationInfo.total_sent
        : paginationInfo.total_unsent;
      
      return {
        currentPage: backendCurrentPage,
        totalPages: Math.max(1, totalPages),
        totalItems,
        onPageChange: handleBackendPageChange,
        allUsers: filteredAndSearchedUsers,
        isPaginated: false 
      };
    } else {
      return {
        currentPage: frontendCurrentPage,
        totalPages: Math.max(1, Math.ceil(filteredAndSearchedUsers.length / frontendItemsPerPage)),
        totalItems: filteredAndSearchedUsers.length,
        onPageChange: setFrontendCurrentPage,
        allUsers: filteredAndSearchedUsers,
        isPaginated: true 
      };
    }
  };

  const paginationData = getPaginationData();

  return (
    <SafeAreaView style={styles.container}>
      <NewOwnerHeader
        text={"Receipt List"}
        onBackButtonPress={() => {
          router.push("/owner/home");
        }}
      />

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "monthly" && styles.activeViewMode
          ]}
          onPress={() => setViewMode("monthly")}
        >
          <Icon name="calendar" size={16} color={viewMode === "monthly" ? "#fff" : "#10A0F6"} />
          <Text style={[
            styles.viewModeText,
            viewMode === "monthly" && styles.activeViewModeText
          ]}>
            Monthly View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "all" && styles.activeViewMode
          ]}
          onPress={() => setViewMode("all")}
        >
          <Icon name="list" size={16} color={viewMode === "all" ? "#fff" : "#10A0F6"} />
          <Text style={[
            styles.viewModeText,
            viewMode === "all" && styles.activeViewModeText
          ]}>
            All Receipts
          </Text>
        </TouchableOpacity>
      </View>

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
          showFilter={viewMode === "monthly"} 
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
          <Text style={styles.loadingText}>
            Loading {viewMode === "monthly" ? "Monthly" : "All"} Receipt Data...
          </Text>
        </View>
      ) : (
        <RenderAboutToExpirePage
          isAboutToExpireModalOpen={isAboutToExpireModalOpen}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
          SetShowInvoice={SetShowInvoice}
          showInvoice={showInvoice}
          setShowModifyModal={setShowModifyModal}
          showModifyModal={showModifyModal}
          onUpdateDiscount={(id, newDiscount, newFee, newDescription) => {}}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchInvoiceData={fetchReceiptData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          heading={viewMode === "monthly" ? "Monthly Receipts" : "All Receipts"}
          title={"Receipt"}
          isLoading={isLoading}
          flatListRef={flatListRef}
          allUsers={paginationData.allUsers}
          currentPage={paginationData.currentPage}
          setCurrentPage={paginationData.onPageChange}
          itemsPerPage={viewMode === "all" ? backendItemsPerPage : frontendItemsPerPage}
          localSelectedMonth={viewMode === "monthly" ? localSelectedMonth : null}
          localSelectedYear={viewMode === "monthly" ? localSelectedYear : null}
          paginationInfo={viewMode === "all" ? paginationInfo : null}
          viewMode={viewMode}
        />
      )}
      <ReceiptModal
            visible={showInvoice}
            onClose={() => {
              SetShowInvoice(false);
            }}
            onShare={() => {}}
            onDownload={() => {}}
            gymData={particularInvoiceData}
            invoice={{
              id: particularInvoiceData?.invoice_number,
              name: particularInvoiceData?.client_name || "Client Name",
              address: particularInvoiceData?.gym_location||"228 Park Avenue, New York, USA",
              contact: particularInvoiceData?.client_contact || "+1 123 456 7890",
              paymentMethod: particularInvoiceData?.payment_method,
              paymentReferenceNumber: particularInvoiceData?.payment_reference_number,
              bankDetails: particularInvoiceData?.bank_details,
              IFSC: particularInvoiceData?.ifsc_code,
              account_holder_name:particularInvoiceData?.account_holder_name,
              branch:particularInvoiceData?.branch,
              discount:
                particularInvoiceData?.fees > 0
                  ? ((particularInvoiceData?.fees - particularInvoiceData?.discounted_fees) / particularInvoiceData?.fees) * 100
                  : 0,
              total: particularInvoiceData?.discounte_fees || particularInvoiceData?.fees,
              gymName: particularInvoiceData?.gym_name || "Fitness Gym",
              gymAddress: particularInvoiceData?.gym_location || "123 Fitness St, Gym City, USA",
              gstType: particularInvoiceData?.gst_type,
              gstPercentage:
                particularInvoiceData?.gst_type !== "no_gst" ? parseFloat(particularInvoiceData?.gst_percentage) || 0 : 0,
              items: [
                {
                  date: particularInvoiceData?.payment_date,
                  description: particularInvoiceData?.plan_description || "Gym Membership",
                  method: particularInvoiceData?.payment_method,
                  amount: particularInvoiceData?.fees || 0,
                },
              ],
            }}
          />
    </SafeAreaView>
  );
};

export default PaidMembersReceiptListPage;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  viewModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10A0F6",
    backgroundColor: "#fff",
  },
  activeViewMode: {
    backgroundColor: "#10A0F6",
  },
  viewModeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#10A0F6",
  },
  activeViewModeText: {
    color: "#fff",
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