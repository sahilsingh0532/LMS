// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaCTVrVicKvX_s9663zOiJG2ih1O9-9Ro",
  authDomain: "leavesystem-e030a.firebaseapp.com",
  projectId: "leavesystem-e030a",
  storageBucket: "leavesystem-e030a.firebasestorage.app",
  messagingSenderId: "468170401978",
  appId: "1:468170401978:web:8bb6f4532d990b3352ba83",
  measurementId: "G-VHMKXY1CG9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
