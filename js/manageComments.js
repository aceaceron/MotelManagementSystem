// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Function to display comments
export function displayComments() {
    const commentsRef = ref(db, 'comments');
    const commentsContainer = document.querySelector('.comments-container');

    // Clear existing comments
    commentsContainer.innerHTML = '';

    // Add a heading for comments
    const heading = document.createElement('h1');
    heading.textContent = 'Comments';
    commentsContainer.appendChild(heading);

    // Fetch comments from Firebase Realtime Database
    onValue(commentsRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const commentData = childSnapshot.val();
            const fileURL = commentData.fileURL || ''; // Default to empty string if fileURL is missing
            const name = commentData.name || 'Anonymous'; // Default to 'Anonymous' if name is missing
            const email = commentData.email || 'N/A'; // Default to 'N/A' if email is missing
            const dateAndTimeOfVisit = new Date(commentData.dateAndTimeOfVisit).toLocaleString();
            const comment = commentData.comment || 'No comment'; // Default to 'No comment' if comment is missing

            // Create comment card element
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';

            // Create comment info container
            const commentInfo = document.createElement('div');
            commentInfo.className = 'comment-info';

            // Add comment details
            const nameElem = document.createElement('div');
            nameElem.className = 'name';
            nameElem.textContent = `Name: ${name}`;

            const emailElem = document.createElement('div');
            emailElem.className = 'email';
            emailElem.textContent = `Email: ${email}`;

            const dateTimeElem = document.createElement('div');
            dateTimeElem.className = 'date-time';
            dateTimeElem.textContent = `Date & Time: ${dateAndTimeOfVisit}`;

            const commentText = document.createElement('div');
            commentText.className = 'comment';
            commentText.textContent = `Comment: ${comment}`;

            // Add photo link if available
            if (fileURL) {
                const photoLink = document.createElement('a');
                photoLink.href = fileURL;
                photoLink.target = '_blank'; // Open in a new tab
                photoLink.textContent = 'View Photo';
                commentInfo.appendChild(photoLink);
            }

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'comments-delete-button';
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                const confirmDelete = confirm('Are you sure you want to delete this comment?');
                if (confirmDelete) {
                    remove(childSnapshot.ref) // Remove the specific comment
                        .then(() => {
                            alert('Comment deleted successfully.');
                        })
                        .catch((error) => {
                            alert('Failed to delete comment: ' + error.message);
                        });
                }
            });

            // Append elements to the comment card
            commentInfo.appendChild(nameElem);
            commentInfo.appendChild(emailElem);
            commentInfo.appendChild(dateTimeElem);
            commentInfo.appendChild(commentText);

            commentCard.appendChild(commentInfo);
            commentCard.appendChild(deleteButton);

            // Append comment card to the comments container
            commentsContainer.appendChild(commentCard);
        });
    });
}