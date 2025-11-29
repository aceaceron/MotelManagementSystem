// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, get, set, update, onChildChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

const recentRooms = new Set(); // To keep track of rooms that have just become available

// Listen for changes in the isRoomAvailable field for all rooms
const roomsRef = ref(db, 'rooms');
onChildChanged(roomsRef, (snapshot) => {
    const roomId = snapshot.key;
    const roomData = snapshot.val();

    if (roomData.isRoomAvailable === true) {
        recentRooms.add(roomId); 
    }
});

window.addEventListener('DOMContentLoaded', async function () {
    try {
        const roomsRef = ref(db, 'rooms/');
        const snapshot = await get(roomsRef);

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            let hasToDo = false;

            for (const roomId in rooms) {
                const roomData = rooms[roomId];

                // Check if the room was recently made available
                if (roomData.isRoomAvailable && roomData.wasRecentlyAvailable || !roomData.wasCleanedToday) {
                    hasToDo = true;
                    break;
                }
            }

            if (hasToDo) {
                document.querySelector('.fa-list-check').classList.add('has-todo');
            }
        }
    } catch (error) {
        console.error('Error checking rooms on page load:', error);
    }
});

document.querySelector('.fa-list-check').addEventListener('click', async function () {
    const toDoListContainer = document.querySelector('.to-do-list-container');
    const roomListElement = document.createElement('ul'); 
    const faListCheckIcon = document.querySelector('.fa-list-check');
    let hasRoomsToCheck = false; 

    try {
        const roomsRef = ref(db, 'rooms/');
        const snapshot = await get(roomsRef);

        // Clear the previous list content
        toDoListContainer.innerHTML = '<span><h3>Rooms to check</h3><button class="close-btn" id="closeBtnToDoList">&times;</button></span>';

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            let roomCount = 0;

            for (const roomId in rooms) {
                const roomData = rooms[roomId];
            
                // Check if the room was recently made available
                if (roomData.isRoomAvailable && roomData.wasRecentlyAvailable || !roomData.wasCleanedToday) {
                    const listItem = document.createElement('li');
                    const checkButton = document.createElement('button');
                    checkButton.classList.add('check-btn');
                    checkButton.setAttribute('data-room-id', roomId);
            
                    // Modify the room label based on roomId
                    let roomLabel;
                    if (roomId === 'eventHall') {
                        roomLabel = 'Event Hall';
                    } else if (roomId === 'stockRoom') {
                        roomLabel = 'Stock Room';
                    } else {
                        roomLabel = `Room ${roomId}`;
                    }
            
                    listItem.innerHTML = `
                        ${roomLabel} 
                        <button class="check-btn" data-room-id="${roomId}">Check</button>
                    `;
                    roomListElement.appendChild(listItem); // Add the room to the list
                    hasRoomsToCheck = true;
                    roomCount++;
                }
            }
            

            // Add the list to the container
            toDoListContainer.appendChild(roomListElement);
            // Display the red circle indicator if there are rooms to check
            if (roomCount > 0) {
                faListCheckIcon.classList.add('has-todo');
            } else {
                faListCheckIcon.classList.remove('has-todo');
            }
        }

        // If no rooms have changed availability, show the message
        if (!hasRoomsToCheck) {
            toDoListContainer.innerHTML += '<p>All rooms recently used have checked.</p>';
            faListCheckIcon.classList.remove('has-todo');
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }

    // Show the to-do list container
    document.querySelector('.to-do-list').style.display = 'flex';

    // Close button functionality
    document.getElementById('closeBtnToDoList').addEventListener('click', function () {
        document.querySelector('.to-do-list').style.display = 'none';
    });
});

document.querySelector('.to-do-list-container').addEventListener('click', async function (event) {
    if (event.target.classList.contains('check-btn')) {
        const roomNumber = event.target.getAttribute('data-room-id');
        // Fetch and update room data when a room is checked
        await updateRoomData(roomNumber);

        // Show the roomChecking container
        document.querySelector('.roomChecking').style.display = 'flex';
    }
});

