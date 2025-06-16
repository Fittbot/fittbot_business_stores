import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform } from "react-native";
import TabNavigator from "../../../components/layout/TabNavigator";
import RadialMenu from "../../../components/layout/RadialMenu";
import BottomSheetMenu from "../../../components/layout/MenuSlider";

export default function TabLayout() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const buttonAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(buttonAnimation, {
      toValue: isMenuVisible ? 1 : 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isMenuVisible]);

  const rotateButton = buttonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const scaleButton = buttonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const toggleMenu = () => {
    setIsMenuVisible((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  return (
    <>
      <TabNavigator
        isSliderVisible={isMenuVisible}
        toggleSlider={toggleMenu}
        rotateButton={rotateButton}
        scaleButton={scaleButton}
      />

      {/* <RadialMenu
        isVisible={isMenuVisible}
        onClose={closeMenu}
        role="owner"
      /> */}

      <BottomSheetMenu
        isVisible={isMenuVisible}
        onClose={closeMenu}
        role="owner"
      />
    </>
  );
}
