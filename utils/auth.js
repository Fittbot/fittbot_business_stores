import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const saveToken = async (key, value) => {
  if (Platform.OS === "web") {
    return localStorage.setItem(key, value);
  } else {
    return await SecureStore.setItemAsync(key, value);
  }
};

export const getToken = async (key) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const deleteToken = async (key) => {
  if (Platform.OS === "web") {
    return localStorage.removeItem(key);
  } else {
    return await SecureStore.deleteItemAsync(key);
  }
};
