import React, { useEffect, useState } from "react";
import { View, Text, Alert, FlatList, TouchableOpacity } from "react-native";

import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { Modal, TextInput, Pressable } from "react-native";

export default function Profile() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  //for the rating perpose from the user feedback
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/events/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch user books");

      setBooks(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to load profile data. Pull down to refresh."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteBook = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/events/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete book");
      }

      setBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendation");
    }
  };

  const confirmDelete = (bookId) => {
    Alert.alert(
      "Delete Recommendation",
      "Are you sure you want to delete this recommendation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteBook(bookId),
        },
      ]
    );
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.bookDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          confirmDelete(item._id);
        }}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />

      {/**YOUR RECOMMENDATIONS */}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}> Your Recommendation 📚</Text>
        <Text style={styles.booksCount}>{books.length}</Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={50}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
            >
              <Text style={styles.addButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {/**Rating from the user feedback with Modal part  */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: 12,
          borderRadius: 10,
          marginHorizontal: 20,
          marginBottom: 10,
          alignItems: "center",
        }}
        onPress={() => setShowRatingModal(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          ⭐ Rate Our App
        </Text>
      </TouchableOpacity>
      <Modal
        visible={showRatingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
            >
              Rate Our App
            </Text>
            <Text style={{ marginBottom: 10 }}>
              How would you rate your experience?
            </Text>

            {/* Rating Stars */}
            <View style={{ flexDirection: "row", marginBottom: 15 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={30}
                    color={i <= rating ? "#f4b400" : COLORS.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback Input */}
            <TextInput
              placeholder="Tell us how we can improve..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              style={{
                borderColor: COLORS.textSecondary,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                marginBottom: 15,
                textAlignVertical: "top",
              }}
            />

            {/* Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={() => setShowRatingModal(false)}
                style={{ marginRight: 15 }}
              >
                <Text style={{ color: COLORS.textSecondary }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowRatingModal(false);
                  Alert.alert(
                    "Thank You! 💖",
                    "Your feedback has been recorded."
                  );

                  setRating(0);
                  setFeedback("");
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  Submit
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
