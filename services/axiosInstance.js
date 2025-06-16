import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import { deleteToken, getToken, saveToken } from "../utils/auth";
import apiConfig from "./apiConfig";
import { showToast } from "../utils/Toaster";
const baseURL = apiConfig.API_URL;

const axiosInstance = axios.create({ baseURL });

let isRefreshing = false;
let refreshPromise = null;

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    showToast({
      type: "error",
      title: "Error",
      desc: error,
    });
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken();
      }

      try {
        const newAccessToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          handleLogout();
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshPromise = null;
        handleLogout();
      }
    } else {
    }

    return Promise.reject(error);
  }
);

const refreshToken = async () => {
  try {
    const ownerId = await getToken("owner_id");

    const role = "owner";
    if (!ownerId) {
      handleLogout();
      return null;
    }

    const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
      id: ownerId,
      role: role,
    });

    if (refreshResponse?.status === 200) {
      // await SecureStore.setItemAsync(
      //   'access_token',
      //   refreshResponse.data.access_token
      // );
      await saveToken("access_token", refreshResponse.data.access_token);
      return `Bearer ${refreshResponse.data.access_token}`;
    } else {
      handleLogout();
      return null;
    }
  } catch (error) {
    handleLogout();
    return null;
  }
};

const handleLogout = async () => {
  await deleteToken("access_token");
  router.replace("/");
};

export default axiosInstance;
