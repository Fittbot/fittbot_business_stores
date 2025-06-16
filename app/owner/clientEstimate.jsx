// import { useFocusEffect } from '@react-navigation/native';
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
// import RenderAboutToExpirePage from '../../components/home/AboutToExpirePage';
// import { showToast } from '../../utils/Toaster';
// import { getmembersDataAPI } from '../../services/Api';
// import OwnerHeader from '../../components/ui/OwnerHeader';
// import { getToken } from '../../utils/auth';
// import InvoiceModal from '../../components/home/Invoice';
// import NewOwnerHeader from '../../components/ui/Header/NewOwnerHeader';
// import { router } from 'expo-router';
// import TabHeader from '../../components/home/finances/TabHeader';
// import SearchBarWithFilterButton from '../../components/ui/SearchBarWithMonthFilter';
// import MonthSelectorModal from '../../components/home/MonthSelectorModal';

// const monthList = [
//   'January',
//   'February',
//   'March',
//   'April',
//   'May',
//   'June',
//   'July',
//   'August',
//   'September',
//   'October',
//   'November',
//   'December',
// ];

// const ClientEstimate = () => {
//   const date = new Date();
//   const [showInvoice, SetShowInvoice] = useState(false);
//   const [invoiceData, setInvoiceData] = useState([]);
//   const [particularInvoiceData, setParticularInvoiceData] = useState({});
//   const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
//     useState(true);
//   const [showModifyModal, setShowModifyModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('Sent');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [localSelectedMonth, setLocalSelectedMonth] = useState(
//     monthList[date.getMonth()]
//   );
//   const [localSelectedYear, setLocalSelectedYear] = useState(
//     date.getFullYear()
//   );
//   const searchInputRef = useRef(null);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [paginatedUsers, setPaginatedUsers] = useState([]);
//   const [paginationLoading, setPaginationLoading] = useState(false);
//   const itemsPerPage = 25;
//   const flatListRef = useRef(null);

//   const [showMonthModal, setShowMonthModal] = useState(false);

//   // Filter users based on search query
//   const handleSearch = (query) => {
//     setSearchQuery(query);
//     if (!query) {
//       setFilteredUsers(
//         activeTab === 'Sent' ? invoiceData.send || [] : invoiceData.unsend || []
//       );
//       return;
//     }
//     const filtered = (
//       activeTab === 'Sent' ? invoiceData.send || [] : invoiceData.unsend || []
//     ).filter(
//       (user) =>
//         user.account_holder_name?.toLowerCase().includes(query.toLowerCase()) ||
//         user.client_contact?.includes(query)
//     );
//     setFilteredUsers(filtered);
//   };

//   // Update filtered users when tab changes or invoiceData updates
//   React.useEffect(() => {
//     const users =
//       activeTab === 'Sent' ? invoiceData.send || [] : invoiceData.unsend || [];
//     setFilteredUsers(users);

//     if (searchQuery) {
//       const filtered = users.filter(
//         (user) =>
//           user.account_holder_name
//             ?.toLowerCase()
//             .includes(searchQuery.toLowerCase()) ||
//           user.client_contact?.includes(searchQuery)
//       );
//       setFilteredUsers(filtered);
//     }
//   }, [activeTab, invoiceData, searchQuery]);

//   const handleOpenAboutToExpireModal = () => {
//     setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
//   };

//   const fetchAttendanceData = async () => {
//     setIsLoading(true);
//     try {
//       const gymId = await getToken('gym_id');
//       if (!gymId) {
//         showToast({
//           type: 'error',
//           title: 'GymId is not available',
//         });
//         return;
//       }

//       const response = await getmembersDataAPI(
//         gymId,
//         localSelectedMonth,
//         localSelectedYear
//       );

