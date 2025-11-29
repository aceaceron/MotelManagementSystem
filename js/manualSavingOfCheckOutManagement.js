// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { saveCheckInData } from './checkInCheckOutManagement.js';

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
const db = getDatabase(app); 

// Constants for fees and rates
const airConRooms = ['2', '4', '6', '8', '9', '10'];
// Constants for additional fees per guest above 2
const ADDITIONAL_FEE_NON_AIRCON = 200;
const ADDITIONAL_FEE_AIRCON = 250;

// Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

// Base rates for different durations
const BASE_RATE_NON_AIRCON = { 3: 300, 6: 500, 24: 1000 };
const BASE_RATE_AIRCON = { 3: 500, 6: 800, 24: 1500 };

function restrictToNumeric(event) {
    const key = event.key;
    if (!/^\d$/.test(key) && key !== 'Backspace' && key !== 'Delete') {
        event.preventDefault();
    }
}
function validateForm() {
    const roomNum = document.getElementById('mbRoomNum').value;
    const checkInDate = document.getElementById('mbCheckInDate').value;
    const checkInTime = document.getElementById('mbCheckInTime').value;
    const initialDuration = document.getElementById('mbInitialDuration').value;
    const extension = document.getElementById('mbExtension').value;
    const numberOfGuests = document.getElementById('mbNumOfGuests').value;
    const checkOutDate = document.getElementById('mbCheckOutDate').value;
    const checkOutTime = document.getElementById('mbCheckOutTime').value;
    const totalDuration = document.getElementById('mbTotalDuration').value;
    const totalAmountPaid = document.getElementById('mbTotalAmountPaid').value;

    // Check if all required fields are filled
    let isValid = roomNum && checkInDate && checkInTime && initialDuration && extension &&
        numberOfGuests && totalDuration && totalAmountPaid;

    // Check for "Invalid Date" in check-out fields
    const checkOutDateTime = new Date(`${checkOutDate} ${checkOutTime}`);
    if (isNaN(checkOutDateTime.getTime())) {
        isValid = false; // If the date is invalid, set form as invalid
    }

    // Enable or disable the Save button based on form validity
    document.getElementById('saveManualBooking').disabled = !isValid;
}

// Add event listeners to all form fields
document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('change', validateForm);
});

// Call the function once on page load to disable the button if the form is initially invalid
document.addEventListener('DOMContentLoaded', validateForm);

function calculateAndUpdateValues() {
    // Get input values
    const checkInDate = document.getElementById('mbCheckInDate').value;
    const checkInTime = document.getElementById('mbCheckInTime').value;
    const roomNum = document.getElementById('mbRoomNum').value;
    const numberOfGuests = parseInt(document.getElementById('mbNumOfGuests').value, 10);
    const extension = parseInt(document.getElementById('mbExtension').value, 10) || 0;
    const initialDuration = parseInt(document.getElementById('mbInitialDuration').value, 10);

    if (!checkInDate || !checkInTime || !roomNum || isNaN(numberOfGuests) || isNaN(initialDuration)) {
        return; // Exit if required inputs are missing
    }

    // Determine if the room is air-conditioned or standard based on room number
    const isAirCon = airConRooms.includes(roomNum);
    const baseRate = isAirCon ? BASE_RATE_AIRCON[initialDuration] : BASE_RATE_NON_AIRCON[initialDuration];
    const additionalGuestFee = isAirCon ? ADDITIONAL_FEE_AIRCON : ADDITIONAL_FEE_NON_AIRCON;
    const extensionFee = isAirCon ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

    // Calculate additional guest fees if guests > 2
    const extraGuests = Math.max(0, numberOfGuests - 2);
    const totalAdditionalFee = extraGuests * additionalGuestFee;

    // Calculate extension fee
    const totalExtensionFee = extension * extensionFee;

    // Calculate total amount
    const totalAmountPaid = baseRate + totalAdditionalFee + totalExtensionFee;

    // Calculate total duration (initial + extension)
    const totalDuration = initialDuration + extension;

    // Calculate check-out date and time
    const checkInDateTime = new Date(`${checkInDate} ${checkInTime}`);
    checkInDateTime.setHours(checkInDateTime.getHours() + totalDuration); // Add the total duration

    // Format check-out date and time
    const checkOutDate = checkInDateTime.toLocaleDateString('en-US');
    const checkOutTime = checkInDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Format totalAmountPaid as PHP currency and display it
    const formattedAmount = `PHP ${totalAmountPaid.toFixed(2)}`;
    document.getElementById('mbTotalAmountPaid').value = formattedAmount; 

    // Set other calculated values to inputs
    document.getElementById('mbCheckOutDate').value = checkOutDate;
    document.getElementById('mbCheckOutTime').value = checkOutTime;
    document.getElementById('mbTotalDuration').value = totalDuration;
}

// Add event listeners to relevant inputs
document.getElementById('mbCheckInDate').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbCheckInTime').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbRoomNum').addEventListener('change', calculateAndUpdateValues);
document.getElementById('mbNumOfGuests').addEventListener('change', calculateAndUpdateValues);
document.getElementById('mbExtension').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbInitialDuration').addEventListener('change', calculateAndUpdateValues);

// Restrict non-numeric input for the following fields
document.getElementById('mbNumOfGuests').addEventListener('keypress', restrictToNumeric);
document.getElementById('mbExtension').addEventListener('keypress', restrictToNumeric);
document.getElementById('mbInitialDuration').addEventListener('keypress', restrictToNumeric);

document.querySelector('#saveManualBooking').addEventListener('click', async function () {
    const saveBooking = confirm('Are you sure the data is correct and accurate?\nThis action cannot be undone once saved.');

    if (saveBooking) {
        // Get input values
        const checkInDate = document.getElementById('mbCheckInDate').value;
        const checkInTime = document.getElementById('mbCheckInTime').value;
        const checkOutDate = document.getElementById('mbCheckOutDate').value;
        const checkOutTime = document.getElementById('mbCheckOutTime').value;
        const roomNum = document.getElementById('mbRoomNum').value;

        // Convert numeric inputs
        const numberOfGuests = parseInt(document.getElementById('mbNumOfGuests').value, 10);
        const extension = parseInt(document.getElementById('mbExtension').value, 10);
        const initialDuration = parseInt(document.getElementById('mbInitialDuration').value, 10);
        const totalDuration = parseInt(document.getElementById('mbTotalDuration').value, 10);

        // Extract the numeric value from the formatted string
        const totalAmountPaidString = document.getElementById('mbTotalAmountPaid').value;
        const totalAmountPaid = parseFloat(totalAmountPaidString.replace('PHP ', '').replace(',', ''));

        try {
            // Save the check-in data with the numeric totalAmountPaid
            await saveCheckInData(
                roomNum,
                initialDuration,
                checkInDate,
                checkInTime,
                checkOutDate,
                checkOutTime,
                extension,
                totalDuration,
                numberOfGuests,
                totalAmountPaid, // Save the integer value
                true
            );
        } catch (error) {
            console.error("Error saving check-in data:", error);
        }
    }
});
