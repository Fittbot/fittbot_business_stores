// components/RewardDetailsModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RewardDetailsModal = ({ visible, onClose, reward }) => {
  if (!reward) return null; // Don't render if no reward is selected

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContentWrapper} onPress={() => { /* Prevent closing */ }}>
            <View style={styles.detailModalContent}>
              <Text style={styles.detailModalTitle}>Reward Details</Text>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>

              <View style={styles.detailModalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Points Required:</Text>
                  <Text style={styles.detailValue}>{reward.xp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reward:</Text>
                  <Text style={styles.detailValue}>{reward.gift}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalActionCloseButton}
                onPress={onClose}
              >
                <Text style={styles.modalActionCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContentWrapper: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  detailModalContent: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  detailModalBody: {
    width: '100%',
    paddingHorizontal: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  modalActionCloseButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalActionCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RewardDetailsModal;