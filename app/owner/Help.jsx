import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
  Keyboard,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supportAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { TouchableWithoutFeedback } from "react-native-web";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const HelpSupportScreen = () => {
  const [selectedTab, setSelectedTab] = useState("Client Management");
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [ticketData, setTicketData] = useState({
    issueType: "",
    customSubject: "",
    email: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Updated issue types for gym admin software
  const commonIssues = [
    "Select an issue type",
    "Technical Support",
    "Client Management",
    "Payment & Billing",
    "Analytics & Reports",
    "Feature Request",
    "Data Import/Export",
    "Other",
  ];

  const faqData = {
    "Client Management": [
      {
        id: 1,
        question: "How do I add a new client to the system?",
        answer:
          "Navigate to the Add Clients from Quick Links and Scan the QR of client from Fittbot App.It will Automatically Fetch Client's Personal Details. You Just have to enter Membership details to add client",
      },
      {
        id: 2,
        question: "How can I assign workout plans to clients?",
        answer:
          "Navigate to the Assignments from Quick Links and Choose Workout, and Choose from pre-created plans and  You can assign them to clients.",
      },
      {
        id: 3,
        question: "How do I assign trainers to specific clients?",
        answer:
          "Navigate to the Assignments from Quick Links  and Choose a trainer from the list  and  You can assign them to clients.",
      },
      {
        id: 4,
        question: "Can I manage client batches and plans?",
        answer:
          "Navigate to the Plans & Batches from Quick Links and you can create/edit/delete plans and batches.",
      },
      {
        id: 5,
        question: "How do I track client attendance and progress?",
        answer:
          "The system automatically tracks attendance when clients check in. You can view detailed analytics, progress reports in the dashboard",
      },
    ],
    "Plans & Pricing": [
      {
        id: 6,
        question: "How do I create different membership plans?",
        answer:
          "Navigate to the Plans & Batches from Quick Links and click 'Add New Plan' and Fill the required details.",
      },

      {
        id: 8,
        question: "How do I manage fee collection and payment tracking?",
        answer:
          "Navigate to Client's Tab to find their fee status and update it.You can also send receipts when they pay the fees and send estimates if they haven't paid the fee",
      },
      {
        id: 9,
        question: "Can I offer discounts or promotional pricing?",
        answer:
          "Yes, you can give discounts and update it during fee collection. You can also create offers in Feed section which will be shown to all the users in their Fittbot App",
      },
    ],
    "Analytics & Reports": [
      {
        id: 10,
        question: "What analytics are available for my gym?",
        answer:
          "You can view member growth, revenue trends, attendance patterns, popular workout times, and client distributions.",
      },
      {
        id: 11,
        question: "How do I access client analytics and progress reports?",
        answer:
          "Client analytics are available in each client's profile (if they've opted in) in the Client's Tab.You can view client's metrics , Daily workout and diet reports .",
      },

      {
        id: 13,
        question: "How do I track income and expenditure?",
        answer:
          "The Financial Dashboard in Home shows real-time income from memberships, services, and products. Track expenses like equipment, utilities, salaries, and maintenance to calculate net profit.",
      },
    ],
    "System Features": [
      {
        id: 14,
        question: "How do I manage gym enquiries and leads?",
        answer:
          "The Enquiry Management system helps you track potential clients, follow up on leads and convert enquiries into memberships with automated workflows.You can reach the page from Home - Active Enquiries Card",
      },
      {
        id: 15,
        question: "Can I send emails to members?",
        answer:
          "Yes, you can emails for membership expiry reminders, payment due notifications and so on",
      },
      {
        id: 16,
        question: "How does the XP and rewards system work?",
        answer:
          "Clients earn XP points for attendance, completing workouts, and achieving diet goals. You can set up rewards and prizes based on XP levels and can distribute them .",
      },
      {
        id: 18,
        question: "How do I manage expired and expiring memberships?",
        answer:
          "The system automatically identifies expiring memberships and can send reminder emails. Use the Membership Status dashboard in the Home page to quickly renew or follow up with clients.",
      },
    ],
  };

  const toggleExpand = (itemId) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate the form before submission
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Check issue type
    if (
      ticketData.issueType === "" ||
      ticketData.issueType === "Select an issue type"
    ) {
      newErrors.issueType = "Please select an issue type";
      isValid = false;
    }

    // Check custom subject if "Other" is selected
    if (ticketData.issueType === "Other" && !ticketData.customSubject.trim()) {
      newErrors.customSubject = "Please enter your subject";
      isValid = false;
    }

    // Check email
    if (!ticketData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(ticketData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Check description
    if (!ticketData.description.trim()) {
      newErrors.description = "Please describe your issue";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitTicket = async () => {
    if (validateForm()) {
      try {
        const gym_id = await getToken("gym_id");
        if (!gym_id) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again later",
          });
        }
        const payload = {
          gym_id,
          subject:
            ticketData?.issueType === "Other"
              ? ticketData.customSubject
              : ticketData?.issueType,
          email: ticketData?.email,
          issue: ticketData?.description,
        };

        const response = await supportAPI(payload);
        if (response?.status === 200) {
          setToken(response?.data);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setModalVisible(false);
            setTicketData({
              issueType: "",
              customSubject: "",
              email: "",
              description: "",
            });
            setErrors({});
          }, 5000);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (err) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTicketData({
      issueType: "",
      customSubject: "",
      email: "",
      description: "",
    });
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/owner/home")}>
          <View style={styles.flexHead}>
            <Ionicons name="arrow-back" size={20} />
            <Text style={styles.headerTitle}>Help and Support</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(faqData).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ Content */}
      <ScrollView style={styles.content}>
        {faqData[selectedTab].map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(item.id)}
            >
              <Text style={styles.question}>{item.question}</Text>
              <Ionicons
                name={expandedItem === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedItem === item.id && (
              <Text style={styles.answer}>{item.answer}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.supportSection}>
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need Technical Support?</Text>
          <Text style={styles.supportText}>
            Having trouble with the gym management system or need help with a
            feature? Our technical support team is here to help you maximize
            your gym's efficiency.
          </Text>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="support-agent" size={18} color="#FFF" />
            <Text style={styles.supportButtonText}>Raise a ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setModalVisible(false);
            }}
          >
            <View style={styles.modalContent}>
              {showSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={60}
                      color="#4CAF50"
                    />
                  </View>
                  <Text style={styles.successTitle}>
                    Support Request Submitted!
                  </Text>
                  <Text style={styles.successText}>
                    Your support ticket ID is {token}. Our technical support
                    team will review your request and get back to you within 24
                    hours.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Raise a ticket</Text>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownSelector,
                        errors.issueType && styles.inputError,
                      ]}
                      onPress={() => setDropdownVisible(true)}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          ticketData.issueType === "Select an issue type" ||
                          !ticketData.issueType
                            ? styles.placeholderText
                            : null,
                        ]}
                      >
                        {ticketData.issueType || "Select an issue type"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                    {errors.issueType && (
                      <Text style={styles.errorTextIssue}>
                        {errors.issueType}
                      </Text>
                    )}

                    {/* Custom Dropdown Menu */}
                    {dropdownVisible && (
                      <View style={styles.dropdownMenu}>
                        {commonIssues.map((issue) => (
                          <TouchableOpacity
                            key={issue}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setTicketData({
                                ...ticketData,
                                issueType: issue,
                              });
                              if (errors.issueType) {
                                setErrors({ ...errors, issueType: null });
                              }
                              setDropdownVisible(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{issue}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Add this to close dropdown when clicking outside */}
                  {dropdownVisible && (
                    <TouchableOpacity
                      style={styles.dropdownBackdrop}
                      onPress={() => setDropdownVisible(false)}
                    />
                  )}

                  {/* Custom Subject (only shown if "Other" is selected) */}
                  {ticketData.issueType === "Other" && (
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          errors.customSubject && styles.inputError,
                        ]}
                        placeholder="Enter your subject"
                        placeholderTextColor="#999"
                        value={ticketData.customSubject}
                        onChangeText={(text) => {
                          setTicketData({ ...ticketData, customSubject: text });
                          if (errors.customSubject) {
                            setErrors({ ...errors, customSubject: null });
                          }
                        }}
                      />
                      {errors.customSubject && (
                        <Text style={styles.errorText}>
                          {errors.customSubject}
                        </Text>
                      )}
                    </View>
                  )}

                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Admin Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    value={ticketData.email}
                    onChangeText={(text) => {
                      setTicketData({ ...ticketData, email: text });
                      if (errors.email) {
                        setErrors({ ...errors, email: null });
                      }
                    }}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.description && styles.inputError,
                    ]}
                    placeholder="Describe your issue or request in detail"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={ticketData.description}
                    onChangeText={(text) => {
                      setTicketData({ ...ticketData, description: text });
                      if (errors.description) {
                        setErrors({ ...errors, description: null });
                      }
                    }}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={submitTicket}
                  >
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  flexHead: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#F8F8F8",
    minWidth: 120,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  answer: {
    fontSize: 12,
    color: "#666",
    padding: 15,
    paddingTop: 0,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 5,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextIssue: {
    color: "#FF3B30",
    fontSize: 12,
    // marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  supportSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  supportCard: {
    backgroundColor: "#FFF",
    borderRadius: 7,
    padding: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 15,
  },
  supportButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  supportButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 12,
  },
  // Success state styles
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
});

export default HelpSupportScreen;
