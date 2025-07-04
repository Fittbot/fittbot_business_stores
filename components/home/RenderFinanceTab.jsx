// Using react-native-picker-select
// Install if needed: npm install react-native-picker-select

import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import FitnessLoader from "../ui/FitnessLoader";
import { getToken } from "../../utils/auth";
import { Ionicons } from "@expo/vector-icons";
import {
  AddExpenditureAPI,
  DeleteExpenditureAPI,
  getCollectionSummaryAPI,
  addExpendituresAPI,
  getGymHomeDataAPI,
  UpdateExpenditureAPI,
  getExpenditureListAPI,
} from "../../services/Api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import SummaryCard from "./finances/SummaryCard";
import NetProfitCard from "./finances/NetProfitCard";
import ReceiptsCard from "./finances/ReceiptsCard";
import ActionButton from "./finances/ActionButtons";
import { showToast } from "../../utils/Toaster";

const { width } = Dimensions.get("window");

const expenseTypes = [
  "Rent",
  "Utilities",
  "Equipment",
  "Supplies",
  "Marketing",
  "Insurance",
  "Salary",
  "Transportation",
  "Others",
];

// Convert expense types to picker format
const expenseTypeItems = expenseTypes.map((type) => ({
  label: type,
  value: type,
}));

const filterOptions = [
  { id: "overall", label: "Overall", icon: "bar-chart" },
  { id: "custom_interval", label: "Custom Range", icon: "calendar-outline" },
];

