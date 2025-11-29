// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";


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
const db = getDatabase(app); // Initialize the Realtime Database
const storage = getStorage(app); // Initialize Firebase Storage

// Function to format the given date as 'yyMMdd'
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const datePart = String(date.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${datePart}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForReservation/${dateKey}`);

    try {
        const snapshot = await get(countRef);
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.val();
        }
        const nextCount = count + 1;
        await set(countRef, nextCount);
        return nextCount;
    } catch (error) {
        console.error('Error getting next sequential number:', error);
        throw error;
    }
}

// Function to generate a unique ID based on the reservation date and a sequential number
async function generateReservationId(reservationDate) {
    const dateKey = formatDate(reservationDate);
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(2, '0');
    return `${dateKey}-${formattedNumber}`;
}


const dateInput = document.getElementById("date");
    
// Get today's date in the format YYYY-MM-DD
const today = new Date();
const formattedDate = today.toISOString().split('T')[0]; // Extract the date part (YYYY-MM-DD)


function formatDateForDatabase(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Month (1-12) without leading zero
    const day = date.getDate(); // Date (1-31) without leading zero
    const year = date.getFullYear(); // Full year (YYYY)
    return `${month}/${day}/${year}`;
}

function formatDateForKeyToDatabase(dateText) {
    const date = new Date(dateText);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


// Constants for base rates
const BASE_RATE_NON_AIRCON = { 3: 300, 6: 500, 24: 1000 };
const BASE_RATE_AIRCON = { 3: 500, 6: 800, 24: 1500 };

// Constants for additional fees
const ADDITIONAL_FEE_NON_AIRCON = 200;
const ADDITIONAL_FEE_AIRCON = 250;
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

// Function to calculate the amount to pay
function calculateAmountToPay(roomType, duration, extension, numberOfGuests) {
    let baseRate;
    let additionalFeePerGuest;
    let extensionFeePerHour;

    if (roomType === 'AIR-CONDITIONED ROOM') {
        baseRate = BASE_RATE_AIRCON[duration];
        additionalFeePerGuest = ADDITIONAL_FEE_AIRCON;
        extensionFeePerHour = ADDITIONAL_EXTENSIONFEE_AIRCON;
    } else if (roomType === 'STANDARD ROOM') {
        baseRate = BASE_RATE_NON_AIRCON[duration];
        additionalFeePerGuest = ADDITIONAL_FEE_NON_AIRCON;
        extensionFeePerHour = ADDITIONAL_EXTENSIONFEE_NON_AIRCON;
    } else {
        throw new Error('Unknown room type');
    }

    // Calculate additional fees for guests more than 2
    const additionalGuestFees = (numberOfGuests > 2) ? (numberOfGuests - 2) * additionalFeePerGuest : 0;

    // Calculate extension fees
    const extensionFees = extension * extensionFeePerHour;

    // Total amount to pay
    const totalAmount = baseRate + additionalGuestFees + extensionFees;
    return totalAmount;
}

document.querySelector('.confirm').addEventListener('click', handleFormSubmit);

// Event listener for form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    showLoadingScreen();

    const lastName = document.getElementById('lastName');
    const firstName = document.getElementById('firstName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    const date = document.getElementById('date');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const startingTime = document.getElementById("dropdownTime");
    const roomType = document.getElementById("dropdown0");
    const duration = document.getElementById("dropdown1");
    const extension = document.getElementById("dropdown2");
    const numberOfGuests = document.getElementById("numOfGuest");

    let valid = true;

    // Validate time if the selected date is today
    const dropdownTime = document.getElementById("dropdownTime");
    const currentDate = new Date();
    const selectedDate = new Date(date.value);

    if (selectedDate.toDateString() === currentDate.toDateString()) {
        currentDate.setHours(currentDate.getHours() + 6); // Add 6 hours to the current time
        const selectedTimeText = dropdownTime.value;
        const [hour, minutePart] = selectedTimeText.split(":");
        const minutes = parseInt(minutePart.slice(0, 2), 10);
        const ampm = minutePart.slice(-2);
        const selectedTime = new Date();
        selectedTime.setHours(ampm === "PM" && hour < 12 ? parseInt(hour) + 12 : parseInt(hour));
        selectedTime.setMinutes(minutes);

        if (selectedTime < currentDate) {
            alert("You can only reserve at least 6 hours from now.");
            hideLoadingScreen(); // Stop the loading screen
            updateButtonState(); // Ensure button is updated
            return; // Stop form submission
        }
    }

    // Proceed with other validation checks
    if (lastName.value.trim() === "") {
        lastName.classList.add('error');
        valid = false;
    } else {
        lastName.classList.remove('error');
    }

    if (firstName.value.trim() === "") {
        firstName.classList.add('error');
        valid = false;
    } else {
        firstName.classList.remove('error');
    }

    if (phoneNumber.value.trim() === "") {
        phoneNumber.classList.add('error');
        valid = false;
    } else {
        phoneNumber.classList.remove('error');
    }

    if (emailAddress.value.trim() === "" || !emailAddress.checkValidity()) {
        emailAddress.classList.add('error');
        valid = false;
    } else {
        emailAddress.classList.remove('error');
    }

    if (date.value.trim() === "") {
        date.classList.add('error');
        valid = false;
    } else {
        date.classList.remove('error');
    }

    if (numberOfGuests.value < 1 || numberOfGuests.value > 6) {
        numberOfGuests.classList.add('error');
        valid = false;
        alert("Invalid value. Number of guests minimum is 1 and maximum of 6.");
    } else {
        numberOfGuests.classList.remove('error');
    }

    if (!termsCheckbox.checked) {
        termsCheckbox.classList.add('error');
        valid = false;
    } else {
        termsCheckbox.classList.remove('error');
    }

    // Check if the selected date is yesterday or earlier
    if (selectedDate < new Date().setHours(0, 0, 0, 0)) {
        alert("The selected date is invalid");
        date.classList.add('error');
        valid = false;
    } else {
        date.classList.remove('error');
    }

    if (valid) {
        try {
            // Generate reservation ID
            const reservationId = await generateReservationId(date.value);
    
            // Calculate the total amount to pay
            const amountToPay = calculateAmountToPay(
                roomType.value,
                parseInt(duration.value, 10) || 0,
                parseInt(extension.value, 10) || 0,
                parseInt(numberOfGuests.value, 10) || 0
            );
    
            // Prepare reservation data
            const reservationData = {
                lastName: lastName.value,
                firstName: firstName.value,
                phoneNumber: phoneNumber.value,
                emailAddress: emailAddress.value,
                reservationCheckInDate: formatDateForDatabase(date.value),
                reservationCheckInTime: startingTime.value,
                roomType: roomType.value,
                duration: duration.value,
                extension: extension.value,
                numberOfGuests: numberOfGuests.value,
                amountToPay: amountToPay,
                reservationId: reservationId,
                reservationStatus: "Pending Payment", 
                referenceCodePayment: "", // Blank value for reference code
                receiptImage: "" // Blank value for receipt image (Firebase storage URL placeholder)
            };
    
            // Save to Firebase
            await set(ref(db, `activeReservations/${date.value}/${reservationId}`), reservationData);
    
            // Show reservation modal
            showReservationModal(reservationData);
    
            // Clear form fields
            lastName.value = '';
            firstName.value = '';
            phoneNumber.value = '09';
            emailAddress.value = '';
            date.value = '';
            numberOfGuests.value = '2';
    
        } catch (error) {
            console.error("Error writing to Firebase:", error);
        } finally {
            hideLoadingScreen();
        }
    } else {
        alert("Please complete the form and accept the terms and conditions.");
        hideLoadingScreen();
    }
};

// Disable room type option if fully booked
async function checkRoomAvailability(dateInput) {
    const db = getDatabase();
    const selectedDate = dateInput.value;
    const airConditionedRoomOption = document.querySelector('option[value="AIR-CONDITIONED ROOM"]');
    const standardRoomOption = document.querySelector('option[value="STANDARD ROOM"]');

    if (!selectedDate || !airConditionedRoomOption || !standardRoomOption) return;

    const reservationsRef = ref(db, `activeReservations/${selectedDate}`);

    try {
        // Fetch all reservations for the selected date
        const snapshot = await get(reservationsRef);

        if (snapshot.exists()) {
            const reservations = snapshot.val();

            // Filter reservations for "AIR-CONDITIONED ROOM"
            const airConditionedReservations = Object.values(reservations).filter(
                (reservation) => reservation.roomType === 'AIR-CONDITIONED ROOM'
            );

            const airConditionedReservationCount = airConditionedReservations.length;

            // Disable option if 6 or more reservations exist for AIR-CONDITIONED ROOM
            if (airConditionedReservationCount >= 6) {
                airConditionedRoomOption.disabled = true;
                airConditionedRoomOption.textContent = "AIR-CONDITIONED ROOM (Fully Occupied)";
            } else {
                airConditionedRoomOption.disabled = false;
                airConditionedRoomOption.textContent = "AIR-CONDITIONED ROOM";
            }

            // Filter reservations for "STANDARD ROOM"
            const standardRoomReservations = Object.values(reservations).filter(
                (reservation) => reservation.roomType === 'STANDARD ROOM'
            );

            const standardRoomReservationCount = standardRoomReservations.length;

            // Disable option if 4 or more reservations exist for STANDARD ROOM
            if (standardRoomReservationCount >= 4) {
                standardRoomOption.disabled = true;
                standardRoomOption.textContent = "STANDARD ROOM (Fully Occupied)";
            } else {
                standardRoomOption.disabled = false;
                standardRoomOption.textContent = "STANDARD ROOM";
            }
        } else {
            // No reservations for this date; ensure options are enabled
            airConditionedRoomOption.disabled = false;
            airConditionedRoomOption.textContent = "AIR-CONDITIONED ROOM";

            standardRoomOption.disabled = false;
            standardRoomOption.textContent = "STANDARD ROOM";
        }
    } catch (error) {
        console.error("Error checking room availability:", error);
    }
}

// Event listener for the submit button
document.getElementById("submitProofOfPaymentBtn").addEventListener("click", submitProofOfPayment);

// Function to handle proof of payment submission
async function submitProofOfPayment() {
    const referenceCodeInput = document.getElementById("referenceCodeGCash");
    const receiptImageInput = document.getElementById("receiptImageInput");
    const reservationIdElement = document.getElementById("reservationId");
    const reservationDateElement = document.getElementById("reservationDateDisplay"); // Find where date is stored

    const referenceCode = referenceCodeInput.value.trim();
    const receiptFile = receiptImageInput.files[0];
    const reservationId = reservationIdElement.textContent.replace("Reservation ID: ", "").trim();

    // Extract the reservation date value
    const reservationDateText = reservationDateElement.textContent.replace("Reservation Date: ", "").trim();
    const reservationDate = formatDateForKeyToDatabase(reservationDateText); // Use helper function for formatting if needed

    if (!referenceCode) {
        alert("Please enter the GCash Reference Code.");
        return;
    }

    if (!receiptFile) {
        alert("Please attach the receipt image.");
        return;
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(receiptFile.type)) {
        alert("Invalid file type. Please upload an image (PNG, JPG, or JPEG).");
        return;
    }

    showLoadingScreen();

    try {
        // Upload receipt image to Firebase Storage
        const receiptFileName = `${reservationId}.jpg`; // Keep the file extension consistent
        const storageRefPath = storageRef(storage, `reservationReceipt/${receiptFileName}`);
        const uploadResult = await uploadBytes(storageRefPath, receiptFile);

        // Get download URL
        const receiptImageUrl = await getDownloadURL(uploadResult.ref);

        // Update reservation data in Firebase Realtime Database
        const reservationRef = ref(db, `activeReservations/${reservationDate}/${reservationId}`);

        await update(reservationRef, {
            reservationStatus: "Validating Payment",
            referenceCodePayment: referenceCode,
            receiptImage: receiptImageUrl,
        });

        alert("Proof of payment successfully submitted.");

        document.querySelector(".postPaymentModal").style.display = "none";


    } catch (error) {
        console.error("Error submitting proof of payment:", error);
        alert("An error occurred while submitting proof of payment. Please try again.");
    } finally {
        hideLoadingScreen();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let isValid = true;
    const lastNameInput = document.getElementById("lastName");
    const firstNameInput = document.getElementById("firstName");
    const phoneNumberInput = document.getElementById("phoneNumber");
    const emailInput = document.getElementById("emailAddress");
    const startingTimeInput = document.getElementById("dropdownTime");
    const dateInput = document.getElementById("date");
    const roomType = document.getElementById("dropdown0");

    const lastNameError = document.getElementById("lastNameError");
    const firstNameError = document.getElementById("firstNameError");
    const phoneNumberError = document.getElementById("phoneNumberError");
    const emailError = document.getElementById("emailAddressError");
    const startingTimeError = document.getElementById("startingTimeError");
    const dateError = document.getElementById("dateError");

    const nextButton = document.getElementById("nextButton");

    dateInput.addEventListener("change", () => {
        checkRoomAvailability(dateInput);
    });

    // Initial check on page load
    checkRoomAvailability(dateInput);

    function validateDate(input, errorField) {
        const selectedDate = new Date(input.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignore time part for comparison
        
        if (selectedDate < today) {
            input.classList.add("invalid");
            errorField.style.display = "block";
            errorField.textContent = "The selected date cannot be in the past.";
            isValid = false;
        } else {
            input.classList.remove("invalid");
            errorField.style.display = "none";
        }
    }

    function validateName(input, errorField) {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(input.value.trim())) {
            input.classList.add("invalid");
            errorField.style.display = "block";
            errorField.textContent = "Please input letters only.";
            isValid = false;
        } else {
            input.classList.remove("invalid");
            errorField.style.display = "none";
        }
    }

    function validatePhoneNumber(input, errorField) {
        const value = input.value.trim();
        const phoneRegex = /^09\d{0,9}$/; // Starts with 09 and allows up to 11 characters

        if (!phoneRegex.test(value)) {
            input.classList.add("invalid");
            errorField.style.display = "block";
            errorField.textContent = "Phone number must start with '09' and be 11 digits long.";
            isValid = false;
        } else if (value.length !== 11) {
            input.classList.add("invalid");
            errorField.style.display = "block";
            errorField.textContent = "Phone number must be exactly 11 digits long.";
            isValid = false;
        } else {
            input.classList.remove("invalid");
            errorField.style.display = "none";
        }
    }

    function validateEmail(input, errorField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
            input.classList.add("invalid");
            errorField.style.display = "block";
            errorField.textContent = "Please enter a valid email address.";
            isValid = false;
        } else {
            input.classList.remove("invalid");
            errorField.style.display = "none";
        }
    }

    function updateButtonState() {
        let isValid = true;  // Reset isValid to true on each call
    
        // Validate all fields
        validateName(lastNameInput, lastNameError);
        validateName(firstNameInput, firstNameError);
        validatePhoneNumber(phoneNumberInput, phoneNumberError);
        validateEmail(emailInput, emailError);
        validateDate(dateInput, dateError);
    
        // Check if startingTime (startingTimeInput) is empty
        if (!startingTimeInput.value.trim()) {
            isValid = false;
            startingTimeInput.classList.add("invalid");
            startingTimeError.style.display = "block";
            startingTimeError.textContent = "Starting time is required.";
        } else {
            startingTimeInput.classList.remove("invalid");
            startingTimeError.style.display = "none";
        }
    
        // Enable or disable the button based on isValid
        nextButton.disabled = !isValid;
    }

    lastNameInput.addEventListener("input", () => {
        validateName(lastNameInput, lastNameError);
        updateButtonState();
    });

    firstNameInput.addEventListener("input", () => {
        validateName(firstNameInput, firstNameError);
        updateButtonState();
    });

    phoneNumberInput.addEventListener("input", () => {
        // Ensure "09" is always at the start
        if (!phoneNumberInput.value.startsWith("09")) {
            phoneNumberInput.value = "09";
        }

        // Limit to 11 characters
        if (phoneNumberInput.value.length > 11) {
            phoneNumberInput.value = phoneNumberInput.value.slice(0, 11);
        }

        // Validate phone number
        validatePhoneNumber(phoneNumberInput, phoneNumberError);
        updateButtonState();
    });

    emailInput.addEventListener("input", () => {
        validateEmail(emailInput, emailError);
        updateButtonState();
    });

    dateInput.addEventListener("change", () => {
        startingTimeInput.value = "";
        updateButtonState();
    });

    // Call updateButtonState when a new time is selected
    startingTimeInput.addEventListener("change", () => {
        updateButtonState();
    });

    // Pre-fill phone number with "09" on page load
    phoneNumberInput.value = "09";

    startingTimeInput.value = ""; // Ensure starting time is empty initially

    roomType.value = "";

    // Initial validation to set the button state
    updateButtonState();

    // Run the time options update function
    updateStartingTimeOptions();
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reservationForm");
    const inputs = form.querySelectorAll("input, select");
    const confirmButton = document.querySelector(".confirm");

    // Function to validate inputs and toggle button state
    function validateForm() {
        let isValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
            }
        });

        confirmButton.disabled = !isValid;
    }

    // Attach input and change event listeners to inputs
    inputs.forEach(input => {
        input.addEventListener("input", validateForm);
    });

    // Attach change event listener to the terms checkbox
    termsCheckbox.addEventListener("change", validateForm);

    // Initial validation on page load
    validateForm();
});

function showReservationModal(reservationData) {
    // Get modal elements
    const reservationModal = document.querySelector(".postPaymentModal");
    const reservationIdEl = document.getElementById("reservationId");
    const fullNameEl = document.getElementById("fullName");
    const emailAddressEl = document.getElementById("emailAddressDisplay");
    const phoneNumberEl = document.getElementById("phoneNumberDisplay");
    const reservationDateEl = document.getElementById("reservationDateDisplay");
    const reservationTimeEl = document.getElementById("reservationTimeDisplay");
    const roomTypeEl = document.getElementById("roomTypeDisplay");
    const durationEl = document.getElementById("durationDisplay");
    const extensionEl = document.getElementById("extensionDisplay");
    const numOfGuestsEl = document.getElementById("numberOfGuestsDisplay");
    const amountToPayEl = document.getElementById("statusToDisplay");

    // Set modal values
    reservationIdEl.innerHTML = `Reservation ID: <i>${reservationData.reservationId}</i>`;
    fullNameEl.innerHTML = `<b>Full name:</b> ${reservationData.firstName} ${reservationData.lastName}`;
    emailAddressEl.innerHTML = `<b>Email address:</b> ${reservationData.emailAddress}`;
    phoneNumberEl.innerHTML = `<b>Phone Number:</b> ${reservationData.phoneNumber}`;
    reservationDateEl.innerHTML = `<b>Reservation Date:</b> ${reservationData.reservationCheckInDate}`;
    reservationTimeEl.innerHTML = `<b>Reservation Time of Check-in:</b> ${reservationData.reservationCheckInTime}`;
    roomTypeEl.innerHTML = `<b>Room Type:</b> ${reservationData.roomType}`;
    durationEl.innerHTML = `<b>Duration:</b> ${reservationData.duration} hours`;
    extensionEl.innerHTML = `<b>Extension:</b> ${reservationData.extension} hours`;
    numOfGuestsEl.innerHTML = `<b>Number of Guests:</b> ${reservationData.numberOfGuests}`;
    amountToPayEl.innerHTML = `<b>Amount to pay in GCash:</b> ₱${reservationData.amountToPay.toFixed(2)}`;

    // Get the reservationPaidStatus and reservationPendingPaymentStatus elements
    const reservationPaidStatus = document.querySelector(".reservationPaidStatus");
    const reservationPendingPaymentStatus = document.querySelector(".reservationPendingPaymentStatus");

    // Display the modal
    reservationModal.style.display = "flex";

    
    document.querySelector(".cancelReservation").style.display = "none";

    // Check the reservation status
    if (reservationData.reservationStatus !== "Pending Payment") {
        // If reservation is not "Pending Payment", show the reservationPaidStatus section
        reservationPaidStatus.style.display = "flex";

        // Hide the reservationPendingPaymentStatus section
        reservationPendingPaymentStatus.style.display = "none";

        // Optionally, populate the reference code and receipt details
        document.getElementById('referenceCodeGCashDisplay').textContent = `Reference Code: ${reservationData.referenceCodePayment}` || "N/A";

        document.getElementById('reservationReceiptDisplay').setAttribute('href', reservationData.receiptImage || "#");

        // Handle status-specific content
        if (reservationData.reservationStatus === "Payment Validated") {
            amountToPayEl.innerHTML = `<b style="color:green;">Payment verified</b> 
                                    <p>You have paid: ₱${reservationData.amountToPay.toFixed(2)}. 
                                    Just show your reservation ID to the staff.</p>`;
        } else if (reservationData.reservationStatus.includes("Payment Rejected due to")) {
            amountToPayEl.innerHTML = `<b style="color:red;">${reservationData.reservationStatus}</b>`;
            
            // Disable the cancelReservation button
            const cancelReservationButton = document.getElementById('cancelReservation');
            if (cancelReservationButton) {
                cancelReservationButton.style.display = "none";
            }
        } else {
            amountToPayEl.innerHTML = `<b style="color:red;">Pending payment</b> 
                                    <p>To be validated by the staff, you must pay: ₱${reservationData.amountToPay.toFixed(2)}</p>`;
        }

        // Hide the payment form
        document.getElementById("reservationPayment").style.display = "none";
    } else {
        // If reservation is "Pending Payment", hide the reservationPaidStatus section
        reservationPaidStatus.style.display = "none";

        // Show the reservationPendingPaymentStatus section
        reservationPendingPaymentStatus.style.display = "flex";

        
        document.getElementById("reservationPayment").style.display = "flex";
    }
    // Capture and download the screenshot after the modal is displayed 
    captureAndDownloadScreenshot(reservationData.reservationId);

    document.getElementById("cancelReservation").addEventListener("click", () => {
        const confirmation = confirm("Do you want to cancel your reservation?");
        if (confirmation) {
            handleCancelReservation(reservationData);
        }
    });
    
}

function updateStartingTimeOptions() {
    const dropdownTime = document.getElementById("dropdownTime");
    const dateInput = document.getElementById("date");
    const currentTime = new Date();

    // Set the current time to be +6 hours for today (to enable time-based filtering)
    const filteredTime = new Date(currentTime);
    filteredTime.setHours(currentTime.getHours() + 6);  // Add 6 hours

    // Function to disable past times for the selected date
    const disablePastTimes = () => {
        const selectedDate = new Date(dateInput.value);

        // Check if the selected date is today
        if (selectedDate.toDateString() === currentTime.toDateString()) {
            // If current time is after the filtered 6-hour window, disable all options
            if (new Date() > filteredTime) {
                const options = dropdownTime.options;
                for (let i = 0; i < options.length; i++) {
                    options[i].disabled = true;
                }
            } else {
                // Loop through dropdown options and disable those before the minimum time
                const options = dropdownTime.options;
                for (let i = 0; i < options.length; i++) {
                    const optionTime = new Date();
                    const [hour, minutePart] = options[i].value.split(":");
                    const minutes = parseInt(minutePart.slice(0, 2), 10);
                    const ampm = minutePart.slice(-2);
                    optionTime.setHours(ampm === "PM" && hour < 12 ? parseInt(hour) + 12 : parseInt(hour));
                    optionTime.setMinutes(minutes);

                    // Enable or disable options based on the 6-hour restriction
                    if (optionTime < filteredTime) {
                        options[i].disabled = true;
                    } else {
                        options[i].disabled = false;
                    }
                }
            }
        } else {
            // Enable all options if the date is tomorrow or later
            const options = dropdownTime.options;
            for (let i = 0; i < options.length; i++) {
                options[i].disabled = false;
            }
        }
    };

    // Add event listener to handle date changes
    dateInput.addEventListener('change', disablePastTimes);

    // Call the function immediately to apply the logic when the page loads
    disablePastTimes();
}

const termsPopup = document.getElementById("terms-popup");
const closeBtn = document.querySelector(".close-btn");
const nextButton = document.getElementById("nextButton");
const confirmTermsButton = document.getElementById("confirmTerms");
const termsCheckbox = document.getElementById("termsCheckbox");

// Show the popup on "NEXT" button click
nextButton.addEventListener("click", () => {
    termsPopup.style.display = "block";
});

// Close the popup when the close button is clicked
closeBtn.addEventListener("click", () => {
    termsPopup.style.display = "none";
});

// Confirm action in the popup
confirmTermsButton.addEventListener("click", () => {
    if (termsCheckbox.checked) {
        alert("Reservation confirmed!");
        termsPopup.style.display = "none";
        // Add logic for successful reservation confirmation
    }
});

// Optional: Close popup when clicking outside the content
window.addEventListener("click", (event) => {
    if (event.target === termsPopup) {
        termsPopup.style.display = "none";
    }
});

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'block';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();
});

// Function to convert reservationId to reservationDate
function convertReservationIdToDate(reservationId) {
    // Extract the date part from reservationId (e.g., "240101-01" -> "240101")
    const datePart = reservationId.split('-')[0];

    // Extract year, month, and day from the date part
    const year = "20" + datePart.substring(0, 2);  // First two characters for year (YY), prepended with "20" to form a full year
    const month = datePart.substring(2, 4);  // Next two characters for month (MM)
    const day = datePart.substring(4, 6);  // Last two characters for day (DD)

    // Construct the reservation date in YYYY-MM-DD format
    const reservationDate = `${year}-${month}-${day}`;

    return reservationDate;
}

// Function to handle the search logic with reservationDate derived from reservationId
async function handleSearch() {
    const reservationId = document.getElementById('searchBar').value;
    const phoneNumber = document.getElementById('phoneNumberReservationQuery').value;
    const checkInTime = document.getElementById('checkInTimeReservationQuery').value;

    // Check if all fields are filled
    if (!reservationId || !phoneNumber || !checkInTime) {
        alert('Please fill in all the fields.');
        return;
    }

    // Convert reservationId to reservationDate
    const reservationDate = convertReservationIdToDate(reservationId);

    // Define the paths to search
    const searchPaths = [
        `activeReservations/${reservationDate}/${reservationId}`,
        `failedReservations/${reservationDate}/${reservationId}`,
        `completedReservations/${reservationDate}/${reservationId}`,
        `failedPaidReservations/${reservationDate}/${reservationId}`
    ];

    try {
        let reservationFound = false;

        // Iterate through the paths and check for the reservation
        for (const path of searchPaths) {
            const reservationRef = ref(db, path);
            const snapshot = await get(reservationRef);

            if (snapshot.exists()) {
                const reservationData = snapshot.val();

                // Validate phone number and check-in time
                if (reservationData.phoneNumber === phoneNumber && reservationData.reservationCheckInTime === checkInTime) {
                    // Show the reservation modal with the fetched data
                    showReservationModal(reservationData);
                    reservationFound = true;
                    break; // Stop searching once a match is found
                }
            }
        }

        // If no matching reservation is found
        if (!reservationFound) {
            alert('No matching reservation found with the provided details.');
        }
    } catch (error) {
        console.error("Error fetching reservation data:", error);
        alert("There was an error fetching the reservation. Please try again.");
    }
}

// Attach the search functionality to the search button
document.querySelector('.search-icon').addEventListener('click', handleSearch);

function captureAndDownloadScreenshot(reservationId) {
    const reservationModal = document.querySelector(".postPaymentModal");
    
    // Check if the modal exists
    if (reservationModal) {
        html2canvas(reservationModal).then(function(canvas) {
            // Convert the canvas to a Blob
            canvas.toBlob(function(blob) {
                // Create a link element
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `LaCasaDeEspeso_Reservation-${reservationId}.png`;

                // Append the link to the body (required for some browsers)
                document.body.appendChild(link);

                // Simulate a click on the link to trigger the download
                link.click();

                // Remove the link after the download
                document.body.removeChild(link);
            });
        }).catch(function(error) {
            console.error("Error capturing screenshot:", error);
        });
    } else {
        console.error("Reservation modal not found.");
    }
}

// Function to handle reservation cancellation
function handleCancelReservation(reservationData) {
    const cancelReservationModal = document.querySelector(".cancelReservation");
    const postPaymentModal = document.querySelector(".postPaymentModal");
    
    const confirmationInput = document.getElementById("cancellingReservationID");
    const reasonInput = document.getElementById("reasonForCancellation");
    const closeCancelReservationModal = document.getElementById("closeCancellingReservationModal");
    const reservationIDEl = document.getElementById("reservationID");
    const reservationAmountPaidEl = document.getElementById("reservationAmountPaid");

    // Set reservation details in the cancellation modal
    reservationIDEl.textContent = `CANCELLING RESERVATION FOR ${reservationData.reservationId}`;
    reservationAmountPaidEl.innerHTML = `You have paid ₱${reservationData.amountToPay || 0.0} for the reservation and it is <span style="color: red;">NON-REFUNDABLE</span>`;

    // Show the cancellation modal
    cancelReservationModal.style.display = "flex";
    
    document.querySelector(".postPaymentWindow").style.display = "none";

    // Close the cancellation modal
    closeCancelReservationModal.addEventListener("click", () => {
        postPaymentModal.style.display = "none";
    });

    // Listen for input in the confirmation field
    confirmationInput.addEventListener("input", () => {
        const confirmationValue = confirmationInput.value.trim();
        if (confirmationValue === reservationData.reservationId) {
            confirmCancellation(reservationData.reservationId, reasonInput.value.trim());
        }
    });
}

// Function to confirm the cancellation
function confirmCancellation(reservationId, cancellationReason) {
    if (!cancellationReason) {
        alert("Please provide a reason for cancellation.");
        return;
    }

    // Convert reservationId to reservationDate
    const reservationDate = convertReservationIdToDate(reservationId);

    const db = getDatabase(); // Get the database instance

    const activeReservationRef = ref(db, `activeReservations/${reservationDate}/${reservationId}`);
    const failedReservationRef = ref(db, `failedPaidReservations/${reservationDate}/${reservationId}`);

    // Fetch the reservation data
    get(activeReservationRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const reservationData = snapshot.val();

                // Add cancellation reason and update status
                reservationData.reasonForFailure = cancellationReason;
                reservationData.reservationStatus = "Guest cancelled their reservation";

                // Move data to failedPaidReservations with updated status
                return set(failedReservationRef, reservationData).then(() => {
                    // Remove data from activeReservations
                    return remove(activeReservationRef);
                });
            } else {
                alert("Reservation not found. Please check the Reservation ID.");
                throw new Error("Reservation not found.");
            }
        })
        .then(() => {
            // Close the modal and reset inputs
            document.querySelector(".cancelReservation").style.display = "none";
            document.getElementById("cancellingReservationID").value = "";
            document.getElementById("reasonForCancellation").value = "";

            alert(`Reservation #${reservationId} has been successfully cancelled.`);
            location.reload(); // Reload the page to reflect changes
        })
        .catch((error) => {
            console.error("Error during cancellation:", error);
            alert("An error occurred while cancelling the reservation. Please try again.");
        });
}

