// components/RewardCard.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image'; // Assuming 'expo-image' is installed

const RewardCard = ({
  item,
  index,
  onPress,
  onEdit,
  onDelete,
  showDropdown,
  setShowDropdown,
}) => {
  const dropdownAnim = useRef(new Animated.Value(0)).current; // For dropdown animation

  const dropdownStyle = {
    opacity: dropdownAnim,
    zIndex: 1000,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0], // Start slightly below and move up
        }),
      },
    ],
  };

  useEffect(() => {
    if (showDropdown === item?.id) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showDropdown]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        onPress();
        if (showDropdown) {
          setShowDropdown(null);
        }
      }}
    >
      <View style={styles.rewardCard}>
        <View style={styles.cardContent}>
          <View style={styles.pointsContainer}>
            <Image
              source={require('../../assets/images/rewards/rewards_img.png')} // Adjust path if needed
              style={styles.rewardImage}
            />
            <View style={styles.pointsValueWrapper}>
              <Image
                style={styles.coinIcon}
                source={require('../../assets/images/rewards/coin.png')} // Adjust path if needed
              />
              <Text style={styles.pointsValue}>{item?.xp}</Text>
            </View>
          </View>

          <View style={styles.rewardInfo}>
            <Text style={styles.giftText}>{item?.gift}</Text>

            <TouchableOpacity
              style={styles.ellipsisButton}
              onPress={() => {
                setShowDropdown(item?.id);
              }}
            >
              <Ionicons
                name="ellipsis-vertical-outline"
                size={16}
                color="#0000003e"
              />
            </TouchableOpacity>

            {showDropdown === item?.id && (
              <Animated.View style={[styles.dropdownMenu, dropdownStyle]}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    onEdit(item, index);
                    setShowDropdown(null);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#333" />
                  <Text style={styles.dropdownItemText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    onDelete(item);
                    setShowDropdown(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                  <Text style={[styles.dropdownItemText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'visible', // For dropdown to be visible
    zIndex: 100,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  pointsContainer: {
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: '#0154A0',
  },
  rewardImage: {
    height: 62,
    width: 89,
  },
  pointsValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  coinIcon: {
    height: 10,
    width: 10,
    marginRight: 5,
  },
  pointsValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#030A15',
  },
  rewardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative', // For absolute positioning of dropdown
  },
  giftText: {
    fontSize: 14,
    color: '#030A15',
    flex: 1,
    textAlignVertical: 'center',
    paddingRight: 10, // Space for ellipsis button
  },
  ellipsisButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    // height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'pink'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0, // Align with the ellipsis button
    right: 35, // Adjust as needed to position relative to ellipsis
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 100, // Ensure dropdown is above other elements
    minWidth: 100,
    paddingVertical: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  deleteText: {
    color: '#ff3b30',
  },
});

export default RewardCard;
