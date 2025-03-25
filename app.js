// Global variables
let currentEvent = null;
let currentInvitees = [];
let isHostAuthenticated = false;

// Initialize the application based on the current page
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    if (filename === 'index.html' || filename === '') {
        // Home page initialization
        console.log('Home page loaded');
    } else if (filename === 'createEvent.html') {
        // Create event page initialization
        console.log('Create event page loaded');
    } else if (filename === 'event.html') {
        // Event details page initialization
        const urlParams = new URLSearchParams(window.location.search);
        const eventCode = urlParams.get('code');
        
        if (eventCode) {
            loadGuestView(eventCode);
        } else {
            // No event code provided, show error
            document.getElementById('guestView').classList.add('hidden');
            document.getElementById('eventNotFound').classList.remove('hidden');
        }
    }
});

// Function to generate a random access code for the host
function generateRandomCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById('hostAccessCode').value = code;
}

// Function to navigate to event page from the home page
function goToEvent() {
    const eventCode = document.getElementById('eventCodeInput').value.trim();
    if (eventCode) {
        window.location.href = `event.html?code=${eventCode}`;
    } else {
        alert('Please enter an event code');
    }
}

// Functions for creating an event
function addInvitee() {
    const name = document.getElementById('inviteeName').value.trim();
    
    if (name) {
        // Add to the invitee list
        currentInvitees.push({
            name: name,
            status: 'pending'
        });
        
        // Clear the input field
        document.getElementById('inviteeName').value = '';
        
        // Update the UI
        updateInviteesList();
    } else {
        alert('Please enter a name');
    }
}

