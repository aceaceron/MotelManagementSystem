import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
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
const database = getDatabase();
const auth = getAuth();

// Cache for user account data
let cachedAccountData = null;

// Redirect based on the current page
const currentPage = window.location.pathname.split('/').pop();

// Function to handle user redirection based on account type
function handleRedirect(accountType) {
    if (currentPage === 'admin.html' && accountType !== 'Admin') {
        window.location.href = 'employee.html'; // Redirect if not admin
    } else if (currentPage === 'employee.html' && accountType !== 'Employee') {
        window.location.href = 'admin.html'; // Redirect if not employee
    }
}

// Function to display the user's first name
function displayUserName(firstName) {
    const helloElement = document.querySelector('.hello');
    if (helloElement) {
        helloElement.innerHTML = `Hello, ${firstName} <div class="date-time" id="dateTime"></div>`;
    }
}

// Check if user is authenticated and redirect based on account type
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (cachedAccountData) {
            handleRedirect(cachedAccountData.accountType);
            displayUserName(cachedAccountData.firstName);
        } else {
            try {
                const email = user.email;
                const sanitizedEmail = email.replace('.', ','); // Replace '.' with ',' in email to use as key
                const snapshot = await get(ref(database, 'workAccounts/' + sanitizedEmail));

                if (snapshot.exists()) {
                    cachedAccountData = snapshot.val();
                    const accountType = cachedAccountData.accountType;
                    const firstName = cachedAccountData.firstName;

                    handleRedirect(accountType);
                    displayUserName(firstName); // Display the user's first name
                } else {
                    window.location.href = 'login.html'; // Redirect if no account data
                }
            } catch (error) {
                console.error('Error fetching account type:', error);
                window.location.href = 'login.html'; // Redirect on error
            }
        }
    } else {
        window.location.href = 'login.html'; // Redirect if not authenticated
    }
});

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                cachedAccountData = null; // Clear cached data on logout
                window.location.href = 'login.html'; // Redirect to login page or homepage
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }
});

// Define the timeout duration
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

let inactivityTimer;

// Function to reset the inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logOutUser, INACTIVITY_TIMEOUT); 
}

// Function to log out the user and show an alert
function logOutUser() {
    signOut(auth).then(() => {
        alert("You have been logged out due to inactivity.");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
}

// Add event listeners to detect user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);

// Initialize the inactivity timer when the page loads
document.addEventListener('DOMContentLoaded', resetInactivityTimer);
