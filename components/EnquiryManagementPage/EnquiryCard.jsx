import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Linking,
} from 'react-native';
import StatusUpdateModal from './StatusUpdateModal';
import { Ionicons } from '@expo/vector-icons';

function EnquiryCard({ enquiry, updateEnquiryStatus }) {
  const [showOptions, setShowOptions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowOptions(false);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = (reason) => {
    updateEnquiryStatus(enquiry.enquiry_id, selectedAction, reason);
    setShowStatusModal(false);
    setSelectedAction(null);
  };

  const getBadgeStyle = () => {
    switch (enquiry.status) {
      case 'Pending':
        return styles.statusPending;
      case 'Follow Up':
        return styles.statusFollowUp;
      case 'Joined':
        return styles.statusJoined;
      case 'Rejected':
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  return (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          // backgroundColor: 'pink',
        }}
      >
        <Text style={styles.cardTitle}>{enquiry.name}</Text>

        <View>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text style={styles.optionsButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Follow Up')}
          >
            <Text style={styles.optionText}>Follow Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Joined')}
          >
            <Text style={styles.optionText}>Joined</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Rejected')}
          >
            <Text style={styles.optionText}>Rejected</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardContent}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-center',
            justifyContent: 'space-between',
            // backgroundColor: 'pink',
            width: '100%',
          }}
        >
          <View>
            {enquiry.contact ? (
              <View style={styles.callRow}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() =>
                    Linking.openURL(`tel:${'+91'}${enquiry.contact}`)
                  }
                >
                  <Ionicons name="call" size={14} color="#007AFF" />
                  <Text style={styles.cardSubtitle2}>{enquiry.contact}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {enquiry.email ? (
              // <Text style={styles.cardSubtitle}>{enquiry.email}</Text>
              <View style={styles.callRow}>
                <TouchableOpacity
                  style={styles.callButton}
                  // onPress={() =>
                  //   Linking.openURL(`tel:${'+91'}${enquiry.contact}`)
                  // }
                >
                  <Ionicons name="mail" size={14} color="#007AFF" />
                  <Text style={styles.cardSubtitle2}>{enquiry.email}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {enquiry.message ? (
              // <Text style={styles.cardMessage}>{enquiry.message}</Text>
              <View style={styles.callRow}>
                <View style={styles.callButton}>
                  <Ionicons name="calendar-outline" size={14} color="#007AFF" />
                  <Text style={styles.cardMessage}>{enquiry.message}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* <Text style={styles.cardSubtitle}>{enquiry.convenientTime}</Text> */}

          <View style={[styles.statusBadge, getBadgeStyle()]}>
            <Text style={styles.statusText}>{enquiry.status}</Text>
          </View>
        </View>

        {enquiry.statusReason ? (
          <View style={styles.noteContainer}>
            {/* <Text style={styles.noteLabel}> */}
            <Ionicons name="calendar-outline" size={14} color="#007AFF" />
            <Text style={styles.noteText}>{enquiry.statusReason}</Text>
            {/* </Text> */}
          </View>
        ) : null}
      </View>

      <StatusUpdateModal
        visible={showStatusModal}
        action={selectedAction}
        onClose={() => setShowStatusModal(false)}
        onSubmit={handleStatusUpdate}
      />
    </View>
  );
}

export default EnquiryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    padding: 'auto',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#FF834E',
  },
  statusFollowUp: {
    backgroundColor: '#34C759',
  },
  statusJoined: {
    backgroundColor: '#34C759',
  },
  statusRejected: {
    backgroundColor: '#FF834E',
  },
  statusText: {
    fontSize: 10,
    // fontWeight: 'bold',
    color: '#fff',
  },
  optionsButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 5,
    zIndex: 1,
    // backgroundColor: 'orange',
  },
  optionsButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
  },
  optionsMenu: {
    position: 'absolute',
    top: 35,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 2,
    width: 130,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  optionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  cardContent: {
    marginTop: 5,
    // flexDirection: 'row',
  },
  cardTitle: {
    fontSize: 14,
    // fontWeight: 'bold',
    color: '#2c3e50',
    // marginBottom: 5,
  },
  callRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 4,
    // paddingHorizontal: 12,
    // borderRadius: 12,
    // backgroundColor: '#7affce',
    // marginLeft: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#404040',
    // marginBottom: 2,
    // marginTop: 2,
  },
  cardSubtitle2: {
    fontSize: 12,
    color: '#404040',
    marginBottom: 2,
    marginLeft: 5,
  },
  cardMessage: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 8,
    marginBottom: 5,
    marginLeft: 5,
  },
  noteContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34495e',
  },
  noteText: {
    fontWeight: 'normal',
    paddingLeft: 5,
  },
  statusInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 2,
  },
  statusValue: {
    fontWeight: 'normal',
  },
});