function updateInviteesList() {
    const inviteesList = document.getElementById('inviteesList');
    inviteesList.innerHTML = '';
    
    currentInvitees.forEach((invitee, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${invitee.name}</span>
            <button class="btn btn-sm" onclick="removeInvitee(${index})">Remove</button>
        `;
        inviteesList.appendChild(li);
    });
}

function removeInvitee(index) {
    currentInvitees.splice(index, 1);
    updateInviteesList();
}

async function submitEvent() {
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const eventLocation = document.getElementById('eventLocation').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const hostAccessCode = document.getElementById('hostAccessCode').value.trim();
    
    if (eventName && eventDate) {
        if (!hostAccessCode) {
            alert('Please create a host access code for security purposes.');
            return;
        }
        
        try {
            // Create a new event object
            const newEvent = {
                id: generateEventCode(),
                name: eventName,
                date: eventDate,
                time: eventTime,
                location: eventLocation,
                description: eventDescription,
                invitees: currentInvitees,
                hostAccessCode: hostAccessCode,
                createdAt: new Date().toISOString()
            };
            
            // Save the event to Firestore
            await saveEvent(newEvent);
            
            // Show success message
            document.getElementById('eventCode').textContent = newEvent.id;
            document.getElementById('hostCodeDisplay').textContent = newEvent.hostAccessCode;
            const eventLink = `${window.location.origin}/event.html?code=${newEvent.id}`;
            document.getElementById('eventLink').value = eventLink;
            
            document.querySelector('.event-form').classList.add('hidden');
            document.getElementById('eventCreatedMessage').classList.remove('hidden');
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error creating event. Please try again.');
        }
    } else {
        alert('Please provide at least an event name and date');
    }
}

function generateEventCode() {
    // Generate a random 6-character code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function copyEventLink() {
    const linkInput = document.getElementById('eventLink');
    linkInput.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Add function to handle guest list upload during event creation
function uploadGuestListCreate() {
    const fileInput = document.getElementById('createEventGuestFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse the Excel/CSV file
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Get the first worksheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON (array of objects)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // Process the guest names (skip header row if exists)
            const startRow = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                            (jsonData[0][0].toLowerCase().includes('name') || 
                             jsonData[0][0].toLowerCase().includes('guest')) ? 1 : 0;
            
            let addedGuests = 0;
            
            // Add each guest name to the currentInvitees array
            for (let i = startRow; i < jsonData.length; i++) {
                if (jsonData[i] && jsonData[i][0] && jsonData[i][0].trim()) {
                    const guestName = jsonData[i][0].trim();
                    
                    // Check if guest already exists in currentInvitees
                    const existingGuest = currentInvitees.find(inv => 
                        inv.name.toLowerCase() === guestName.toLowerCase());
                    
                    if (!existingGuest) {
                        // Add new guest
                        currentInvitees.push({
                            name: guestName,
                            status: 'pending'
                        });
                        addedGuests++;
                    }
                }
            }
            
            // Update the UI
            if (addedGuests > 0) {
                updateInviteesList();
                alert(`Successfully added ${addedGuests} guests to the invitation list.`);
                fileInput.value = ''; // Clear the file input
            } else {
                alert('No new guests were found in the file or all guests already exist in your list.');
            }
            
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing the file. Please make sure it\'s a valid Excel or CSV file.');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
}

// Functions for viewing an event
async function loadGuestView(eventCode) {
    try {
        // Get the event from Firestore
        const doc = await db.collection('events').doc(eventCode).get();
        
        if (!doc.exists) {
            // Event not found
            document.getElementById('guestView').classList.add('hidden');
            document.getElementById('eventNotFound').classList.remove('hidden');
            return;
        }
        
        // Get event data
        const event = doc.data();
        currentEvent = event;
        
        // Update UI with basic event details
        document.getElementById('eventNameHeader').textContent = event.name;
        document.getElementById('guestEventName').textContent = event.name;
        document.getElementById('guestEventDate').textContent = formatDate(event.date);
        document.getElementById('guestEventTime').textContent = formatTime(event.time);
        document.getElementById('guestEventLocation').textContent = event.location;
        document.getElementById('guestEventDescription').textContent = event.description;
        
        // Update attending guest list
        updateAttendingList();
        
        // Check if the user has already RSVP'd
        checkUserRsvpStatus();
        
        // Check if host access code is in localStorage
        const storedAccessCode = localStorage.getItem(`host_access_${eventCode}`);
        if (storedAccessCode && storedAccessCode === event.hostAccessCode) {
            isHostAuthenticated = true;
        }
    } catch (error) {
        console.error('Error loading event details for guest view:', error);
        alert('Error loading event details. Please try again.');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString) return 'TBD';
    return timeString;
}

function updateAttendingList() {
    const attendingList = document.getElementById('attendingList');
    attendingList.innerHTML = '';
    
    if (currentEvent && currentEvent.invitees) {
        // Filter only attending guests
        const attendingGuests = currentEvent.invitees.filter(invitee => invitee.status === 'yes');
        
        if (attendingGuests.length > 0) {
            attendingGuests.forEach(invitee => {
                const li = document.createElement('li');
                li.textContent = invitee.name;
                attendingList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'empty-message';
            li.textContent = 'No one has confirmed attendance yet.';
            li.style.fontStyle = 'italic';
            li.style.color = '#6c757d';
            attendingList.appendChild(li);
        }
    }
}

function updateGuestList() {
    const guestsList = document.getElementById('guestsList');
    guestsList.innerHTML = '';
    
    if (currentEvent && currentEvent.invitees) {
        currentEvent.invitees.forEach(invitee => {
            const li = document.createElement('li');
            
            // Determine status class and text
            let statusClass = '';
            let statusText = '';
            
            switch(invitee.status) {
                case 'yes':
                    statusClass = 'status-attending';
                    statusText = 'Attending';
                    break;
                case 'no':
                    statusClass = 'status-declined';
                    statusText = 'Declined';
                    break;
                case 'maybe':
                    statusClass = 'status-maybe';
                    statusText = 'Maybe';
                    break;
                default:
                    statusClass = 'status-pending';
                    statusText = 'Pending';
            }
            
            li.innerHTML = `
                <span>${invitee.name}</span>
                <span class="status-indicator ${statusClass}">${statusText}</span>
            `;
            li.setAttribute('data-status', invitee.status);
            guestsList.appendChild(li);
        });
    }
}

function updateGuestStats() {
    if (currentEvent && currentEvent.invitees) {
        const stats = {
            attending: 0,
            declined: 0,
            maybe: 0,
            pending: 0
        };
        
        currentEvent.invitees.forEach(invitee => {
            switch(invitee.status) {
                case 'yes':
                    stats.attending++;
                    break;
                case 'no':
                    stats.declined++;
                    break;
                case 'maybe':
                    stats.maybe++;
                    break;
                default:
                    stats.pending++;
            }
        });
        
        document.getElementById('attendingCount').textContent = stats.attending;
        document.getElementById('declinedCount').textContent = stats.declined;
        document.getElementById('maybeCount').textContent = stats.maybe;
        document.getElementById('pendingCount').textContent = stats.pending;
    }
}

function showGuestTab(status) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Filter guests by status
    const guests = document.querySelectorAll('#guestsList li');
    
    guests.forEach(guest => {
        if (status === 'all' || guest.getAttribute('data-status') === status) {
            guest.style.display = 'flex';
        } else {
            guest.style.display = 'none';
        }
    });
}

function checkUserRsvpStatus() {
    // Check if the user has already responded
    const guestName = localStorage.getItem(`rsvp_${currentEvent.id}_name`);
    const guestResponse = localStorage.getItem(`rsvp_${currentEvent.id}_response`);
    
    if (guestName && guestResponse) {
        // User has already responded - need to update both views
        
        // Update guest view
        const guestViewRsvpForm = document.querySelector('#guestView #rsvpForm');
        const guestViewAlreadyResponded = document.querySelector('#guestView #alreadyResponded');
        const guestViewCurrentResponse = document.querySelector('#guestView #currentResponse');
        
        if (guestViewRsvpForm && guestViewAlreadyResponded) {
            guestViewRsvpForm.classList.add('hidden');
            guestViewAlreadyResponded.classList.remove('hidden');
            
            // Display their current response
            let responseText = getStatusText(guestResponse);
            guestViewCurrentResponse.textContent = responseText;
            
            // Pre-fill the form in case they want to change their response
            document.querySelector('#guestView #guestName').value = guestName;
        }
        
        // Update host view if it exists
        const hostViewRsvpForm = document.querySelector('#eventDetails #rsvpForm');
        const hostViewAlreadyResponded = document.querySelector('#eventDetails #alreadyResponded');
        const hostViewCurrentResponse = document.querySelector('#eventDetails #currentResponse');
        
        if (hostViewRsvpForm && hostViewAlreadyResponded) {
            hostViewRsvpForm.classList.add('hidden');
            hostViewAlreadyResponded.classList.remove('hidden');
            
            // Display their current response
            let responseText = getStatusText(guestResponse);
            hostViewCurrentResponse.textContent = responseText;
            
            // Pre-fill the form in case they want to change their response
            document.querySelector('#eventDetails #guestName').value = guestName;
        }
    }
}

function showRsvpForm() {
    // Determine which view is active
    if (isHostAuthenticated && document.getElementById('eventDetails').classList.contains('hidden') === false) {
        // Host view
        document.querySelector('#eventDetails #alreadyResponded').classList.add('hidden');
        document.querySelector('#eventDetails #rsvpForm').classList.remove('hidden');
    } else {
        // Guest view
        document.querySelector('#guestView #alreadyResponded').classList.add('hidden');
        document.querySelector('#guestView #rsvpForm').classList.remove('hidden');
    }
}

async function respondToInvitation(response) {
    const guestName = document.getElementById('guestName').value.trim();
    
    if (guestName) {
        try {
            // Current timestamp
            const responseDate = new Date().toISOString();
            
            // Save the response in localStorage for this browser only
            localStorage.setItem(`rsvp_${currentEvent.id}_name`, guestName);
            localStorage.setItem(`rsvp_${currentEvent.id}_response`, response);
            localStorage.setItem(`rsvp_${currentEvent.id}_date`, responseDate);
            
            // Update the invitee's status in the event
            let found = false;
            if (currentEvent && currentEvent.invitees) {
                for (let i = 0; i < currentEvent.invitees.length; i++) {
                    if (currentEvent.invitees[i].name.toLowerCase() === guestName.toLowerCase()) {
                        currentEvent.invitees[i].status = response;
                        currentEvent.invitees[i].responseDate = responseDate;
                        found = true;
                        break;
                    }
                }
                
                // If the guest wasn't in the original invitee list, add them
                if (!found) {
                    currentEvent.invitees.push({
                        name: guestName,
                        status: response,
                        responseDate: responseDate
                    });
                }
                
                // Save the updated event to Firestore
                await saveEvent(currentEvent);
                
                // Update the UI based on current view
                if (isHostAuthenticated && document.getElementById('eventDetails').classList.contains('hidden') === false) {
                    // If host view is active
                    updateGuestList();
                    updateGuestStats();
                    updateDetailedGuestList();
                } else {
                    // Guest view
                    updateAttendingList();
                }
                
                // Show success message
                const rsvpForm = document.querySelector('#' + (isHostAuthenticated ? 'eventDetails' : 'guestView') + ' #rsvpForm');
                const rsvpSuccess = document.querySelector('#' + (isHostAuthenticated ? 'eventDetails' : 'guestView') + ' #rsvpSuccess');
                
                rsvpForm.classList.add('hidden');
                rsvpSuccess.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error responding to invitation:', error);
            alert('Error saving your response. Please try again.');
        }
    } else {
        alert('Please enter your name');
    }
}

// Host authentication and management functions
async function verifyAccessCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code');
    const accessCode = document.getElementById('accessCodeInput').value.trim();
    
    if (!accessCode) {
        alert('Please enter the host access code.');
        return;
    }
    
    try {
        // Get the event from Firestore
        const event = await getEvent(eventCode);
        
        if (event && event.hostAccessCode === accessCode) {
            // Correct access code
            currentEvent = event;
            isHostAuthenticated = true;
            
            // Hide guest view and access form, show host view
            document.getElementById('guestView').classList.add('hidden');
            document.getElementById('eventAccessForm').classList.add('hidden');
            document.getElementById('eventDetails').classList.remove('hidden');
            
            // Update UI with event details for host view
            document.getElementById('eventNameHeader').textContent = event.name;
            document.getElementById('eventDate').textContent = formatDate(event.date);
            document.getElementById('eventTime').textContent = formatTime(event.time);
            document.getElementById('eventLocation').textContent = event.location;
            document.getElementById('eventDescription').textContent = event.description;
            
            // Load complete guest list for host
            updateGuestList();
            updateGuestStats();
            
            // Store access code in localStorage for this event
            localStorage.setItem(`host_access_${eventCode}`, accessCode);
        } else {
            alert('Invalid access code. Please try again.');
        }
    } catch (error) {
        console.error('Error verifying access code:', error);
        alert('Error accessing the event. Please try again.');
    }
}

function updateDetailedGuestList() {
    if (!isHostAuthenticated || !currentEvent) return;
    
    const tableBody = document.getElementById('detailedGuestsTable');
    tableBody.innerHTML = '';
    
    if (currentEvent.invitees && currentEvent.invitees.length > 0) {
        currentEvent.invitees.forEach(invitee => {
            // Get status text
            let statusText = getStatusText(invitee.status);
            
            // Get response date if available (default to 'Not responded yet')
            const responseDate = invitee.responseDate ? new Date(invitee.responseDate).toLocaleString() : 'Not responded yet';
            
            // Create table row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${invitee.name}</td>
                <td class="status-${invitee.status || 'pending'}">${statusText}</td>
                <td>${responseDate}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        // No invitees yet
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" class="empty-message">No guests have been invited yet</td>';
        tableBody.appendChild(tr);
    }
}

function getStatusText(status) {
    switch(status) {
        case 'yes': return 'Attending';
        case 'no': return 'Declined';
        case 'maybe': return 'Maybe';
        default: return 'Pending';
    }
}

function toggleDetailedView() {
    const detailedView = document.getElementById('detailedGuestList');
    const toggleBtn = document.getElementById('viewToggleBtn');
    
    if (detailedView.classList.contains('hidden')) {
        detailedView.classList.remove('hidden');
        toggleBtn.textContent = 'Hide Detailed View';
    } else {
        detailedView.classList.add('hidden');
        toggleBtn.textContent = 'Show Detailed View';
    }
}

function exportGuestList() {
    if (!currentEvent || !currentEvent.invitees) {
        alert('No guest data available to export.');
        return;
    }
    
    let csvContent = 'Name,Status,Response Date\n';
    
    currentEvent.invitees.forEach(invitee => {
        const status = getStatusText(invitee.status);
        const responseDate = invitee.responseDate ? new Date(invitee.responseDate).toLocaleString() : 'Not responded';
        
        // Create CSV row, properly escape values
        const row = [
            `"${invitee.name.replace(/"/g, '""')}"`,
            `"${status}"`,
            `"${responseDate}"`
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentEvent.name}_guest_list.csv`);
    document.body.appendChild(link);
    
    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
}

// Add function to handle guest list upload
async function uploadGuestList() {
    const fileInput = document.getElementById('guestListFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // Parse the Excel/CSV file
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Get the first worksheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON (array of objects)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // Process the guest names (skip header row if exists)
            const startRow = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                             (jsonData[0][0].toLowerCase().includes('name') || 
                              jsonData[0][0].toLowerCase().includes('guest')) ? 1 : 0;
            
            let newGuests = 0;
            
            // Add each guest name to the event
            for (let i = startRow; i < jsonData.length; i++) {
                if (jsonData[i] && jsonData[i][0] && jsonData[i][0].trim()) {
                    const guestName = jsonData[i][0].trim();
                    
                    // Check if guest already exists
                    const existingGuest = currentEvent.invitees.find(inv => 
                        inv.name.toLowerCase() === guestName.toLowerCase());
                    
                    if (!existingGuest) {
                        // Add new guest
                        currentEvent.invitees.push({
                            name: guestName,
                            status: 'pending'
                        });
                        newGuests++;
                    }
                }
            }
            
            // Save updated event and refresh UI
            if (newGuests > 0) {
                await saveEvent(currentEvent);
                updateGuestList();
                updateGuestStats();
                updateDetailedGuestList();
                alert(`Successfully added ${newGuests} new guests to the event.`);
                fileInput.value = ''; // Clear the file input
            } else {
                alert('No new guests were found in the file or all guests already exist.');
            }
            
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing the file. Please make sure it\'s a valid Excel or CSV file.');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
}

// Modified localStorage functions to use Firebase instead
async function saveEvent(event) {
    try {
        // Store the event in Firestore
        await db.collection('events').doc(event.id).set(event);
        console.log('Event saved to Firestore:', event.id);
        
        // Store local RSVP state if user has responded (for this browser only)
        const guestName = localStorage.getItem(`rsvp_${event.id}_name`);
        const guestResponse = localStorage.getItem(`rsvp_${event.id}_response`);
        
        if (guestName && guestResponse) {
            localStorage.setItem(`rsvp_${event.id}_name`, guestName);
            localStorage.setItem(`rsvp_${event.id}_response`, guestResponse);
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event data. Please try again.');
    }
}

async function getEvent(eventId) {
    try {
        // Get the event from Firestore
        const doc = await db.collection('events').doc(eventId).get();
        
        if (doc.exists) {
            return doc.data();
        } else {
            console.log('No event found with ID:', eventId);
            return null;
        }
    } catch (error) {
        console.error('Error getting event:', error);
        alert('Error retrieving event data. Please try again.');
        return null;
    }
}

// Function to show the host login form
function showHostLogin() {
    document.getElementById('guestView').classList.add('hidden');
    document.getElementById('eventAccessForm').classList.remove('hidden');
}

// Function to go back to guest view
function backToGuestView() {
    document.getElementById('eventAccessForm').classList.add('hidden');
    document.getElementById('guestView').classList.remove('hidden');
}

// Function to show the host panel when the button is clicked
function showHostPanel() {
    document.getElementById('hostPanel').classList.remove('hidden');
    document.getElementById('hostAuthSection').classList.add('hidden');
}
window.showHostPanel = showHostPanel;