//       if (response?.status === 200) {
//         setInvoiceData(response?.data?.invoice_data || []);
//         // console.log('🚀 ~ fetchAttendanceData ~ response:', response);
//         console.log(
//           '🚀 ~ fetchAttendanceData ~ invoiceData:',
//           invoiceData.send
//         );
//       } else {
//         showToast({
//           type: 'error',
//           title: response?.detail,
//         });
//       }
//     } catch (error) {
//       const errorMessage = 'Something went wrong, please try again later.';
//       showToast({
//         type: 'error',
//         title: errorMessage,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       fetchAttendanceData();
//     }, [])
//   );

//   const tabs = [
//     { id: 'Sent', label: 'Sent' },
//     { id: 'Unsent', label: 'Unsent' },
//   ];

//   const handleTabPress = useCallback(
//     (tab) => {
//       setActiveTab(tab);
//       setCurrentPage(1); // Reset to first page when tab changes
//     },
//     [setActiveTab]
//   );

//   const handleQueryChange = useCallback(
//     (text) => {
//       setSearchQuery(text);

//       setTimeout(() => {
//         searchInputRef.current?.focus();
//       }, 0);
//     },
//     [setSearchQuery]
//   );

//   const handleClearText = useCallback(() => {
//     setSearchQuery('');

//     setTimeout(() => {
//       searchInputRef.current?.focus();
//     }, 0);
//   }, [setSearchQuery]);

//   const handleMonthSelection = useCallback((month) => {
//     setLocalSelectedMonth(month);
//   }, []);

//   const handleYearSelection = useCallback((year) => {
//     setLocalSelectedYear(year);
//   }, []);

//   const handleApply = useCallback(() => {
//     fetchAttendanceData(localSelectedMonth, localSelectedYear);
//     setShowMonthModal(false);
//   }, [fetchAttendanceData, localSelectedMonth, localSelectedYear]);

//   useEffect(() => {
//     setPaginationLoading(true);

//     // Calculate pagination values
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const currentItems = filteredUsers.slice(startIndex, endIndex);

//     setTimeout(() => {
//       setPaginatedUsers(currentItems);
//       setPaginationLoading(false);

//       if (flatListRef.current) {
//         flatListRef.current.scrollToOffset({ offset: 0, animated: true });
//       }
//     }, 100);
//   }, [currentPage, filteredUsers]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <NewOwnerHeader
//         onBackButtonPress={() => router.push('/owner/home')}
//         text={'About To Expire Members List'}
//       />

//       <TabHeader
//         tabs={tabs}
//         activeTab={activeTab}
//         onTabChange={handleTabPress}
//       />

//       <View
//         style={{
//           width: '100%',
//           maxHeight: '100%',
//           backgroundColor: '#fff',
//           padding: 20,
//         }}
//       >
//         <SearchBarWithFilterButton
//           placeholder="Search by name or contact"
//           style={styles.searchContainer}
//           inputStyle={styles.searchInput}
//           value={searchQuery}
//           onChangeText={handleQueryChange}
//           onClearText={handleClearText}
//           onFilterPress={() => setShowMonthModal(true)}
//           selectedMonth={localSelectedMonth}
//           selectedYear={localSelectedYear}
//           ref={searchInputRef}
//         />
//       </View>

//       <MonthSelectorModal
//         visible={showMonthModal}
//         onClose={() => setShowMonthModal(false)}
//         onSelectMonth={handleMonthSelection}
//         selectedMonth={localSelectedMonth}
//         selectedYear={localSelectedYear}
//         onSelectYear={handleYearSelection}
//         handleApply={handleApply}
//       />

//       <RenderAboutToExpirePage
//         isAboutToExpireModalOpen={isAboutToExpireModalOpen}
//         handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
//         SetShowInvoice={SetShowInvoice}
//         showInvoice={showInvoice}
//         setShowModifyModal={setShowModifyModal}
//         showModifyModal={showModifyModal}
//         // users={DueFeeUserData}
//         users={filteredUsers}
//         onUpdateDiscount={(id, newDiscount, newFee, newDescription) => {}}
//         setParticularInvoiceData={setParticularInvoiceData}
//         fetchAttendanceData={fetchAttendanceData}
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         heading={'About to Expire Members List'}
//         title={'Estimate'}
//         searchQuery={searchQuery}
//         setSearchQuery={handleSearch}
//         currentPage={currentPage}
//         setCurrentPage={setCurrentPage}
//         paginatedUsers={paginatedUsers}
//         setPaginatedUsers={setPaginatedUsers}
//         paginationLoading={paginationLoading}
//         setPaginationLoading={setPaginationLoading}
//         itemsPerPage={itemsPerPage}
//         flatListRef={flatListRef}
//         searchInputRef={searchInputRef}
//         localSelectedMonth={localSelectedMonth}
//         localSelectedYear={localSelectedYear}
//       />

