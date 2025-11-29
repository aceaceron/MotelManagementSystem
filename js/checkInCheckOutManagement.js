// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { updateRoomData } from "./roomChecking.js";

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


// Function to format the current date as YYYYMMDD
function formatDate() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const date = String(now.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${date}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForCheckIns/${dateKey}`);

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

// Function to generate a unique ID based on the current date and a sequential number
async function generateCheckInId() {
    const dateKey = formatDate();
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(3, '0');
    return `${dateKey}-${formattedNumber}`;
}

// Function to save check-in/check-out data to Firebase
export async function saveCheckInData(roomNum, initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, totalDuration, numberOfGuests, totalAmountPaid, shouldMoveToPast = false) {
    try {
        const checkInId = await generateCheckInId(); // Assuming this generates a unique ID
        const newCheckInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);

        const checkInCheckOutData = {
            roomNum,
            initialDuration,
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            numberOfGuests,
            totalAmountPaid
        };

        await set(newCheckInCheckOutRef, checkInCheckOutData);

        if (shouldMoveToPast) {
            await moveDataToPastCheckIn(checkInId);
        }

        return checkInId; // Return the generated check-in ID
    } catch (error) {
        console.error('Error in saveCheckInData function:', {
            message: error.message,
            stack: error.stack,
            data: {
                roomNum,
                initialDuration,
                checkInDate,
                checkInTime,
                checkOutDate,
                checkOutTime,
                extension,
                totalDuration,
                numberOfGuests,
                totalAmountPaid
            }
        });
        throw error;
    }
}

window.fetchRoomData = async function (roomNum) {
    try {
        const roomRef = ref(db, 'currentCheckIn');
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            let foundEntry = null;
            let checkInId = null;

            for (let key in data) {
                if (data.hasOwnProperty(key) && data[key].roomNum === roomNum) {
                    foundEntry = data[key];
                    checkInId = key;  // Save the key as the unique ID
                    break;
                }
            }
            if (foundEntry) {
                const { initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, numberOfGuests, totalDuration, totalAmountPaid } = foundEntry;
                var extensionStatus = '';
                if (extension === 0) {
                    extensionStatus = 'NONE';
                } else if (extension === 1) {
                    extensionStatus = extension + " HOUR";
                } else {
                    extensionStatus = extension + " HOURS";
                }

                const roomType = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? 'Air-conditioned Room' : 'Standard Room';
                document.getElementById('roomInfoUnavail').textContent = 'ROOM ' + roomNum;
                document.getElementById('UnavailRoomType').textContent = roomType;
                document.getElementById('UnavailRoomNum').textContent = roomNum;
                document.getElementById('UnavailDuration').textContent = initialDuration + ' HOURS';
                document.getElementById('UnavailCheckInDate').textContent = checkInDate;
                document.getElementById('UnavailCheckInTime').textContent = checkInTime;
                document.getElementById('UnavailCheckOutDate').textContent = checkOutDate;
                document.getElementById('UnavailCheckOutTime').textContent = checkOutTime;
                document.getElementById('UnavailExtension').textContent = extensionStatus;
                document.getElementById('UnavailTotalDuration').textContent = totalDuration + ' HOURS';
                document.getElementById('UnavailNumOfGuest').textContent = numberOfGuests;
                document.getElementById('UnavailTotalAmountPaid').textContent = 'PHP ' + totalAmountPaid + '.00';

                document.getElementById('UnavailCheckInId').textContent = checkInId;

                const currentTime = new Date().getTime();
                const checkoutDateTime = new Date(`${checkOutDate} ${checkOutTime}`).getTime();
                let remainingTime = checkoutDateTime - currentTime;

                const checkOutDateDirectory = convertDateToISOFormat(checkOutDate);

                // Find the button for the selected room
                const roomButton = document.querySelector(`#room${roomNum}`);
                if (roomButton) {
                    // Pass checkInId and roomNum to startCountdown
                    await startCountdown(remainingTime, roomButton, checkInId, roomNum, checkOutDateDirectory);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

let countdown;

const countdowns = {}; // Object to hold countdown IDs for each room

async function startCountdown(initialDuration, roomButton, checkInId, roomId, checkOutDateDirectory) {
    const availabilityText = roomButton.querySelector('.availability-text');

    // Clear any existing countdown for this room
    if (countdowns[roomId]) {
        clearInterval(countdowns[roomId]);
    }

    countdowns[roomId] = setInterval(async () => {  // Store the interval ID for this room
        let hours = Math.floor((initialDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((initialDuration % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((initialDuration % (1000 * 60)) / 1000);

        availabilityText.textContent = `${hours}h ${minutes}m ${seconds}s`;

        if (initialDuration <= 0) {
            clearInterval(countdowns[roomId]); // Clear this specific countdown
            delete countdowns[roomId]; // Remove the countdown ID from the object
            
            // Reset the room's UI to available
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";

            // Mark the room as available in Firebase
            await saveRoomState(roomId, true); // 'true' indicates the room is now available

            // Move the data to pastCheckIn
            await moveDataToPastCheckIn(checkInId);

            document.querySelector(".confirmedReceiptWindow").style.display = "flex";
           
            // Event listeners
            document.getElementById("confirmReceiptNumber").addEventListener("click", () => {
                handleReceiptNumberSave(checkInId, db, checkOutDateDirectory);
            });

            // Update room data
            await updateRoomData(roomId);
        } else {
            initialDuration -= 1000;
        }
    }, 1000);
}


function convertDateToISOFormat(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function moveDataToPastCheckIn(checkInId) {
    try {
        const checkInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);
        const checkInCheckOutSnapshot = await get(checkInCheckOutRef);
        const checkInCheckOutData = checkInCheckOutSnapshot.val();

        if (checkInCheckOutData) {
            const checkOutDateDirectory = convertDateToISOFormat(checkInCheckOutData.checkOutDate || new Date().toLocaleDateString());

            // Save the data to the pastCheckIn table
            const pastCheckInRef = ref(db, `pastCheckIn/${checkOutDateDirectory}/${checkInId}`);
            await set(pastCheckInRef, checkInCheckOutData);

            // Remove the old data from currentCheckIn
            await remove(checkInCheckOutRef);
        }
    } catch (error) {
        console.error('Error moving data to pastCheckIn:', error);
    }
}


// Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

document.getElementById('extendHr').addEventListener('click', async function () {
    try {
        // Show confirmation dialog to the user
        const confirmed = confirm('Are you sure you that the guest paid to extend the check-out time by one hour?');

        if (!confirmed) {
            console.log('Extension canceled.');
            return; // Exit if the user cancels
        }

        const checkInIdElement = document.getElementById('UnavailCheckInId');
        const roomNumElement = document.getElementById('UnavailRoomNum');

        // Check if required DOM elements are present
        if (!checkInIdElement || !roomNumElement) {
            console.error('Required DOM elements not found.');
            return;
        }

        // Retrieve unique ID and selected room number
        const checkInId = checkInIdElement.textContent.trim();
        const roomNum = roomNumElement.textContent.trim();

        if (!checkInId || !roomNum) {
            console.error('Unique ID or Room Number is missing.');
            return;
        }

        // Determine the additional fee based on the room type
        const additionalFee = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

        // Reference to the current booking data in Firebase
        const bookingRef = ref(db, `currentCheckIn/${checkInId}`);
        const snapshot = await get(bookingRef);

        if (!snapshot.exists()) {
            console.error('No data available for the given unique ID.');
            return;
        }

        const bookingData = snapshot.val();


        // Extract and format the check-out date and time
        const checkOutDateStr = bookingData.checkOutDate; // Format should be MM/DD/YYYY
        const checkOutTimeStr = bookingData.checkOutTime; // Format should be HH:MM:SS AM/PM

        // Create a Date object with the correct format
        const [month, day, year] = checkOutDateStr.split('/'); // MM/DD/YYYY
        const [time, modifier] = checkOutTimeStr.split(' '); // HH:MM:SS AM/PM
        const [hours, minutes, seconds] = time.split(':'); // HH:MM:SS

        // Convert to 24-hour format if necessary
        let hours24 = parseInt(hours, 10);
        if (modifier === 'PM' && hours24 < 12) hours24 += 12;
        if (modifier === 'AM' && hours24 === 12) hours24 = 0;

        // Construct the ISO 8601 date-time string
        const isoDateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours24.toString().padStart(2, '0')}:${minutes}:${seconds}`;

        // Log the formatted ISO date-time string for debugging
        console.log('Combining check-out date and time:', isoDateTimeStr);

        const checkOutDateTime = new Date(isoDateTimeStr);

        // Check if the Date object is valid
        if (isNaN(checkOutDateTime.getTime())) {
            console.error('Invalid check-out datetime format:', isoDateTimeStr);
            return;
        }

        // Add one hour to the check-out time
        checkOutDateTime.setHours(checkOutDateTime.getHours() + 1);

        // Convert the updated Date object to ISO string and local date/time strings
        const newCheckoutTimeISO = checkOutDateTime.toISOString();
        const newCheckoutDate = checkOutDateTime.toLocaleDateString();
        const newCheckoutTime = checkOutDateTime.toLocaleTimeString();

        const newExtension = (bookingData.extension || 0) + 1;
        const newTotalDuration = (bookingData.totalDuration || 0) + 1;

        // Update the total amount paid
        const originalAmount = parseFloat(document.getElementById('UnavailTotalAmountPaid').textContent.split('PHP ')[1]);
        const newTotalAmount = originalAmount + additionalFee;

        document.getElementById('UnavailTotalAmountPaid').textContent = `PHP ${newTotalAmount.toFixed(2)}`;

        // Update Firebase with the new checkout time and total amount
        await set(bookingRef, {
            ...bookingData,
            checkOutDate: newCheckoutDate,
            checkOutTime: newCheckoutTime,
            extension: newExtension,
            totalDuration: newTotalDuration,
            totalAmountPaid: newTotalAmount
        });

        // Update the UI with the new check-out date and time
        document.getElementById('UnavailCheckOutDate').textContent = newCheckoutDate;
        document.getElementById('UnavailCheckOutTime').textContent = newCheckoutTime;
        document.getElementById('UnavailExtension').textContent = `${newExtension} HOURS`;
        document.getElementById('UnavailTotalDuration').textContent = `${newTotalDuration} HOURS`;

        location.reload(true);

    } catch (error) {
        console.error('Error extending booking:', error);
    }
});

document.getElementById('timeOut').addEventListener('click', async function () {
    // Confirm action with the user
    const confirmed = confirm('Are you sure you want to mark this room as checked out? This action cannot be undone.');

    if (confirmed) {
        const checkInId = document.getElementById('UnavailCheckInId').textContent; // Fetch the displayed unique ID

        // Get the current date and time
        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        const formattedDate = `${month}/${day}/${year}`;

        // Define checkOutDateDirectory in YYYY-MM-DD format with padding
        const paddedMonth = String(month).padStart(2, '0'); // Add leading zero if needed
        const paddedDay = String(day).padStart(2, '0'); // Add leading zero if needed
        const checkOutDateDirectory = `${year}-${paddedMonth}-${paddedDay}`;

        // Reset the room's UI
        const roomButton = document.querySelector(`.room[data-room="${roomNum}"]`);
        if (roomButton) {
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";
        }

        try {
            // Update the room's availability and "wasRecentlyAvailable" status in Firebase
            await saveRoomState(roomNum, true);

            document.querySelector(".confirmedReceiptWindow").style.display = "flex";
           
            // Event listeners
            document.getElementById("confirmReceiptNumber").addEventListener("click", () => {
                handleReceiptNumberSave(checkInId, db, checkOutDateDirectory);
            });

            await updateRoomData(roomNum);

            // Update checkout time and date, then move data to the "pastCheckIn" table
            await set(ref(db, `currentCheckIn/${checkInId}/checkOutTime`), formattedTime);
            await set(ref(db, `currentCheckIn/${checkInId}/checkOutDate`), formattedDate);
            await moveDataToPastCheckIn(checkInId);

            // Hide the sliding panel
            document.getElementById('slidingPanelUnavail').classList.remove('show');

            // Clear the countdown interval
            clearInterval(countdown);

            // location.reload(true);
        } catch (error) {
            console.error('Error during time-out process:', error);
        }
    } else {
        alert('Time-out action canceled.');
    }
});

async function handleReceiptNumberSave(checkInId, db, checkOutDateDirectory) {
    const officialReceiptNumberInput = document.getElementById("officialReceiptNumber");
    const enteringReceiptNumWindow = document.querySelector(".confirmedReceiptWindow");

    const receiptNumber = officialReceiptNumberInput.value.trim();

    if (!receiptNumber) {
        alert("Please enter the receipt number.");
        return;
    }

    const confirmSave = confirm(`Are you sure you want to save this receipt number: ${receiptNumber}?`);

    if (confirmSave) {
        try {
            await set(ref(db, `pastCheckIn/${checkOutDateDirectory}/${checkInId}/officialReceiptNumber`), receiptNumber);
            alert("Receipt number saved successfully!");
        } catch (error) {
            console.error("Error saving receipt number:", error);
            alert("There was an error saving the receipt number. Please try again.");
        }

        // Close the receipt window
        enteringReceiptNumWindow.style.display = "none";
    }
}

document.getElementById("cancelReceiptNumber").addEventListener("click", () => {
    const enteringReceiptNumWindow = document.querySelector(".confirmedReceiptWindow");
    enteringReceiptNumWindow.style.display = "none";
});


// Function to save room state (availability) to Firebase
export async function saveRoomState(roomNum, isRoomAvailable) {
    try {
        const roomRef = ref(db, `rooms/${roomNum}`);
        const updates = {
            isRoomAvailable: isRoomAvailable,
        };

        if (isRoomAvailable) {
            updates.wasRecentlyAvailable = true; // Mark as recently available
        } else {
            updates.wasRecentlyAvailable = false; // Reset when room is unavailable
        }

        await update(roomRef, updates);

    } catch (error) {
        console.error('Error saving room state:', error);
    }
}

// Function to retrieve room state from Firebase
export async function getRoomState(roomId) {
    try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return { isRoomAvailable: true }; // Default to available if no data
        }
    } catch (error) {
        console.error('Error retrieving room state:', error);
        return { isRoomAvailable: true }; // Default to available in case of error
    }
}

// Function to initialize room with Firebase data
export async function initializeRoom(roomElement, roomId) {
    const roomState = await getRoomState(roomId);
    if (roomState && !roomState.isRoomAvailable) {
        roomElement.style.backgroundColor = 'red';
        roomElement.style.color = 'white';
        changeAvailability(roomElement);
    }

    roomElement.addEventListener('click', async function () {
        if (window.yesBtnPressed) {
            // Save the room state to Firebase
            await saveRoomState(roomId, false);

            // Update the UI
            roomElement.style.backgroundColor = 'red';
            roomElement.style.color = 'white';
            changeAvailability(roomElement);
        }
    });
}