import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useLocalSearchParams } from "expo-router";
import COLORS from "../../constants/colors";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function Booking() {
  const { events } = useLocalSearchParams();

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [parsedEvents, setParsedEvents] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  const [registrationId, setRegistrationId] = useState("");
  const qrRef = useRef();

  useEffect(() => {
    try {
      const decoded = JSON.parse(decodeURIComponent(events || "[]"));
      setParsedEvents(decoded);
    } catch (e) {
      console.error("Error parsing events:", e);
    }
  }, [events]);

  const handleRegisterPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Helper to create a random registration ID
  const generateRegistrationId = () => {
    return (
      "REG-" +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      Date.now().toString().slice(-4)
    );
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      Alert.alert("Error", "Please fill in at least your name and email.");
      return;
    }

    // Generate registration ID
    const regId = generateRegistrationId();
    setRegistrationId(regId);

    // Close form modal, show confirmation modal
    setModalVisible(false);
    setConfirmationVisible(true);
  };

  const handleRemoveEvent = (id) => {
    Alert.alert("Remove Event", "Are you sure you want to remove this event?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setParsedEvents((prev) => prev.filter((ev) => ev._id !== id));
        },
      },
    ]);
  };

  // Download handler - creates a PDF and shares it
  const handleDownload = async () => {
    try {
      if (!qrRef.current) {
        Alert.alert("QR Error", "QR code not generated.");
        return;
      }

      const dataURL = await new Promise((resolve) => {
        qrRef.current.toDataURL((data) => {
          resolve(data);
        });
      });

      const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            p { font-size: 16px; }
            .label { font-weight: bold; }
            .info { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>Registration Details</h1>
          <div class="info"><span class="label">Registration ID:</span> ${registrationId}</div>
          <div class="info"><span class="label">Name:</span> ${
            formData.name
          }</div>
          <div class="info"><span class="label">Email:</span> ${
            formData.email
          }</div>
          <div class="info"><span class="label">Phone:</span> ${
            formData.phone || "N/A"
          }</div>
          <div class="info"><span class="label">Location:</span> ${
            formData.location || "N/A"
          }</div>
          <hr />
          <div class="info"><span class="label">Event Name:</span> ${
            selectedEvent?.title || "N/A"
          }</div>
          <div class="info"><span class="label">Event ID:</span> ${
            selectedEvent?._id || "N/A"
          }</div>
          <div class="info"><span class="label">Event Launcher:</span> ${
            selectedEvent?.user?.username || "N/A"
          }</div>
          <div class="info"><span class="label">Launcher Email:</span> ${
            selectedEvent?.user?.email || "N/A"
          }</div>
          <br/>
          <img src="data:image/png;base64,${dataURL}" alt="QR Code" width="160" height="160" />
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Download Registration PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      Alert.alert("Error", "Could not generate the PDF file.");
      console.error(error);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Heading card */}
        <View style={styles.headingCard}>
          <Text style={styles.headingText}>
            Your Selected Event is here — Let's Register and Enjoy!
          </Text>
        </View>

        {parsedEvents.length === 0 ? (
          <Text style={styles.empty}>No events selected</Text>
        ) : (
          parsedEvents.map((event, index) => (
            <View key={event._id || index} style={styles.eventCard}>
              <Image source={{ uri: event.image }} style={styles.eventImage} />

              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventUsername}>
                  Posted by: {event.user?.username || "Unknown"}
                </Text>
                <Text style={styles.eventCaption} numberOfLines={3}>
                  {event.caption}
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.registerButton]}
                    onPress={() => handleRegisterPress(event)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Register</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.removeButton]}
                    onPress={() => handleRemoveEvent(event._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Registration Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Register for {selectedEvent?.title}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={formData.location}
              onChangeText={(text) => handleChange("location", text)}
              placeholderTextColor="#888"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: COLORS.primary },
                ]}
                onPress={handleSubmit}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Submit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: "#333" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>Registration Successful!</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Registration ID:</Text>
              <Text style={styles.value}>{registrationId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{formData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{formData.email}</Text>
            </View>
            {formData.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{formData.phone}</Text>
              </View>
            ) : null}
            {formData.location ? (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{formData.location}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Event Name:</Text>
              <Text style={styles.value}>{selectedEvent?.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Event ID:</Text>
              <Text style={styles.value}>{selectedEvent?._id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Event Launcher:</Text>
              <Text style={styles.value}>
                {selectedEvent?.user?.username || "N/A"}
              </Text>
            </View>

            <View style={styles.qrCodeContainer}>
              <QRCode
                value={JSON.stringify({
                  registrationId,
                  eventId: selectedEvent?._id,
                  name: formData.name,
                  email: formData.email,
                })}
                size={160}
                getRef={(c) => (qrRef.current = c)}
              />
            </View>

            {/* Buttons Container */}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: "#28a745", flex: 1, marginRight: 10 },
                ]}
                onPress={handleDownload}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Download
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton, { flex: 1 }]}
                onPress={() => {
                  setConfirmationVisible(false);
                  setFormData({ name: "", email: "", phone: "", location: "" });
                }}
              >
                <Text style={[styles.modalButtonText, { color: "#333" }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
    paddingBottom: 80,
  },
  headingCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  headingText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  empty: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  eventCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    flexDirection: "row",
  },
  eventImage: {
    width: 120,
    height: 120,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventUsername: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  eventCaption: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
  },
  removeButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  confirmContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "100%",
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    color: "#555",
  },
  value: {
    fontSize: 16,
    color: "#111",
    maxWidth: "65%",
    textAlign: "right",
  },
  qrCodeContainer: {
    alignItems: "center",
    marginVertical: 25,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    backgroundColor: "#eee",
  },
});
