import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { showToast } from "../../utils/Toaster";
import {
  SendEstimatesToExpireMembers,
  UpdateInvoiceDiscount,
} from "../../services/Api"; // Only keep relevant API calls
import UserItem2 from "./UserItem2";
import NoDataComponent from "../../utils/noDataComponent";
import PaginationControls from "../ui/PaginationControls";

const RenderAboutToExpirePage = ({
  SetShowInvoice,
  setParticularInvoiceData,
  fetchInvoiceData, // Updated prop name to be more generic for fetching
  activeTab,
  title, // 'Estimate' or 'Receipt'
  allUsers, // This prop now holds the already filtered and searched users
  currentPage,
  setCurrentPage,
  itemsPerPage,
  flatListRef,
  localSelectedMonth,
  localSelectedYear,
  isAboutToExpireModalOpen,
  handleOpenAboutToExpireModal,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });
  const [emailSentUsers, setEmailSentUsers] = useState([]); // Stores IDs of users for whom emails have been sent

  // State for paginated users (derived from allUsers)
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [paginationLoading, setPaginationLoading] = useState(false);

  // Reset selection and emailSentUsers when activeTab or allUsers changes
  useEffect(() => {
    setSelectedItems([]);
    setIsSelectAll(false);
    setEmailSentUsers([]); // Clear sent status when data or tab changes
  }, [activeTab, allUsers]);

  // Effect to handle pagination logic
  useEffect(() => {
    setPaginationLoading(true);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = allUsers?.slice(startIndex, endIndex);

    setTimeout(() => {
      setPaginatedUsers(currentItems);
      setPaginationLoading(false);
      if (flatListRef.current) {
        flatListRef?.current.scrollToOffset({ offset: 0, animated: true });
      }
    }, 100); // Small delay for smoother pagination
  }, [currentPage, allUsers, itemsPerPage]);

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > Math.ceil(allUsers?.length / itemsPerPage)) {
        return;
      }
      setCurrentPage(page);
    },
    [allUsers?.length, itemsPerPage]
  );

  const toggleItemSelection = useCallback(
    (item) => {
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      const itemId = item[idKey];

      // Prevent selection if email has already been sent for this item
      if (emailSentUsers.includes(itemId)) {
        showToast({
          type: "info",
          title: "Email Already Sent",
          desc: "An email has already been sent for this member.",
        });
        return;
      }

      setSelectedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    },
    [title, emailSentUsers]
  );

  const toggleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedItems([]);
      setIsSelectAll(false);
    } else {
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      const selectableItems = paginatedUsers
        .filter((user) => !emailSentUsers.includes(user[idKey]))
        .map((user) => user[idKey]);

      setSelectedItems(selectableItems);
      setIsSelectAll(true);
    }
  }, [isSelectAll, paginatedUsers, emailSentUsers, title]);

  // Update isSelectAll state based on current page's selected items
  useEffect(() => {
    if (paginatedUsers?.length === 0) {
      setIsSelectAll(false);
      return;
    }

    const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
    const selectableUsersOnPage = paginatedUsers.filter(
      (user) => !emailSentUsers.includes(user[idKey])
    );

    const allSelectedOnPage =
      selectableUsersOnPage?.length > 0 &&
      selectableUsersOnPage.every((user) =>
        selectedItems.includes(user[idKey])
      );

    setIsSelectAll(allSelectedOnPage);
  }, [selectedItems, paginatedUsers, emailSentUsers, title]);

  const handleUpdateDiscount = useCallback(
    async (payload) => {
      setIsLoading(true);
      try {
        const response = await UpdateInvoiceDiscount(payload);
        if (response.status === 200) {
          showToast({
            type: "success",
            title: "Discount updated successfully!",
          });
          fetchInvoiceData(localSelectedMonth, localSelectedYear); // Re-fetch data
        } else {
          showToast({
            type: "error",
            title: response?.message || "Failed to update discount.",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error updating discount",
          desc: "An error occurred while updating discount.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoiceData, localSelectedMonth, localSelectedYear]
  );

  const handleSendEmails = useCallback(async () => {
    if (selectedItems?.length === 0) {
      showToast({
        type: "error",
        title: "No Selection",
        desc: "Please select at least one user to send emails.",
      });
      return;
    }

    Alert.alert(
      `Send ${title}s`,
      `Are you sure you want to send ${title}s to ${selectedItems?.length} selected members?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          onPress: async () => {
            setSendingEmails(true);
            setEmailProgress({ sent: 0, total: selectedItems?.length });

            try {
              const payload = [...selectedItems]; // Use a copy of selectedItems

              const response = await SendEstimatesToExpireMembers(payload); // Only this API for estimates

              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: `${payload?.length} ${title}s sent successfully!`,
                });
                setEmailSentUsers((prev) => [...prev, ...payload]); // Mark sent
                setSelectedItems([]); // Clear selection after sending
                fetchInvoiceData(localSelectedMonth, localSelectedYear); // Refresh data
              } else {
                showToast({
                  type: "error",
                  title: response?.message || `Failed to send ${title}s.`,
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Error",
                desc: `Failed to send ${title}s. Please try again.`,
              });
            } finally {
              setSendingEmails(false);
            }
          },
        },
      ]
    );
  }, [
    selectedItems,
    title,
    fetchInvoiceData,
    localSelectedMonth,
    localSelectedYear,
  ]);

  const keyExtractor = useCallback(
    (item) => {
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      return item[idKey] ? item[idKey].toString() : Math.random().toString();
    },
    [title]
  );

  const renderUserItem = useCallback(
    ({ item, index }) => {
      const realIndex = (currentPage - 1) * itemsPerPage + index + 1;
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      const isEmailSent = emailSentUsers.includes(item[idKey]);
      const isSelected = selectedItems.includes(item[idKey]);

      return (
        <UserItem2
          item={item}
          index={realIndex}
          setParticularInvoiceData={setParticularInvoiceData}
          SetShowInvoice={SetShowInvoice}
          handleUpdateDiscount={handleUpdateDiscount}
          toggleItemSelection={toggleItemSelection}
          emailSent={isEmailSent}
          title={title}
          isSelected={isSelected}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
        />
      );
    },
    [
      currentPage,
      itemsPerPage,
      emailSentUsers,
      selectedItems,
      setParticularInvoiceData,
      SetShowInvoice,
      handleUpdateDiscount,
      toggleItemSelection,
      title,
    ]
  );

  const totalPages = Math.max(1, Math.ceil(allUsers?.length / itemsPerPage));

  const ListHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>
        {activeTab === "Unsent" && paginatedUsers?.length > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={toggleSelectAll}
              disabled={sendingEmails || paginatedUsers?.length === 0}
            >
              <Icon
                name={isSelectAll ? "check-square" : "square"}
                size={18}
                color="#10A0F6"
              />
              <Text style={styles.selectButtonText}>
                {isSelectAll ? "Unselect All" : "Select All"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (selectedItems?.length === 0 || sendingEmails) &&
                  styles.disabledButton,
              ]}
              onPress={handleSendEmails}
              disabled={selectedItems?.length === 0 || sendingEmails}
            >
              {sendingEmails ? (
                <Text style={styles.sendButtonText}>Sending...</Text> // Simplified progress text
              ) : (
                <>
                  <Icon name="mail" size={18} color="white" />
                  <Text style={styles.sendButtonText}>
                    Send ({selectedItems?.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {sendingEmails && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#10A0F6" />
            <Text style={styles.progressText}>Sending emails...</Text>
          </View>
        )}
      </View>
    );
  }, [
    activeTab,
    paginatedUsers?.length,
    toggleSelectAll,
    sendingEmails,
    isSelectAll,
    selectedItems?.length,
    handleSendEmails,
  ]);

  const renderPaginationLoader = useCallback(() => {
    if (!paginationLoading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#10A0F6" />
        <Text style={styles.loaderText}>Loading users...</Text>
      </View>
    );
  }, [paginationLoading]);

  const renderPaginationInfo = useCallback(() => {
    const start = Math.min(
      (currentPage - 1) * itemsPerPage + 1,
      allUsers?.length
    );
    const end = Math.min(currentPage * itemsPerPage, allUsers?.length);
    const total = allUsers?.length;

    if (total === 0) return null;

    return (
      <Text style={styles.paginationInfoText}>
        Showing {start} - {end} of {total} users
      </Text>
    );
  }, [currentPage, allUsers?.length, itemsPerPage]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={paginatedUsers}
        keyExtractor={keyExtractor}
        renderItem={renderUserItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          paginationLoading ? (
            renderPaginationLoader()
          ) : (
            <NoDataComponent title={`No ${activeTab} ${title} Found`} />
          )
        }
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={false}
        initialNumToRender={itemsPerPage}
        maxToRenderPerBatch={itemsPerPage}
        windowSize={itemsPerPage}
      />

      {allUsers?.length > 0 && (
        <View style={styles.paginationFooter}>
          {renderPaginationInfo()}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    // paddingHorizontal: 15,
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  headerContainer: {
    paddingVertical: 10,
    backgroundColor: "#F5F7FA",
    zIndex: 1,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: "#E6F3FF",
    borderWidth: 1,
    borderColor: "#A6D9FF",
  },
  selectButtonText: {
    marginLeft: 8,
    color: "#10A0F6",
    fontWeight: "600",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10A0F6",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  sendButtonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#b2ebf2",
  },
  progressText: {
    marginLeft: 10,
    color: "#00796b",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  paginationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  paginationInfoText: {
    fontSize: 14,
    color: "#666",
  },
  // Styles for UserItem2 (assuming it's defined elsewhere or will be added)
  // These are example styles to show what might be in UserItem2's stylesheet
  userItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C0C0C0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  checkedCheckbox: {
    backgroundColor: "#10A0F6",
    borderColor: "#10A0F6",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userContact: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userPlan: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#F0F0F0",
  },
  emailSentBadge: {
    backgroundColor: "#d4edda",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  emailSentText: {
    color: "#155724",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default RenderAboutToExpirePage;
