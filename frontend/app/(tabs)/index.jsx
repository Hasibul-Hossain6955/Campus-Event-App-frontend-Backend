import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import styles from "../../assets/styles/home.styles";
import { API_URL } from "../../constants/api";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { formatPublishDate } from "../../lib/utils";
import { useRouter } from "expo-router";

export default function Home() {
  //for testing  const { logout } = useAuthStore();
  const { token } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const [selectedEvents, setSelectedEvents] = useState([]);

  const fetchBook = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await fetch(
        `${API_URL}/events?page=${pageNum}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to fetch events");

      const uniqueBooks =
        refresh || pageNum === 1
          ? data.books
          : Array.from(
              new Set([...books, ...data.books].map((book) => book._id))
            ).map((id) =>
              [...books, ...data.books].find((book) => book._id === id)
            );

      setBooks(uniqueBooks);

      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log("Error fetching books", error);
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBook();
  }, []);

  //new adding extra feature
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchBook(page + 1);
    }
  };

  const toggleSelectEvent = (item) => {
    const isSelected = selectedEvents.some((e) => e._id === item._id);
    if (isSelected) {
      setSelectedEvents((prev) => prev.filter((e) => e._id !== item._id));
    } else {
      setSelectedEvents((prev) => [...prev, item]);
    }
  };
  const handleMultiBooking = () => {
    router.push({
      pathname: "/booking",
      params: {
        events: encodeURIComponent(JSON.stringify(selectedEvents)),
      },
    });
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedEvents.some((e) => e._id === item._id);
    return (
      <View style={styles.bookCard}>
        <View style={styles.bookHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.user.profileImage }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.user.username}</Text>
          </View>
        </View>

        <View style={styles.bookImageContainer}>
          <Image
            source={item.image}
            style={styles.bookImage}
            contentFit="cover"
          />
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            {renderRatingStars(item.rating)}
          </View>
          <Text style={styles.caption}>{item.caption}</Text>
          <Text style={styles.data}>
            Shared on{formatPublishDate(item.createdAt)}
          </Text>

          {/* 👇 Booking Button */}
          <TouchableOpacity
            style={{
              marginTop: 12,
              backgroundColor: isSelected ? "#aaa" : COLORS.primary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => toggleSelectEvent(item)}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              {isSelected ? "Remove" : "Select"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
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

  //console.log(books);
  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBook(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🚀 Event Launcher</Text>
            <Text style={styles.headerSubtitle}>🎉 Great Event Community</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={60}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No recommendations yet 😔</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share a book!
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 10 }}
            />
          ) : null
        }
      />

      {selectedEvents.length > 0 && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: COLORS.primary,
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 5,
          }}
          onPress={handleMultiBooking}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
            Book {selectedEvents.length} Event(s)
          </Text>
        </TouchableOpacity>
      )}

      {/** <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity> */}
    </View>
  );
}
