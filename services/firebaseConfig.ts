
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
    initializeAuth, // @ts-ignore
    getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqvQMUfRBByJQKNzcFd7ZX1fajyvxQgxc",
    authDomain: "attendancegps-ce4d4.firebaseapp.com",
    projectId: "attendancegps-ce4d4",
    storageBucket: "attendancegps-ce4d4.firebasestorage.app",
    messagingSenderId: "790854453367",
    appId: "1:790854453367:web:d59cd5689c5cc6b7579e72",
    measurementId: "G-FTWJ0TW2S4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
