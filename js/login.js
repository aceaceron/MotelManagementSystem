import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3ueNqM29tpPKOsGyZ94uuYMFhkfXrT3M",
    authDomain: "lcdedb.firebaseapp.com",
    databaseURL: "https://lcdedb-default-rtdb.firebaseio.com",
    projectId: "lcdedb",
    storageBucket: "lcdedb.appspot.com",
    messagingSenderId: "113814487086",
    appId: "1:113814487086:web:a03f7044d7f838a8151fbf"
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
