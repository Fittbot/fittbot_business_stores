import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
  SafeAreaView,
  NativeModules,
  Platform,
} from "react-native";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");
const { NavigationMode } = NativeModules;

const BottomSheetMenu = ({ isVisible, onClose, role }) => {
  const router = useRouter();
  const bottomSheetHeight = height * 0.7;

  // Animation values
  const slideAnim = useRef(new Animated.Value(bottomSheetHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const menuItems =
    role === "owner"
      ? [
          {
            title: "Add Client",
            icon: require("../../assets/images/header/icon_1.png"),
            route: "/owner/clientform",
          },
          {
            title: "Manage Trainer",
            icon: require("../../assets/images/header/icon_2.png"),
            route: "/owner/trainerform",
          },
          {
            title: "Plans & Batches",
            icon: require("../../assets/images/header/icon_3.png"),
            route: "/owner/manageplans",
          },
          {
            title: "Template",
            icon: require("../../assets/images/header/icon_4.png"),
            route: "/owner/manageNutritionAndWorkoutTemplate",
          },
          {
            title: "Assignments",
            icon: require("../../assets/images/header/icon_5.png"),
            route: "/owner/assigntrainer",
          },
          {
            title: "Enquiries",
            icon: require("../../assets/images/header/icon_6.png"),
            route: "/owner/addEnquiry",
          },
          {
            title: "Brochures",
            icon: require("../../assets/images/header/icon_7.png"),
            route: "/owner/gymPlans",
          },
          {
            title: "Prizes",
            icon: require("../../assets/images/header/icon_8.png"),
            route: "/owner/gymdata",
          },
          {
            title: "Rewards",
            icon: require("../../assets/images/header/icon_9.png"),
            route: "/owner/rewards",
          },
        ]
      : [];

  // Pan responder for swipe-down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeMenu();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Optimized animation control
  useEffect(() => {
    if (isVisible) {
      // Reset animations
      slideAnim.setValue(bottomSheetHeight);
      fadeAnim.setValue(0);
      contentOpacity.setValue(0);

      // Animate overlay and content together for faster interaction
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        // Make content visible immediately after slide starts
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 150,
          delay: 50, // Small delay to let slide animation start
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, bottomSheetHeight]);

  // Close menu animation sequence
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: bottomSheetHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Don't render when not visible
  if (!isVisible && fadeAnim._value === 0) {
    return null;
  }

  const navigateToRoute = (route) => {
    closeMenu();
    setTimeout(() => {
      try {
        router.push(route);
      } catch (error) {
        showToast({
          type: "error",
          title: "Navigation error",
          desc: error.message,
        });
      }
    }, 300);
  };

  return (
    <SafeAreaView
      style={StyleSheet.absoluteFill}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {/* Backdrop overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </Pressable>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle for dragging down */}
        <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <Animated.View style={{ opacity: contentOpacity }}>
          <Text style={styles.title}>Quick Links</Text>

          {/* Menu items grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <View key={`menu-item-${index}`} style={styles.menuItem}>
                <Pressable
                  style={({ pressed }) => [
                    styles.menuButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => navigateToRoute(item.route)}
                  pointerEvents="auto" // Ensure immediate interaction
                >
                  <Image source={item.icon} style={styles.iconImage} />
                  <Text style={styles.menuText}>{item.title}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 40,
    height: Platform.OS === "ios" ? "65%" : "62%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 20,
  },
  dragHandleContainer: {
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginTop: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    margin: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  menuItem: {
    width: "30%",
    marginBottom: 24,
    alignItems: "center",
  },
  menuButton: {
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  iconImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 8,
  },
  menuText: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    color: "#333",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default BottomSheetMenu;
