import "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";
import { Platform, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationProvider } from "../context/NavigationContext";
import * as Notifications from "expo-notifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const channel = notification.request.content.data?.channel || "default";

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldHandleActionButtons: true,
      vibrate: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

async function configureNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#FF231F7C",
      enableVibrate: true,
      sound: "default",
      enableLights: true,
      showBadge: true,
    });
  }
}

export default function RootLayout() {
  const [role, setRole] = useState("owner");
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  useEffect(() => {
    configureNotificationChannels();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <NavigationProvider>
            <View style={{ zIndex: 10000 }}>
              <Toast topOffset={70} />
            </View>
            <Stack>
              <Stack.Screen
                name="owner/(tabs)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(diet)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(workout)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(feed)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              {/* <Stack.Screen name="owner/(tabs)/manageClients" options={{ headerShown: false }} /> */}
              <Stack.Screen
                name="shimmerExamples"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="index"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="forgotpassword"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="register"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="changepassword"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="verificationowner"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/allclients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/Help"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/assigntrainer"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assigntrainerpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assignworkoutpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assigndietpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assignplans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientdata"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientform"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/diet"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/gymdata"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageplans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/trainerform"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/workout_schedule"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/selectgym"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/ownerprofile"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/feedback"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/rewards"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/viewallfoods"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/addEnquiry"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageNutritionAndWorkoutTemplate"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/gymPlans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientEstimate"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/unpaidMembers"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/paidMembersReceiptListPage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageClients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientsManagement"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/client/[id]"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/rateus"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="owner/OtpVerification"
                options={{ headerShown: false, gestureEnabled: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </NavigationProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
