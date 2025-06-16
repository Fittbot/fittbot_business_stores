import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Text, View } from "react-native";
import LiveDistribution from "./LiveDistribution";
import WorkoutDistributionChart from "./LiveDistributionChart";
import GymCard from "../ui/GymCard";
import { addPunchOutAPI } from "../../services/clientApi";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const RenderAnalyticsTab = ({ styles, analyticsData }) => {

  const handleGymExit = async () => {
      // const clientId = await AsyncStorage.getItem('client_id');
      const gymId = await getToken('gym_id');
  
      try {
        const payload = {
          // client_id: clientId,
          gym_id: gymId,
        };
  
        const response = await addPunchOutAPI(payload);
  
        if (response?.status === 200) {
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            desc: response?.detail || 'Failed to punch out',
          });
        }
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          desc: 'Something went wrong. Please try again later',
        });
      } finally {
        setLoading(false);
      }
    };



  const prepareChartData = () => {
    const chartData = {
      muscle_group: {
        labels: [],
        datasets: [{ data: [] }],
      },
      training: {
        labels: [],
        datasets: [{ data: [] }],
      },
      goals: {
        labels: [],
        datasets: [{ data: [] }],
      },
    };
    const muscleSummary =
      analyticsData?.muscleSummary || analyticsData?.muscle_summary;
    if (muscleSummary && Object.keys(muscleSummary).length > 0) {
      chartData.muscle_group.labels = Object.keys(muscleSummary);
      chartData.muscle_group.datasets[0].data =
        chartData.muscle_group.labels.map(
          (muscle) => muscleSummary[muscle].count || 0
        );
    }

    const goalsSummary =
      analyticsData?.goalsSummary || analyticsData?.goals_summary;
    if (goalsSummary && Object.keys(goalsSummary).length > 0) {
      chartData.goals.labels = Object.keys(goalsSummary);
      chartData.goals.datasets[0].data = chartData.goals.labels.map(
        (goal) => goalsSummary[goal].count || 0
      );
    }

    const trainingTypeSummary =
      analyticsData?.trainingTypeSummary ||
      analyticsData?.training_type_summary;
    if (trainingTypeSummary && Object.keys(trainingTypeSummary).length > 0) {
      chartData.training.labels = Object.keys(trainingTypeSummary);
      chartData.training.datasets[0].data = chartData.training.labels.map(
        (training) => trainingTypeSummary[training].count || 0
      );
    }

    return chartData;
  };

  const chartData = prepareChartData();

  if (analyticsData?.liveCount === 0) {
    return (
      <View style={styles.containerLive}>
        <Ionicons name="fitness-outline" size={80} color="#A0A0A0" />
        <Text style={styles.mainText}>Currently no one is in the gym</Text>
        <Text style={styles.subText}>
          Check back later for real-time updates
        </Text>
      </View>
    );
  }

  const sections = [
    {
      id: "gym-cards",
      type: "gym-cards",
      component: (
        <View style={styles.sectionContainer}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: 10,
            }}
          >
            <GymCard
              value={analyticsData?.liveCount}
              label="Active Members"
              image={require("../../assets/images/home/live_1.png")}
            />
            <GymCard
              value={analyticsData?.top_muscle || "NA"}
              label="Popular Today"
              image={require("../../assets/images/home/live_2.png")}
            />
          </View>
        </View>
      ),
    },
    {
      id: "live-distribution",
      type: "live-distribution",
      component: (
        <LiveDistribution USERS={analyticsData?.present_clients || []} />
      ),
    },
    {
      id: "workout-distribution",
      type: "workout-distribution",
      component: <WorkoutDistributionChart chartData={chartData} />,
    },
  ];

  const renderSection = ({ item }) => (
    <View key={item.id}>{item.component}</View>
  );

  return (
    <FlatList
      data={sections}
      renderItem={renderSection}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default RenderAnalyticsTab;
