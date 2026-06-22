import { Platform } from 'react-native';

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

let nativeStore;
if (isNative) {
  nativeStore = require('expo-secure-store');
}

export default {
  getItem: (key) =>
    isNative
      ? nativeStore.getItemAsync(key)
      : Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) =>
    isNative
      ? nativeStore.setItemAsync(key, value)
      : Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) =>
    isNative
      ? nativeStore.deleteItemAsync(key)
      : Promise.resolve(localStorage.removeItem(key)),
};
