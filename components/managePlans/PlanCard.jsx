import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PlanCard = ({ item, type, onEdit, onDelete, name }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleEdit = () => {
    toggleMenu();
    onEdit(item);
  };

  const handleDelete = () => {
    toggleMenu();
    onDelete(item.id, type === "Plan" ? item.plans : item.batch_name);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{name}</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Icon name="dots-vertical" size={22} color="#4A5568" />
        </TouchableOpacity>
      </View>

      {type === "plans" ? (
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon
                name="clock-outline"
                size={20}
                color="#0078FF"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{item.duration} Months</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon
                name="currency-inr"
                size={20}
                color="#0078FF"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{item.amount}</Text>
            </View>
          </View>
          {item.description && (
            <Text style={styles.description}>{item.description || ""}</Text>
          )}
        </View>
      ) : (
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon
                name="clock-outline"
                size={20}
                color="#0078FF"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{item.timing}</Text>
            </View>
          </View>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </View>
      )}

      {/* <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon
              name="clock-outline"
              size={16}
              color="#0078FF"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{item.duration || 0} Months</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon
              name="currency-inr"
              size={16}
              color="#0078FF"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{item.amount || 0}</Text>
          </View>
        </View>
        <Text style={styles.description}>
          {item.description || 'Reprehender it Lorem on velit nulla.'}
        </Text>
      </View> */}

      {/* Menu Modal */}
      {menuVisible && (
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Icon name="pencil" size={18} color="#0078FF" />
            <Text style={styles.menuItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Icon name="delete" size={18} color="#E53E3E" />
            <Text style={[styles.menuItemText, { color: "#E53E3E" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 4,
    position: "relative",
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0078FF",
  },
  menuButton: {
    padding: 4,
  },
  cardContent: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 15,
    color: "#4A5568",
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
  },
  menuContainer: {
    position: "absolute",
    top: 45,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000000000,
    width: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#4A5568",
  },
});

export default PlanCard;