const RenderFinancesTab = ({
  styles,
  fetchAttendanceData,
  financialData: financialData2,
  isIncomeModalVisible,
  setIncomeModalVisible,
  isExpenditureModalVisible,
  setExpenditureModalVisible,
}) => {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [editingExpense, setEditingExpense] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseType, setExpenseType] = useState("");
  const [customExpenseType, setCustomExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] =
    useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({
    scope: "current_month",
    startDate: null,
    endDate: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [tempFilter, setTempFilter] = useState({
    scope: "overall",
    startDate: null,
    endDate: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // iOS picker temp states
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [tempExpenseDate, setTempExpenseDate] = useState(new Date());
  const [tempSelectedMonth, setTempSelectedMonth] = useState(new Date());

  const [ledgerData, setLedgerData] = useState({});
  const [financialData, setFinancialData] = useState([]);

  const getFilterLabel = () => {
    switch (currentFilter.scope) {
      case "current_month":
        return "Current Month";
      case "overall":
        return "Overall";
      case "custom_interval":
        if (currentFilter.startDate && currentFilter.endDate) {
          return `${currentFilter.startDate.toLocaleDateString()} - ${currentFilter.endDate.toLocaleDateString()}`;
        }
        return "Custom Range";
      default:
        return "Current Month";
    }
  };

  const expenditureList = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const response = await getExpenditureListAPI(gymId);

      if (response?.status === 200) {
        setFinancialData(response.data);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLedgerData = async (filterParams = currentFilter) => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");

      const apiParams = {
        gym_id: gymId,
        scope: filterParams.scope,
      };

      if (
        filterParams.scope === "custom_interval" &&
        filterParams.startDate &&
        filterParams.endDate
      ) {
        apiParams.start_date = filterParams.startDate
          .toISOString()
          .split("T")[0];
        apiParams.end_date = filterParams.endDate.toISOString().split("T")[0];
      } else if (filterParams.scope === "specific_month_year") {
        apiParams.month = filterParams.month;
        apiParams.year = filterParams.year;
      }

      const response = await getCollectionSummaryAPI(
        apiParams.gym_id,
        apiParams.scope,
        apiParams.start_date,
        apiParams.end_date,
        apiParams.month,
        apiParams.year
      );

      if (response?.status === 200) {
        const data = {
          expenditure: response?.data?.expenditure,
          profit: response?.data?.profit,
          receipt_count: response?.data?.receipt_count,
          total_collection: response?.data?.total_collection,
        };
        setLedgerData(data);
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    expenditureList();
    fetchLedgerData();
  }, []);

  const openFilterModal = () => {
    setTempFilter(
      currentFilter.scope === "current_month"
        ? { ...currentFilter, scope: "overall" }
        : { ...currentFilter }
    );
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setCurrentFilter({ ...tempFilter });
    fetchLedgerData(tempFilter);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    const defaultFilter = {
      scope: "current_month",
      startDate: null,
      endDate: null,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };
    setCurrentFilter(defaultFilter);
    fetchLedgerData(defaultFilter);
    setIsFilterModalVisible(false);
  };

  // Updated date change handlers for iOS/Android compatibility
  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === "android") {
      if (type === "start") {
        setShowStartDatePicker(false);
        if (selectedDate) {
          setTempFilter((prev) => ({ ...prev, startDate: selectedDate }));
        }
      } else if (type === "end") {
        setShowEndDatePicker(false);
        if (selectedDate) {
          setTempFilter((prev) => ({ ...prev, endDate: selectedDate }));
        }
      } else if (type === "expense") {
        setShowDatePicker(false);
        if (selectedDate) {
          setExpenseDate(selectedDate);
        }
      } else if (type === "month") {
        setShowMonthPicker(false);
        if (selectedDate) {
          setSelectedMonth(selectedDate);
          if (isIncomeModalVisible) {
            filterDataByMonth(selectedDate, "income");
          } else if (isExpenditureModalVisible) {
            filterDataByMonth(selectedDate, "expense");
          }
        }
      }
    } else {
      // iOS - just update temp time
      if (selectedDate) {
        if (type === "start") {
          setTempStartDate(selectedDate);
        } else if (type === "end") {
          setTempEndDate(selectedDate);
        } else if (type === "expense") {
          setTempExpenseDate(selectedDate);
        } else if (type === "month") {
          setTempSelectedMonth(selectedDate);
        }
      }
    }
  };

  // iOS picker confirmation handlers
  const confirmStartDateSelection = () => {
    setTempFilter((prev) => ({ ...prev, startDate: tempStartDate }));
    setShowStartDatePicker(false);
  };

  const confirmEndDateSelection = () => {
    setTempFilter((prev) => ({ ...prev, endDate: tempEndDate }));
    setShowEndDatePicker(false);
  };

  const confirmExpenseDateSelection = () => {
    setExpenseDate(tempExpenseDate);
    setShowDatePicker(false);
  };

  const confirmMonthSelection = () => {
    setSelectedMonth(tempSelectedMonth);
    setShowMonthPicker(false);
    if (isIncomeModalVisible) {
      filterDataByMonth(tempSelectedMonth, "income");
    } else if (isExpenditureModalVisible) {
      filterDataByMonth(tempSelectedMonth, "expense");
    }
  };

  // Cancel handlers for iOS
  const cancelStartDateSelection = () => {
    setShowStartDatePicker(false);
  };

  const cancelEndDateSelection = () => {
    setShowEndDatePicker(false);
  };

  const cancelExpenseDateSelection = () => {
    setShowDatePicker(false);
  };

  const cancelMonthSelection = () => {
    setShowMonthPicker(false);
  };

  // Functions to open date pickers
  const openStartDatePicker = () => {
    setTempStartDate(tempFilter.startDate || new Date());
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    setTempEndDate(tempFilter.endDate || new Date());
    setShowEndDatePicker(true);
  };

  const openExpenseDatePicker = () => {
    setTempExpenseDate(expenseDate);
    setShowDatePicker(true);
  };

  const openMonthPicker = () => {
    setTempSelectedMonth(selectedMonth);
    setShowMonthPicker(true);
  };

  const toggleAddExpenseModal = (expense = null) => {
    setAddExpenseModalVisible(!isAddExpenseModalVisible);

    if (expense) {
      setEditingExpense(expense.expenditure_id);
      setExpenseDate(new Date(expense.date));
      setExpenseType(expense.type);
      if (!expenseTypes.includes(expense.type)) {
        setExpenseType("Others");
        setCustomExpenseType(expense.expenditure_type);
      }
      setExpenseAmount(expense.amount.toString());
    } else if (isAddExpenseModalVisible) {
      resetForm();
    }
  };

  const toggleIncomeModal = () => {
    setIncomeModalVisible(!isIncomeModalVisible);
    if (!isIncomeModalVisible) {
      filterDataByMonth(selectedMonth, "income");
    }
  };

  const toggleExpenditureModal = () => {
    setExpenditureModalVisible(!isExpenditureModalVisible);
    if (!isExpenditureModalVisible) {
      filterDataByMonth(selectedMonth, "expense");
    }
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteConfirmModalVisible(true);
    setExpenditureModalVisible(false);
  };

  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalVisible(false);
    setExpenseToDelete(null);
  };

  const confirmDeleteExpense = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");

      if (!gymId || !expenseToDelete) {
        showToast({
          type: "error",
          title: "GymID or expenseToDelete is not available",
        });
        return;
      }

      const response = await DeleteExpenditureAPI(
        gymId,
        expenseToDelete.expenditure_id
      );

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Expense deleted successfully",
        });
        closeDeleteConfirmModal();

        await fetchAttendanceData();
        fetchLedgerData();
        // toggleExpenditureModal();

        if (isExpenditureModalVisible) {
          filterDataByMonth(selectedMonth, "expense");
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to delete expense",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setExpenseDate(new Date());
    setExpenseType("");
    setCustomExpenseType("");
    setExpenseAmount("");
    setFormErrors({});
    setEditingExpense(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!expenseDate) {
      errors.date = "Date is required";
    }

    if (!expenseType) {
      errors.type = "Expense type is required";
    } else if (expenseType === "Others" && !customExpenseType.trim()) {
      errors.customType = "Please specify the expense type";
    }

    if (!expenseAmount) {
      errors.amount = "Amount is required";
    } else if (isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filterDataByMonth = (date, type) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (type === "expense") {
      const filtered = financialData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getFullYear() === year &&
          expenseDate.getMonth() + 1 === month
        );
      });
      setFilteredExpenses(filtered);
    } else {
      const filtered = financialData.filter((income) => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getFullYear() === year &&
          incomeDate.getMonth() + 1 === month
        );
      });
      setFilteredIncome(filtered);
    }
  };

  const submitExpense = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "GymID is not available",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        date: expenseDate.toISOString().split("T")[0],
        type: expenseType === "Others" ? customExpenseType : expenseType,
        amount: parseFloat(expenseAmount),
      };

      let response;

      if (editingExpense) {
        response = await UpdateExpenditureAPI({
          ...payload,
          expense_id: editingExpense,
        });
      } else {
        response = await AddExpenditureAPI(payload);
      }

      if (response?.status == 200) {
        showToast({
          type: "success",
          title: response?.message,
        });
        toggleAddExpenseModal();
        await fetchAttendanceData();
        fetchLedgerData();
        if (isExpenditureModalVisible) {
          filterDataByMonth(selectedMonth, "expense");
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!expenseDate) return false;
    if (!expenseType) return false;
    if (expenseType === "Others" && !customExpenseType.trim()) return false;
    if (
      !expenseAmount ||
      isNaN(expenseAmount) ||
      parseFloat(expenseAmount) <= 0
    )
      return false;
    return true;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const isFilterValid = () => {
    if (tempFilter.scope === "custom_interval") {
      return (
        tempFilter.startDate &&
        tempFilter.endDate &&
        tempFilter.startDate <= tempFilter.endDate
      );
    }
    return true;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContent}
    >
      {/* Filter Header */}
      <View style={filterStyles.filterHeader}>
        <View style={filterStyles.filterHeaderLeft}>
          <Text style={filterStyles.filterTitle}>Financial Overview</Text>
          <Text style={filterStyles.filterSubtitle}>{getFilterLabel()}</Text>
        </View>
        <TouchableOpacity
          style={filterStyles.filterButton}
          onPress={openFilterModal}
        >
          <LinearGradient
            colors={["#4A90E2", "#357ABD"]}
            style={filterStyles.filterButtonGradient}
          >
            <Ionicons name="filter" size={20} color="#fff" />
            <Text style={filterStyles.filterButtonText}>Filter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        <SummaryCard
          title="Total Collection"
          amount={ledgerData?.total_collection || 0}
          icon="receipt"
          iconColor="#00A389"
          iconBgColor="#E6F7F4"
          leftImage={require("../../assets/images/finances/collection.png")}
        />
        <SummaryCard
          title="Expenditure"
          amount={ledgerData?.expenditure || 0}
          icon="trending-down"
          iconColor="#FF4747"
          iconBgColor="#FFEDED"
          rightImage={require("../../assets/images/finances/expenditure.png")}
        />
      </View>

      <View style={{ paddingHorizontal: 15 }}>
        <NetProfitCard amount={ledgerData?.profit || 0} />
        <ReceiptsCard
          count={ledgerData?.receipt_count || 0}
          onPress={() => router.push("/owner/paidMembersReceiptListPage")}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <ActionButton
            onPress={() => {
              toggleAddExpenseModal();
            }}
            text={"Add Expenses"}
          />
          <ActionButton
            onPress={() => {
              toggleExpenditureModal();
            }}
            text={"View Expenses"}
          />
        </View>
      </View>

      {/* Professional Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={filterStyles.modalOverlay}>
          <View style={filterStyles.modalContainer}>
            <LinearGradient
              colors={["#4A90E2", "#357ABD"]}
              style={filterStyles.modalHeader}
            >
              <Text style={filterStyles.modalHeaderTitle}>Filter Options</Text>
              <TouchableOpacity
                style={filterStyles.closeButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={filterStyles.modalContent}>
              {/* Filter Options */}
              <View style={filterStyles.optionsContainer}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      filterStyles.optionCard,
                      tempFilter.scope === option.id &&
                        filterStyles.optionCardSelected,
                    ]}
                    onPress={() =>
                      setTempFilter((prev) => ({ ...prev, scope: option.id }))
                    }
                  >
                    <View style={filterStyles.optionContent}>
                      <View
                        style={[
                          filterStyles.optionIcon,
                          tempFilter.scope === option.id &&
                            filterStyles.optionIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={
                            tempFilter.scope === option.id ? "#fff" : "#4A90E2"
                          }
                        />
                      </View>
                      <Text
                        style={[
                          filterStyles.optionLabel,
                          tempFilter.scope === option.id &&
                            filterStyles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {tempFilter.scope === option.id && (
                      <View style={filterStyles.selectedIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4A90E2"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Date Range */}
              {tempFilter.scope === "custom_interval" && (
                <View style={filterStyles.dateSection}>
                  <Text style={filterStyles.sectionTitle}>
                    Select Date Range
                  </Text>

                  <View style={filterStyles.dateRangeContainer}>
                    <View style={filterStyles.dateInputContainer}>
                      <Text style={filterStyles.dateLabel}>From Date</Text>
                      <TouchableOpacity
                        style={filterStyles.dateButton}
                        onPress={openStartDatePicker}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#4A90E2"
                        />
                        <Text style={filterStyles.dateButtonText}>
                          {tempFilter.startDate
                            ? tempFilter.startDate.toLocaleDateString()
                            : "Select start date"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={filterStyles.dateInputContainer}>
                      <Text style={filterStyles.dateLabel}>To Date</Text>
                      <TouchableOpacity
                        style={filterStyles.dateButton}
                        onPress={openEndDatePicker}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#4A90E2"
                        />
                        <Text style={filterStyles.dateButtonText}>
                          {tempFilter.endDate
                            ? tempFilter.endDate.toLocaleDateString()
                            : "Select end date"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* iOS Start Date Picker Modal */}
                  {Platform.OS === "ios" && showStartDatePicker && (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showStartDatePicker}
                      onRequestClose={cancelStartDateSelection}
                    >
                      <TouchableWithoutFeedback
                        onPress={cancelStartDateSelection}
                      >
                        <View style={pickerStyles.pickerModalContainer}>
                          <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                          >
                            <View style={pickerStyles.pickerContainer}>
                              <View style={pickerStyles.pickerHeader}>
                                <TouchableOpacity
                                  onPress={cancelStartDateSelection}
                                >
                                  <Text style={pickerStyles.pickerCancelText}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <Text style={pickerStyles.pickerTitle}>
                                  Select Start Date
                                </Text>
                                <TouchableOpacity
                                  onPress={confirmStartDateSelection}
                                >
                                  <Text style={pickerStyles.pickerConfirmText}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={tempStartDate}
                                mode="date"
                                display="spinner"
                                themeVariant="light"
                                textColor="#000000"
                                onChange={(event, date) =>
                                  handleDateChange(event, date, "start")
                                }
                                style={pickerStyles.iosPickerStyle}
                                maximumDate={new Date()}
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  )}

                  {/* iOS End Date Picker Modal */}
                  {Platform.OS === "ios" && showEndDatePicker && (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showEndDatePicker}
                      onRequestClose={cancelEndDateSelection}
                    >
                      <TouchableWithoutFeedback
                        onPress={cancelEndDateSelection}
                      >
                        <View style={pickerStyles.pickerModalContainer}>
                          <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                          >
                            <View style={pickerStyles.pickerContainer}>
                              <View style={pickerStyles.pickerHeader}>
                                <TouchableOpacity
                                  onPress={cancelEndDateSelection}
                                >
                                  <Text style={pickerStyles.pickerCancelText}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <Text style={pickerStyles.pickerTitle}>
                                  Select End Date
                                </Text>
                                <TouchableOpacity
                                  onPress={confirmEndDateSelection}
                                >
                                  <Text style={pickerStyles.pickerConfirmText}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={tempEndDate}
                                mode="date"
                                display="spinner"
                                themeVariant="light"
                                textColor="#000000"
                                onChange={(event, date) =>
                                  handleDateChange(event, date, "end")
                                }
                                style={pickerStyles.iosPickerStyle}
                                minimumDate={tempFilter.startDate}
                                maximumDate={new Date()}
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  )}

                  {/* Android Date Pickers */}
                  {Platform.OS === "android" && showStartDatePicker && (
                    <DateTimePicker
                      value={tempFilter.startDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) =>
                        handleDateChange(event, date, "start")
                      }
                      maximumDate={new Date()}
                    />
                  )}

                  {Platform.OS === "android" && showEndDatePicker && (
                    <DateTimePicker
                      value={tempFilter.endDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) =>
                        handleDateChange(event, date, "end")
                      }
                      minimumDate={tempFilter.startDate}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={filterStyles.actionButtons}>
              <TouchableOpacity
                style={filterStyles.resetButton}
                onPress={resetFilters}
              >
                <Text style={filterStyles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  filterStyles.applyButton,
                  !isFilterValid() && filterStyles.applyButtonDisabled,
                ]}
                onPress={applyFilters}
                disabled={!isFilterValid()}
              >
                <LinearGradient
                  colors={
                    isFilterValid() ? ["#4A90E2", "#357ABD"] : ["#ccc", "#aaa"]
                  }
                  style={filterStyles.applyButtonGradient}
                >
                  <Text style={filterStyles.applyButtonText}>
                    Apply Filters
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Existing Modals - Income/Expenditure, Add Expense, Delete Confirm */}
      <Modal
        visible={isIncomeModalVisible || isExpenditureModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setIncomeModalVisible(false);
          setExpenditureModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {isIncomeModalVisible ? "Income Details" : "Expenditure Details"}
            </Text>
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={() => {
                setIncomeModalVisible(false);
                setExpenditureModalVisible(false);
              }}
            >
              <Ionicons name="close" size={24} color="#444" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthPickerContainer}>
            <TouchableOpacity
              style={styles.monthPickerButton}
              onPress={openMonthPicker}
            >
              <Text style={styles.monthPickerText}>
                {formatMonthYear(selectedMonth)}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#444" />
            </TouchableOpacity>

            {/* iOS Month Picker Modal */}
            {Platform.OS === "ios" && showMonthPicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showMonthPicker}
                onRequestClose={cancelMonthSelection}
              >
                <TouchableWithoutFeedback onPress={cancelMonthSelection}>
                  <View style={pickerStyles.pickerModalContainer}>
                    <TouchableWithoutFeedback
                      onPress={(e) => e.stopPropagation()}
                    >
                      <View style={pickerStyles.pickerContainer}>
                        <View style={pickerStyles.pickerHeader}>
                          <TouchableOpacity onPress={cancelMonthSelection}>
                            <Text style={pickerStyles.pickerCancelText}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <Text style={pickerStyles.pickerTitle}>
                            Select Month
                          </Text>
                          <TouchableOpacity onPress={confirmMonthSelection}>
                            <Text style={pickerStyles.pickerConfirmText}>
                              Done
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={tempSelectedMonth}
                          mode="date"
                          display="spinner"
                          themeVariant="light"
                          textColor="#000000"
                          onChange={(event, date) =>
                            handleDateChange(event, date, "month")
                          }
                          style={pickerStyles.iosPickerStyle}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}

            {/* Android Month Picker */}
            {Platform.OS === "android" && showMonthPicker && (
              <DateTimePicker
                value={selectedMonth}
                mode="date"
                display="spinner"
                onChange={(event, date) =>
                  handleDateChange(event, date, "month")
                }
              />
            )}
          </View>

          <View style={styles.cardContainer}>
            {isIncomeModalVisible ? (
              filteredIncome.length > 0 ? (
                <FlatList
                  data={filteredIncome}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.incomeCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons name="person" size={20} color="#444" />
                          <Text style={styles.cardHeaderText}>
                            {item.client_name}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.amountLabel}>Amount Paid:</Text>
                        <Text style={styles.amountValue}>
                          ₹{item.fees_paid}
                        </Text>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No income records found for this month
                  </Text>
                </View>
              )
            ) : filteredExpenses.length > 0 ? (
              <FlatList
                data={filteredExpenses}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.expenseCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons name="cash-outline" size={20} color="#444" />
                        <Text style={styles.cardHeaderText}>
                          {item.expenditure_type}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.amountLabel}>Amount:</Text>
                      <Text style={styles.amountValue}>₹{item.amount}</Text>
                    </View>
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setExpenditureModalVisible(false);
                          setTimeout(() => toggleAddExpenseModal(item), 300);
                        }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteExpense(item)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                  No expense records found for this month
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isDeleteConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteConfirmModal}
        // Add these props to ensure it appears above other modals
        presentationStyle="overFullScreen" // iOS specific
        statusBarTranslucent={true} // Android specific
      >
        <View style={[styles.confirmModalOverlay, { zIndex: 9999 }]}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="warning-outline" size={32} color="#FF5757" />
              <Text style={styles.confirmModalTitle}>Delete Expense</Text>
            </View>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={closeDeleteConfirmModal}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDeleteExpense}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            {isLoading && <FitnessLoader />}
          </View>
        </View>
      </Modal>
      {/* UPDATED ADD EXPENSE MODAL WITH OFFICIAL PICKER */}
      <Modal
        visible={isAddExpenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => toggleAddExpenseModal()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContainer, { maxHeight: "80%" }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <Text style={styles.modalHeader}>
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </Text>

                  <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Date *</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={openExpenseDatePicker}
                      >
                        <Text style={styles.dateText}>
                          {expenseDate.toLocaleDateString()}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={24}
                          color="#444"
                        />
                      </TouchableOpacity>
                      {formErrors.date && (
                        <Text style={styles.errorText}>{formErrors.date}</Text>
                      )}

                      {/* iOS Expense Date Picker Modal */}
                      {Platform.OS === "ios" && showDatePicker && (
                        <Modal
                          transparent={true}
                          animationType="slide"
                          visible={showDatePicker}
                          onRequestClose={cancelExpenseDateSelection}
                        >
                          <TouchableWithoutFeedback
                            onPress={cancelExpenseDateSelection}
                          >
                            <View style={pickerStyles.pickerModalContainer}>
                              <TouchableWithoutFeedback
                                onPress={(e) => e.stopPropagation()}
                              >
                                <View style={pickerStyles.pickerContainer}>
                                  <View style={pickerStyles.pickerHeader}>
                                    <TouchableOpacity
                                      onPress={cancelExpenseDateSelection}
                                    >
                                      <Text
                                        style={pickerStyles.pickerCancelText}
                                      >
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                    <Text style={pickerStyles.pickerTitle}>
                                      Select Date
                                    </Text>
                                    <TouchableOpacity
                                      onPress={confirmExpenseDateSelection}
                                    >
                                      <Text
                                        style={pickerStyles.pickerConfirmText}
                                      >
                                        Done
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                  <DateTimePicker
                                    value={tempExpenseDate}
                                    mode="date"
                                    display="spinner"
                                    themeVariant="light"
                                    textColor="#000000"
                                    onChange={(event, date) =>
                                      handleDateChange(event, date, "expense")
                                    }
                                    style={pickerStyles.iosPickerStyle}
                                    maximumDate={new Date()}
                                  />
                                </View>
                              </TouchableWithoutFeedback>
                            </View>
                          </TouchableWithoutFeedback>
                        </Modal>
                      )}

                      {/* Android Date Picker */}
                      {Platform.OS === "android" && showDatePicker && (
                        <DateTimePicker
                          value={expenseDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) =>
                            handleDateChange(event, date, "expense")
                          }
                          maximumDate={new Date()}
                        />
                      )}
                    </View>

                    {/* EXPENSE TYPE PICKER WITH RNPICKERSELECT */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Expense Type *</Text>
                      <View style={pickerSelectStyles.pickerContainer}>
                        <RNPickerSelect
                          value={expenseType}
                          onValueChange={(value) => setExpenseType(value)}
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          placeholder={{
                            label: "Select expense type...",
                            value: "",
                          }}
                          items={expenseTypeItems}
                          Icon={() => (
                            <Ionicons
                              name="chevron-down"
                              size={20}
                              color="#666666"
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {formErrors.type && (
                        <Text style={styles.errorText}>{formErrors.type}</Text>
                      )}
                    </View>

                    {expenseType === "Others" && (
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Specify Type *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter expense type"
                          value={customExpenseType}
                          onChangeText={setCustomExpenseType}
                        />
                        {formErrors.customType && (
                          <Text style={styles.errorText}>
                            {formErrors.customType}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Amount (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                        value={expenseAmount}
                        onChangeText={setExpenseAmount}
                      />
                      {formErrors.amount && (
                        <Text style={styles.errorText}>
                          {formErrors.amount}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => toggleAddExpenseModal()}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        !isFormValid() && styles.disabledButton,
                      ]}
                      onPress={submitExpense}
                      disabled={!isFormValid() || isSubmitting}
                    >
                      <Text style={styles.submitButtonText}>
                        {isSubmitting
                          ? "Submitting..."
                          : editingExpense
                          ? "Update Expense"
                          : "Add Expense"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isSubmitting && <FitnessLoader />}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EXPENSE TYPE PICKER MODAL - REMOVED, NOW HANDLED BY RNPICKERSELECT */}

      {isLoading && <FitnessLoader />}
    </ScrollView>
  );
};

// iOS Picker Styles
const pickerStyles = {
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  confirmModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 340,
    width: "90%",
    elevation: 20, // High elevation for Android
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    zIndex: 10000, // Even higher z-index for the container
  },
};

// RNPickerSelect Styles
const pickerSelectStyles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIOS: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 12,
    color: "#333",
    paddingRight: 50, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 45,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 12,
    color: "#333",
    paddingRight: 50,
    backgroundColor: "transparent",
  },
  placeholder: {
    color: "#999",
    fontSize: 16,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 16 : 12,
    right: 16,
  },
});

// Expense Picker Styles - REMOVED, NOW USING RNPICKERSELECT

// Filter Styles
const filterStyles = {
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  filterHeaderLeft: {
    flex: 1,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  filterSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  filterButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingTop: 20,
  },
  optionCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#4A90E2",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: "#4A90E2",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionLabelSelected: {
    color: "#4A90E2",
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  dateSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
};

export default RenderFinancesTab;