export async function updateRoomData(roomNumber) {
    
    document.querySelector('.roomChecking').style.display = 'flex';
    if (roomNumber) {
        try {
            const roomRef = ref(db, `rooms/${roomNumber}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();

            if (roomData) {
                let currentPage = 0;
                const pages = {
                    quantity: [],
                    status: [],
                    present: [],
                    summary: []
                };

                // Segregate keys into pages
                for (const key in roomData) {
                    const value = roomData[key];

                    if (key.toLowerCase().includes('quantity')) {
                        pages.quantity.push({ key, value });
                    } else if (key.toLowerCase().includes('status')) {
                        pages.status.push({ key, value });
                    } else if (key.toLowerCase().includes('present')) {
                        pages.present.push({ key, value });
                    }
                }

                function renderPage() {
                    let formHTML = '<div class="roomChecking-header">';
                    const roomDisplayName = roomNumber === 'stockRoom' ? 'Stock Room' :
                                            roomNumber === 'eventHall' ? 'Event Hall' :
                                            `Room ${roomNumber}`;
                    formHTML += `<h3>${roomDisplayName}</h3>`;
                    formHTML += `<div class="close-btn" id="closeBtnRoomChecking">&times;</div>`;
                    const currentSection = currentPage === 0 ? "Equipment Quantity"
                        : currentPage === 1 ? "Equipment Status"
                            : currentPage === 2 ? "Equipment Presence"
                                : "Summary of Changes";
                    formHTML += `</div>`;
                    formHTML += `<p>Room Checking - ${currentSection}</p>`;

                    if (currentPage === 3) {
                        // Summary page
                        formHTML += '<div class="form-summary"><h4>Summary of Changes</h4><ul>';
                        if (pages.summary && pages.summary.length > 0) {
                            pages.summary.forEach(({ key, oldValue, newValue }) => {
                                formHTML += `<li><strong>${key}:</strong> ${oldValue} → ${newValue}</li>`;
                            });
                        } else {
                            formHTML += '<li>No changes made.</li>';
                        }
                        formHTML += '</ul></div>';
                        formHTML += '<div class="form-buttons">';
                        formHTML += '<button type="button" id="previousPage">Previous</button>';
                        formHTML += '<button type="button" id="submitUpdatedValue">Confirm</button>';
                        formHTML += '</div>';
                    } else {
                        // Regular page
                        formHTML += '<form id="roomDataForm" class="room-data-form">';
                        const currentKeySet = Object.keys(pages)[currentPage];
                        pages[currentKeySet].forEach(({ key, value }) => {
                            formHTML += `<div class="form-group"><label for="${key}">${key}</label>`;

                            if (typeof value === 'boolean') {
                                formHTML += `<input type="checkbox" id="${key}" name="${key}" ${value ? 'checked' : ''} />`;
                            } else if (typeof value === 'number') {
                                formHTML += `<input type="number" id="${key}" name="${key}" value="${value}" />`;
                            } else if (typeof value === 'string' && key.toLowerCase().includes('status')) {
                                formHTML += `<select id="${key}" name="${key}">
                                    <option value="All Working" ${value === 'All Working' ? 'selected' : ''}>All Working</option>
                                    <option value="Some are working, some are broken" ${value === 'Some are working, some are broken' ? 'selected' : ''}>Some are working, some are broken</option>
                                    <option value="Need cleaning" ${value === 'Need cleaning' ? 'selected' : ''}>Need cleaning</option>
                                    <option value="Not Working" ${value === 'Not Working' ? 'selected' : ''}>Not Working</option>
                                </select>`;
                            } else {
                                formHTML += `<input type="text" id="${key}" name="${key}" value="${value}" />`;
                            }
                            formHTML += '</div>';
                        });
                        formHTML += '</form>';
                        formHTML += '<div class="form-buttons">';
                        formHTML += '<button type="button" id="nextPage">Next</button>';
                        if (currentPage > 0) {
                            formHTML += '<button type="button" id="previousPage">Previous</button>';
                        }
                        formHTML += '</div>';
                    }

                    document.querySelector('.roomChecking-container').innerHTML = formHTML;

                    // Handle navigation
                    document.getElementById('nextPage')?.addEventListener('click', function () {
                        saveCurrentPageValues();
                        currentPage++;
                        renderPage();
                    });

                    document.getElementById('previousPage')?.addEventListener('click', function () {
                        currentPage--;
                        renderPage();
                    });

                    // Handle form submission on the summary page
                    if (currentPage === 3) {
                        document.getElementById('submitUpdatedValue')?.addEventListener('click', async function () {
                            // Collect updated data and update Firebase
                            saveCurrentPageValues();
                            
                            try {
                                const updates = {};
                                pages.summary.forEach(({ key, newValue }) => {
                                    updates[key] = newValue;
                                });
                    
                                // Set wasRecentlyAvailable to false
                                updates.wasRecentlyAvailable = false;
                                updates.wasCleanedToday = true;
                    
                                // Get the current date and format it as M/D/YYYY, M/DD/YYYY, or MM/DD/YYYY
                                const currentDate = new Date();
                                const formattedDate = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();
                                updates.lastDateChecked = formattedDate;
                    
                                // Get the current time and format it to remove leading zeros in the hour
                                let hours = currentDate.getHours();
                                const minutes = currentDate.getMinutes().toString().padStart(2, '0');
                                const seconds = currentDate.getSeconds().toString().padStart(2, '0');
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format and remove leading zero
                                const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
                                updates.lastTimeChecked = formattedTime;
                    
                                await update(roomRef, updates);
                                alert('Room checked successfully!');
                                document.querySelector('.roomChecking').style.display = 'none';
                                document.querySelector('.to-do-list').style.display = 'none';
                                location.reload();
                            } catch (error) {
                                console.error('Error updating room data:', error);
                            }
                        });
                    }                    

                    // Handle close button
                    document.getElementById('closeBtnRoomChecking').addEventListener('click', function () {
                        document.querySelector('.roomChecking').style.display = 'none';
                    });
                }

                // Save the values from the current page before moving to the next one
                function saveCurrentPageValues() {
                    const currentKeySet = Object.keys(pages)[currentPage];
                    pages[currentKeySet].forEach(({ key, value }) => {
                        const element = document.getElementById(key);

                        if (!element) {
                            return;
                        }

                        let newValue;
                        if (element.type === 'checkbox') {
                            newValue = element.checked;
                        } else if (element.type === 'number') {
                            newValue = parseFloat(element.value);
                        } else if (element.type === 'select-one') {
                            newValue = element.value;
                        } else {
                            newValue = element.value;
                        }

                        // Find the corresponding item in the pages array
                        const pageItem = pages[currentKeySet].find(item => item.key === key);
                        if (pageItem) {
                            const { value: oldValue } = pageItem;
                            if (oldValue !== undefined && oldValue !== newValue) {
                                // Add to summary if the value has changed
                                if (!pages.summary) pages.summary = [];
                                pages.summary.push({
                                    key,
                                    oldValue,
                                    newValue
                                });
                            }
                            pageItem.value = newValue; // Update the current value
                        }
                    });
                }
                renderPage();
            } else {
                document.querySelector('.roomChecking').innerHTML = '<p>No data available for this room.</p>';
            }
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    }
}

// Function to update wasCleanedToday and wasRecentlyAvailable to false for all rooms
async function updateRoomsAt8AM() {
    try {
        const roomsRef = ref(db, 'rooms'); // Use the modular SDK method to reference 'rooms'
        const roomsSnapshot = await get(roomsRef);

        if (roomsSnapshot.exists()) {
            const roomsData = roomsSnapshot.val();
            const updates = {};

            for (const roomId in roomsData) {
                // Check if the room has the keys 'wasCleanedToday'
                if (roomsData[roomId].hasOwnProperty('wasCleanedToday')) {
                    // Set wasCleanedToday
                    updates[`rooms/${roomId}/wasCleanedToday`] = false;
                }
            }

            // Apply the updates to Firebase
            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
            } else {
                console.log('No updates needed');
            }
        } else {
            console.log('No rooms found');
        }
    } catch (error) {
        console.error('Error updating rooms:', error);
    }
}

// Function to calculate the time until 8:00 AM the next day
function getTimeUntilNext8AM() {
    const now = new Date();
    const next8AM = new Date();
    next8AM.setHours(8, 0, 0, 0); // Set time to 8:00 AM
    // If it's already past 8:00 AM, schedule for the next day
    if (now > next8AM) {
        next8AM.setDate(next8AM.getDate() + 1);
    }

    return next8AM.getTime() - now.getTime(); // Time in milliseconds until 8:00 AM
}

// Function to schedule the update at 8:00 AM every day
function scheduleDailyUpdateAt8AM() {
    const timeUntilNext8AM = getTimeUntilNext8AM();

    // Set a timeout to trigger the update at the next 8:00 AM
    setTimeout(() => {
        // Call the update function
        updateRoomsAt8AM();

        // After the first update, set an interval to trigger every 24 hours
        setInterval(updateRoomsAt8AM, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilNext8AM);
}

// Call the scheduling function once when the page loads
scheduleDailyUpdateAt8AM();

// document.getElementById('copyDataButton').addEventListener('click', async function () {
//     const roomsToCopyTo = [4, 6, 8, 9, 10];
//     const roomToCopyFrom = 2;

//     try {
//         // Fetch data from room 1
//         const roomRef = ref(db, `rooms/${roomToCopyFrom}`);
//         const roomSnapshot = await get(roomRef);
        
//         if (roomSnapshot.exists()) {
//             const roomData = roomSnapshot.val();

//             // Copy data to rooms 3, 5, and 7
//             for (const room of roomsToCopyTo) {
//                 const copyRoomRef = ref(db, `rooms/${room}`);
//                 await set(copyRoomRef, roomData);
//             }
//             alert('Data copied successfully to rooms 3, 5, and 7!');
//         } else {
//             alert(`No data found for room ${roomToCopyFrom}`);
//         }
//     } catch (error) {
//         console.error('Error copying room data:', error);
//         alert('Error copying data. Check the console for more details.');
//     }
// });
