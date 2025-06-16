// SideNavigation.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

import MenuItems from "./tabs";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getProfileDataAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";

// '#5c2b9b', '#ff3c7a'

const SideNavigation = ({
  isVisible,
  onClose,
  userData = {},
  color1 = "#5c2b9b",
  color2 = "#ff3c7a",
  profileData,
  gymLogo,
}) => {
  // Default user data if not provided

  const router = useRouter();
  const { menuItems } = MenuItems({ setIsMenuVisible: () => {} });

  // const getProfileData = async () => {
  //   try {
  //     const gymId = await getToken("gym_id");
  //     const ownerId = await getToken("owner_id");
  //     if (!gymId || !ownerId) {
  //       showToast({
  //         type: "error",
  //         title: "GymID or OwnerID not found",
  //       });
  //       return;
  //     }

  //     const response = await getProfileDataAPI(gymId, ownerId, null, "owner");
  //     let { name, email, contact_number, dob, age } =
  //       response?.data?.owner_data;

  //     setProfileData(response?.data?.owner_data);

  //     let {
  //       gym_id,
  //       name: gymName,
  //       location,
  //       total_members,
  //       account_number,
  //       account_holdername,
  //       account_ifsccode,
  //       account_branch,
  //       account_id,
  //       upi_id,
  //       gst_number,
  //     } = response?.data?.gym_data;

  //     setGymLogo(response?.data?.gym_data?.logo);
  //   } catch (error) {
  //     showToast({
  //       type: "error",
  //       title: "Something went wrong, please try again later.",
  //     });
  //   }
  // };

  // useEffect(() => {
  //   getProfileData();
  // }, []);

  const user = {
    name: profileData?.name || "",
    email: profileData?.email || "",
    profileImage: profileData?.profileImage,
    // require("../../../assets/images/header/user_pic.png")
    ...profileData,
  };

  // Animation value for side drawer
  const sideNavAnimation = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  // Animation for opening and closing side drawer
  useEffect(() => {
    if (isVisible) {
      Animated.timing(sideNavAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sideNavAnimation, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, sideNavAnimation]);

  if (!isVisible && sideNavAnimation._value === -SCREEN_WIDTH) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.sideNavContainer,
          { transform: [{ translateX: sideNavAnimation }] },
        ]}
      >
        <LinearGradient
          colors={[color1, color2]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        >
          <View style={styles.sideNavHeader}>
            {/* <Image source={user.profileImage} style={styles.profileImage} /> */}
            <Image
              source={
                gymLogo
                  ? { uri: gymLogo }
                  : require("../../../assets/images/offer.jpg")
              }
              style={styles.profileImage}
            />

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sideNavContent}>
          {menuItems?.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.sideNavItem}
              onPress={() => {
                item.onPress();
                onClose();
              }}
            >
              <View style={styles.sideNavItemContent}>
                <LinearGradient
                  colors={[color1, color2]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.sideNavIconContainer}
                >
                  <View>
                    <Ionicons name={item.icon} size={22} color="#ffffff" />
                  </View>
                </LinearGradient>
                <Text style={styles.sideNavItemText}>{item.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    // borderRadius: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    // borderRadius: 100,
  },
  sideNavContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxWidth: 360,
    // borderTopRightRadius: 100,
    // borderBottomRightRadius: 100,
  },
  sideNavHeader: {
    padding: 20,
    // backgroundColor: '#F5E7FF',
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 50,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  profileEmail: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 10,
  },
  editProfileButton: {
    // backgroundColor: '#9B4DEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    paddingLeft: 5,
  },
  sideNavContent: {
    flex: 1,
    paddingTop: 15,
  },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E7FF",
  },
  sideNavItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideNavIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sideNavItemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default SideNavigation;
