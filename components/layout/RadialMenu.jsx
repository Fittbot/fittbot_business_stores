import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showToast } from "../../utils/Toaster";

const { width } = Dimensions.get("window");

const RadialMenu = ({ isVisible, onClose, role }) => {
  const router = useRouter();

  // Animation references for each button
  const containerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnimations = useRef([]);
  const closeButtonAnim = useRef(new Animated.Value(0)).current;

  const menuItems =
    role === "owner"
      ? [
          {
            title: "Client Management",
            iconName: "people",
            route: "/owner/clientform",
            labelPosition: { left: -30, bottom: -5 }, // Far right button - label on bottom left
          },
          {
            title: "Trainer Setup",
            iconName: "person",
            route: "/owner/trainerform",
            labelPosition: { left: -30, bottom: -0 }, // Right side button - label on bottom left
          },
          // {
          //     title: 'Workout Plans',
          //     iconName: 'barbell-outline',
          //     route: '/owner/workout_schedule',
          //     labelPosition: { left: -20, bottom: -0 } // Right-middle button - label on bottom left
          // },
          {
            title: "Manage Template",
            iconName: "list-circle-outline",
            route: "/owner/manageNutritionAndWorkoutTemplate",
            labelPosition: { left: -20, bottom: -0 }, // Right-middle button - label on bottom left
          },
          {
            title: "Gym Plans",
            iconName: "restaurant-outline",
            route: "/owner/gymPlans",
            labelPosition: { left: 5, bottom: -0 }, // Middle-right button - label slightly left
          },
          {
            title: "Assignments",
            iconName: "swap-horizontal-outline",
            route: "/owner/assigntrainer",
            labelPosition: { left: 0, bottom: -2 }, // Center button - centered label
          },
          {
            title: "Membership",
            iconName: "pricetag-outline",
            route: "/owner/manageplans",
            labelPosition: { right: -20, bottom: -4 }, // Middle-left button - label slightly right
          },
          {
            title: "Rewards",
            iconName: "star-outline",
            route: "/owner/rewards",
            labelPosition: { right: -30, bottom: 2 }, // Left-middle button - label on bottom right
          },
          {
            title: "Prizes",
            iconName: "medal-outline",
            route: "/owner/gymdata",
            labelPosition: { right: -35, bottom: 6 }, // Left side button - label on bottom right
          },
          {
            title: "Add Enquires",
            iconName: "person-add-outline",
            route: "/owner/addEnquiry",
            labelPosition: { right: -20, bottom: -2 }, // Far left button - label on bottom right
          },
        ]
      : [];

  // Initialize animations for each button
  useEffect(() => {
    if (buttonAnimations.current.length !== menuItems.length) {
      buttonAnimations.current = menuItems.map(() => new Animated.Value(0));
    }
  }, [menuItems.length]);

  // Control animations based on visibility
  useEffect(() => {
    if (isVisible) {
      // Reset animations
      containerAnim.setValue(0);
      closeButtonAnim.setValue(0);
      buttonAnimations.current.forEach((anim) => anim.setValue(0));

      // Fade in the background overlay
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate close button
      Animated.timing(closeButtonAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Animate each button in sequence with a fan-out effect
      Animated.stagger(
        30,
        buttonAnimations.current.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 80,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Animate out all at once
      Animated.parallel([
        Animated.timing(containerAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(closeButtonAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        ...buttonAnimations.current.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [isVisible]);

  // Don't render anything when not visible and animation is complete
  if (!isVisible && containerAnim._value === 0) {
    return null;
  }

  const navigateToRoute = (route) => {
    onClose();
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
    }, 100);
  };

  // Calculate the radius and angles for the top semi-circle arrangement
  const radius = width * 0.4; // Size of semi-circle
  const startAngle = 50; // Start from the right (0 radians)
  // const endAngle = Math.PI; // End at the left (π radians)
  const endAngle = -650;

  return (
    <View
      style={{ position: "absolute", bottom: 0, right: 0, left: 0, top: 0 }}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {/* Overlay background */}
      {/* <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    styles.overlay,
                    { opacity: containerAnim }
                ]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View> */}
      {isVisible && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[styles.overlay, { flex: 1, opacity: containerAnim }]}
          />
        </Pressable>
      )}

      {/* Radial menu container */}
      <View style={styles.menuContainer}>
        {/* Close button in center */}
        <Animated.View
          style={[
            styles.closeButtonWrapper,
            {
              opacity: closeButtonAnim,
              transform: [{ scale: closeButtonAnim }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
        </Animated.View>

        {menuItems.map((item, index) => {
          // Calculate position in top semi-circle
          const angle =
            startAngle +
            (index / (menuItems.length - 1)) * (endAngle - startAngle);

          // Flip the coordinates for top semicircle (negative y)
          const x = radius * Math.cos(angle);
          const y = -radius * Math.sin(angle) + 270; // Negative to go upward, additional offset

          const animation = buttonAnimations.current[index] || containerAnim;
          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          });

          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, x],
          });

          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, y],
          });

          const opacity = animation;

          return (
            <Animated.View
              key={`radial-item-${index}`}
              style={[
                styles.buttonWrapper,
                {
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  { backgroundColor: getColorForIndex(index) },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => navigateToRoute(item.route)}
              >
                <Ionicons name={item.iconName} size={24} color="#FFF" />
              </Pressable>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    position: "absolute",
                    // width: 'auto',
                    minWidth: 60,
                    maxWidth: 150,
                    ...item.labelPosition,
                  },
                ]}
              >
                <Text style={styles.labelText} numberOfLines={1}>
                  {item.title}
                </Text>
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// Generate a color from a predefined palette based on index
const getColorForIndex = (index) => {
  const colors = [
    "#FF5757", // vivid red
    "#FF7A57", // orange-red
    "#FF9E57", // deep orange
    "#FFB657", // golden orange
    "#F28B82", // soft coral
    "#EA80FC", // violet pink
    "#7C4DFF", // rich purple
    "#3F51B5", // deep indigo
    "#4DB6AC", // teal
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 99,
  },
  menuContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    paddingBottom: 30, // Space above the tab bar
  },
  buttonWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 100,
    marginBottom: 150,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    bottom: -5, // Position it below the menu items
  },
  closeButton: {
    width: 65,
    height: 65,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    color: "white",
    backgroundColor: "#FF5757",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  labelContainer: {
    marginTop: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
});

export default RadialMenu;
