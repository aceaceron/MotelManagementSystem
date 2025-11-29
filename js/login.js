import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();

document.getElementById('loadingScreen').style.display = 'none';

function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    // Show the loading spinner
    document.getElementById('loadingScreen').style.display = 'flex';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Retrieve the account type from the database
            const sanitizedEmail = email.replace('.', ',');
            const userRef = ref(database, 'workAccounts/' + sanitizedEmail);

            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const accountType = snapshot.val().accountType;

                    // Redirect based on account type
                    if (accountType === 'Admin') {
                        window.location.href = 'admin.html';
                    } else if (accountType === 'Employee') {
                        window.location.href = 'employee.html';
                    } else {
                        alert('Unknown account type');
                    }
                } else {
                    alert('No data available');
                }
            }).catch((error) => {
                console.error(error);
                document.getElementById('loadingScreen').style.display = 'none'; 
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);

            // Hide the loading spinner if an error occurs
            document.getElementById('loadingScreen').style.display = 'none';
        });
}

// Add event listener for form submission
document.getElementById('loginForm').addEventListener('submit', handleLogin);

// Add event listener for the "Enter" key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        handleLogin(event);
    }
});
