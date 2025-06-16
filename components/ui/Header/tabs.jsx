import React from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { deleteToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";

const MenuItems = ({ setIsMenuVisible = {} }) => {
  const menuItems = [
    {
      id: "profile",
      icon: "person-outline",
      text: "My Profile",
      onPress: () => {
        router.push("/owner/ownerprofile");
        setIsMenuVisible(false);
      },
    },
    {
      id: "foods",
      icon: "nutrition-outline",
      text: "View All Foods",
      onPress: () => {
        router.push("/owner/viewallfoods");
        setIsMenuVisible(false);
      },
    },
    // {
    //   id: "reminders",
    //   icon: "notifications-outline",
    //   text: "Reminders",
    //   onPress: () => {
    //     // router.push("/client/reminders");
    //     setIsMenuVisible(false);
    //   },
    // },
    {
      id: "feedback",
      icon: "mail-outline",
      text: "Gym Feedback",
      onPress: () => {
        router.push("/owner/feedback");
        setIsMenuVisible(false);
      },
    },
    // {
    //   id: "refer",
    //   icon: "person-add",
    //   text: "Refer and Earn",
    //   onPress: () => {
    //     // router.push("/client/referral");
    //     setIsMenuVisible(false);
    //   },
    // },
    {
      id: "support",
      icon: "help-circle-outline",
      text: "Help & Support",
      onPress: () => {
        router.push("/owner/Help");
        setIsMenuVisible(false);
      },
    },
    {
      id: "rate_us",
      icon: "star",
      text: "Rate Us",
      onPress: () => {
        router.push("/owner/rateus");
        setIsMenuVisible(false);
      },
    },
    {
      id: "logout",
      icon: "log-out-outline",
      text: "Logout",
      onPress: async () => {
        try {
          await deleteToken("gym_id");
          await deleteToken("owner_id");
          await deleteToken("role");
          await deleteToken("gym_name");
          await deleteToken("access_token");
          await deleteToken("refresh_token");
          await deleteToken("name");
          router.push("/");
        } catch (error) {
          showToast({
            type: "error",
            title: "Error Logging out",
            desc: error,
          });
        }
        setIsMenuVisible(false);
      },
    },
  ];

  return { menuItems };
};

export default MenuItems;
