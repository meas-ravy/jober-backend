import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAuqOc2gi8kj-oM0qq_VDa3wrBeWrlzhD8",
  authDomain: "push-notification-de8ac.firebaseapp.com",
  databaseURL:
    "https://push-notification-de8ac-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "push-notification-de8ac",
  storageBucket: "push-notification-de8ac.firebasestorage.app",
  messagingSenderId: "418521148309",
  appId: "1:418521148309:web:723579dd6bf26a9d15649c",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };
