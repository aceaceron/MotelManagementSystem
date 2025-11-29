document.querySelector('.menuLogo').addEventListener('click', function () {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});



function updateGuestCount(inputId, isIncrement) {
    let input = document.getElementById(inputId);
    let value = parseInt(input.value);
    if (!isNaN(value)) {
        if (isIncrement) {
            if (value < 6) {
                input.value = value + 1;
            }
        } else {
            if (value > 1) {
                input.value = value - 1;
            }
        }
    }
}

function validateInput(input) {
    let value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
        input.value = 1; // Set minimum value to 1
    } else if (value > 6) {
        input.value = 6; // Set maximum value to 6
    }
}

function resetGuestCounts() {
    document.getElementById('numberOfGuestAircon').value = 2;
    document.getElementById('numberOfGuestNonAircon').value = 2;
}

// Sliding panel functionality
const slidingPanelAirconAvail = document.getElementById('slidingPanelAirconAvail');
const slidingPanelNonAirconAvail = document.getElementById('slidingPanelNonAirconAvail');
const slidingPanelUnavail = document.getElementById('slidingPanelUnavail');
const closeBtnAircon = document.getElementById('closeBtnAircon');
const closeBtnNonAircon = document.getElementById('closeBtnNonAircon');
const closeBtnUnavail = document.getElementById('closeBtnUnavail');
const roomInfoAircon = document.getElementById('roomInfoAircon');
const roomInfoNonAircon = document.getElementById('roomInfoNonAircon');
const roomInfoUnavail = document.getElementById('roomInfoUnavail');

document.querySelectorAll('.room').forEach(roomButton => {
    roomButton.addEventListener('click', function () {
        var roomId = this.dataset.room;

        if (['2', '4', '6', '8', '9', '10'].includes(roomId)) {
            // Room is aircon
            roomInfoNonAircon.textContent = `ROOM ${roomId}`;
            slidingPanelNonAirconAvail.classList.add('show');
            slidingPanelAirconAvail.classList.remove('show');
            resetGuestCounts();
        } else {
            // Room is non-aircon
            roomInfoAircon.textContent = `ROOM ${roomId}`;
            slidingPanelAirconAvail.classList.add('show');
            slidingPanelNonAirconAvail.classList.remove('show');
            resetGuestCounts();
        }
    });
});

closeBtnAircon.addEventListener('click', function () {
    slidingPanelAirconAvail.classList.remove('show');
});

closeBtnNonAircon.addEventListener('click', function () {
    slidingPanelNonAirconAvail.classList.remove('show');
});

closeBtnUnavail.addEventListener('click', function () {
    slidingPanelUnavail.classList.remove('show');
});

window.addEventListener('resize', function () {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (window.innerWidth > 600) {
        dropdownMenu.style.display = 'none'; // Hide dropdown if screen is larger than 600px
    }
});

function updateDateTime() {
    const dateTimeElement = document.getElementById('dateTime');
    const now = new Date();
    const formattedDateTime = now.toLocaleString();
    dateTimeElement.textContent = formattedDateTime;
}

setInterval(updateDateTime, 1000);
updateDateTime();

let popup = document.getElementById("popupPaymentWindow");
let roomNum = null;

function changeAvailability(roomButton) {
    if (roomButton.style.backgroundColor === "skyblue") {
        roomButton.querySelector('.availability-text').textContent = "Available";
        roomButton.style.backgroundColor = "skyblue"; // Reset background to sky blue
        roomButton.style.color = "black";
    } else {
        roomButton.querySelector('.availability-text').textContent = "Occupied";
        roomButton.style.color = "white";
    }
}

document.querySelectorAll('.room').forEach(roomButton => {
    roomButton.addEventListener('click', function () {
        roomNum = this.dataset.room;

        // Check if the room button background color is red
        if (this.style.backgroundColor === 'red') {
            document.getElementById('slidingPanelUnavail').classList.add('show');
            document.getElementById('slidingPanelAirconAvail').classList.remove('show');
            document.getElementById('slidingPanelNonAirconAvail').classList.remove('show');
            // Fetch the details from Firebase and update the panel
            fetchRoomData(roomNum).then(() => {
                document.getElementById('roomInfoUnavail').textContent = `ROOM ${roomNum}`;
            });

        } else {
            const isAircon = ['2', '4', '6', '8', '9', '10'].includes(roomNum);

            if (isAircon) {
                document.getElementById('roomInfoAircon').textContent = `ROOM ${roomNum}`;
                document.getElementById('slidingPanelAirconAvail').classList.add('show');
                document.getElementById('slidingPanelNonAirconAvail').classList.remove('show');
                document.getElementById('slidingPanelUnavail').classList.remove('show');
            } else {
                document.getElementById('roomInfoNonAircon').textContent = `ROOM ${roomNum}`;
                document.getElementById('slidingPanelNonAirconAvail').classList.add('show');
                document.getElementById('slidingPanelAirconAvail').classList.remove('show');
                document.getElementById('slidingPanelUnavail').classList.remove('show');
            }
        }
    });
});

