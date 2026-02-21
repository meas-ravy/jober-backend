import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // We replace escaped newlines for the private key if stored as a string in env
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL ||
        "https://push-notification-de8ac-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
    console.log("Firebase Admin Initialized successfully");
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export const messaging = admin.messaging();
export const auth = admin.auth();
export const db = admin.database();
