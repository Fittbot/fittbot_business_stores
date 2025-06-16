import React, { useState, useMemo } from "react";
import {
  Platform,
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";

const TAB_ICONS = {
  home: require("../../assets/images/TabNavigatore/home.png"),
  home_active: require("../../assets/images/TabNavigatore/home_active.png"),
  feed: require("../../assets/images/TabNavigatore/feed.png"),
  feed_active: require("../../assets/images/TabNavigatore/feed_active_2.png"),
  clients: require("../../assets/images/TabNavigatore/clients.png"),
  clients_active: require("../../assets/images/TabNavigatore/clients_active.png"),
  analysis: require("../../assets/images/TabNavigatore/analysis.png"),
  analysis_active: require("../../assets/images/TabNavigatore/analysis_active_2.png"),
};

const TAB_COLORS = {
  home: "#A1338E",
  feed: "#5B6EB9",
  add: "#297DB3",
  client: "#2E4C5B",
  analysis: "#0F6861",
  default: "#000",
};

export default function TabNavigator({
  isSliderVisible,
  toggleSlider,
  rotateButton,
  scaleButton,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");

  // Memoize tab color calculation
  const getTabColor = useMemo(() => {
    return (routeName) => {
      if (routeName === activeTab) {
        return TAB_COLORS[routeName] || TAB_COLORS.default;
      }
      return "#979797";
    };
  }, [activeTab]);

  // Memoize tab bar style to prevent recalculation
  const tabBarStyle = useMemo(() => {
    const isMarketplace = pathname.includes("/marketplace");
    return Platform.select({
      ios: {
        position: "absolute",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0,
        paddingTop: 5,
        height: 70,
        display: isMarketplace ? "none" : "flex",
      },
      default: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderColor: "#FFDDDD",
        paddingTop: 5,
        height: 70,
        display: isMarketplace ? "none" : "flex",
      },
    });
  }, [pathname]);

  const handleTabPress = (routeName) => {
    setActiveTab(routeName);
    // Use replace instead of push for tab navigation
    router.replace({
      pathname: `/owner/${routeName}`,
      params: {
        is_active: false,
      },
    });
  };

  // Create tab icon component to reduce repetition
  const TabIcon = ({ name, focused }) => {
    const iconKey = focused ? `${name}_active` : name;
    const iconSource =
      name === "client"
        ? focused
          ? TAB_ICONS.clients_active
          : TAB_ICONS.clients
        : TAB_ICONS[iconKey];

    return (
      <View style={styles.iconContainer}>
        <Image style={styles.tabIcon} source={iconSource} />
      </View>
    );
  };

  // Memoize screen options
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#979797",
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarStyle,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIconStyle: styles.tabBarIcon,
      tabBarItemStyle: styles.tabBarItem,
    }),
    [tabBarStyle]
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarActiveTintColor: getTabColor(route.name),
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("home");
          },
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="feed" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("feed");
          },
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: ({ children }) => (
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={toggleSlider}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.addButton,
                  {
                    transform: [
                      { rotate: rotateButton },
                      { scale: scaleButton },
                      { scale: !isSliderVisible ? 1 : 0 },
                    ],
                  },
                ]}
              >
                <Ionicons name="add" size={32} color="#FFF" />
              </Animated.View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="client"
        options={{
          title: "Client",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="client" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("client");
          },
        }}
      />

      <Tabs.Screen
        name="analysis"
        options={{
          title: "Analysis",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="analysis" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("analysis");
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabIcon: {
    width: 30,
    height: 25,
    resizeMode: "contain",
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    paddingBottom: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2159D0",
    alignItems: "center",
    justifyContent: "center",
    // shadowColor: "#FF5757",
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    // elevation: 8,
  },
});