// Constants for additional fees per guest above 2
const ADDITIONAL_FEE_NON_AIRCON = 200;
const ADDITIONAL_FEE_AIRCON = 250;


// Base rates for different durations
const BASE_RATE_NON_AIRCON = { 3: 300, 6: 500, 24: 1000 };
const BASE_RATE_AIRCON = { 3: 500, 6: 800, 24: 1500 };

function openPopUpPaymentWindow(roomType, duration, amount) {
    const now = new Date();

    // Format date and time for display
    const checkInDate = now.toLocaleDateString();
    const checkInTime = now.toLocaleTimeString();

    // Calculate check-out time
    const checkOut = new Date(now.getTime() + duration * 60 * 60 * 1000); // duration is in hours
    const checkOutDate = checkOut.toLocaleDateString();
    const checkOutTime = checkOut.toLocaleTimeString();

    const numberOfGuestsNonAircon = document.getElementById('numberOfGuestNonAircon').value;
    const numberOfGuestsAircon = document.getElementById('numberOfGuestAircon').value;
    const numberOfGuests = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? numberOfGuestsAircon : numberOfGuestsNonAircon;

    let numOfGuests;
    let additionalFee;

    if (roomType === 'Air-conditioned Room') {
        numOfGuests = parseInt(document.getElementById('numberOfGuestAircon').value);
        additionalFee = ADDITIONAL_FEE_AIRCON;
    } else {
        numOfGuests = parseInt(document.getElementById('numberOfGuestNonAircon').value);
        additionalFee = ADDITIONAL_FEE_NON_AIRCON;
    }

    // Calculate additional fees
    let extraGuests = Math.max(0, numOfGuests - 2);
    let totalAdditionalFee = extraGuests * additionalFee;

    // Calculate total amount
    let totalAmount = amount + totalAdditionalFee;

    // Set confirmation window details
    document.getElementById('ConfirmationroomNum').textContent = `Room Number: ${roomNum}`;
    document.getElementById('ConfirmationroomType').textContent = `Room Type: ${roomType}`;
    document.getElementById('ConfirmationDuration').textContent = `Duration: ${duration} HOURS`;

    document.getElementById('ConfirmationCheckInDate').textContent = `Date of Check-in: ${checkInDate}`;
    document.getElementById('ConfirmationCheckInTime').textContent = `Time In: ${checkInTime}`;
    document.getElementById('ConfirmationCheckOutDate').textContent = `Date of Check-Out: ${checkOutDate}`;
    document.getElementById('ConfirmationCheckOutTime').textContent = `Time Out: ${checkOutTime}`;
    document.getElementById('ConfirmationAmountPaid').textContent = `Room Rate: PHP ${amount}.00`;
    document.getElementById('ConfirmationNumOfGuest').textContent = `Number of Guest: ${numberOfGuests}`;
    document.getElementById('ConfirmationTotalAmountPaid').textContent = `Total Amount Paid: PHP ${totalAmount.toFixed(2)}`;

    document.getElementById('UnavailNumOfGuest').textContent = `${numOfGuests}`;
    document.getElementById('UnavailTotalAmountPaid').textContent = `PHP ${totalAmount.toFixed(2)}`;

    popup.classList.add("open-paymentConfirmation");
}

function closePopUpPaymentWindow() {
    popup.classList.remove("open-paymentConfirmation");
    document.getElementById('paymentConfirmationChkbox').checked = false;
    document.getElementById('yesBtn').disabled = true;
}

document.getElementById('paymentConfirmationChkbox').addEventListener('change', function () {
    const yesBtn = document.getElementById('yesBtn');
    yesBtn.disabled = !this.checked;  // Enable the yes button only if the checkbox is checked
});

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();

    const toggleLists = document.querySelectorAll('.toggle-list');

    toggleLists.forEach(list => {
        list.addEventListener('click', function () {
            // Toggle visibility of the <ul> element
            const isVisible = list.classList.contains('show');
            toggleLists.forEach(l => l.classList.remove('show')); // Hide all lists
            if (!isVisible) {
                list.classList.add('show'); // Show the clicked list

            }
        });
    });
});

// Function to hide validatingReservationPayment when clicking outside its content
document.addEventListener('click', function (event) {
    const modal = document.querySelector('.validatingReservationPayment');
    const modalContent = document.querySelector('.validatingReservationPayment-content');

    if (modal.style.display === 'flex' && !modalContent.contains(event.target)) {
        modal.style.display = 'none';
    }
});


function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Function to hide validatingReservationPayment when clicking outside its content
document.addEventListener('click', function (event) {
    const modal = document.querySelector('.validatingReservationPayment');
    const modalContent = document.querySelector('.confirmedReceiptModal');

    if (modal.style.display === 'flex' && !modalContent.contains(event.target)) {
        modal.style.display = 'none';
    }
});