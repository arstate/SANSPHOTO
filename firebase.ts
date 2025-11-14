import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  onValue, 
  off, 
  set, 
  push, 
  update, 
  remove,
  DataSnapshot,
  query,
  orderByChild,
  equalTo,
  get
} from "firebase/database";

// Konfigurasi Firebase aplikasi web Anda
const firebaseConfig = {
  apiKey: "AIzaSyC6uVbu_80AgI1kWHE1qd-6oOcPGXnqSBY",
  authDomain: "sansphoto-2025.firebaseapp.com",
  databaseURL: "https://sansphoto-2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sansphoto-2025",
  storageBucket: "sansphoto-2025.firebasestorage.app",
  messagingSenderId: "465383190656",
  appId: "1:465383190656:web:0efc6e8eda92a769053665"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fungsi bantuan untuk mengubah objek Firebase menjadi array
export const firebaseObjectToArray = <T extends {id: string}>(data: Record<string, Omit<T, 'id'>> | null | undefined): T[] => {
  if (!data) return [];
  return Object.entries(data).map(([key, value]) => ({
    id: key,
    ...value,
  } as T));
};

export { db, ref, onValue, off, set, push, update, remove, query, orderByChild, equalTo, get };
export type { DataSnapshot };