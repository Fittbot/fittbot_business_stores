import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { Image } from 'expo-image';

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.iconContainer}>{icon}</View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value || 'N/A'}
      </Text>
    </View>
  </View>
);

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ClientInformation = ({ client }) => {
  if (!client) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{uri:client.profile}}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientId}>
            ID: {client.gym_client_id}
          </Text>
        </View>
      </View>

      <SectionHeader title="Personal Information" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={
            <MaterialIcons name="person-outline" size={20} color="#4B5563" />
          }
          label="Gender"
          value={client.gender}
        />
        <InfoRow
          icon={<MaterialIcons name="cake" size={20} color="#4B5563" />}
          label="Age"
          value={client.age ? `${client.age} years` : ''}
        />
        <InfoRow
          icon={<MaterialIcons name="height" size={20} color="#4B5563" />}
          label="Height"
          value={client.height}
        />
        <InfoRow
          icon={
            <MaterialIcons name="monitor-weight" size={20} color="#4B5563" />
          }
          label="Weight"
          value={client.weight}
        />
        <InfoRow
          icon={
            <MaterialIcons name="monitor-weight" size={20} color="#4B5563" />
          }
          label="BMI"
          value={client.bmi}
        />
      </View>

      <SectionHeader title="Contact Information" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={<MaterialIcons name="phone" size={20} color="#4B5563" />}
          label="Phone"
          value={client.contact}
        />
        <InfoRow
          icon={<MaterialIcons name="email" size={20} color="#4B5563" />}
          label="Email"
          value={client.email}
        />
        {/* <InfoRow 
          icon={<MaterialIcons name="location-on" size={20} color="#4B5563" />} 
          label="Address" 
          value={client.address} 
        /> */}
      </View>

      <SectionHeader title="Membership Details" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={
            <MaterialCommunityIcons
              name="calendar-month"
              size={20}
              color="#4B5563"
            />
          }
          label="Joining Date"
          value={client.joined_date}
        />
        <InfoRow
          icon={
            <MaterialIcons name="fitness-center" size={20} color="#4B5563" />
          }
          label="Plan"
          value={client.training}
        />
        <InfoRow
          icon={<FontAwesome5 name="running" size={18} color="#4B5563" />}
          label="Batch"
          value={client.batch}
        />
        <InfoRow
          icon={<MaterialIcons name="attach-money" size={20} color="#4B5563" />}
          label="Fee Status"
          value={client.feePaid}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profileInfo: {
    alignItems: 'center',
  },
  clientName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  clientId: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
});

export default ClientInformation;
