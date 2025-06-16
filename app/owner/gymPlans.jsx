import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Swiper from "react-native-swiper";
import ImageUploadModal from "../../components/gymPlansPage/ImageUploadModal";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { getToken } from "../../utils/auth";
import { PostGymPlansImages, getGymPlansImages } from "../../services/Api";
import { showToast } from "../../utils/Toaster";
import NoDataComponent from "../../utils/noDataComponent";
import ImageWithFallback from "../../utils/ImagewithFallback";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import { FullImageModal } from "../../components/profile/FullImageModal";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);

const GymPlans = () => {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brochureId, setBrochureId] = useState(null);
  const swiperRef = useRef(null);
  const [isFullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);

  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchGymBrochures();
  }, []);

  useEffect(() => {
    if (currentSlideIndex >= images.length && images.length > 0) {
      setCurrentSlideIndex(images.length - 1);
    }
  }, [images]);

  const fetchGymBrochures = async () => {
    try {
      setLoading(true);
      const gym_id = await getToken("gym_id");

      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setLoading(false);
        return;
      }

      const response = await getGymPlansImages(gym_id);

      if (response.status === 200) {
        if (
          response.data &&
          response.data.images &&
          response.data.images.length > 0
        ) {
          const serverImages = response.data.images.map((path, index) => ({
            id: `server-${index}`,
            source: { uri: path },
            serverPath: path,
          }));

          setImages(serverImages);
          setBrochureId(response.data.brouchre_id);
        } else {
          setImages([]);
        }
      } else {
        showToast({
          type: "error",
          title: "Failed to fetch gym brochures",
        });
        setImages([]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching gym brochures",
      });
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const openFullImage = (image) => {
    setFullImageSource(image);
    setFullImageModalVisible(true);
  };

  const postTheGymBrochures = async (updatedImages) => {
    try {
      setLoading(true);
      const formData = new FormData();
      const gym_id = await getToken("gym_id");

      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      formData.append("gym_id", gym_id);

      if (brochureId) {
        formData.append("brochure_id", brochureId);
      }

      const serverImages = updatedImages
        .filter((img) => img.serverPath)
        .map((img) => img.serverPath);

      formData.append("media", JSON.stringify(serverImages));

      const newImages = updatedImages.filter(
        (img) => !img.serverPath && img.source.uri
      );

      newImages.forEach((img, index) => {
        const uri = img.source.uri;
        const fileName = uri.split("/").pop();
        const fileType = fileName.split(".").pop();

        formData.append("file", {
          uri,
          name: fileName || `image_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      const response = await PostGymPlansImages(formData);

      if (response && response.status === 200) {
        showToast({
          type: "success",
          title: response.message || "Images updated successfully",
        });

        if (response.brochure_id) {
          setBrochureId(response.brochure_id);
        }
        await fetchGymBrochures();
      } else {
        throw new Error(response?.message || "Failed to update images");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error.message || "Failed to update images",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToPrevSlide = () => {
    if (swiperRef.current && currentSlideIndex > 0) {
      swiperRef.current.scrollBy(-1);
    }
  };

  const goToNextSlide = () => {
    if (swiperRef.current && currentSlideIndex < images.length - 1) {
      swiperRef.current.scrollBy(1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <OwnerHeader /> */}
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Brochures"}
      />
      <Text style={styles.headerTitle}>Gym Image Gallery</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : images.length > 0 ? (
        <>
          <View style={styles.mediaWrapper}>
            <Swiper
              ref={swiperRef}
              style={styles.swiperContainer}
              showsPagination={false}
              loop={false}
              autoplay={false}
              removeClippedSubviews={false}
              scrollEnabled={true}
              bounces={true}
              showsButtons={false}
              onIndexChanged={(index) => {
                setCurrentSlideIndex(index);
              }}
              loadMinimal={false}
              index={currentSlideIndex}
            >
              {images.map((image, index) => (
                <View key={`slide-${image.id}`} style={styles.slideItem}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openFullImage(image.source)}
                    style={styles.mediaImageContainer}
                  >
                    <ImageWithFallback
                      source={image.source}
                      style={styles.mediaImage}
                      resizeMode="contain"
                      fallbackText="Unable to load gym plan image"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </Swiper>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.navArrow,
                    styles.leftArrow,
                    currentSlideIndex === 0 ? styles.disabledArrow : null,
                  ]}
                  onPress={goToPrevSlide}
                  disabled={currentSlideIndex === 0}
                >
                  <AntDesign
                    name="left"
                    size={24}
                    color={currentSlideIndex === 0 ? "#ccc" : "#007AFF"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navArrow,
                    styles.rightArrow,
                    currentSlideIndex === images.length - 1
                      ? styles.disabledArrow
                      : null,
                  ]}
                  onPress={goToNextSlide}
                  disabled={currentSlideIndex === images.length - 1}
                >
                  <AntDesign
                    name="right"
                    size={24}
                    color={
                      currentSlideIndex === images.length - 1
                        ? "#ccc"
                        : "#007AFF"
                    }
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.indicatorContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={`indicator-${index}`}
                style={[
                  styles.customIndicator,
                  currentSlideIndex === index && styles.activeCustomIndicator,
                ]}
                onPress={() => {
                  if (swiperRef.current) {
                    swiperRef.current.scrollBy(index - currentSlideIndex, true);
                  }
                }}
              />
            ))}
          </View>
        </>
      ) : (
        <NoDataComponent
          icon="picture"
          title="No Gym Plans Available"
          message="Upload gym brochures and plan images to showcase to your members"
          buttonText="Add Images"
          onButtonPress={() => setModalVisible(true)}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      <ImageUploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        images={images}
        setImages={setImages}
        postTheGymBrochures={postTheGymBrochures}
      />
      <FullImageModal
        isVisible={isFullImageModalVisible}
        imageSource={fullImageSource}
        onClose={() => setFullImageModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    color: "#007AFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  mediaWrapper: {
    width: responsiveWidth(100),
    height: responsiveWidth(100),
    marginTop: 10,
    backgroundColor: "#F7F7F7",
    position: "relative",
  },
  swiperContainer: {
    height: responsiveWidth(100),
  },
  slideItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
  },
  mediaImageContainer: {
    width: responsiveWidth(90),
    height: responsiveWidth(110),
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  customIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginHorizontal: 5,
  },
  activeCustomIndicator: {
    backgroundColor: "#007AFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  disabledArrow: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});

export default GymPlans;
