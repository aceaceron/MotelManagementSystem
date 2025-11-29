// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

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
const storage = getStorage(app); // Initialize Firebase Storage
const db = getDatabase(app); // Initialize the Realtime Database

// Function to handle file upload and comment saving
async function addComment() {
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const dateTimeInput = document.getElementById('dateTimeInput');
    const fileInput = document.getElementById('fileInput');
    const commentInput = document.getElementById('commentInput');
    const commentsList = document.getElementById('commentsList');

    if (nameInput.value.trim() && dateTimeInput.value.trim() && fileInput.files.length > 0 && commentInput.value.trim()) {
        const file = fileInput.files[0];
        const fileName = `${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, `comments/${fileName}`);
        
        try {
            // Upload the file
            await uploadBytes(fileRef, file);
            
            // Get the file's download URL
            const fileURL = await getDownloadURL(fileRef);
            
            // Prepare comment data
            const commentData = {
                name: nameInput.value,
                email: emailInput.value,
                dateAndTimeOfVisit: new Date(dateTimeInput.value).toISOString(),
                comment: commentInput.value,
                fileURL: fileURL
            };

            // Save comment details to Firebase Realtime Database
            const commentsRef = ref(db, 'comments');
            const newCommentRef = push(commentsRef);

            await set(newCommentRef, commentData);

            console.log('Comment saved successfully');

            // Clear form fields
            nameInput.value = '';
            emailInput.value = '';
            dateTimeInput.value = '';
            fileInput.value = '';
            commentInput.value = '';
        } catch (error) {
            console.error('Detailed Error:', error.message);
            console.error('Error Stack:', error.stack);
            alert('There was an error saving your comment. Please try again.');
        }
        
    } else {
        alert('Please enter all fields.');
    }
}

// Add event listener for the submit button
document.getElementById('submitComment').addEventListener('click', addComment);

// Function to load and display comments
async function loadComments() {
    const commentsRef = ref(db, 'comments');
    const commentsList = document.getElementById('commentsList');

    onValue(commentsRef, async (snapshot) => {
        commentsList.innerHTML = ''; // Clear existing comments
        const promises = [];

        snapshot.forEach((childSnapshot) => {
            const commentData = childSnapshot.val();
            const fileURL = commentData.fileURL;
            const name = commentData.name;
            const dateAndTimeOfVisit = new Date(commentData.dateAndTimeOfVisit).toLocaleString();
            const comment = commentData.comment;

            // Create comment element
            const newComment = document.createElement('div');
            newComment.classList.add('comment');

            const profileIcon = document.createElement('img');
            profileIcon.src = 'img/user.png';
            profileIcon.alt = 'Profile Icon';
            profileIcon.classList.add('profileIcon');

            const commentDetails = document.createElement('div');
            commentDetails.classList.add('comment-details');

            // Mask the name inline
            const maskedName = name.length <= 2 ? name : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];

            const nameElem = document.createElement('div');
            nameElem.classList.add('name');
            nameElem.textContent = maskedName; // Use masked name

            const dateTimeElem = document.createElement('div');
            dateTimeElem.classList.add('date-time');
            dateTimeElem.textContent = dateAndTimeOfVisit;

            const commentText = document.createElement('div');
            commentText.textContent = comment;

            // Create image element
            const image = document.createElement('img');
            image.src = fileURL;
            image.classList.add('comment-image'); // Add class for styling if needed
            image.alt = 'Uploaded Image';

            commentDetails.appendChild(nameElem);
            commentDetails.appendChild(dateTimeElem);
            commentDetails.appendChild(commentText);
            commentDetails.appendChild(image);

            newComment.appendChild(profileIcon);
            newComment.appendChild(commentDetails);

            commentsList.appendChild(newComment);
        });
    }, {
        onlyOnce: false // Make sure the listener keeps running
    });
}

// Load comments when the page is loaded
window.onload = function() {
    loadComments();
};