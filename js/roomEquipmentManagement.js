// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('clearInventoryData').addEventListener('click', function () {
        const inventoryData = document.querySelector('.inventory-data');

        // Clear the inventory data container
        inventoryData.innerHTML = '';

        if (window.innerWidth < 1000) {
            inventoryData.style.display = 'none';
        } else {
            inventoryData.style.display = '';
        }

        document.getElementById('roomSelected').value = '';
        document.getElementById('tableFilter').value = '';

        const roomTableKeySelect = document.getElementById('roomTableKey');
        const updateValue = document.getElementById('updateValue');
        const statusDropdown = document.getElementById('valueForStatusKeyType');
        const booleanDropdown = document.getElementById('valueForBooleanTypeForUpdate');
        const minimumValueInputContainer = document.getElementById('minimumValueInput');

        updateValue.style.display = 'inline';
        statusDropdown.style.display = 'none';
        minimumValueInputContainer.style.display = 'none';
        booleanDropdown.style.display = 'none';

        roomTableKeySelect.innerHTML = '';
        updateValue.innerHTML = '';
        updateValue.placeholder = '';

        roomTableKeySelect.value = '';
        updateValue.value = '';
    });

    document.getElementById('makeAllRoomsToCheck').addEventListener('click', async function () {
        // Show confirmation dialog
        const userConfirmed = confirm('Force all rooms to be check by the employee?');

        if (!userConfirmed) {
            return; // Exit the function if the user cancels
        }

        try {
            // Reference to the rooms collection
            const roomsRef = ref(db, 'rooms');
            const roomsSnapshot = await get(roomsRef);

            if (roomsSnapshot.exists()) {
                const roomsData = roomsSnapshot.val();

                // Iterate through each room and update the 'wasCleanedToday' key
                const updatePromises = Object.keys(roomsData).map(async roomId => {
                    const roomRef = ref(db, `rooms/${roomId}`);
                    const roomSnapshot = await get(roomRef);

                    if (roomSnapshot.exists()) {
                        let roomData = roomSnapshot.val();

                        // Update 'wasCleanedToday' key to false
                        roomData.wasCleanedToday = false;

                        // Write the updated data back to the database
                        await set(roomRef, roomData);
                    }
                });

                // Wait for all update operations to complete
                await Promise.all(updatePromises);

                alert('All rooms are task to be checked.');
            } else {
                alert('No rooms found in the database.');
            }
        } catch (error) {
            console.error('Error updating rooms:', error);
            alert('Error updating rooms. Check the console for more details.');
        }
    });

    // Function to fetch and update inventory data with filtering
    async function updateInventoryData(selectedRoom, filter) {
        document.querySelector('.inventory-data').style.display = 'flex';
        if (selectedRoom) {
            try {
                const roomRef = ref(db, `rooms/${selectedRoom}`);
                const roomSnapshot = await get(roomRef);
                const roomData = roomSnapshot.val();

                if (roomData) {
                    // Fetch all quantityMinimumValues in one go
                    const quantityMinRef = ref(db, `quantityMinimumValues`);
                    const quantityMinSnapshot = await get(quantityMinRef);
                    const quantityMinValues = quantityMinSnapshot.val() || {};

                    let tableHTML = '<table class="data-table">';
                    tableHTML += '<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';

                    const roomTableKeySelect = document.getElementById('roomTableKey');
                    roomTableKeySelect.innerHTML = ''; // Clear previous options
                    
                    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                    const timePattern = /^(1[0-2]|0?[1-9]):[0-5][0-9]:[0-5][0-9] (AM|PM)$/;
    
                    for (const key in roomData) {
                        const value = roomData[key];
                        const minValue = quantityMinValues[key] || null;

                        // Display value with or without icon
                        let displayValue = document.createElement('span');
                        displayValue.textContent = value;

                        let hasExclamationIcon = false;

                        // Check if the status key does not equal 'All Working' or if the value is less than the minimum and add an icon if necessary
                        if (
                            (key.toLowerCase().includes('status') && value !== 'All Working') ||
                            (key.toLowerCase().includes('present') && value !== true) ||
                            (key === 'wasCleanedToday' && value === false) ||
                            (minValue !== null && value < minValue)
                        ) {
                            const icon = document.createElement('i');
                            icon.className = 'fa-solid fa-triangle-exclamation';
                            displayValue.appendChild(icon);
                            hasExclamationIcon = true;
                        }

                        // Apply the filter
                        if (filter === 'quantity' && !key.toLowerCase().includes('quantity')) continue;
                        if (filter === 'status' && !key.toLowerCase().includes('status')) continue;
                        if (filter === 'present' && !key.toLowerCase().includes('present')) continue;
                        if (filter === 'boolean' && typeof value !== 'boolean') continue;
                        if (filter === 'forRepair' && !hasExclamationIcon) continue;
                        if (filter === 'dateAndTime' && !(datePattern.test(value) || timePattern.test(value))) continue;

                        tableHTML += `<tr><td>${key}</td><td>${displayValue.outerHTML}</td></tr>`;

                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = key;
                        option.dataset.value = value !== undefined ? value : null;
                        roomTableKeySelect.appendChild(option);
                    }

                    tableHTML += '</tbody></table>';
                    document.querySelector('.inventory-data').innerHTML = tableHTML;

                    const updateInput = document.querySelector('.inventory-update input[type="text"]');
                    const statusDropdown = document.getElementById('valueForStatusKeyType');
                    const booleanDropdown = document.getElementById('valueForBooleanTypeForUpdate');
                    const minimumValueInputContainer = document.getElementById('minimumValueInput');
                    const updateMinimumValue = document.getElementById('update-minimumValue');

                    const firstOption = roomTableKeySelect.options[0];

                    if (firstOption) {
                        const key = firstOption.value.toLowerCase();
                        const selectedValue = firstOption.dataset.value;

                        let isBoolean = false;
                        if (selectedValue === 'true' || selectedValue === 'false') {
                            isBoolean = true;
                        }

                        // Automatically toggle input fields based on the filter
                        if (filter === 'status' || key.includes('status')) {
                            updateInput.style.display = 'none';
                            statusDropdown.style.display = 'inline';
                            minimumValueInputContainer.style.display = 'none';
                            booleanDropdown.style.display = 'none';
                            statusDropdown.value = selectedValue || null;
                        } else if (filter === 'quantity' || key.includes('quantity')) {
                            minimumValueInputContainer.style.display = 'flex';
                            statusDropdown.style.display = 'none';
                            updateInput.style.display = 'flex';
                            booleanDropdown.style.display = 'none';

                            const quantityMinimumValue = quantityMinValues[firstOption.value];
                            updateMinimumValue.placeholder = `Minimum value: ${quantityMinimumValue}` || "Enter Minimum Value";
                        } else if (
                            isBoolean ||
                            filter === 'present' ||
                            filter === 'boolean' ||
                            key.includes('present')
                        ) {
                            updateInput.style.display = 'none';
                            statusDropdown.style.display = 'none';
                            minimumValueInputContainer.style.display = 'none';
                            booleanDropdown.style.display = 'flex';
                            booleanDropdown.value = selectedValue || null;
                        } else {
                            updateInput.style.display = 'inline';
                            statusDropdown.style.display = 'none';
                            minimumValueInputContainer.style.display = 'none';
                            booleanDropdown.style.display = 'none';
                        }
                        updateInput.placeholder = `Current value: ${selectedValue}` || "Select a value";
                        updateInput.value = '';
                    } else {
                        // Handle the case where there are no options available
                        updateInput.style.display = 'inline';
                        statusDropdown.style.display = 'none';
                        booleanDropdown.style.display = 'none';
                        minimumValueInputContainer.style.display = 'none';
                        updateInput.placeholder = "No options available";
                        updateInput.value = '';
                    }
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            }
        }
    }

    // Initial room selection event listener
    document.getElementById('roomSelected').addEventListener('change', function () {
        const selectedRoom = this.value;
        const selectedKey = document.getElementById('roomTableKey').value;

        const inventoryManagement = document.querySelector('.inventory-management');

        // Handle the case when "All" is selected
        if (selectedRoom === 'all') {
            displayCombinedRoomData();
            document.getElementById('tableFilter').disabled = true;
            inventoryManagement.classList.add('disabled');
        } else {
            // Handle the case for specific rooms
            const filter = document.getElementById('tableFilter').value;
            updateInventoryData(selectedRoom, filter);
            document.getElementById('tableFilter').disabled = false;
            inventoryManagement.classList.remove('disabled');
        }

        updateStyles(selectedKey);
    });

    async function displayCombinedRoomData() {
        try {
            const roomNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'eventHall', 'stockRoom'];
            let combinedData = {};

            const fetchPromises = roomNumbers.map(async (roomNumber) => {
                const roomRef = ref(db, `rooms/${roomNumber === 'eventHall' ? 'eventHall'
                    : roomNumber === 'stockRoom' ? 'stockRoom'
                        : roomNumber}`);
                const roomSnapshot = await get(roomRef);
                return roomSnapshot.val();
            });

            const allRoomsData = await Promise.all(fetchPromises);

            allRoomsData.forEach(roomData => {
                if (roomData) {
                    Object.keys(roomData).forEach(key => {
                        if (key.toLowerCase().includes('quantity') && typeof roomData[key] === 'number') {
                            if (!combinedData[key]) {
                                combinedData[key] = 0;
                            }
                            combinedData[key] += roomData[key];
                        }
                    });
                }
            });

            displayData(combinedData);
        } catch (error) {
            console.error('Error fetching and combining room data:', error);
            alert('An error occurred while fetching and combining data.');
        }
    }

    function displayData(data) {
        const outputElement = document.querySelector('.inventory-data');
        outputElement.innerHTML = '';

        let tableHTML = '<table class="data-table">';
        tableHTML += '<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';

        for (const [key, value] of Object.entries(data)) {
            tableHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }

        tableHTML += '</tbody></table>';
        outputElement.innerHTML = tableHTML;
    }

    // Filter event listener
    document.getElementById('tableFilter').addEventListener('change', function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const selectedKey = document.getElementById('roomTableKey').value;
        const filter = this.value;
        updateInventoryData(selectedRoom, filter);
        updateStyles(selectedKey);
    });

    // Update button functionality
    document.getElementById('updateButton').addEventListener('click', async function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const selectedKey = document.getElementById('roomTableKey').value;
        const filter = document.getElementById('tableFilter').value;

        let newValueRaw;
        let minimumValueRaw;

        if (selectedKey.toLowerCase().includes('status')) {
            // Use the value from the status dropdown
            newValueRaw = document.getElementById('valueForStatusKeyType').value;
        } else if (selectedKey.toLowerCase().includes('present')) {
            newValueRaw = document.getElementById('valueForBooleanTypeForUpdate').value;
            newValueRaw = newValueRaw === 'true';
        } else {
            // Use the value from the input field
            newValueRaw = document.querySelector('.inventory-update input[type="text"]').value;
        }

        // Check if the key contains "quantity" and get the minimum value if needed
        if (selectedKey.toLowerCase().includes('quantity')) {
            minimumValueRaw = document.getElementById('update-minimumValue').value;
        }

        if (selectedRoom && selectedKey && newValueRaw !== undefined && newValueRaw !== null) {
            try {
                const keyRef = ref(db, `rooms/${selectedRoom}/${selectedKey}`);
                const keySnapshot = await get(keyRef);
                const currentValue = keySnapshot.val();

                // Determine the type of the existing value
                const currentType = typeof currentValue;

                // Convert the new value to match the current type
                let newValue;

                switch (currentType) {
                    case 'number':
                        newValue = parseFloat(newValueRaw);
                        if (isNaN(newValue)) {
                            alert('Please enter a valid number.');
                            clearInputFields();
                            return;
                        }
                        break;
                    case 'boolean':
                        newValueRaw = document.getElementById('valueForBooleanTypeForUpdate').value;
                        newValue = newValueRaw === 'true';
                        break;
                    case 'string':
                        if (selectedKey.toLowerCase().includes('date')) {
                            // Validate M/D/YYYY or MM/DD/YYYY format for date
                            const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                            
                            if (datePattern.test(newValueRaw)) {
                                // Remove leading zeros from month and day
                                newValue = newValueRaw.replace(/(^|\/)0+/g, '$1');
                            } else {
                                alert('Please enter a valid date in the format MM/DD/YYYY.');
                                clearInputFields();
                                return;
                            }
                        } else if (selectedKey.toLowerCase().includes('time')) {
                            // Validate HH:MM AM/PM format for time
                            const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])\s?(AM|PM)$/i;
                            if (timePattern.test(newValueRaw)) {
                                // Parse the input time
                                let [time, period] = newValueRaw.split(/\s+/);
                                let [hour, minute] = time.split(':');

                                // Combine with seconds and period
                                newValue = `${hour}:${minute}:00 ${period.toUpperCase()}`;
                                newValue = newValue.replace(/^0/, '');
                            } else {
                                alert('Please enter a valid time in the format HH:MM:SS AM/PM.');
                                clearInputFields();
                                return;
                            }
                        } else {
                            newValue = newValueRaw;
                        }
                        break;
                    default:
                        console.error('Unsupported data type:', currentType);
                        clearInputFields();
                        return;
                }

                // Update in Firebase
                const userConfirmed = confirm(`Are you sure you want to update the value for ${selectedKey}?`);
                if (userConfirmed) {
                    await set(keyRef, newValue);

                    // If it's a quantity key, also update minimum value in a separate path
                    if (selectedKey.toLowerCase().includes('quantity') && minimumValueRaw !== '' && !isNaN(minimumValueRaw)) {
                        const minimumValueRef = ref(db, `quantityMinimumValues/${selectedKey}`);
                        await set(minimumValueRef, parseInt(minimumValueRaw));
                    }

                    alert('Value updated successfully');
                    updateInventoryData(selectedRoom, filter);
                    updateRoomSelectionOptions();
                    clearInputFields();
                }
            } catch (error) {
                console.error('Error updating key:', error);
            }
        } else {
            alert('Please select a room, a key, and provide a value.');
        }
    });

    // Handle the change event on the roomTableKey select element
    document.getElementById('roomTableKey').addEventListener('change', async function () {
        const selectedKey = this.value;
        const selectedValue = this.options[this.selectedIndex].dataset.value;
        const selectedRoom = document.getElementById('roomSelected').value;


        const updateInput = document.querySelector('.inventory-update input[type="text"]');
        const minimumValueInputContainer = document.getElementById('minimumValueInput');
        const booleanDropdown = document.getElementById('valueForBooleanTypeForUpdate');
        const statusDropdown = document.getElementById('valueForStatusKeyType');
        const minimumValueInput = document.getElementById('update-minimumValue');

        try {
            // Fetch the current value for the selected key
            const keyRef = ref(db, `rooms/${selectedRoom}/${selectedKey}`);
            const keySnapshot = await get(keyRef);
            const currentValue = keySnapshot.val();

            // Determine the type of the current value
            const currentType = typeof currentValue;

            // Fetch the minimum value for quantities from Firebase
            const quantityMinimumRef = ref(db, `quantityMinimumValues/${selectedKey}`);
            const quantityMinimumSnapshot = await get(quantityMinimumRef);
            const quantityMinimumValue = quantityMinimumSnapshot.val();

            if (selectedKey.toLowerCase().includes('status')) {
                updateInput.style.display = 'none';
                statusDropdown.style.display = 'flex';
                booleanDropdown.style.display = 'none';
                minimumValueInputContainer.style.display = 'none';
            } else if (currentType === 'boolean') {
                updateInput.style.display = 'none';
                booleanDropdown.style.display = 'flex';
                statusDropdown.style.display = 'none';
                minimumValueInputContainer.style.display = 'none';
            } else if (selectedKey.toLowerCase().includes('quantity')) {
                updateInput.style.display = 'flex';
                statusDropdown.style.display = 'none';
                booleanDropdown.style.display = 'none';
                minimumValueInputContainer.style.display = 'flex';

                minimumValueInput.placeholder = `Minimum value: ${quantityMinimumValue}` || "Enter Minimum Value";
                updateInput.placeholder = `Current value: ${selectedValue}` || "Select a value";
                updateInput.value = "";

                if (quantityMinimumSnapshot.exists()) {
                    const minimumValue = quantityMinimumSnapshot.val();
                    minimumValueInput.placeholder = `Minimum value: ${minimumValue}` || "Enter Minimum Value";
                } else {
                    minimumValueInput.placeholder = "Enter Minimum Value";
                }
            } else {
                updateInput.style.display = 'inline';
                statusDropdown.style.display = 'none';
                booleanDropdown.style.display = 'none';
                minimumValueInputContainer.style.display = 'none';

                updateInput.placeholder = selectedValue;
                updateInput.value = "";
            }
        } catch (error) {
            console.error('Error fetching minimum value or current value:', error);
            minimumValueInput.placeholder = "Enter Minimum Value";
        }

        // Adjust styling for different conditions
        updateStyles(this.value);
    });

    // Utility function to clear input fields
    function clearInputFields() {
        document.querySelector('.inventory-update input[type="text"]').value = '';
        document.querySelector('.inventory-update input[type="text"]').value = '';
        document.getElementById('valueForStatusKeyType').value = 'All Working';
        document.getElementById('update-minimumValue').value = '';
    }

    document.getElementById('addButton').addEventListener('click', async function () {
        const valueDataTypeSelect = document.getElementById('valueDataType');
        const selectedRoom = document.getElementById('roomSelected').value;
        const addKeyInput = document.getElementById('inventory-addKey');
        let addKey = addKeyInput.value;
        let addValueRaw = document.getElementById('inventory-addValue').value;
        const statusDropdown = document.getElementById('valueForStatusKeyTypeForAdd');
        const booleanDropdown = document.getElementById('valueForBooleanTypeForAdd');
        const filter = document.getElementById('tableFilter').value;
        const selectedType = valueDataTypeSelect.value;

        let minimumValue;

        addKey = addKey.replace(/\s+/g, ' ').toLowerCase();

        addKey = addKey.replace(/\b\w/g, (match) => match.toUpperCase()).replace(/\s+/g, '');
        addKey = addKey.charAt(0).toLowerCase() + addKey.slice(1)

        // Append the appropriate suffix based on selectedType
        if (selectedType === 'equipmentQuantity') {
            addKey = addKey + 'Quantity';
        } else if (selectedType === 'equipmentStatus') {
            addKey = addKey + 'Status';
            addValueRaw = statusDropdown.value;
        } else if (selectedType === 'equipmentPresence') {
            addKey = 'is' + addKey.charAt(0).toUpperCase() + addKey.slice(1) + 'Present';
            addValueRaw = booleanDropdown.value === 'true';
        } else if (selectedType === 'True or False') {
            addValueRaw = booleanDropdown.value === 'true';
        }

        if (selectedRoom !== "" && addKey && addKey !== "Quantity" && addKey !== "Status" && addKey !== "isPresent" && addValueRaw && selectedType) {
            try {
                const roomRef = ref(db, `rooms/${selectedRoom}/${addKey}`);
                const minimumValueRef = ref(db, `quantityMinimumValues/${addKey}`);
                const keySnapshot = await get(roomRef);
                const existingValue = keySnapshot.val();
                let addValue;

                if (existingValue !== null) {
                    alert("Key already in the database!");
                    addKeyInput.value = '';
                    document.getElementById('inventory-addValue').value = '';
                    document.getElementById('add-minimumValue').value = '';
                    return;
                } else {
                    switch (selectedType) {
                        case 'equipmentQuantity':
                            addValue = parseInt(addValueRaw);                            
                            minimumValue = parseInt(document.getElementById('add-minimumValue').value);

                            minimumValue = minimumValue ? parseInt(minimumValue) : null;
                        
                            if (isNaN(addValue)) {
                                alert('Please enter a valid numeric value for quantity.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            if (minimumValue && isNaN(minimumValue)) {
                                alert('Please enter a valid numeric value for minimum value.');
                                document.getElementById('add-minimumValue').value = '';
                                return;
                            }
                            break;
                        case 'equipmentStatus':
                            addValue = statusDropdown.value;
                            break;
                        case 'equipmentPresence':
                            addValue = booleanDropdown.value === 'true';
                            break;
                        case 'Number':
                            addValue = parseFloat(addValueRaw);
                            if (isNaN(addValue)) {
                                alert('Please enter a valid number.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'Boolean':
                            addValue = booleanDropdown.value === 'true';
                            break;
                        case 'Date':
                            const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                            
                            if (datePattern.test(addValueRaw)) {
                                addValue = addValueRaw.replace(/(^|\/)0+/g, '$1');
                            } else {
                                alert('Please enter a valid date in the format MM/DD/YYYY.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'Time':
                            const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?\s?(AM|PM)$/i;
                            if (timePattern.test(addValueRaw)) {
                                let [time, period] = addValueRaw.split(/\s+/);
                                let [hours, minutes, seconds] = time.split(':');
                                if (seconds === undefined) {
                                    seconds = '00';
                                }
                                period = period.toUpperCase();
                                addValue = `${hours}:${minutes}:${seconds} ${period}`;
                                addValue = addValue.replace(/^0/, '');
                            } else {
                                alert('Please enter a valid time in the format HH:MM:SS AM/PM.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'String':
                        default:
                            addValue = addValueRaw;
                            break;
                    }
                }

                const userConfirmed = confirm(`Are you sure you want to add Key: ${addKey}, Value: ${JSON.stringify(addValue)}?`);

                if (userConfirmed) {
                    if (selectedType === 'equipmentQuantity') {
                        await set(roomRef, addValue);
                        if (minimumValue !== null && minimumValue !== undefined) {
                            await set(minimumValueRef, minimumValue); 
                        }
                    } else {
                        await set(roomRef, addValue);
                    }

                    updateInventoryData(selectedRoom, filter);
                    alert('Key and value added successfully');
                    addKeyInput.value = '';
                    document.getElementById('inventory-addValue').value = '';
                    document.getElementById('add-minimumValue').value = '';
                    updateRoomSelectionOptions();
                }
            } catch (error) {
                console.error('Error adding key:', error);
            }
        } else {
            alert('Please provide a room, key, and value.');
            addKeyInput.value = '';
            document.getElementById('inventory-addValue').value = '';
            document.getElementById('add-minimumValue').value = '';
        }
    });

    document.getElementById('infoButton').addEventListener('click', function () {
        alert('The Minimum Value is used to specify a minimum quantity for certain equipment. If the equipment quantity falls below this value, a notification or minimum can be triggered.');
    });

    document.getElementById('deleteButton').addEventListener('click', async function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const selectedKey = document.getElementById('roomTableKey').value;
        const filter = document.getElementById('tableFilter').value;

        if (selectedRoom && selectedKey) {
            try {
                const keyRef = ref(db, `rooms/${selectedRoom}/${selectedKey}`);
                const userConfirmed = confirm(`Are you sure you want to delete Key: ${selectedKey}?`);
                if (userConfirmed) {
                    await remove(keyRef);
                    if (selectedKey.toLowerCase().includes('quantity')) {
                        const minimumValueRef = ref(db, `quantityMinimumValues/${selectedKey}`);
                        await remove(minimumValueRef);
                    }
                    console.log('Key removed successfully');
                    updateInventoryData(selectedRoom, filter);
                    // Clear the input field after update
                    document.querySelector('.inventory-update input[type="text"]').value = '';
                    updateRoomSelectionOptions();
                }
            } catch (error) {
                console.error('Error removing key:', error);
            }
        } else {
            console.log('Please select a room and a key.');
        }
    });

    // Update placeholder based on selected data type
    document.getElementById('valueDataType').addEventListener('change', function () {
        const selectedType = this.value;
        const minimumValueInput = document.getElementById('minimumValueInputAdd');
        const addValue = document.getElementById('inventory-addValue');
        const infoButton = document.getElementById('infoButton');
        const addKeyInput = document.getElementById('inventory-addKey');

        const presencePrefix = document.getElementById('presence-prefix');
        const quantitySuffix = document.getElementById('quantity-suffix');
        const statusSuffix = document.getElementById('status-suffix');
        const presenceSuffix = document.getElementById('presence-suffix');


        presencePrefix.style.display = 'none';
        quantitySuffix.style.display = 'none';
        statusSuffix.style.display = 'none';
        presenceSuffix.style.display = 'none';

        if (selectedType === 'equipmentQuantity') {
            addKeyInput.value = '';
            quantitySuffix.style.display = 'inline';
            presencePrefix.style.display = 'none';
            statusSuffix.style.display = 'none';
            presenceSuffix.style.display = 'none';
            addKeyInput.placeholder = 'Enter equipment name';
        } else if (selectedType === 'equipmentStatus') {
            addKeyInput.value = '';
            statusSuffix.style.display = 'inline';
            presencePrefix.style.display = 'none';
            quantitySuffix.style.display = 'none';
            presenceSuffix.style.display = 'none';
            addKeyInput.placeholder = 'Enter equipment name';
        } else if (selectedType === 'equipmentPresence') {
            addKeyInput.value = '';
            presencePrefix.style.display = 'inline';
            presenceSuffix.style.display = 'inline';
            quantitySuffix.style.display = 'none';
            statusSuffix.style.display = 'none';
            addKeyInput.placeholder = 'Enter equipment name';
        }
        else {
            presencePrefix.style.display = 'none';
            quantitySuffix.style.display = 'none';
            statusSuffix.style.display = 'none';
            presenceSuffix.style.display = 'none';
            addKeyInput.placeholder = 'Key';
        }

        // Reset the input field value and placeholder
        addValue.value = "";
        if (selectedType === 'Date') {
            addValue.placeholder = 'MM/DD/YYYY';
        } else if (selectedType === 'Time') {
            addValue.placeholder = 'HH:MM:SS AM/PM';
        } else {
            addValue.placeholder = 'Value';
        }

        // Show or hide the additional input field based on the selected type
        if (selectedType === 'equipmentQuantity') {
            document.querySelector(".input-wrapper").style.width = '95%';
            minimumValueInput.style.display = 'flex';
            addValue.style.width = '50%';
            minimumValueInput.style.width = '40%';
            infoButton.style.width = '10%'
            if (window.innerWidth < 1000) {
                // Adjust styles for smaller screens
                addValue.style.width = '90%'; // Adjusted width for smaller screens
                minimumValueInput.style.width = '100%';
                document.querySelector(".input-wrapper").style.width = '100%';
            } else {
                // Styles for screens wider than 1000px
                addValue.style.width = '90%';
                minimumValueInput.style.width = '100%';
                infoButton.style.width = '10%';
            }
        } else {
            minimumValueInput.style.display = 'none';
            document.querySelector(".input-wrapper").style.width = '100%';
            addValue.style.width = '90%'; // Reset width to default
        }

        // Handle the equipmentStatus specific dropdown visibility
        const valueForStatusDropdown = document.getElementById('valueForStatusKeyTypeForAdd');
        const valueForBooleanDropdown = document.getElementById('valueForBooleanTypeForAdd');

        if (selectedType === 'equipmentStatus') {
            valueForStatusDropdown.style.display = 'inline';
            valueForBooleanDropdown.style.display = 'none';
            addValue.style.display = 'none';
        } else if (selectedType === 'equipmentPresence' || selectedType === 'True or False') {
            valueForBooleanDropdown.style.display = 'inline';
            valueForStatusDropdown.style.display = 'none';
            addValue.style.display = 'none';
        } else {
            valueForStatusDropdown.style.display = 'none';
            valueForBooleanDropdown.style.display = 'none';
            addValue.style.display = 'inline';
        }
    });

    async function updateRoomSelectionOptions() {
        try {
            const roomNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'eventHall', 'stockRoom'];
            const roomSelected = document.getElementById('roomSelected');

            // Fetch all rooms data in one go
            const roomsRef = ref(db, `rooms`);
            const roomsSnapshot = await get(roomsRef);
            const roomsData = roomsSnapshot.val() || {};

            // Fetch all quantity minimum values in one go
            const quantityMinRef = ref(db, `quantityMinimumValues`);
            const quantityMinSnapshot = await get(quantityMinRef);
            const quantityMinValues = quantityMinSnapshot.val() || {};

            for (const roomNumber of roomNumbers) {
                const roomData = roomsData[
                    roomNumber === 'eventHall' ? 'eventHall'
                        : roomNumber === 'stockRoom' ? 'stockRoom'
                            : roomNumber
                ];

                if (roomData) {
                    let roomStatusAlert = false;

                    for (const key in roomData) {
                        const minValue = quantityMinValues[key] || null;

                        // Check if the value is less than the minimum and set roomStatusAlert if necessary
                        if (
                            (key.toLowerCase().includes('status') && roomData[key] !== 'All Working') ||
                            (key.toLowerCase().includes('present') && roomData[key] !== true) ||
                            (key === 'wasCleanedToday' && roomData[key] === false) ||
                            (minValue !== null && roomData[key] < minValue)
                        ) {
                            roomStatusAlert = true;
                            break;
                        }
                    }

                    // Update the option text with the warning icon if needed
                    const option = roomSelected.querySelector(`option[value="${roomNumber}"]`);

                    if (option) {
                        if (roomNumber === 'eventHall') {
                            option.textContent = roomStatusAlert ? 'Event Hall ⚠️' : 'Event Hall';
                        } else if (roomNumber === 'stockRoom') {
                            option.textContent = roomStatusAlert ? 'Stock Room ⚠️' : 'Stock Room';
                        } else {
                            option.textContent = roomStatusAlert ? `Room ${roomNumber} ⚠️` : `Room ${roomNumber}`;
                        }
                    }

                }
            }
        } catch (error) {
            console.error('Error updating room selection options:', error);
        }
    }

    function updateStyles(selectedKey) {
        const updateInput = document.querySelector('.inventory-update input[type="text"]');
        const minimumValueInputContainer = document.getElementById('minimumValueInput');

        if (selectedKey.toLowerCase().includes('quantity')) {
            minimumValueInputContainer.style.display = 'flex';
            updateInput.style.width = '100%';
            minimumValueInputContainer.style.width = '100%';

            if (window.innerWidth < 1000) {
                updateInput.style.width = '90%';
                minimumValueInputContainer.style.width = '100%';
            }
        } else {
            minimumValueInputContainer.style.display = 'none';
            updateInput.style.width = '90%';
        }
    }
    // Call the function to update room selection options
    updateRoomSelectionOptions();
    document.getElementById('presence-prefix').style.display = 'none';
    document.getElementById('quantity-suffix').style.display = 'none';
    document.getElementById('status-suffix').style.display = 'none';
    document.getElementById('presence-suffix').style.display = 'none';

});
