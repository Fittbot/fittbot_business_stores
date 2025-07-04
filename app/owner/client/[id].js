import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ClientInformation from "../../../components/client/ClientInformation";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../../components/home/finances/TabHeader";
import Toast from "react-native-toast-message";
import ClientDietReport from "../../../components/client/ClientDietReport";
import ClientWorkoutReport from "../../../components/client/ClientWorkoutReport";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import AccessDeniedComponent from "../../../utils/accessDeniedComponent";

const ClientInfo = () => {
  const { id, client: clientString } = useLocalSearchParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (clientString) {
      try {
        const clientData = JSON.parse(decodeURIComponent(clientString));
        setClient(clientData);
      } catch (error) {
        showToast({
          type: "error",
          title: "Error parsing client data",
        });
      }
    }
  }, [clientString]);

  const tabs = client?.is_old_client
    ? [{ id: "info", label: "Information" }]
    : [
        { id: "info", label: "Information" },
        { id: "workout", label: "Workout Report" },
        { id: "diet", label: "Diet Report" },
      ];

  return (
    <SafeAreaView style={styles.container}>
      <NewOwnerHeader
        text="Client Details"
        onBackButtonPress={() => {
          router.push({
            pathname: "/owner/client",
          });
        }}
      />

      <TabHeader activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      <SafeAreaView style={styles.container}>
        {activeTab === "info" && <ClientInformation client={client} />}
        {activeTab === "diet" &&
          (client.data_sharing ? (
            <ClientDietReport clientId={id} />
          ) : (
            <AccessDeniedComponent />
          ))}
        {activeTab === "workout" &&
          (client.data_sharing ? (
            <ClientWorkoutReport
              clientId={id}
              gender={client.gender || "male"}
            />
          ) : (
            <AccessDeniedComponent />
          ))}
      </SafeAreaView>
      <Toast />
    </SafeAreaView>
  );
};

export default ClientInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  comingSoon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: "#666",
  },
});
