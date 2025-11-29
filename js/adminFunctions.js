// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { displayReservations } from './reservationManagement.js';
import { displayComments } from './manageComments.js';


// Firebase configuration object
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

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// // Get the modal
// var modal = document.getElementById("systemUpdate");

// // Get the <span> element that closes the modal
// var span = document.getElementsByClassName("closeUpdateModal")[0];

// // Show the modal when the page loads
// window.onload = function() {
//     modal.style.display = "block";
// };

// // When the user clicks on <span> (x), close the modal
// span.onclick = function() {
//     modal.style.display = "none";
// };

// // When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//     if (event.target == modal) {
//         modal.style.display = "none";
//     }
// };

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
