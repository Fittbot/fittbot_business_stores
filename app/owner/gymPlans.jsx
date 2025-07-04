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
  Alert,
} from "react-native";
import Swiper from "react-native-swiper";
import ImageUploadModal from "../../components/gymPlansPage/ImageUploadModal";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { getToken } from "../../utils/auth";
import { PostGymPlansImages, getGymPlansImages, getBrochurePresignedUrls, confirmBrochureUpload, deleteBrochure } from "../../services/Api";
import { showToast } from "../../utils/Toaster";
import NoDataComponent from "../../utils/noDataComponent";
import ImageWithFallback from "../../utils/ImagewithFallback";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import { FullImageModal } from "../../components/profile/FullImageModal";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import axios from "axios";

const { width } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);

const GymPlans = () => {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const swiperRef = useRef(null);
  const [isFullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 

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
        if (response.data && Array.isArray(response.data)) {
          const serverImages = response.data.map((item, index) => ({
            id: `server-${index}`,
            source: { uri: item.images },
            serverPath: item.images,
            brochureId: item.brouchre_id, 
          }));

          setImages(serverImages);
          setRefreshKey(prev => prev + 1);
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
      console.error("Error fetching gym brochures:", error);
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

  const deleteBrochureImage = async (brochureId, imageIndex) => {
    try {
      setDeleting(true);

      const response = await deleteBrochure(brochureId);

      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Image deleted successfully",
        });

        if (imageIndex <= currentSlideIndex && currentSlideIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
        }

        await fetchGymBrochures();
      }
    } catch (error) {
      console.error("Error deleting brochure:", error);
      showToast({
        type: "error",
        title: "Failed to delete image",
      });
    } finally {
      setDeleting(false);
    }
  };


  const handleDeleteFromModal = async (imageIndex) => {
    const image = images[imageIndex];

    if (image.serverPath || image.brochureId) {
      try {
        setDeleting(true);

        const response = await deleteBrochure(image.brochureId);

        if (response.status === 200) {
          showToast({
            type: "success",
            title: "Image deleted successfully from server",
          });

          
          if (imageIndex <= currentSlideIndex && currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
          }

          await fetchGymBrochures();
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error deleting brochure:", error);
        showToast({
          type: "error",
          title: "Failed to delete image from server",
        });
      } finally {
        setDeleting(false);
      }
    } else {
      const updatedImages = images.filter((_, index) => index !== imageIndex);
      setImages(updatedImages);
      if (imageIndex <= currentSlideIndex && currentSlideIndex > 0) {
        setCurrentSlideIndex(prev => prev - 1);
      }

      setRefreshKey(prev => prev + 1);

      showToast({
        type: "success",
        title: "Local image removed",
      });
    }
  };

  const uploadToS3 = async (updatedImages) => {
    try {
      setUploading(true);
      setUploadStatus("Preparing upload...");

      const gym_id = await getToken("gym_id");

      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return false;
      }

      const newImages = updatedImages.filter(
        (img) => !img.serverPath && img.source.uri
      );

      if (newImages.length === 0) {
        const hasChanges = updatedImages.length !== images.length;

        showToast({
          type: "success",
          title: hasChanges ? "Changes saved successfully" : "No new images to upload",
        });
        return true;
      }

      const mediaMetadata = newImages.map((item) => {
        const uri = item.source.uri;
        const fileName = uri.split("/").pop();
        const fileType = fileName.split(".").pop().toLowerCase();

        return {
          type: "image",
          fileName: fileName || `brochure_${Date.now()}.${fileType}`,
          contentType: `image/${fileType}`,
          extension: fileType
        };
      });

      setUploadStatus("Getting upload URLs...");

      const presignedResponse = await getBrochurePresignedUrls({
        gym_id: parseInt(gym_id),
        media: mediaMetadata,
      });

      if (presignedResponse?.status !== 200 || !presignedResponse.data?.presigned_urls) {
        throw new Error("Failed to get upload URLs");
      }

      const { presigned_urls } = presignedResponse.data;

      setUploadStatus("Uploading images...");

      const uploadPromises = newImages.map(async (item, index) => {

        const { upload_url, cdn_url, content_type, brochure_id: newBrochureId } = presigned_urls[index];

        try {

          const formData = new FormData();

          Object.keys(upload_url.fields).forEach(key => {
            formData.append(key, upload_url.fields[key]);
          });

          const uri = item.source.uri;
          const fileName = uri.split("/").pop();
          const fileType = content_type || `image/${fileName.split(".").pop().toLowerCase()}`;

          formData.append('file', {
            uri: uri,
            name: fileName,
            type: fileType,
          });

          const s3Response = await fetch(upload_url.url, {
            method: 'POST',
            body: formData,
            headers: {
              
            },
          });

          if (s3Response.status === 204 || s3Response.status === 200) {
            return {
              success: true,
              cdn_url: cdn_url,
              brochure_id: newBrochureId
            };
          } else {
            console.error("S3 upload failed with status:", s3Response.status);
            const responseText = await s3Response.text();
            console.error("S3 error response:", responseText);
            return { success: false };
          }
        } catch (error) {
          console.error("Upload error for image:", error);
          return { success: false };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const failedUploads = uploadResults.filter(result => !result.success);

      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} images failed to upload`);
      }

      setUploadStatus("Finalizing...");

      const newCdnUrls = uploadResults.map((result) => {
        return {
          cdn_url: result.cdn_url,
          brochure_id: result.brochure_id
        }
      });

      for (const cdnUrl of newCdnUrls) {
        await confirmBrochureUpload({
          cdn_url: cdnUrl.cdn_url,
          gym_id: parseInt(gym_id),
          brouchure_id: cdnUrl.brochure_id,
        });
      }

      setUploadStatus("Upload complete!");

      showToast({
        type: "success",
        title: "Images uploaded successfully",
      });

      await fetchGymBrochures();

      return true;

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("Upload failed");
      showToast({
        type: "error",
        title: error.message || "Failed to upload images",
      });
      return false;
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadStatus("");
      }, 2000);
    }
  };

  const postTheGymBrochures = async (updatedImages) => {
    return await uploadToS3(updatedImages);
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
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Brochures"}
      />
      {/* <Text style={styles.headerTitle}>Gym Image Gallery</Text>

      Upload Status */}
      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>{uploadStatus}</Text>
        </View>
      )}

      {/* Delete Status */}
      {deleting && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#FF3B30" />
          <Text style={[styles.uploadingText, { color: "#FF3B30" }]}>Deleting image...</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : images.length > 0 ? (
        <>
          <View style={styles.mediaWrapper}>
            <Swiper
              key={refreshKey} 
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
                <View key={`slide-${image.id}-${refreshKey}`} style={styles.slideItem}>
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
                    color={currentSlideIndex === 0 ? "#fcfcfc" : "#fff"}
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
                        : "#fff"
                    }
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.indicatorContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={`indicator-${index}-${refreshKey}`}
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
        style={[styles.addButton, (uploading || deleting) && styles.disabledButton]}
        onPress={() => setModalVisible(true)}
        disabled={uploading || deleting}
      >
        {uploading ? (
          <ActivityIndicator size={20} color="#FFF" />
        ) : (
          <AntDesign name="plus" size={24} color="#FFF" />
        )}
      </TouchableOpacity>

      <ImageUploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        images={images}
        setImages={setImages}
        postTheGymBrochures={postTheGymBrochures}
        uploading={uploading}
        onDeleteImage={handleDeleteFromModal} 
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
  uploadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  uploadingText: {
    marginLeft: 10,
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  mediaWrapper: {
    flex: 0.8,
    width: responsiveWidth(100),
    height: responsiveWidth(100),
    marginTop: 10,
    backgroundColor: "#F7F7F7",
    position: "relative",
    alignItems: 'center',
    justifyContent: 'center'
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
    position: "relative",
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
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 5,
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
  disabledButton: {
    opacity: 0.7,
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