// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { displayReservations } from './reservationManagement.js';
import { displayComments } from './manageComments.js';


// Firebase configuration object
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

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}


window.onclick = function (event) {
    if (!event.target.matches('.menuLogo')) {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownMenu.style.display === 'block') {
            dropdownMenu.style.display = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();
    displayReservations();
    displayComments();

    // Get elements
    const dashboardSection = document.querySelector('.dashboard');
    const accountsSection = document.querySelector('.accounts');
    const recordsSection = document.querySelector('.records');
    const manualBookingSection = document.querySelector('.manualBooking');
    const commentsSection = document.querySelector('.comments');
    const inventorySection = document.querySelector('.inventory');

    // Initially show the dashboard and hide records
    dashboardSection.style.display = 'flex';
    accountsSection.style.display = 'none';
    recordsSection.style.display = 'none';
    manualBookingSection.style.display = 'none';
    commentsSection.style.display = 'none';
    inventorySection.style.display = 'none';


    // Add click event listeners
    document.querySelector('#dashboard').addEventListener('click', function () {
        dashboardSection.style.display = 'flex';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#accounts').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'flex';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#records').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'flex';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#commentsList').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'flex';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#mnlBooking').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'flex';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#inventory').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'flex';
    });
    document.querySelector('#dashboardBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'flex';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#accountsBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'flex';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#recordsBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'flex';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#mnlBookingBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'flex';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#commentsListBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'flex';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#inventoryBtn').addEventListener('click', function () {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'flex';
    });
});



console.log('Firebase script loaded and ready');
