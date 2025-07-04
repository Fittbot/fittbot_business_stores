import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
const FeeDetailsModal = ({
  visible,
  onClose,
  originalFee,
  discountedFee,
  setDiscountedFee,
  selectedPaymentOption,
  setSelectedPaymentOption,
  paymentReferenceNumber,
  setPaymentReferenceNumber,
  paymentOptions,
  plans,
  setSelectedPlan,
  handleOriginalFee,
  setShowReceiptModal,
  selectedPlan,
  gstType,
  setGstType,
  gstPercentage,
  setGstPercentage,
  gstTypeOptions,
}) => {
  const [discountType, setDiscountType] = useState("amount");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");

  const discountTypeOptions = [
    { label: "Amount (₹)", value: "amount" },
    { label: "Percentage (%)", value: "percentage" },
  ];

  const calculateFinalFee = () => {
    if (!originalFee || originalFee === 0) return 0;

    if (discountType === "amount") {
      const discount = parseFloat(discountAmount) || 0;
      return Math.max(0, originalFee - discount);
    } else {
      const discount = parseFloat(discountPercentage) || 0;
      const discountAmount = (originalFee * discount) / 100;
      return Math.max(0, originalFee - discountAmount);
    }
  };

  useEffect(() => {
    const finalFee = calculateFinalFee();
    setDiscountedFee(finalFee);
  }, [discountType, discountAmount, discountPercentage, originalFee]);

  const handleDiscountTypeChange = (value) => {
    setDiscountType(value);
    setDiscountAmount("");
    setDiscountPercentage("");
    setDiscountedFee(originalFee);
  };

  const getDiscountAmount = () => {
    if (discountType === "amount") {
      return parseFloat(discountAmount) || 0;
    } else {
      const percentage = parseFloat(discountPercentage) || 0;
      return (originalFee * percentage) / 100;
    }
  };

  const getDiscountPercentage = () => {
    if (discountType === "percentage") {
      return parseFloat(discountPercentage) || 0;
    } else {
      const amount = parseFloat(discountAmount) || 0;
      return originalFee > 0 ? (amount / originalFee) * 100 : 0;
    }
  };

  const renderPaymentOption = (option) => {
    const isSelected = selectedPaymentOption === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.paymentOptionButton,
          isSelected && styles.paymentOptionSelected,
        ]}
        onPress={() => setSelectedPaymentOption(option.value)}
      >
        <View style={styles.paymentOptionContent}>
          <View style={styles.radioButton}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.paymentOptionText}>{option.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const validateAndProceed = () => {
    if (
      gstType !== "no_gst" &&
      (!gstPercentage || parseFloat(gstPercentage) < 0)
    ) {
      Alert.alert("Error", "Please enter a valid GST percentage");
      return;
    }

    if (!originalFee || originalFee <= 0) {
      Alert.alert("Error", "Please select a plan first");
      return;
    }

    if (discountType === "amount" && discountAmount) {
      const discount = parseFloat(discountAmount);
      if (discount < 0 || discount > originalFee) {
        Alert.alert(
          "Error",
          "Discount amount cannot be negative or exceed the original fee"
        );
        return;
      }
    }

    if (discountType === "percentage" && discountPercentage) {
      const discount = parseFloat(discountPercentage);
      if (discount < 0 || discount > 100) {
        Alert.alert("Error", "Discount percentage must be between 0 and 100");
        return;
      }
    }

    onClose();
    setShowReceiptModal(true);
  };

  const calculateGstAmount = () => {
    if (gstType === "no_gst" || !gstPercentage) return 0;
    const baseAmount = calculateFinalFee();
    return (baseAmount * parseFloat(gstPercentage)) / 100;
  };

  const calculateTotalAmount = () => {
    const baseAmount = calculateFinalFee();
    if (gstType === "no_gst") return baseAmount;

    const gstAmount = calculateGstAmount();
    if (gstType === "exclusive") {
      return baseAmount + gstAmount;
    }
    return baseAmount;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={() => {}}
        >
          <Text style={styles.modalTitle}>Update Fee Details</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>Select Gym plan</Text>
              <View style={styles.dropdownContainer}>
                <RNPickerSelect
                  placeholder={{
                    label: "Select Gym plan",
                    value: null,
                  }}
                  pickerProps={{
                    itemStyle: {
                      color: "#000000",
                    },
                  }}
                  onValueChange={(id) => {
                    const selected = plans.find((p) => p.id === id);
                    if (selected) {
                      setSelectedPlan(selected);
                      handleOriginalFee(selected.amount);
                      setDiscountAmount("");
                      setDiscountPercentage("");
                    }
                  }}
                  items={plans.map((plan) => ({
                    label: plan.plans,
                    value: plan.id,
                  }))}
                  style={pickerSelectStyles}
                  value={selectedPlan?.id}
                  Icon={() => (
                    <Ionicons name="chevron-down" size={18} color="#666666" />
                  )}
                  useNativeAndroidPickerStyle={false}
                  fixAndroidTouchableBug={true}
                />
              </View>
            </View>
            <View style={styles.feeRowContainer}>
              <View style={styles.feeColumn}>
                <Text style={styles.feeLabel}>Original Fee</Text>
                <TextInput
                  style={styles.feeInputDisabled}
                  keyboardType="numeric"
                  value={`₹ ${originalFee.toString()}`}
                  editable={false}
                />
              </View>

              <View style={styles.feeColumn}>
                <Text style={styles.feeLabel}>Final Fee</Text>
                <TextInput
                  style={styles.feeInputDisabled}
                  keyboardType="numeric"
                  value={`₹ ${calculateFinalFee().toString()}`}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>Discount Type</Text>
              <View style={styles.radioButtonContainer}>
                {discountTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOptionButton}
                    onPress={() => handleDiscountTypeChange(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioButton}>
                      {discountType === option.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.radioOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>
                {discountType === "amount"
                  ? "Discount Amount (₹)"
                  : "Discount Percentage (%)"}
              </Text>
              <TextInput
                style={styles.feeInput}
                keyboardType="numeric"
                value={
                  discountType === "amount"
                    ? discountAmount
                    : discountPercentage
                }
                placeholder={
                  discountType === "amount"
                    ? "Enter discount amount"
                    : "Enter discount percentage"
                }
                placeholderTextColor="#999"
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9.]/g, "");
                  if (discountType === "amount") {
                    setDiscountAmount(numericValue);
                  } else {
                    setDiscountPercentage(numericValue);
                  }
                }}
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>Payment Method</Text>
              <View style={styles.paymentOptionsGrid}>
                {paymentOptions.map((option, index) => {
                  if (index % 2 === 0) {
                    return (
                      <View key={index} style={styles.paymentOptionsRow}>
                        {renderPaymentOption(option)}
                        {index + 1 < paymentOptions.length &&
                          renderPaymentOption(paymentOptions[index + 1])}
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>
                Payment Reference No (Optional)
              </Text>
              <TextInput
                placeholder="Enter your payment reference number"
                placeholderTextColor="#999"
                style={styles.referenceInput}
                value={paymentReferenceNumber}
                onChangeText={(text) => {
                  setPaymentReferenceNumber(text);
                }}
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.feeLabel}>GST Type</Text>
              <View style={styles.gstRadioContainer}>
                {gstTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.gstRadioOptionButton}
                    onPress={() => {
                      setGstType(option.value);
                      if (option.value === "no_gst") {
                        setGstPercentage("");
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioButton}>
                      {gstType === option.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.gstRadioOptionText}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {gstType !== "no_gst" && (
              <View style={styles.sectionContainer}>
                <Text style={styles.feeLabel}>GST Percentage (%)</Text>
                <TextInput
                  style={styles.feeInput}
                  keyboardType="phone-pad"
                  value={gstPercentage}
                  placeholder="Enter GST % (e.g., 18)"
                  placeholderTextColor="#999"
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9.]/g, "");
                    setGstPercentage(numericValue);
                  }}
                />
              </View>
            )}

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Fee Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Original Amount:</Text>
                <Text style={styles.summaryValue}>₹{originalFee}</Text>
              </View>

              {getDiscountAmount() > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount:</Text>
                  <Text style={[styles.summaryValue, styles.discountText]}>
                    -₹{getDiscountAmount().toFixed(2)} (
                    {getDiscountPercentage().toFixed(1)}%)
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Base Amount:</Text>
                <Text style={styles.summaryValue}>₹{calculateFinalFee()}</Text>
              </View>

              {gstType !== "no_gst" && gstPercentage && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      GST ({gstPercentage}% {gstType}):
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₹{calculateGstAmount().toFixed(2)}
                    </Text>
                  </View>

                  {gstType === "exclusive" && (
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Amount:</Text>
                      <Text style={styles.totalValue}>
                        ₹{calculateTotalAmount().toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {gstType === "inclusive" && gstPercentage && (
                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { fontSize: 12, fontStyle: "italic" },
                    ]}
                  >
                    * GST is included in the base amount
                  </Text>
                </View>
              )}

              {gstType === "no_gst" && (
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>₹{calculateFinalFee()}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={validateAndProceed}
            >
              <LinearGradient
                colors={["#16222A", "#3A6073"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateButton}
              >
                <Text style={styles.updateButtonText}>Update Fee</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 12,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 6,
    color: "black",
    paddingRight: 35, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 44,
  },
  inputAndroid: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 6,
    color: "black",
    paddingRight: 35,
    backgroundColor: "transparent",
    minHeight: 44,
  },
  placeholder: {
    color: "#999",
    fontSize: 12,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 2 : 12,
    right: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: "85%",
    width: "100%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feeRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  feeColumn: {
    width: "48%",
  },
  feeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  feeInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 12,
  },
  feeInputDisabled: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#F0F0F0",
    color: "#666",
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 15,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden", // Add this for proper icon positioning
  },
  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
    paddingVertical: 8,
  },
  radioOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 100,
  },
  radioOptionText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 6,
  },
  gstRadioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingVertical: 8,
  },
  gstRadioOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: "center",
  },
  gstRadioOptionText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 6,
    textAlign: "center",
  },
  paymentOptionsGrid: {
    marginTop: 5,
  },
  paymentOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentOptionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
  },
  paymentOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#F8F8F8",
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    height: 15,
    width: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  paymentOptionText: {
    fontSize: 12,
    color: "#000",
  },
  referenceInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 12,
  },
  // Summary section styles
  summaryContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  discountText: {
    color: "#28A745",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: "space-between",
  },
  buttonWrapper: {
    flex: 1,
    marginRight: 10,
  },
  updateButton: {
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default FeeDetailsModal;
