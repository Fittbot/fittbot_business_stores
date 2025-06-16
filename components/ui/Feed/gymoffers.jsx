import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";
import FitnessLoader from "../FitnessLoader";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  getGymOffersAPI2,
  updateGymOffersAPI,
  deleteGymOffersAPI,
} from "../../../services/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const dummyOffers = [
  {
    id: "1",
    title: "New Year Special",
    subdescription: "25% OFF Annual Membership",
    description:
      "Start your fitness journey with our exclusive New Year promotion! Get 25% off on our annual premium membership plan. Includes unlimited access to all facilities, group classes, and a complimentary personal training session. Valid for new members only. Offer expires January 31st. Use promo code NEWYEAR25 at checkout.",
    validity: "2025-01-31",
    category: "membership",
    discount: "25%",
    code: "NEWYEAR25",
    tag: "Limited Time",
    image: "membership",
  },
  {
    id: "2",
    title: "Bring a Friend Week",
    subdescription: "Free Pass for Your Workout Buddy",
    description:
      "Working out is always better with friends! Current members can bring a friend for a full week of free access to all gym facilities. Your friend will get to experience our state-of-the-art equipment, swimming pool, and can join any two group classes of their choice. Just register your friend at the front desk 24 hours before their first visit.",
    validity: "2025-04-15",
    category: "guest",
    discount: "100%",
    code: "BUDDY2025",
    tag: "Member Exclusive",
    image: "friends",
  },
  {
    id: "3",
    title: "Protein Shake Bundle",
    subdescription: "Buy 2 Get 1 Free",
    description:
      "Power up your recovery with our premium protein shakes. Purchase any two protein shakes from our nutrition bar and get the third one absolutely free! Choose from a variety of flavors including chocolate, vanilla, strawberry, and our new peanut butter blend. Each shake contains 25g of high-quality protein to support your muscle recovery. Limit one bundle per customer per day.",
    validity: "2025-03-31",
    category: "nutrition",
    discount: "33%",
    code: "SHAKE3PACK",
    tag: "Best Value",
    image: "protein",
  },
  {
    id: "4",
    title: "Personal Training Package",
    subdescription: "5 Sessions for the Price of 4",
    description:
      "Take your training to the next level with personalized coaching from our certified trainers. Book a package of 5 personal training sessions and only pay for 4. Our trainers will create a custom workout plan tailored to your specific goals, whether you're looking to build strength, lose weight, or improve overall fitness. Sessions must be used within 60 days of purchase.",
    validity: "2025-05-15",
    category: "training",
    discount: "20%",
    code: "PT5FOR4",
    tag: "Staff Pick",
    image: "training",
  },
  {
    id: "5",
    title: "Gym Apparel Sale",
    subdescription: "Up to 40% OFF Selected Items",
    description:
      "Refresh your workout wardrobe with our high-performance gym apparel. For a limited time, enjoy up to 40% off selected items including moisture-wicking t-shirts, compression leggings, shorts, and accessories. Made with premium materials for comfort and durability during even the most intense workouts. Visit our in-gym store to check out all the discounted items while supplies last.",
    validity: "2025-04-10",
    category: "apparel",
    discount: "40%",
    code: "GEAR40",
    tag: "Hot Deal",
    image: "apparel",
  },
  {
    id: "6",
    title: "Student Special",
    subdescription: "Monthly Membership at $29.99",
    description:
      "Calling all students! We understand you're on a budget, which is why we're offering a special discounted monthly membership just for you. Show your valid student ID and get our premium membership for just $29.99 per month with no long-term commitment. Includes full access to all facilities and group classes. Regular price is $49.99 per month. No enrollment fee.",
    validity: "2025-06-30",
    category: "membership",
    discount: "40%",
    code: "STUDENT30",
    tag: "Student Only",
    image: "student",
  },
  {
    id: "7",
    title: "Early Bird Discount",
    subdescription: "15% OFF for Morning Workouts",
    description:
      "Are you an early riser? Get rewarded for your morning workouts! Sign up for our Early Bird membership and save 15% on any membership plan when you agree to use the gym only between 5am-9am on weekdays. This special offer helps us manage gym capacity while giving you a quieter workout environment with no wait times for equipment. Contact our membership team for details.",
    validity: "2025-05-30",
    category: "membership",
    discount: "15%",
    code: "EARLYBIRD15",
    tag: "Smart Saver",
    image: "morning",
  },
];

