import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Your web app's Firebase configuration
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
const auth = getAuth();
const database = getDatabase();

// Create Account
document.getElementById('createAccount').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const workAccountLastName = document.getElementById('workAccountLastName').value;
    const workAccountFirstName = document.getElementById('workAccountFirstName').value;
    const workAccountAddressPurok = document.getElementById('workAccountAddressPurok').value;
    const workAccountAddressBrgy = document.getElementById('workAccountAddressBrgy').value;
    const workAccountAddressMunicipality = document.getElementById('workAccountAddressMunicipality').value;
    const workAccountAddressProvince = document.getElementById('workAccountAddressProvince').value;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const accountType = document.getElementById('accountType').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const sanitizedEmail = email.replace('.', ','); // Replace '.' with ',' in email to use as key

            // Save the account type in the database
            set(ref(database, 'workAccounts/' + sanitizedEmail), {
                lastName : workAccountLastName,
                firstName : workAccountFirstName,
                addressPurok : workAccountAddressPurok,
                addressBrgy : workAccountAddressBrgy,
                addressMunicipality : workAccountAddressMunicipality,
                addressProvince : workAccountAddressProvince,
                email: email,
                password: password,
                accountType: accountType
            });

            alert(`${accountType} account created!`);

            // Clear form inputs
            document.getElementById('workAccountLastName').value = '';
            document.getElementById('workAccountFirstName').value = '';
            document.getElementById('workAccountAddressPurok').value = '';
            document.getElementById('workAccountAddressBrgy').value = '';
            document.getElementById('workAccountAddressMunicipality').value = '';
            document.getElementById('workAccountAddressProvince').value = '';
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('accountType').value = 'Employee';

            // Refresh the list of accounts
            displayAccounts();
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Display Accounts
function displayAccounts() {
    const accountsRef = ref(database, 'workAccounts');

    onValue(accountsRef, (snapshot) => {
        const accountsContainer = document.querySelector('.displayAccounts');
        accountsContainer.innerHTML = ''; // Clear any existing content
        
        const heading = document.createElement('h1');
        heading.textContent = 'Active work accounts';
        accountsContainer.appendChild(heading);

        // Loop through each account and display it
        snapshot.forEach((childSnapshot) => {
            const emailKey = childSnapshot.key.replace(',', '.'); // Convert the sanitized email back to normal
            const accountData = childSnapshot.val();
            const accountType = accountData.accountType;
            

            const accountCard = document.createElement('div');
            const accountInfo = document.createElement('div');
            const emailElement = document.createElement('span');
            const accountTypeElement = document.createElement('span');
            const deleteButton = document.createElement('button');

            accountCard.className = 'account-card';
            accountInfo.className = 'account-info';
            deleteButton.className = 'delete-btn';


            emailElement.textContent = `Email: ${emailKey}`;
            accountTypeElement.textContent = `Account Type: ${accountType}`;
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                const confirmDeleteWorkAcc = confirm(`Are you sure you want to delete ${emailKey} account?`);
                if (confirmDeleteWorkAcc) {
                    remove(ref(database, 'workAccounts/' + childSnapshot.key))
                        .then(() => deleteUserByEmail(emailKey, accountData.password))
                        .then(() => {
                            alert(`Account ${emailKey} deleted successfully.`);
                            displayAccounts(); // Refresh the list after deletion
                        })
                        .catch((error) => {
                            alert(`Failed to delete account: ${error.message}`);
                        });
                }
            });

            accountInfo.appendChild(emailElement);
            accountInfo.appendChild(accountTypeElement);
            accountCard.appendChild(accountInfo);
            accountCard.appendChild(deleteButton);

            accountsContainer.appendChild(accountCard);
        });
    }, {
        onlyOnce: false // Keep the listener active for real-time updates
    });
}

// Function to delete a user by email
function deleteUserByEmail(email, password) {
    const trimmedEmail = email.trim().toLowerCase();

    return new Promise((resolve, reject) => {
        signInWithEmailAndPassword(auth, trimmedEmail, password)
            .then(userCredential => {
                const user = userCredential.user;
                return deleteUser(user);
            })
            .then(resolve)
            .catch(reject);
    });
}

// Call displayAccounts on page load
displayAccounts();
