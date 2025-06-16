import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import ImagePreviewBox from './ImagePreviewBox';
import { showToast } from '../../utils/Toaster';

const { width, height } = Dimensions.get('window');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const TARGET_ASPECT_RATIO = 3 / 4;
const RATIO_TOLERANCE = 0.05;

const ImageUploadModal = ({
  visible,
  onClose,
  images,
  setImages,
  maxImages = 6,
  postTheGymBrochures,
}) => {
  const [localImages, setLocalImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState(null);

  useEffect(() => {
    if (visible) {
      const imagesCopy = images.map((img) => ({
        ...img,
        id: img.id || `image-${Date.now()}-${Math.random()}`,
      }));

      const placeholders = Array(maxImages - imagesCopy.length)
        .fill()
        .map(() => ({
          id: `placeholder-${Date.now()}-${Math.random()}`,
          isPlaceholder: true,
        }));

      setLocalImages([...imagesCopy, ...placeholders]);
      setSelectedForSwap(null);
    }
  }, [visible, images, maxImages]);

  const validateImage = async (imageUri, fileSize) => {
    if (fileSize > MAX_FILE_SIZE) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        desc: 'Image size should be less than 2MB. Please select a smaller image.',
      });
      return false;
    }

    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        resolve(true);
        return;
      }

      Image.getSize(
        imageUri,
        (width, height) => {
          const imageRatio = width / height;
          const ratioDeviation = Math.abs(imageRatio - TARGET_ASPECT_RATIO);

          if (ratioDeviation > RATIO_TOLERANCE) {
            showToast({
              type: 'error',
              title: 'Incorrect Aspect Ratio',
              desc: 'Please select an image with a 3:4 aspect ratio.',
            });
            resolve(false);
          } else {
            resolve(true);
          }
        },
        (error) => {
          showToast({
            type: 'error',
            title: error?.message || 'Failed to verify image dimensions.',
          });
          resolve(false);
        }
      );
    });
  };

  const pickImage = async () => {
    try {
      if (localImages.filter((img) => !img.isPlaceholder).length >= maxImages) {
        showToast({
          type: 'error',
          title: `You can only add up to ${maxImages} images.`,
        });
        return;
      }

      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast({
            type: 'error',
            title: 'Permission denied',
            desc: 'We need camera roll permissions to upload images',
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isValid = await validateImage(asset.uri, asset.fileSize);

        if (isValid) {
          const newImage = {
            id: `image-${Date.now()}-${Math.random()}`,
            source: { uri: asset.uri },
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize,
          };

          setLocalImages((prevImages) => {
            const placeholderIndex = prevImages.findIndex(
              (img) => img.isPlaceholder
            );

            if (placeholderIndex !== -1) {
              const updatedImages = [...prevImages];
              updatedImages[placeholderIndex] = newImage;
              return updatedImages;
            } else {
              return [...prevImages, newImage];
            }
          });
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error?.message || 'Failed to pick image',
      });
    }
  };

  const replaceImage = async (index) => {
    try {
      if (
        index < 0 ||
        index >= localImages.length ||
        localImages[index].isPlaceholder
      ) {
        showToast({
          type: 'error',
          title: 'Invalid index for replacement',
        });
        return;
      }

      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast({
            type: 'error',
            title: 'Permission denied',
            desc: 'We need camera roll permissions to upload images',
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isValid = await validateImage(asset.uri, asset.fileSize);

        if (isValid) {
          setLocalImages((prevImages) => {
            const updatedImages = [...prevImages];
            const serverPath = updatedImages[index].serverPath;
            updatedImages[index] = {
              ...updatedImages[index],
              source: { uri: asset.uri },
              width: asset.width,
              height: asset.height,
              fileSize: asset.fileSize,
              ...(serverPath && { serverPath: null, wasServerImage: true }),
            };
            return updatedImages;
          });
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error?.message || 'Failed to replace image',
      });
    }
  };

  const removeImage = (index) => {
    if (
      index < 0 ||
      index >= localImages.length ||
      localImages[index].isPlaceholder
    ) {
      return;
    }

    setLocalImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);

      newImages.push({
        id: `placeholder-${Date.now()}-${Math.random()}`,
        isPlaceholder: true,
      });

      return newImages;
    });

    if (selectedForSwap === index) {
      setSelectedForSwap(null);
    }
  };

  const handleSwapSelection = (index) => {
    if (localImages[index].isPlaceholder) return;

    if (selectedForSwap === null) {
      setSelectedForSwap(index);
    } else if (selectedForSwap === index) {
      setSelectedForSwap(null);
    } else {
      const updatedImages = [...localImages];
      const temp = updatedImages[selectedForSwap];
      updatedImages[selectedForSwap] = updatedImages[index];
      updatedImages[index] = temp;

      setLocalImages(updatedImages);
      setSelectedForSwap(null);
    }
  };

  const handleDragEnd = ({ data }) => {
    const realImages = data.filter((item) => !item.isPlaceholder);
    const placeholders = data.filter((item) => item.isPlaceholder);

    setLocalImages([...realImages, ...placeholders]);
  };

  const saveChanges = async () => {
    try {
      setIsSubmitting(true);
      const realImagesOnly = localImages.filter((item) => !item.isPlaceholder);

      await postTheGymBrochures(realImagesOnly);

      setImages(realImagesOnly);
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        title: error?.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item, drag, isActive }) => {
    const index = localImages.findIndex((img) => img.id === item.id);
    const isSelected = selectedForSwap === index;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={() => {
            if (!item.isPlaceholder) {
              setIsDragging(true);
              drag();
            }
          }}
          onPress={() => {
            if (!isDragging) {
              handleSwapSelection(index);
            }
          }}
          disabled={item.isPlaceholder && isDragging}
          delayLongPress={200}
          style={[
            styles.dragItem,
            isActive && styles.dragActive,
            isSelected && styles.selectedForSwap,
          ]}
        >
          <ImagePreviewBox
            image={item}
            index={index}
            onRemove={() => removeImage(index)}
            onReplace={() => replaceImage(index)}
            onAddImage={pickImage}
            isPlaceholder={item.isPlaceholder}
            isSelected={isSelected}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setSelectedForSwap(null);
        onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Images</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedForSwap(null);
                onClose();
              }}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <AntDesign name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.instructions}>
            {/* <Text style={styles.modalSubtitle}>
              Long press and drag to reorder images (max: {maxImages})
            </Text> */}
            {selectedForSwap !== null ? (
              <Text style={styles.swapInstructions}>
                Tap another image to swap, or tap this image again to cancel
              </Text>
            ) : (
              <Text style={styles.swapInstructions}>
                Tap an image to select it for swapping
              </Text>
            )}
            <Text style={styles.requirementsText}>
              Images must be 3:4 ratio and under 2MB
            </Text>
          </View>

          <DraggableFlatList
            data={localImages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onDragBegin={() => {
              setIsDragging(true);
              setSelectedForSwap(null);
            }}
            onRelease={() => {
              setIsDragging(false);
            }}
            onDragEnd={(params) => {
              setIsDragging(false);
              handleDragEnd(params);
            }}
            numColumns={3}
            contentContainerStyle={styles.imageGridContainer}
            style={styles.imageGrid}
            activationDistance={5}
          />

          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
            onPress={saveChanges}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  instructions: {
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  swapInstructions: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
  },
  requirementsText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  closeButton: {
    padding: 5,
  },
  imageGrid: {
    maxHeight: height * 0.5,
  },
  imageGridContainer: {
    paddingVertical: 10,
  },
  dragItem: {
    margin: 2,
  },
  dragActive: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    zIndex: 999,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderRadius: 5,
  },
  selectedForSwap: {
    borderWidth: 2,
    borderColor: '#FF5757',
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#007bffb8',
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ImageUploadModal;