const getOfferImage = (imageType) => {
  switch (imageType) {
    case "membership":
      return require("../../../assets/images/feed/offer_1.jpg");
    case "friends":
      return require("../../../assets/images/feed/offer_2.jpg");
    case "guest":
      return require("../../../assets/images/feed/offer_2.jpg");
    case "protein":
      return require("../../../assets/images/feed/offer_5.jpg");
    case "nutrition":
      return require("../../../assets/images/feed/offer_5.jpg");
    case "training":
      // return require('../../../assets/images/offer.jpg');
      return require("../../../assets/images/feed/offer_4.jpg");
    case "apparel":
      return require("../../../assets/images/feed/offer_3.jpg");
    case "student":
      return require("../../../assets/images/feed/offer_1.jpg");
    case "morning":
      return require("../../../assets/images/feed/offer_2.jpg");
    default:
      return require("../../../assets/images/offer.jpg");
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "membership":
      return "id-card";
    case "guest":
      return "user-friends";
    case "nutrition":
      return "blender";
    case "training":
      return "dumbbell";
    case "apparel":
      return "tshirt";
    default:
      return "tag";
  }
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const GymOffers = ({ onScroll, scrollEventThrottle, headerHeight }) => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  const handleOfferPress = (item) => {
    setSelectedOffer({
      ...item,
      // Make sure all required fields are present
      title: item.title || "",
      description: item.description || "",
      validity: item.validity || new Date().toISOString().split("T")[0],
      category: item.category || "membership",
      discount: item.discount || "",
      code: item.code || "",
      tag: item.tag || "Special Offer",
      image: item.image || "membership",
    });
    setModalVisible(true);
  };

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const response = await getGymOffersAPI2(gymId);

      if (response.status === 200) {
        // Transform the API response to match our component's expected format
        const formattedOffers = response.data.map((offer) => ({
          id: offer.id.toString(),
          title: offer.title,
          subdescription: offer.subdescription || "",
          description: offer.description,
          validity: offer.validity,
          category: offer.category || "membership",
          discount: offer.discount || "10",
          code: offer.code || "OFFER10",
          tag: offer.priority === "high" ? "Limited Time" : "Special Offer",
          image: offer.category || "membership",
        }));

        setOffers(formattedOffers);
      } else {
        showToast({
          type: "error",
          title: "Failed to fetch offers",
          desc: response?.message,
        });
        setOffers(dummyOffers);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching offers",
        desc: error.message,
      });
      setOffers(dummyOffers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Confirm delete
  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      setIsLoading(true);
      const response = await deleteGymOffersAPI({
        offer_id: announcementToDelete.id,
        gym_id: await getToken("gym_id"),
      });

      if (response.status === 200) {
        // Update the offers list by filtering out the deleted item
        const updatedOffers = offers.filter(
          (a) => a.id !== announcementToDelete.id
        );
        setOffers(updatedOffers);
      } else {
        showToast({
          type: "error",
          title: "Failed to delete offer",
          desc: response?.message,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error deleting offer",
        desc: error.message,
      });
    } finally {
      setDeleteModalVisible(false);
      setAnnouncementToDelete(null);
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setAnnouncementToDelete(null);
  };

  const handleUpdateOffer = async (updatedOffer) => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const payload = {
        id: updatedOffer.id,
        title: updatedOffer.title,
        description: updatedOffer.description,
        validity: updatedOffer.validity,
        category: updatedOffer.category,
        discount: updatedOffer.discount,
        code: updatedOffer.code,
        priority: updatedOffer.tag === "Limited Time" ? "high" : "low",
        gym_id: gymId,
      };

      const response = await updateGymOffersAPI(payload);

      if (response.status === 200) {
        // Update the offer in the list
        const updatedOffers = offers.map((offer) =>
          offer.id === updatedOffer.id ? updatedOffer : offer
        );
        setOffers(updatedOffers);
        setSelectedOffer(null);
        setModalVisible(false);
      } else {
        showToast({
          type: "error",
          title: "Failed to update offer",
          desc: response?.message,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating offer",
        desc: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderOffer = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[
          styles.offerContainer,
          isEven ? styles.offerEven : styles.offerOdd,
        ]}
        onPress={() => handleOfferPress(item)}
        onLongPress={() => {
          setAnnouncementToDelete(item);
          setDeleteModalVisible(true);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.offerImageContainer}>
          <ImageBackground
            source={getOfferImage(item.image)}
            style={styles.offerImage}
            imageStyle={styles.offerImageStyle}
          >
            <LinearGradient
              colors={
                isEven
                  ? ["rgba(255, 87, 87, 0.85)", "rgba(255, 87, 87, 0.95)"]
                  : ["rgba(83, 82, 237, 0.85)", "rgba(83, 82, 237, 0.95)"]
              }
              style={styles.offerGradient}
            >
              <View style={styles.offerTag}>
                <Text style={styles.offerTagText}>{item.tag}</Text>
              </View>
              <View style={styles.offerIconContainer}>
                <FontAwesome5
                  name={getCategoryIcon(item.category)}
                  size={responsiveFontSize(20)}
                  color="#FFF"
                />
              </View>
              <Text style={styles.offerDiscount}>{item.discount}%</Text>
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offersubdescription}>
                {item.subdescription}
              </Text>
              <View style={styles.offervalidity}>
                <Ionicons
                  name="time-outline"
                  size={responsiveFontSize(14)}
                  color="#FFF"
                />
                <Text style={styles.offerValidText}>
                  Valid until {formatDate(item.validity)}
                </Text>
              </View>
              <View style={styles.offerFooter}>
                <Text style={styles.offerCode}>Code: {item.code}</Text>
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Entypo
                    name="chevron-right"
                    size={responsiveFontSize(14)}
                    color="#FFF"
                  />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    );
  };

  // Delete confirmation modal
  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay2}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteModalContainer}>
                <View style={styles.deleteModalHeader}>
                  <Ionicons name="warning-outline" size={40} color="#295196" />
                  <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
                </View>
                <Text style={styles.deleteModalText}>
                  Are you sure you want to delete this announcement?
                  {announcementToDelete && (
                    <Text style={styles.deleteModalHighlight}>
                      {' "'}
                      {announcementToDelete.title}
                      {'"'}
                    </Text>
                  )}
                </Text>
                <Text style={styles.deleteModalSubtext}>
                  This action cannot be undone.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.cancelButton]}
                    onPress={cancelDelete}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteButton]}
                    onPress={confirmDelete}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={responsiveFontSize(24)}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>

              {selectedOffer && (
                <View style={styles.modalContent}>
                  <ImageBackground
                    source={getOfferImage(selectedOffer.image)}
                    style={styles.modalImage}
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      style={styles.modalImageGradient}
                    >
                      <View style={styles.modalOfferTag}>
                        <Text style={styles.modalOfferTagText}>
                          {selectedOffer.tag}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={styles.modalTitleContainer}>
                          <Text style={styles.modalTitle}>
                            {selectedOffer.title}
                          </Text>
                          <Text style={styles.modalsubdescription}>
                            {selectedOffer.subdescription}
                          </Text>
                        </View>
                        <View>
                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                              setModalVisible(false);
                              // Navigate to edit page with offer data
                              router.push({
                                pathname: "/owner/(feed)/addOfferFormPage",
                                params: {
                                  offer: JSON.stringify(selectedOffer),
                                },
                              });
                            }}
                          >
                            <MaterialIcons
                              name="edit"
                              size={responsiveFontSize(22)}
                              color="#a8ff97"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.closeButton, { marginTop: 5 }]}
                            onPress={() => {
                              setModalVisible(false);
                              // Show delete confirmation
                              setAnnouncementToDelete(selectedOffer);
                              setDeleteModalVisible(true);
                            }}
                          >
                            <MaterialIcons
                              name="delete"
                              size={responsiveFontSize(22)}
                              color="#ff8888"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>

                  <View style={styles.modalDetailsContainer}>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoItem}>
                        <FontAwesome5
                          name={getCategoryIcon(selectedOffer.category)}
                          size={responsiveFontSize(18)}
                          color="#295196"
                        />
                        <Text style={styles.modalInfoLabel}>Category</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedOffer.category.charAt(0).toUpperCase() +
                            selectedOffer.category.slice(1)}
                        </Text>
                      </View>

                      <View style={styles.modalInfoDivider} />

                      <View style={styles.modalInfoItem}>
                        <FontAwesome
                          name="percent"
                          size={responsiveFontSize(18)}
                          color="#295196"
                        />
                        <Text style={styles.modalInfoLabel}>Discount</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedOffer.discount}
                        </Text>
                      </View>

                      <View style={styles.modalInfoDivider} />

                      <View style={styles.modalInfoItem}>
                        <Ionicons
                          name="calendar"
                          size={responsiveFontSize(18)}
                          color="#295196"
                        />
                        <Text style={styles.modalInfoLabel}>Valid Until</Text>
                        <Text style={styles.modalInfoValue}>
                          {formatDate(selectedOffer.validity)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDescriptionContainer}>
                      <Text style={styles.modalDescriptionTitle}>
                        Offer Details
                      </Text>
                      <Text style={styles.modalDescription}>
                        {selectedOffer.description}
                      </Text>
                    </View>

                    <View style={styles.modalCodeContainer}>
                      <Text style={styles.modalCodeLabel}>Use Code</Text>
                      <View style={styles.modalCodeBox}>
                        <Text style={styles.modalCodeValue}>
                          {selectedOffer.code}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (isLoading) {
    return <FitnessLoader page="feed" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.offersContainer,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View style={styles.headerInfoContainer}>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={() => router.push("/owner/(feed)/addOfferFormPage")}
              >
                <LinearGradient
                  colors={["#1DA1F2", "#1DA1F2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                >
                  <MaterialIcons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add New Offer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <LinearGradient
              colors={["#295196", "#8C52FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoHeader}
            >
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Exclusive Offers</Text>
                <Text style={styles.promosubdescription}>
                  Save big on memberships & more
                </Text>
              </View>
              <View style={styles.promoIconContainer}>
                <FontAwesome5
                  name="tags"
                  size={responsiveFontSize(24)}
                  color="#FFF"
                />
              </View>
            </LinearGradient>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5
              name="gift"
              size={responsiveFontSize(50)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>No Offers Available</Text>
            <Text style={styles.emptysubdescription}>
              Check back soon for new deals
            </Text>
          </View>
        )}
      />
      {renderDetailModal()}
      {/* {renderOptionsDropdown()}
       */}
      {renderDeleteConfirmationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  addButtonContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  offersContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerInfoContainer: {
    marginVertical: responsiveHeight(2),
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  promosubdescription: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
  },
  promoIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: responsiveHeight(30),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    padding: responsiveWidth(4),
    justifyContent: "space-between",
    borderRadius: responsiveWidth(3),
  },
  offerTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  offerTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  offerDiscount: {
    color: "#FFF",
    fontSize: responsiveFontSize(28),
    fontWeight: "bold",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offersubdescription: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
  },
  offervalidity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    marginLeft: responsiveWidth(1),
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerCode: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    marginRight: responsiveWidth(1),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(10),
  },
  emptyTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(2),
  },
  emptysubdescription: {
    fontSize: responsiveFontSize(14),
    color: "#999",
    marginTop: responsiveHeight(1),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(4),
  },

  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(4),
    zIndex: 10,
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    height: responsiveHeight(30),
    width: "100%",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: responsiveWidth(4),
  },
  modalOfferTag: {
    position: "absolute",
    top: responsiveHeight(2),
    left: responsiveWidth(4),
    backgroundColor: "#295196",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  modalsubdescription: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1,
    padding: responsiveWidth(4),
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    marginTop: responsiveHeight(0.5),
  },
  modalInfoValue: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(1),
  },
  modalDescription: {
    color: "#555",
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
  },
  modalCodeContainer: {
    marginVertical: responsiveHeight(2),
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    marginBottom: responsiveHeight(1),
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#295196",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#295196",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  // Delete modal styles
  deleteModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: responsiveWidth(5),
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  deleteModalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(1),
  },
  deleteModalText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    textAlign: "center",
    marginBottom: responsiveHeight(1),
  },
  deleteModalHighlight: {
    fontWeight: "bold",
  },
  deleteModalSubtext: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    textAlign: "center",
    marginBottom: responsiveHeight(3),
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalButton: {
    borderRadius: 8,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
  },
  deleteButton: {
    backgroundColor: "#295196",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
  },
});

export default GymOffers;
