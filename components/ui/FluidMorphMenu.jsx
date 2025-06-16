import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const CENTRAL_SIZE = 60;
const BUTTON_SIZE = 40;
const EXPANDED_RADIUS = 70;

const FluidMorphMenu = ({ menuItems }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = useSharedValue(0);

  const handlePressCentral = () => {
    progress.value = withTiming(isExpanded ? 0 : 1, {
      duration: 500,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    setIsExpanded(!isExpanded);
  };

  const handleButtonPress = (route) => {
    progress.value = withTiming(0, { duration: 300, easing: Easing.ease });
    setTimeout(() => {
      setIsExpanded(false);
      router.push(route);
    }, 300); // Small delay to let the collapse animation finish
  };

  const centralShapePath = 'M50,50 C20,20 80,20 50,80 C20,80 80,80 50,50'; // Example initial path

  const animatedCentralStyle = useAnimatedStyle(() => ({
    width: CENTRAL_SIZE,
    height: CENTRAL_SIZE,
    borderRadius: CENTRAL_SIZE / 2,
    backgroundColor: interpolate(
      progress.value,
      [0, 1],
      ['#FFDDDD', '#f0f0f0']
    ),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [
      { scale: interpolate(progress.value, [0, 0.8, 1], [1, 1.1, 1]) },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.5, 0]),
    transform: [
      { rotate: interpolate(progress.value, [0, 1], ['0deg', '45deg']) },
    ],
  }));

  const animatedButtonStyles = menuItems.map((item, index) => {
    const angle = ((2 * Math.PI) / menuItems.length) * index;
    return useAnimatedStyle(() => ({
      position: 'absolute',
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      backgroundColor: '#FF5757',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: progress.value,
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [0, EXPANDED_RADIUS * Math.cos(angle)]
          ),
        },
        {
          translateY: interpolate(
            progress.value,
            [0, 1],
            [0, EXPANDED_RADIUS * Math.sin(angle)]
          ),
        },
        { scale: interpolate(progress.value, [0, 0.7, 1], [0.5, 1.2, 1]) },
      ],
    }));
  });

  const animatedIconInButtonStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 0.7, 1], [0, 1.2, 1]) },
    ],
  }));

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePressCentral}>
        <Animated.View style={[styles.centralButton, animatedCentralStyle]}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="add" size={28} color="#FF5757" />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {isExpanded &&
        menuItems.map((item, index) => (
          <TouchableWithoutFeedback
            key={item.title}
            onPress={() => runOnJS(handleButtonPress)(item.route)}
          >
            <Animated.View
              style={[styles.morphButton, animatedButtonStyles[index]]}
            >
              <Animated.View style={animatedIconInButtonStyle}>
                <Ionicons name={item.iconName} size={20} color="#FFF" />
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralButton: {
    // Styles are in animatedCentralStyle
  },
  morphButton: {
    position: 'absolute',
    // Styles are in animatedButtonStyles
  },
});

export default FluidMorphMenu;
