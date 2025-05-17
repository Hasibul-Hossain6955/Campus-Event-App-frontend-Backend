import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import useNotificationStore from "./useNotificationStore";

export default function Notifications() {
  const { notifications } = useNotificationStore();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications yet.</Text>
      ) : (
        notifications.map((n, index) => (
          <View key={index} style={styles.notificationCard}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.detail}>Booked by: {n.name}</Text>
            <Text style={styles.detail}>Email: {n.email}</Text>
            <Text style={styles.detail}>
              Time: {new Date(n.time).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  noNotifications: { fontSize: 16, color: "#888", textAlign: "center" },
  notificationCard: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  detail: { fontSize: 14, color: "#555", marginTop: 4 },
});
