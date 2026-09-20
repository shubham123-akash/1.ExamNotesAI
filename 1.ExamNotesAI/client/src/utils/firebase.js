
// import { initializeApp } from "firebase/app";
// import {getAuth, GoogleAuthProvider} from "firebase/auth"

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
//   authDomain: "authexamnotes.firebaseapp.com",
//   projectId: "authexamnotes",
//   storageBucket: "authexamnotes.firebasestorage.app",
//   messagingSenderId: "198091553006",
//   appId: "1:198091553006:web:cd719d4ee1ebf391139bff"
// };


// const app = initializeApp(firebaseConfig);

// const auth = getAuth(app)

// const provider = new GoogleAuthProvider()

// export {auth , provider}



// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "authexamnotes-63574.firebaseapp.com",
  projectId: "authexamnotes-63574",
  storageBucket: "authexamnotes-63574.firebasestorage.app",
  messagingSenderId: "953242846214",
  appId: "1:953242846214:web:e0b6e016a61e97145a2f87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}