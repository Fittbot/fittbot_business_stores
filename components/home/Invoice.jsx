import { Feather } from '@expo/vector-icons'; // or 'react-native-vector-icons/Feather'
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dateUtils } from '../../utils/date';

const InvoiceModal = ({ visible, onClose, invoice, onDownload }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/gym-logo.webp')}
                style={styles.logo}
                alt={invoice.gym_logo}
              />
              <View style={styles.headerRight}>
                <Text>{dateUtils.getCurrentDateFormatted()}</Text>
                <Text style={styles.invoiceNumber}>{invoice.gymName}</Text>
                <Text>Estimate No: {invoice.id}</Text>
                {/* <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={onDownload}
                >
                  <Feather name="download" size={20} color="#fff" />
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity> */}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Bill To */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.text}>Name: {invoice.name}</Text>
              {/* <Text style={styles.text}>Address: {invoice.address}</Text> */}
              <Text style={styles.text}>Contact: {invoice.contact}</Text>
            </View>

            {/* Payment Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Schedule</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>Plan</Text>
                <Text
                  style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}
                >
                  Amount
                </Text>
              </View>
              {invoice.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.date}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {item.description}
                  </Text>
                  <Text
                    style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}
                  >
                    ₹{item.amount}
                  </Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {/* <Text style={styles.text}>
                  Payment Method: {invoice.paymentMethod}
                </Text> */}
                <Text style={styles.text}>
                  Bank Details: {invoice.bankDetails}
                </Text>
              </View>
              <View style={styles.footerRight}>
                <Text style={styles.text}>Discount: {invoice.discount}%</Text>
                <Text style={styles.total}>Total: ₹{invoice.total}</Text>
              </View>
            </View>

            {/* Close Button at Bottom */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default InvoiceModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '94%',
    // height: '94%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
  },
  scrollContent: {
    // paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#1D4ED8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionDivider: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tableCell: {
    fontSize: 13,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 14,
    marginTop: 20,
  },
  footerLeft: {
    flex: 1.5,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 6,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  closeText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
});
