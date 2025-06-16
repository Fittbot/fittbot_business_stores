import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';

// Individual card component
const PrizeMemberCard = ({ member }) => {

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={require('../../assets/images/user_1.png')}
          style={styles.profileImage}
          contentFit="cover"
        />
        <View style={styles.headerText}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberId}>ID: {member.memberId}</Text>
        </View>
      </View>

      <View style={styles.prizeInfo}>
        <View style={styles.giftIconContainer}>
          <Image
            source={require('../../assets/images/prize/gift_icon.png')}
            style={[
              styles.giftIcon,
              { marginLeft: member.prize.length > 20 ? 25 : 0 },
            ]}
            contentFit="cover"
          />
        </View>
        <View style={styles.scrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={member.prize.length > 15}
            contentContainerStyle={styles.scrollContent}
          >
            <Text
              style={[
                styles.prizeText,
                member.prize.length > 20 && { paddingRight: 20 }, // Add padding if scrollable
              ]}
              numberOfLines={1}
            >
              {member.prize}
            </Text>
          </ScrollView>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.dateContainer}>
          <Text style={styles.clockIcon}>⏱</Text>
          <Text style={styles.dateText}>{member.date}</Text>
        </View>
        <Text style={styles.xpText}>XP:{member.xp}</Text>
      </View>

      {member.is_given ? (
        <TouchableOpacity style={styles.givePrizeButton}>
          <Text style={styles.buttonText}>Given</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.givePrizeButton}>
          <Text style={styles.buttonText}>Give Prize</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PrizeMemberCard;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  memberId: {
    fontSize: 10,
    color: '#666',
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  giftIconContainer: {
    marginRight: 8,
    // marginLeft: 8,
  },
  giftIcon: {
    width: 16,
    height: 16,
  },
  prizeText: {
    fontSize: 14,
    color: '#0085FF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  givePrizeButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 12,
  },
});
