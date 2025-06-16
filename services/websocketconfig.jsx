import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import apiConfig from "./apiConfig";
import { showToast } from "../utils/Toaster";
import { getToken } from "../utils/auth";

const baseURL = apiConfig.API_URL;

let isRefreshing = false;
let refreshPromise = null;

const getBaseUrl = (url) => {
  return url.replace(/^(https?:\/\/)/, "");
};

const handleLogout = async () => {
  await SecureStore.deleteItemAsync("access_token");
  router.replace("/");
};

const refreshToken = async () => {
  if (isRefreshing) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const gymId = await getToken("gym_id");
      const role = "owner";

      if (!clientId) {
        await handleLogout();
        return null;
      }

      console.log("Attempting to refresh token with gym ID:", gymId);

      const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
        id: gymId,
        role: role,
      });

      if (refreshResponse?.status === 200) {
        console.log("Token refresh successful");
        const newToken = refreshResponse.data.access_token;
        await SecureStore.setItemAsync("access_token", newToken);
        return newToken;
      } else {
        console.log(
          "Token refresh failed with status:",
          refreshResponse?.status
        );
        await handleLogout();
        return null;
      }
    } catch (error) {
      console.error("Token refresh error:", error.message);
      await handleLogout();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Gets a valid token, refreshing if necessary
 */
const getValidToken = async () => {
  const token = await SecureStore.getItemAsync("access_token");

  if (!token) {
    console.log("No token found, attempting refresh");
    return await refreshToken();
  }

  return token;
};

/**
 * Verifies if a token is valid
 */
const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${baseURL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response?.status === 200;
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return false;
  }
};

/**
 * Creates a WebSocket connection
 */
const connect = async (endPoint, gymId, token) => {
  try {
    const wsUrl = websocketConfig.buildWebSocketUrl(endPoint, gymId, token);
    console.log("Attempting WebSocket connection to:", wsUrl);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established successfully");
    };

    socket.onclose = async (event) => {
      console.log(
        "WebSocket closed with code:",
        event.code,
        "reason:",
        event.reason
      );
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return socket;
  } catch (error) {
    console.error("Error connecting to WebSocket:", error.message);
    return null;
  }
};

const websocketConfig = {
  baseUrl: getBaseUrl(baseURL),
  websocketPath: "/websocket/ws",

  buildWebSocketUrl: function (endPoint, gymId, token) {
    return `wss://${this.baseUrl}${this.websocketPath}${endPoint}/${gymId}?token=${token}`;
  },

  getWebSocketUrlWithValidToken: async function (endPoint, gymId) {
    const token = await this.getVerifiedToken();
    if (!token) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Could not get a valid token",
      });
    }
    return this.buildWebSocketUrl(endPoint, gymId, token);
  },

  getVerifiedToken: async function () {
    let token = await getValidToken();
    if (!token) return null;

    const isValid = await verifyToken(token);
    if (isValid) return token;

    console.log("Token invalid, refreshing");
    return await refreshToken();
  },

  createWebSocketConnection: async function (endPoint, gymId) {
    try {
      const token = await this.getVerifiedToken();

      if (!token) {
        console.log("Could not obtain a valid token");
        return null;
      }

      return await connect(endPoint, gymId, token);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      return null;
    }
  },
};

export default websocketConfig;
