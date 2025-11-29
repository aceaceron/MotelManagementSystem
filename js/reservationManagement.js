// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getRoomState, saveRoomState, saveCheckInData } from './checkInCheckOutManagement.js';

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
const db = getDatabase(app); // Initialize the Realtime Database

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Function to fetch and display reservations
export async function displayReservations() {
    const reservationDiv = document.querySelector('.reservation');
    showLoadingScreen();

    const currentFile = window.location.pathname.split('/').pop();

    try {
        const reservationsRef = ref(db, 'activeReservations');
        const snapshot = await get(reservationsRef);

        if (snapshot.exists()) {
            hideLoadingScreen();
            const reservations = snapshot.val();
            reservationDiv.innerHTML = '';

            for (const [date, reservationsByDate] of Object.entries(reservations)) {
                for (const [reservationId, reservationData] of Object.entries(reservationsByDate)) {
                    const reservationDivElement = document.createElement('div');
                    reservationDivElement.classList.add('reservation-item');
                    var extensionStatus = '';
                    if (reservationData.extension === 0) {
                        extensionStatus = 'NONE';
                    } else if (reservationData.extension === 1) {
                        extensionStatus = reservationData.extension + " HOUR";
                    } else {
                        extensionStatus = reservationData.extension + " HOURS";
                    }

                    

                    reservationDivElement.innerHTML = `
                        <p><strong>Reservation ID:</strong><br>${reservationId}</p>
                        <p><strong>Reservation Date & Time:</strong><br>${reservationData.reservationCheckInDate}, ${reservationData.reservationCheckInTime}</p>
                        <p><strong>Room Type:</strong><br>${reservationData.roomType}</p>
                        <p><strong>Duration:</strong><br>${reservationData.duration} HOURS</p>
                        <p><strong>Number of Guests:</strong><br>${reservationData.numberOfGuests}</p>
                        <p><strong>Extension:</strong><br>${extensionStatus}</p>
                        <p><strong>Amount to Pay/Paid:</strong><br>PHP ${reservationData.amountToPay}.00</p><hr>
                        <p><strong>Full Name:</strong><br>${reservationData.lastName}, ${reservationData.firstName}</p>
                        <p><strong>Phone Number:</strong><br>${reservationData.phoneNumber}</p>
                        <p><strong>Email Address:</strong><br>${reservationData.emailAddress}</p><hr>
                        <p><strong>Reservation Status:</strong><br>${reservationData.reservationStatus}</p>
                        <div class="reservation-buttons">
                        <!-- Show btn-verify only if reservationStatus is not "Payment Validated" and disable if it includes "Payment rejected due to" -->
                        <button class="btn-verify" data-reservation-id="${reservationId}" 
                            style="display: ${reservationData.reservationStatus === 'Payment Validated' ? 'none' : 'inline-block'}"
                            ${reservationData.reservationStatus.includes('Payment Rejected due to') ? 'disabled' : ''}>
                            <i class="fa-solid fa-money-bills"></i>
                        </button>

                        
                        <!-- Show btn-book only if reservationStatus is "Payment Validated" -->
                        <button class="btn-book" 
                            style="display: ${reservationData.reservationStatus === 'Payment Validated' ? 'inline-block' : 'none'}">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        
                        <!-- Other buttons are not conditional -->
                        <button class="btn-no-show"><i class="fa-solid fa-user-slash"></i></button>
                        <button class="btn-invalid"><i class="fa-solid fa-text-slash"></i></button>
                    </div>

                    `;

                    reservationDiv.appendChild(reservationDivElement);
                    
                    // Function to show the validatingReservationPayment section
                    document.querySelectorAll('.btn-verify').forEach((button) => {
                        button.addEventListener('click', async function () {

                            const reservationId = this.getAttribute('data-reservation-id');
                            if (!reservationId) {
                                alert('Reservation ID is missing.');
                                return;
                            }
                    
                            const reservationDate = convertReservationIdToDate(reservationId);
                    
                            // Fetch reservation details from Firebase
                            try {
                                const reservationRef = ref(db, `activeReservations/${reservationDate}/${reservationId}`);
                                const snapshot = await get(reservationRef);
                    
                                if (snapshot.exists()) {
                                    const reservationData = snapshot.val();
                                    // Populate the reservation data into the validatingReservationPayment section
                                    document.getElementById('validatingReservationNum').textContent = `Validating Reservation #${reservationId}`;
                                    if (!reservationData.referenceCodePayment && !reservationData.receiptImage) {
                                        // If referenceCodePayment is present but receiptImage is missing, show appropriate message
                                        document.getElementById('validatingReferenceCodeGCash').innerHTML = "Guest has not provided the reference code and receipt of payment in GCash";
                                        // Hide the receipt image
                                        document.getElementById('validatingGCashReceipt').style.display = 'none';
                                    } 
                                    // Check if referenceCodePayment or receiptImage is missing
                                    else if (!reservationData.referenceCodePayment) {
                                        // If referenceCodePayment is missing, display the message
                                        document.getElementById('validatingReferenceCodeGCash').innerHTML = "Guest has not yet provided the Reference Code of their payment";
                                    } else {
                                        // If both referenceCodePayment and receiptImage are available, display them
                                        document.getElementById('validatingReferenceCodeGCash').innerHTML = `Reference Code provided:<br><b>${reservationData.referenceCodePayment}</b>`;
                                        
                                        // Set the receipt image
                                        const receiptImage = document.getElementById('validatingGCashReceipt');
                                        receiptImage.src = reservationData.receiptImage || '';
                                        receiptImage.alt = `Receipt for Reservation #${reservationId}`;
                                        // Ensure receipt image is visible
                                        receiptImage.style.display = 'block';
                                    }

                                    // Display the validatingReservationPayment section
                                    document.querySelector('.validatingReservationPayment').style.display = 'flex';
                    
                                    // Attach event listeners for accept and reject buttons
                                    document.getElementById('acceptReservationPayment').addEventListener('click', async function () {
                                        if (confirm('Are you sure you want to validate this payment?')) {
                                            try {
                                                reservationData.reservationStatus = 'Payment Validated';
                    
                                                // Update Firebase
                                                await update(ref(db, `activeReservations/${reservationDate}/${reservationId}`), {
                                                    reservationStatus: reservationData.reservationStatus,
                                                });
                    
                                                alert('Payment validated successfully.');
                                                document.querySelector('.validatingReservationPayment').style.display = 'none';
                                                location.reload(true);
                                            } catch (error) {
                                                console.error('Error updating reservation status:', error);
                                                alert('Failed to validate payment. Please try again.');
                                            }
                                        }
                                    });
                    
                                    document.getElementById('rejectReservationPayment').addEventListener('click', async function () {
                                        const reason = document.getElementById('reasonForRejectPayment').value.trim();
                                        if (!reason) {
                                            alert('Please provide a reason for rejecting the payment.');
                                            return;
                                        }
                    
                                        if (confirm(`Are you sure you want to reject this payment with the reason: "${reason}"?`)) {
                                            try {
                                                reservationData.reservationStatus = `Payment Rejected due to ${reason}`;
                                                reservationData.reasonForRejectingReservation = reason;
                    
                                                // Update Firebase
                                                await update(ref(db, `activeReservations/${reservationDate}/${reservationId}`), {
                                                    reservationStatus: reservationData.reservationStatus,
                                                    reasonForRejectingReservation: reservationData.reasonForRejectingReservation,
                                                });
                    
                                                alert('Payment rejected successfully.');
                                                document.querySelector('.validatingReservationPayment').style.display = 'none';
                                                location.reload(true);
                                            } catch (error) {
                                                console.error('Error updating reservation status:', error);
                                                alert('Failed to reject payment. Please try again.');
                                            }
                                        }
                                    });
                                } else {
                                    alert('No reservation found with this ID.');
                                }
                            } catch (error) {
                                console.error('Error fetching reservation details:', error);
                                alert('Failed to fetch reservation details. Please try again.');
                            }
                        });
                    });

                    reservationDivElement.querySelector('.btn-book').addEventListener('click', function () {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const amountToPay = reservationData.amountToPay;

                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);

                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }

                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);

                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));

                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else if (daysDifference === 0 && minutesDifference <= 10) {
                            const roomElement = reservationDivElement.querySelector('p:nth-child(3)');

                            if (roomElement) {
                                const roomText = roomElement.textContent.trim();

                                // Extract the room type by splitting based on the colon and trimming
                                const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                                const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';
                                
                                showRoomSelectionModal(roomType, reservationData, reservationId);


                            } else {
                                console.error('Room type element not found!');
                            }
                        } else if (daysDifference === 0 || minutesDifference < 0 && minutesDifference >= -10) {

                            const continueBooking = confirm(`The reservation for ID: ${reservationId} check-in time has passed less than 10 minutes.\nDo the customer what to continue the booking? `);

                            if (continueBooking) {
                                const roomElement = reservationDivElement.querySelector('p:nth-child(3)');

                                if (roomElement) {
                                    const roomText = roomElement.textContent.trim();

                                    // Extract the room type by splitting based on the colon and trimming
                                    const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                                    const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';

                                    showRoomSelectionModal(roomType, reservationData, reservationId);

                                }
                            } else {
                                const failedBooking = confirm(`The reservation for ID: ${reservationId} will be invalid if continue.`);
                                if (failedBooking) {
                                    const reservationCheckInDate = reservationData.reservationCheckInDate;
                                    const reason = 'Customer showed passed the check-out time and decide to discontinue booking.';
                                    moveToFailedReservations(reservationId, reservationCheckInDate, reason);
                                }
                            }
                        }
                        else {
                            alert(`The reservation for ID: ${reservationId} check-in time has passed 10 minutes.\nReservation now invalid and unable to continue.`);
                        }
                    });

                    reservationDivElement.querySelector('.btn-no-show').addEventListener('click', function () {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const reservationCheckInDate = reservationData.reservationCheckInDate;

                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);

                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }

                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);

                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));

                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else {
                            const confirmNoShow = confirm(`Has the customer for Reservation ID: ${reservationId} no showed his/her reservation? \nThis action can not be undone!`);
                            if (confirmNoShow) {
                                const reason = 'No show / Did not appear';
                                moveToFailedReservations(reservationId, reservationCheckInDate, reason);
                            }
                        }
                    });

                    reservationDivElement.querySelector('.btn-invalid').addEventListener('click', function () {
                        openInvalidModal(reservationId, reservationData);
                    });

                }
            }
        } else {
            hideLoadingScreen();
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

async function setupRoomSelectionModal(roomType) {
    const roomSelectionModal = document.getElementById('roomSelectionModal');
    const roomNumbersContainer = document.getElementById('roomNumbersContainer');
    const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

    // Reset styles for all room numbers
    roomNumbers.forEach(roomDiv => {
        roomDiv.classList.remove('disabled');
        roomDiv.style.backgroundColor = ''; // Reset to default
        roomDiv.style.cursor = ''; // Reset cursor
    });

    // Define which rooms should be disabled based on room type
    const airconRooms = [1, 3, 5, 7];
    const standardRooms = [2, 4, 6, 8, 9, 10];

    for (const roomDiv of roomNumbers) {
        const roomNumber = parseInt(roomDiv.getAttribute('data-room'), 10);

        // Fetch room availability from Firebase (this is an async operation)
        const roomState = await getRoomState(roomNumber);

        if ((roomType === 'STANDARD ROOM' && standardRooms.includes(roomNumber)) ||
            (roomType === 'AIR-CONDITIONED ROOM' && airconRooms.includes(roomNumber))) {
            roomDiv.classList.add('disabled');
            roomDiv.style.backgroundColor = 'Gray'; // Set background color to gray
            roomDiv.style.cursor = 'not-allowed'; // Set cursor to not-allowed
        } else if (roomState && !roomState.isRoomAvailable) {
            roomDiv.style.backgroundColor = 'red';
            roomDiv.style.cursor = 'not-allowed';
            roomDiv.classList.add('disabled');
        } else if (roomState && roomState.isRoomAvailable) {
            roomDiv.style.backgroundColor = 'green';
        }
    }

    // After all room availability checks are done, show the modal
    roomSelectionModal.style.display = 'block';
}

async function showRoomSelectionModal(roomType, reservationData, reservationId) {
    // Show loading screen
    showLoadingScreen();

    try {
        await setupRoomSelectionModal(roomType);

        const roomNumbersContainer = document.getElementById('roomNumbersContainer');
        const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

        roomNumbers.forEach(roomDiv => {
            if (roomDiv.style.backgroundColor === 'green') {
                // Add a click event listener for the green rooms
                roomDiv.addEventListener('click', async () => {
                    await handleRoomSelection(roomDiv, reservationData, reservationId);
                });
            }
        });

    } catch (error) {
        console.error('Error fetching room states:', error);
    } finally {
        // Hide the loading screen
        hideLoadingScreen();
    }
}

async function handleRoomSelection(roomDiv, reservationData, reservationId) {
    const roomNumber = roomDiv.getAttribute('data-room');
    const roomSelectionModal = document.getElementById('roomSelectionModal');

    if (reservationData && reservationId) {
        const { duration, extension, reservationCheckInDate } = reservationData;

        // Calculate check-out time
        const now = new Date();
        const checkOut = new Date(now.getTime() + (duration + extension) * 60 * 60 * 1000);
        const checkOutDate = checkOut.toLocaleDateString();
        const checkOutTime = checkOut.toLocaleTimeString();

        const totalDuration = duration + extension;

        // Save check-in/check-out data and get the checkInId
        const checkInId = await saveCheckInData(
            roomNumber,
            duration,
            reservationCheckInDate,
            now.toLocaleTimeString(), // checkInTime
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            reservationData.numberOfGuests,
            reservationData.amountToPay
        );

        // Move the reservation data to 'completedReservations', including the checkInId
        await moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId);

        // Update room availability
        await saveRoomState(roomNumber, false);

        // Update UI
        roomDiv.style.backgroundColor = 'red';
        roomDiv.style.cursor = 'not-allowed';
        roomDiv.classList.add('disabled');

        location.reload(true);

        // Hide the modal
        roomSelectionModal.style.display = 'none';
    } else {
        console.error('Reservation data or ID is missing.');
    }
}

