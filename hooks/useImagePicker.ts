import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
}

export function useImagePicker() {
  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to add images to notes.'
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take photos.'
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async (): Promise<ImagePickerResult | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    };
  };

  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    };
  };

  return {
    pickFromGallery,
    takePhoto,
  };
}
