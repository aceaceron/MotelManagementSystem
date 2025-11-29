// Section 1: Intersection Observer for Scroll Animations
// Function to handle visibility of elements as they come into view
function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Add the 'visible' class when the element is in view
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);  // Optional: Stop observing after the element is visible
        }
    });
}

// Script to handle closing the disclaimer
document.addEventListener('DOMContentLoaded', function() {
    const disclaimerPopup = document.getElementById('ai-disclaimer-popup');
    const closeButton = document.querySelector('#ai-disclaimer-popup .confirm-understand');

    if (closeButton && disclaimerPopup) {
        closeButton.addEventListener('click', function() {
            disclaimerPopup.style.display = 'none';
        });
    }
});

// Intersection Observer options to trigger when 10% of the element is visible
const observerOptions = { threshold: 0.1 };
// Create a new IntersectionObserver with the handleIntersection callback
const observer = new IntersectionObserver(handleIntersection, observerOptions);

// Wait for the DOM to fully load before executing scripts
document.addEventListener('DOMContentLoaded', () => {
    // Select all elements that need scroll animations
    const elements = document.querySelectorAll('.info, .backgroundphoto, .content, .container3-content, .comment-box, .comments-list, .container3 .container3-content .gallery-item img, .container5, .container6');
    // Attach the observer to each selected element
    elements.forEach(element => observer.observe(element));

    // Smooth scrolling for anchor links (e.g., links with href="#section-id")
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault(); // Prevent default anchor behavior
            const targetId = anchor.getAttribute('href').substring(1); // Extract the ID from the href attribute
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                // Smooth scroll to the target element
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Section 2: Terms and Conditions Popup
// Handle display of the Terms and Conditions popup
const popup = document.getElementById('terms-popup'); // Popup element
const tac = document.querySelector('.tac'); // Link/button that triggers the popup
const closeBtn = document.querySelector('.close-btn'); // Close button for the popup

// Hide the popup when the close button is clicked
closeBtn.addEventListener('click', () => {
    popup.style.display = 'none'; // Hide the popup
});

// Close the popup when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup.style.display = 'none'; // Hide the popup
    }
});

// Section 3: Event Rental Reservation Popup
// Handle display of the Event Rental popup
const popup2 = document.getElementById('event-popup'); // Popup element for event rentals
const eventtac = document.querySelector('.eventtac'); // Link/button that triggers the popup
const closeBtn2 = document.querySelector('.close-btn2'); // Close button for the popup

// Show the popup when the link/button is clicked
eventtac.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default anchor behavior
    popup2.style.display = 'block'; // Display the popup
});

// Hide the popup when the close button is clicked
closeBtn2.addEventListener('click', () => {
    popup2.style.display = 'none'; // Hide the popup
});

// Close the popup when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === popup2) {
        popup2.style.display = 'none'; // Hide the popup
    }
});

// Section 4: Dropdown Menu Functionality
// Handle toggle for the dropdown menu
document.querySelector('.menu-button').addEventListener('click', function () {
    this.classList.toggle('active'); // Toggle the active state of the menu button

    const dropdownMenu = document.querySelector('.dropdown-nav');
    // Show or hide the dropdown menu
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});

// Hide the dropdown menu when a link inside it is clicked
document.querySelectorAll('.dropdown-nav a').forEach(link => {
    link.addEventListener('click', function () {
        document.querySelector('.dropdown-nav').style.display = 'none'; // Hide the dropdown menu
        document.querySelector('.menu-button').classList.remove('active'); // Remove active state from menu button
    });
});


function closeReservationModal() {
    const postPaymentModal = document.querySelector(".postPaymentModal");
    if (postPaymentModal) {
        postPaymentModal.style.display = "none";
    }
}

// Add an event listener to the close button
const closeReservationModalBtn = document.getElementById("closeReservationModal");
if (closeReservationModalBtn) {
    closeReservationModalBtn.addEventListener("click", closeReservationModal);
}

document.addEventListener("DOMContentLoaded", () => {
    const searchContainer = document.querySelector(".search-container");
    const searchBar = document.querySelector("#searchBar");
    const reservationQueryContainer = document.querySelector("#reservationQueryContainer");

    // Function to check screen width and adjust styles
    function adjustStylesOnFocus() {
        if (window.innerWidth < 1000) {
            searchContainer.style.backgroundColor = "transparent"; // Transparent background for smaller screens
        } else {
            searchContainer.style.backgroundColor = "#f9f9f9"; // Default background for larger screens
        }
    }

    // Function to adjust placeholder based on screen width
    function adjustPlaceholder() {
        if (window.innerWidth < 1000) {
            searchBar.placeholder = "Enter Reservation ID if have one...";
        } else {
            searchBar.placeholder = "Already have reservation? Enter your Reservation ID here";
        }
    }

    // Adjust placeholder on page load
    adjustPlaceholder();

    // Show dropdown on focus
    searchBar.addEventListener("focus", () => {
        reservationQueryContainer.classList.add("active");
        searchContainer.style.borderColor = "#007bff"; 
        adjustStylesOnFocus();
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (!searchContainer.contains(event.target)) {
            reservationQueryContainer.classList.remove("active");
            searchContainer.style.borderColor = "#ccc";
            searchContainer.style.backgroundColor =
                window.innerWidth < 1000 ? "transparent" : "lightgreen";
        }
    });

    // Reapply styles and placeholder on window resize
    window.addEventListener("resize", () => {
        adjustPlaceholder(); // Adjust the placeholder dynamically
        if (!reservationQueryContainer.classList.contains("active")) {
            searchContainer.style.backgroundColor =
                window.innerWidth < 1000 ? "transparent" : "#f9f9f9";
        }
    });
});


