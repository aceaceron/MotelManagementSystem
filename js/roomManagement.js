import { saveCheckInData, initializeRoom, saveRoomState } from './checkInCheckOutManagement.js';

document.getElementById('yesBtn').addEventListener('click', function() {
    document.getElementById('paymentConfirmationChkbox').checked = false;
    document.getElementById('yesBtn').disabled = true;
    if (roomNum) {
        // Extract the necessary values
        const durationText = document.getElementById('ConfirmationDuration').textContent;
        const duration = parseInt(durationText.split(' ')[1]);
        const checkInDate = document.getElementById('ConfirmationCheckInDate').textContent.split(': ')[1];
        const checkInTime = document.getElementById('ConfirmationCheckInTime').textContent.split(': ')[1];
        const checkOutDate = document.getElementById('ConfirmationCheckOutDate').textContent.split(': ')[1];
        const checkOutTime = document.getElementById('ConfirmationCheckOutTime').textContent.split(': ')[1];
        const extension = 0;
        const totalDuration = duration;

        const numberOfGuests = parseInt(document.getElementById('ConfirmationNumOfGuest').textContent.split(': ')[1]);
        const totalAmountPaid = parseFloat(document.getElementById('ConfirmationTotalAmountPaid').textContent.split('PHP ')[1]);

        // Find the button corresponding to the selected room and change its background color to red
        const roomButton = document.querySelector(`.room[data-room="${roomNum}"]`);
        if (roomButton) {
            roomButton.style.backgroundColor = 'red';
            roomButton.style.color = 'white';

            // Save data
            saveCheckInData(roomNum, duration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, totalDuration, numberOfGuests, totalAmountPaid);

            // Save room state to Firebase
            saveRoomState(roomNum, false);

            fetchRoomData(roomNum);

            // Change availability of the room
            changeAvailability(roomButton);

            // Close the popup after confirming
            closePopUpPaymentWindow();

            // Automatically slide back the sliding panel
            if (['2', '4', '6', '8', '9', '10'].includes(roomNum)) {
                document.getElementById('slidingPanelAirconAvail').classList.remove('show');
            } else {
                document.getElementById('slidingPanelNonAirconAvail').classList.remove('show');
            }
            fetchRoomData(roomNum);
            
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const roomElement = document.querySelectorAll('.room');
    // Iterate over each room element
    roomElement.forEach(roomElement => {
        // Get the room ID from the data attribute
        const roomId = roomElement.dataset.room;
        initializeRoom(roomElement, roomId);
        fetchRoomData(roomId);
    });
});

console.log('External script loaded');