//       <InvoiceModal
//         visible={showInvoice}
//         onClose={() => SetShowInvoice(false)}
//         invoice={{
//           id: particularInvoiceData?.invoice_number,
//           name: particularInvoiceData?.account_holder_name,
//           contact: particularInvoiceData?.client_contact,
//           paymentMethod: 'Stripe / Bank Transfer',
//           bankDetails: `${particularInvoiceData?.bank_details}, IFSC: ${particularInvoiceData?.ifsc_code}`,
//           discount: particularInvoiceData?.discount,
//           total: particularInvoiceData?.discounted_fees,
//           gymName: particularInvoiceData?.gym_name,
//           gymAddress: '123 Fitness St, Gym City, USA',
//           gymLogo: particularInvoiceData?.gym_logo,
//           items: [
//             {
//               date: particularInvoiceData?.due_date,
//               description: particularInvoiceData?.plan_description,
//               amount: particularInvoiceData?.fees,
//             },
//           ],
//         }}
//         onDownload={() =>
//           downloadInvoiceAsPDF({
//             id: 'INV-2025-001',
//             name: 'Rames Quinerie',
//             address: '228 Park Avenue, New York, USA',
//             contact: '+1 123 456 7890',
//             paymentMethod: 'Stripe / Bank Transfer',
//             bankDetails: 'Acct No: 1234567890, IFSC: ABCD01234',
//             discount: 10,
//             total: 900,
//             items: [
//               { date: '2025-04-10', description: 'Demo Text', amount: 1000 },
//             ],
//           })
//         }
//       />
//     </SafeAreaView>
//   );
// };

// export default ClientEstimate;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F7F7F7',
//   },
// });

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
import { router } from "expo-router";
import TabHeader from "../../components/home/finances/TabHeader";
import SearchBarWithFilterButton from "../../components/ui/SearchBarWithMonthFilter";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import InvoiceModal from "../../components/home/Invoice"; // Import InvoiceModal
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

const ClientEstimate = () => {
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

  // Filtered and paginated data states
  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const flatListRef = useRef(null); // Ref for FlatList in RenderAboutToExpirePage

  const searchInputRef = useRef(null);

  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);

  const fetchInvoiceData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd get the gymId from a secure storage like AsyncStorage
      // For demonstration, let's assume getToken is implemented.
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({ type: "error", title: "Gym ID is not available." });
        return;
      }

      const response = await getmembersDataAPI(
        gymId,
        localSelectedMonth,
        localSelectedYear
      );

      if (response?.status === 200) {
        setInvoiceData(
          response?.data?.invoice_data || { send: [], unsend: [] }
        );
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch invoice data.",
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
      fetchInvoiceData();
    }, [fetchInvoiceData])
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
    fetchInvoiceData(); // Re-fetch data with new month/year
  }, [fetchInvoiceData]);

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
        text={"Client Estimates"}
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
          <Text style={styles.loadingText}>Loading Estimates...</Text>
        </View>
      ) : (
        <RenderAboutToExpirePage
          SetShowInvoice={SetShowInvoice}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchInvoiceData={fetchInvoiceData}
          activeTab={activeTab}
          heading={"Client Estimates"}
          title={"Estimate"}
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
        // onDownload prop can be passed if download functionality is implemented for estimates
        // For now, it's commented out as estimates are generally not downloaded as invoices.
        // onDownload={() => { /* implement download logic if needed */ }}
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
    // backgroundColor: '#F0F2F5',
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

export default ClientEstimate;
