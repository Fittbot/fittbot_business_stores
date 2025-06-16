import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import FitnessLoader from '../ui/FitnessLoader';
import { getToken } from '../../utils/auth';
import { Ionicons } from '@expo/vector-icons';
import {
  AddExpenditureAPI,
  DeleteExpenditureAPI,
  getCollectionSummaryAPI,
  addExpendituresAPI,
  getGymHomeDataAPI,
  UpdateExpenditureAPI,
  getExpenditureListAPI,
} from '../../services/Api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import SummaryCard from './finances/SummaryCard';
import NetProfitCard from './finances/NetProfitCard';
import ReceiptsCard from './finances/ReceiptsCard';
import ActionButton from './finances/ActionButtons';
import TabHeader from './finances/TabHeader';
import { showToast } from '../../utils/Toaster';

const expenseTypes = [
  'Rent',
  'Utilities',
  'Equipment',
  'Supplies',
  'Marketing',
  'Insurance',
  'Salary',
  'Transportation',
  'Others',
];

const RenderFinancesTab = ({
  styles,
  fetchAttendanceData,
  financialData: financialData2,
  //   isAddExpenseModalVisible,
  //   setAddExpenseModalVisible,
  isIncomeModalVisible,
  setIncomeModalVisible,
  isExpenditureModalVisible,
  setExpenditureModalVisible,
  //   isDeleteConfirmModalVisible,
  //   setIsDeleteConfirmModalVisible,
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
  const [expenseType, setExpenseType] = useState('');
  const [customExpenseType, setCustomExpenseType] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] =
    useState(false);
  const [activeTab, setActiveTab] = useState('current_month');

  const [ledgerData, setLedgerData] = useState({});

  const [financialData, setFinancialData] = useState([]);

  const tabs = [
    { id: 'current_month', label: 'Current Month' },
    { id: 'overall', label: 'Overall' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const expenditureList = async () => {
    setIsLoading(true);

    try {
      const gymId = await getToken('gym_id');

      const response = await getExpenditureListAPI(gymId);

      if (response?.status === 200) {
        setFinancialData(response.data);
      } else {
        showToast({
          type: 'error',
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error || 'Something went wrong, please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const AddExpenditure = async () => {
    setIsLoading(true);

    try {
      const gymId = await getToken('gym_id');

      const payload = {
        gym_id: gymId,
        date: expenseDate,
        type: expenseType,
        amount: expenseAmount,
      };

      const response = await addExpendituresAPI(payload);

      if (response?.status === 200) {
      } else {
        showToast({
          type: 'error',
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error || 'Something went wrong, please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken('gym_id');

      const response = await getCollectionSummaryAPI(
        gymId,
        activeTab === 'current_month' ? 'current_month' : 'overall'
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
          type: 'error',
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error || 'Something went wrong, please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    expenditureList();
    fetchLedgerData();
  }, [activeTab]);

  const toggleAddExpenseModal = (expense = null) => {
    setAddExpenseModalVisible(!isAddExpenseModalVisible);

    if (expense) {
      setEditingExpense(expense.expenditure_id);
      setExpenseDate(new Date(expense.date));
      setExpenseType(expense.type);
      if (!expenseTypes.includes(expense.type)) {
        setExpenseType('Others');
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
      filterDataByMonth(selectedMonth, 'income');
    }
  };

  const toggleExpenditureModal = () => {
    setExpenditureModalVisible(!isExpenditureModalVisible);
    if (!isExpenditureModalVisible) {
      filterDataByMonth(selectedMonth, 'expense');
    }
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteConfirmModalVisible(true);
  };

  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalVisible(false);
    setExpenseToDelete(null);
  };

  const confirmDeleteExpense = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken('gym_id');

      if (!gymId || !expenseToDelete) {
        showToast({
          type: 'error',
          title: 'GymID or expenseToDelete is not available',
        });
        return;
      }

      const response = await DeleteExpenditureAPI(
        gymId,
        expenseToDelete.expenditure_id
      );

      if (response?.status === 200) {
        showToast({
          type: 'success',
          title: 'Expense deleted successfully',
        });
        closeDeleteConfirmModal();
        toggleExpenditureModal();
        await fetchAttendanceData();

        if (isExpenditureModalVisible) {
          filterDataByMonth(selectedMonth, 'expense');
        }
      } else {
        showToast({
          type: 'error',
          title: response?.detail || 'Failed to delete expense',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error?.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setExpenseDate(new Date());
    setExpenseType('');
    setCustomExpenseType('');
    setExpenseAmount('');
    setFormErrors({});
    setEditingExpense(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!expenseDate) {
      errors.date = 'Date is required';
    }

    if (!expenseType) {
      errors.type = 'Expense type is required';
    } else if (expenseType === 'Others' && !customExpenseType.trim()) {
      errors.customType = 'Please specify the expense type';
    }

    if (!expenseAmount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  const handleMonthChange = (event, selected) => {
    setShowMonthPicker(false);
    if (selected) {
      setSelectedMonth(selected);
      if (isIncomeModalVisible) {
        filterDataByMonth(selected, 'income');
      } else if (isExpenditureModalVisible) {
        filterDataByMonth(selected, 'expense');
      }
    }
  };

  const filterDataByMonth = (date, type) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (type === 'expense') {
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
      const gymId = await getToken('gym_id');

      if (!gymId) {
        showToast({
          type: 'error',
          title: 'GymID is not available',
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        date: expenseDate.toISOString().split('T')[0],
        type: expenseType === 'Others' ? customExpenseType : expenseType,
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
          type: 'success',
          title: response?.message,
        });
        toggleAddExpenseModal();
        await fetchAttendanceData();
        if (isExpenditureModalVisible) {
          filterDataByMonth(selectedMonth, 'expense');
        }
      } else {
        showToast({
          type: 'error',
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!expenseDate) return false;
    if (!expenseType) return false;
    if (expenseType === 'Others' && !customExpenseType.trim()) return false;
    if (
      !expenseAmount ||
      isNaN(expenseAmount) ||
      parseFloat(expenseAmount) <= 0
    )
      return false;
    return true;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContent}
    >
      <TabHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <View style={styles.cardsContainer}>
        <SummaryCard
          title="Total Collection"
          amount={ledgerData?.total_collection}
          icon="receipt"
          iconColor="#00A389"
          iconBgColor="#E6F7F4"
          leftImage={require('../../assets/images/finances/collection.png')}
        />
        <SummaryCard
          title="Expenditure"
          amount={ledgerData?.expenditure}
          icon="trending-down"
          iconColor="#FF4747"
          iconBgColor="#FFEDED"
          rightImage={require('../../assets/images/finances/expenditure.png')}
        />
      </View>

      <View style={{ paddingHorizontal: 15 }}>
        <NetProfitCard amount={ledgerData?.profit} />
        <ReceiptsCard
          count={ledgerData?.receipt_count}
          newCount={5}
          onPress={() => router.push('/owner/paidMembersReceiptListPage')}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <ActionButton
            onPress={() => {
              toggleAddExpenseModal();
            }}
            text={'Add Expenses'}
          />
          <ActionButton
            onPress={() => {
              toggleExpenditureModal();
            }}
            text={'View Expenses'}
          />
        </View>
      </View>

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
              {isIncomeModalVisible ? 'Income Details' : 'Expenditure Details'}
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
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={styles.monthPickerText}>
                {formatMonthYear(selectedMonth)}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#444" />
            </TouchableOpacity>
            {showMonthPicker && (
              <DateTimePicker
                value={selectedMonth}
                mode="date"
                display="spinner"
                onChange={handleMonthChange}
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
      >
        <View style={styles.confirmModalOverlay}>
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

      <Modal
        visible={isAddExpenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => toggleAddExpenseModal()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <Text style={styles.modalHeader}>
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </Text>

                  <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Date *</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
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
                      {showDatePicker && (
                        <DateTimePicker
                          value={expenseDate}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Expense Type *</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => {
                          Keyboard.dismiss();
                          setPickerVisible(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            !expenseType && styles.pickerPlaceholder,
                          ]}
                        >
                          {expenseType || 'Select expense type'}
                        </Text>
                        <Ionicons name="chevron-down" size={24} color="#444" />
                      </TouchableOpacity>
                      {formErrors.type && (
                        <Text style={styles.errorText}>{formErrors.type}</Text>
                      )}
                    </View>

                    {expenseType === 'Others' && (
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
                          ? 'Submitting...'
                          : editingExpense
                          ? 'Update Expense'
                          : 'Add Expense'}
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

      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderText}>Select Expense Type</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#444" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScrollView}>
              {expenseTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    expenseType === type && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setExpenseType(type);
                    setPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      expenseType === type && styles.pickerItemTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default RenderFinancesTab;
