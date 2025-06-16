import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Image,
  Dimensions,
  Easing,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

const BADGE_HIERARCHY = [
  {
    name: 'ROOKIE',
    image: require('../../assets/images/badges/rookie.png'),
    pointRange: '500-1999 XP',
    ranges: {
      Silver: '500-1000 XP',
      Gold: '1000-1500 XP',
      Platinum: '1500-2000 XP',
    },
  },
  {
    name: 'WARRIOR',
    image: require('../../assets/images/badges/WARRIOR.png'),
    pointRange: '2000-3499 XP',
    ranges: {
      Silver: '2000-2500 XP',
      Gold: '2500-3000 XP',
      Platinum: '3000-3500 XP',
    },
  },
  {
    name: 'MAVERICK',
    image: require('../../assets/images/badges/MAVERICK.png'),
    pointRange: '3500-4999 XP',
    ranges: {
      Silver: '3500-4000 XP',
      Gold: '4000-4500 XP',
      Platinum: '4500-5000 XP',
    },
  },
  {
    name: 'BEAST',
    image: require('../../assets/images/badges/BEAST.png'),
    pointRange: '5000-6499 XP',
    ranges: {
      Silver: '5000-5500 XP',
      Gold: '5500-6000 XP',
      Platinum: '6000-6500 XP',
    },
  },
  {
    name: 'TITAN',
    image: require('../../assets/images/badges/TITAN.png'),
    pointRange: '6500-7999 XP',
    ranges: {
      Silver: '6500-7000 XP',
      Gold: '7000-7500 XP',
      Platinum: '7500-8000 XP',
    },
  },
  {
    name: 'CHAMPION',
    image: require('../../assets/images/badges/CHAMPION.png'),
    pointRange: '8000-9499 XP',
    ranges: {
      Silver: '8000-8500 XP',
      Gold: '8500-9000 XP',
      Platinum: '9000-9500 XP',
    },
  },
  {
    name: 'LEGEND',
    image: require('../../assets/images/badges/LEGEND.png'),
    pointRange: '9500-10999 XP',
    ranges: {
      Silver: '9500-10000 XP',
      Gold: '10000-10500 XP',
      Platinum: '10500-11000 XP',
    },
  },
  {
    name: 'GLADIATOR',
    image: require('../../assets/images/badges/GLADIATOR.png'),
    pointRange: '11000-12499 XP',
    ranges: {
      Silver: '11000-11500 XP',
      Gold: '11500-12000 XP',
      Platinum: '12000-12500 XP',
    },
  },
  {
    name: 'CONQUEROR',
    image: require('../../assets/images/badges/CONQUEROR.png'),
    pointRange: '12500-14000 XP',
    ranges: {
      Silver: '12500-13000 XP',
      Gold: '13000-13500 XP',
      Platinum: '13500-14000 XP',
    },
  },
];

const BadgeDetailsPage = () => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const [selectedBadge, setSelectedBadge] = useState(0);
  const flatListRef = useRef(null);

 
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: selectedBadge,
        animated: false,
      });
    }
  }, [selectedBadge]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      //   case 'Silver':
      //     return '#C0C0C0';
      //   case 'Gold':
      //     return '#FFD700';
      //   case 'Platinum':
      //     return '#E5E4E2';
      //   default:
      //     return '#C0C0C0';
      case 'Silver':
        return '#54d278';
      case 'Gold':
        return '#ffd900';
      case 'Platinum':
        return '#4e6bd4';
      default:
        return '#C0C0C0';
    }
  };

  const renderBadgeItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.badgeItemContainer}>
        <Animated.View
          style={[styles.badgeWrapper, { transform: [{ scale }], opacity }]}
        >
          <Image source={item.image} style={styles.badgeImage} />
          <Text style={styles.badgeName}>{item.name}</Text>
        </Animated.View>
      </View>
    );
  };

  const currentBadgeData = BADGE_HIERARCHY[selectedBadge];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedBadge((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BADGE_HIERARCHY.length;

        flatListRef.current?.scrollToOffset({
          offset: nextIndex * ITEM_WIDTH,
          animated: true,
        });

        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    // <View style={{ backgroundColor: 'white' }}>

    <View style={styles.modalContainer}>
      <Animated.View
        style={[
          styles.modalContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Fittbot User's Badge Progression</Text>
          {/* <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity> */}
        </View>

        <Text style={styles.modalSubtitle}>
          Fittbot Users Unlock new badges as they earn XP through workouts and challenges
        </Text>

        <Animated.FlatList
          ref={flatListRef}
          data={BADGE_HIERARCHY}
          keyExtractor={(item) => item.name}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / ITEM_WIDTH
            );
            setSelectedBadge(index);
          }}
          initialScrollIndex={selectedBadge}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          renderItem={renderBadgeItem}
          style={styles.badgesList}
          contentContainerStyle={styles.badgesListContent}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          snapToAlignment="center"
        />

        <View style={styles.progressContainer}>
          <View style={styles.progressIndicator}>
            {BADGE_HIERARCHY?.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  selectedBadge === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Fixed level container that doesn't scroll */}
        <View style={styles.levelContainer}>
          {['Silver', 'Gold', 'Platinum'].map((level, levelIndex) => (
            <View key={levelIndex} style={[styles.levelItem]}>
              <Text style={[styles.levelTitle]}>{level}</Text>
              <Text
                style={[styles.levelRange, { color: getLevelColor(level) }]}
              >
                {currentBadgeData?.ranges[level] || '0-0 XP'}
              </Text>
            </View>
          ))}
        </View>

        {/* <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              selectedBadge === 0 && styles.disabledButton,
            ]}
            onPress={() => {
              if (selectedBadge > 0) {
                setSelectedBadge(selectedBadge - 1);
              }
            }}
            disabled={selectedBadge === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={selectedBadge === 0 ? '#ccc' : '#FF5757'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              selectedBadge === BADGE_HIERARCHY.length - 1 &&
                styles.disabledButton,
            ]}
            onPress={() => {
              if (selectedBadge < BADGE_HIERARCHY.length - 1) {
                setSelectedBadge(selectedBadge + 1);
              }
            }}
            disabled={selectedBadge === BADGE_HIERARCHY.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={
                selectedBadge === BADGE_HIERARCHY.length - 1
                  ? '#ccc'
                  : '#FF5757'
              }
            />
          </TouchableOpacity>
        </View> */}

        {/* <TouchableOpacity style={styles.keepTrainingButton}>
          <Text style={styles.keepTrainingText}>KEEP TRAINING!</Text>
        </TouchableOpacity> */}
      </Animated.View>
    </View>
    // </View>
  );
};

export default BadgeDetailsPage;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    // borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    paddingTop: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#0154A0',
    width: 10,
    height: 10,
  },
  badgesList: {
    height: 160,
    // backgroundColor: 'red',
  },
  badgesListContent: {
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'green',
    paddingLeft: 15,
  },
  badgeItemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  levelContainer: {
    width: '100%',
    marginTop: 10,
  },
  levelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8a8a8a',
    backgroundColor: '#F8F8F8',
    shadowColor: 'rgba(0, 0, 0, 0.453)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#fff',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e2e2e',
  },
  levelRange: {
    fontSize: 14,
    color: '#666',
    fontWeight: 500,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  disabledButton: {
    opacity: 0.5,
  },
  keepTrainingButton: {
    backgroundColor: '#0154A0',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  keepTrainingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