function convertDateToISOFormat(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId) {
    try {
        const isoFormattedDate = convertDateToISOFormat(reservationCheckInDate);
        const reservationRef = ref(db, `activeReservations/${isoFormattedDate}/${reservationId}`);
        const completedReservationRef = ref(db, `completedReservations/${isoFormattedDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();
            reservationDetails.checkInId = checkInId; // Add the checkInId to the reservation details

            await set(completedReservationRef, reservationDetails);
            await remove(reservationRef);

            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            // Additional debugging info
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to completedReservations:', error);
    }
}

async function moveToFailedReservations(reservationId, reservationDate) {
    try {
        const isoFormattedDate = convertDateToISOFormat(reservationDate);
        const reservationRef = ref(db, `activeReservations/${isoFormattedDate}/${reservationId}`);
        const failedReservationRef = ref(db, `failedReservations/${isoFormattedDate}/${reservationId}`);
        const failedPaidReservationRef = ref(db, `failedPaidReservations/${isoFormattedDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();

            // Determine the destination and reason
            if (reservationDetails.reservationStatus === "Payment Validated") {
                reservationDetails.reasonForFailure = "Guest did not show up";
                await set(failedPaidReservationRef, reservationDetails);
                console.log(`Moved reservation ID ${reservationId} to failedPaidReservations.`);
            } else {
                await set(failedReservationRef, reservationDetails);
                console.log(`Moved reservation ID ${reservationId} to failedReservations.`);
            }

            // Remove the original reservation
            await remove(reservationRef);

            // Reload the page to reflect the changes
            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to failed reservations:', error);
    }
}


// Get modal elements
const invalidModal = document.querySelector('.invalidReservation'); // Target the correct modal
const closeInvalidModal = document.getElementById('closeInvalidModal');
const moveToFailedBtn = document.getElementById('moveToFailed');
const editReservationBtn = document.getElementById('editReservation');
const invalidReservationMessage = document.getElementById('invalidReservationMessage');
const editReservationKey = document.getElementById('editReservationKey');
const editReservationValue = document.querySelector('.editReservationValue');

// Variables to store the current reservation data
let currentReservationId = '';
let currentReservationData = {};

// Open invalid reservation modal
function openInvalidModal(reservationId, reservationData) {
    currentReservationId = reservationId;
    currentReservationData = reservationData;
    var extensionStatus;

    if (reservationData.extension === 0) {
        extensionStatus = 'NONE';
    } else if (reservationData.extension === 1) {
        extensionStatus = reservationData.extension + " HOUR";
    } else {
        extensionStatus = reservationData.extension + " HOURS";
    }

    // Populate the reservation info in the modal
    document.getElementById('reservationInfoId').textContent = reservationId;
    document.getElementById('reservationInfoCheckInDate').textContent = reservationData.reservationCheckInDate;
    document.getElementById('reservationInfoRoomType').textContent = reservationData.roomType;
    document.getElementById('reservationInfoDuration').textContent = reservationData.duration + ' HOURS';
    document.getElementById('reservationInfoExtension').textContent = extensionStatus;
    document.getElementById('reservationInfoNumOfGuest').textContent = reservationData.numberOfGuests;
    document.getElementById('reservationInfoTotalAmountPaid').textContent = `PHP ${reservationData.amountToPay}.00`;
    document.getElementById('reservationInfoStatus').textContent = reservationData.reservationStatus;

    invalidReservationMessage.textContent = `Would you like to delete Reservation ID: ${reservationId} due to invalid values, or would you prefer to edit the values?`;

    const editReservationValueInput = document.querySelector('#editReservationValue');
    editReservationValueInput.value = reservationData.lastName;

    // Show the invalid reservation modal
    invalidModal.style.display = 'flex'; // Show the modal

    document.getElementById("editReservationKey").addEventListener("change", function () {
        const selectedKey = this.value; // Get the selected value
        const textInput = document.getElementById("editReservationValue");
        const timeDropdown = document.getElementById("editReservationValueForCheckInTime");
    
        if (selectedKey === "checkInTime") {
            // Show the time dropdown, hide the text input
            timeDropdown.style.display = "flex";
            textInput.style.display = "none";
        } else {
            // Show the text input, hide the time dropdown
            textInput.style.display = "flex";
            timeDropdown.style.display = "none";
        }
    });
    
}

// Handle move to failed reservations
moveToFailedBtn.onclick = async function () {
    const reason = document.querySelector('.reasonOfFailure').value.trim();

    if (reason === '') {
        alert('Please provide a reason for the failure.');
        return;
    }

    await moveToFailedReservations(currentReservationId, currentReservationData.reservationCheckInDate, reason);
    invalidModal.style.display = 'none';
};

// Handle editing reservation values
editReservationKey.addEventListener('change', function () {
    const selectedKey = editReservationKey.value;
    editReservationValue.value = currentReservationData[selectedKey] || '';
});

editReservationBtn.onclick = async function () {
    let selectedKey = editReservationKey.value;
    let newValue;

    // Determine the value based on the selected key
    if (selectedKey === 'checkInTime') {
        selectedKey = "reservationCheckInTime"
        newValue = editReservationValueForCheckInTime.value; // Get the value from the dropdown
    } else {
        newValue = editReservationValue.value.trim(); // Get the value from the text input
    }

    // Ensure a value is provided
    if (newValue === '') {
        alert('Please provide a new value.');
        return;
    }

    // Convert the reservationCheckInDate from MM/DD/YYYY to YYYY-MM-DD
    const checkInDate = currentReservationData.reservationCheckInDate;
    const [month, day, year] = checkInDate.split('/');
    const formattedCheckInDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Update the specific reservation field
    try {
        const reservationRef = ref(db, `activeReservations/${formattedCheckInDate}/${currentReservationId}`);
        await update(reservationRef, { [selectedKey]: newValue });

        alert(`Reservation updated successfully!`);
        invalidModal.style.display = 'none';
        location.reload(true);
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Failed to update the reservation. Please try again.');
    }
};

// Close the modal when the user clicks on the close button
closeInvalidModal.onclick = function () {
    invalidModal.style.display = 'none';
};

document.getElementById('closeRoomSelectionModal').addEventListener('click', function () {
    document.getElementById('roomSelectionModal').style.display = 'none';
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

