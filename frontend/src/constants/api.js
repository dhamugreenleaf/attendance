import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to connect to local host machine
// Use localhost for iOS simulator and web
const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const PORT = 5000;

export const API_URL = `http://${LOCAL_HOST}:${PORT}/api`;

