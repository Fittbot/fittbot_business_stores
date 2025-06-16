import { Feather } from "@expo/vector-icons"; // or 'react-native-vector-icons/Feather'
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { textSplitterAndCapitalizer } from "../../utils/textSplitterAndCapitalizer";
import { dateUtils } from "../../utils/date";

const ReceiptModal = ({
  visible,
  onClose,
  invoice,
  onDownload,
  onsubmit,
  RedButtonText,
  gymData, // New prop for gym data from API
}) => {
  // Calculate GST amounts based on GST type
  const calculateGSTAmounts = () => {
    const baseAmount = invoice.total || 0;
    const gstPercentage = invoice.gstPercentage || 0;

    if (invoice.gstType === "no_gst" || !gstPercentage) {
      return {
        subtotal: baseAmount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: baseAmount,
      };
    }

    if (invoice.gstType === "inclusive") {
      // GST is included in the total amount
      const gstAmount = (baseAmount * gstPercentage) / (100 + gstPercentage);
      const subtotal = baseAmount - gstAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      return {
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        total: baseAmount,
      };
    } else {
      // GST is exclusive - added on top
      const gstAmount = (baseAmount * gstPercentage) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const total = baseAmount + gstAmount;

      return {
        subtotal: baseAmount,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        total: total,
      };
    }
  };

  const gstAmounts = calculateGSTAmounts();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={{
                  uri:
                    gymData?.logo ||
                    "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/default.png",
                }}
                style={styles.logo}
                defaultSource={require("../../assets/images/gym-logo.webp")}
              />
              <View style={styles.headerRight}>
                <Text style={styles.dateText}>
                  {dateUtils.getCurrentDateFormatted()}
                </Text>
                <Text style={styles.gymName}>
                  {gymData?.name || "Fitness Gym"}
                </Text>
                <Text style={styles.gymLocation}>
                  {gymData?.location || "Location"}
                </Text>
                {/* <Text style={styles.receiptInfo}>Receipt No: {invoice.id}</Text> */}
                <Text style={styles.gstInfo}>
                  GST No: {gymData?.gst_number || "09AAACH7409R1ZZ"}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Bill To */}
            <View
              style={[
                styles.section,
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              {gymData && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bank Details</Text>
                  <Text style={styles.text}>
                    Account Holder: {gymData.account_holdername}
                  </Text>
                  <Text style={styles.text}>
                    Account No: {gymData.account_number}
                  </Text>
                  <Text style={styles.text}>
                    IFSC Code: {gymData.account_ifsccode}
                  </Text>
                  <Text style={styles.text}>
                    Branch: {gymData.account_branch}
                  </Text>
                  {gymData.upi_id && (
                    <Text style={styles.text}>UPI ID: {gymData.upi_id}</Text>
                  )}
                </View>
              )}
              <View
                style={{
                  marginLeft: 10,
                  paddingLeft: 10,
                  borderLeftWidth: 1,
                  borderLeftColor: "#ccc",
                }}
              >
                <Text style={styles.sectionTitle}>Paid By</Text>
                <Text style={styles.text}>Name: {invoice.name}</Text>
                <Text style={styles.text}>Contact: {invoice.contact}</Text>
                <Text style={styles.text}>
                  Payment Method:{" "}
                  {textSplitterAndCapitalizer(invoice.paymentMethod)}
                </Text>
              </View>
            </View>

            {/* Payment Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Date</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>
                  Plan Details
                </Text>
                <Text
                  style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                >
                  Amount
                </Text>
              </View>
              {invoice?.items?.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.date}
                  </Text>
                  <View style={[{ flex: 4 }]}>
                    <Text style={styles.tableCell}>{item.description}</Text>
                    <Text style={styles.hsnText}>HSN: 998213</Text>
                  </View>
                  <Text
                    style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                  >
                    ₹{item.amount}
                  </Text>
                </View>
              ))}
            </View>

            {/* Show discount if applicable */}
            {invoice.discount > 0 && (
              <Text style={styles.discountText}>
                Discount ({invoice.discount.toFixed(2)}%): -₹
                {(
                  ((invoice?.items?.[0]?.amount || 0) * invoice.discount) /
                  100
                ).toFixed(2)}
              </Text>
            )}

            {/* Payment Reference Number */}
            {invoice.paymentReferenceNumber && (
              <View style={styles.section}>
                <Text style={styles.text}>
                  Reference No: {invoice.paymentReferenceNumber}
                </Text>
              </View>
            )}

            {/* Amount Breakdown */}
            <View style={styles.footerRight}>
              <Text style={styles.text}>
                Subtotal: ₹{gstAmounts.subtotal.toFixed(2)}
              </Text>

              {/* GST Breakdown */}
              {invoice.gstType !== "no_gst" && invoice.gstPercentage > 0 && (
                <>
                  <Text style={styles.text}>
                    CGST ({(invoice.gstPercentage / 2).toFixed(1)}%): ₹
                    {gstAmounts.cgst.toFixed(2)}
                  </Text>
                  <Text style={styles.text}>
                    SGST ({(invoice.gstPercentage / 2).toFixed(1)}%): ₹
                    {gstAmounts.sgst.toFixed(2)}
                  </Text>
                  <Text style={styles.gstTypeInfo}>
                    GST Type:{" "}
                    {invoice.gstType === "inclusive"
                      ? "Inclusive"
                      : "Exclusive"}
                  </Text>
                </>
              )}

              {invoice.gstType === "no_gst" && (
                <Text style={styles.noGstText}>No GST Applied</Text>
              )}

              <Text style={styles.total}>
                Total: ₹{gstAmounts.total.toFixed(2)}
              </Text>
            </View>

            {/* Bank Details */}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.section}>
                <Text style={styles.thanksText}>
                  Thanks for being part of our gym community.
                </Text>
              </View>

              {/* <View style={styles.section}>
                <Text style={styles.CCText}>
                  This invoice has been paid in full.
                </Text>
              </View> */}
            </View>
          </ScrollView>

          {/* Sticky Buttons */}
          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onsubmit} style={styles.saveButton}>
              <Text style={styles.saveText}>{RedButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReceiptModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 10,
    shadowColor: "#000",
    maxHeight: "90%",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    borderRadius: 50,
    elevation: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 16,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  gymName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    color: "#333",
  },
  gymLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  receiptInfo: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
  gstInfo: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
  hsnText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  downloadBtn: {
    flexDirection: "row",
    backgroundColor: "#1D4ED8",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
  },
  downloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionDivider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  text: {
    fontSize: 13,
    color: "#333",
    marginBottom: 3,
  },
  discountText: {
    fontSize: 13,
    color: "#28A745",
    marginBottom: 15,
    fontWeight: "500",
    textAlign: "right",
  },
  gstTypeInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
    fontStyle: "italic",
  },
  noGstText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
    fontStyle: "italic",
  },
  thanksText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  CCText: {
    fontSize: 10,
    color: "#848484",
    marginBottom: 4,
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 12,
    color: "#444",
  },
  footer: {
    flexDirection: "column",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 14,
    marginTop: 20,
  },
  footerLeft: {
    flex: 1.5,
  },
  footerRight: {
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  stickyButtonContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#6B7280",
    borderRadius: 6,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  saveText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
});
