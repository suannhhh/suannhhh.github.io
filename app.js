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
            loadEventDetails(eventCode);
        } else {
            // No event code provided, show error
            document.getElementById('eventDetails').classList.add('hidden');
            document.getElementById('eventNotFound').classList.remove('hidden');
        }
    }
});

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
    const email = document.getElementById('inviteeEmail').value.trim();
    
    if (name && email) {
        // Add to the invitee list
        currentInvitees.push({
            name: name,
            email: email,
            status: 'pending'
        });
        
        // Clear the input fields
        document.getElementById('inviteeName').value = '';
        document.getElementById('inviteeEmail').value = '';
        
        // Update the UI
        updateInviteesList();
    } else {
        alert('Please enter both name and email');
    }
}

function updateInviteesList() {
    const inviteesList = document.getElementById('inviteesList');
    inviteesList.innerHTML = '';
    
    currentInvitees.forEach((invitee, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${invitee.name} (${invitee.email})</span>
            <button class="btn btn-sm" onclick="removeInvitee(${index})">Remove</button>
        `;
        inviteesList.appendChild(li);
    });
}

function removeInvitee(index) {
    currentInvitees.splice(index, 1);
    updateInviteesList();
}

function submitEvent() {
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const eventLocation = document.getElementById('eventLocation').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    
    if (eventName && eventDate) {
        // Create a new event object
        const newEvent = {
            id: generateEventCode(),
            name: eventName,
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            description: eventDescription,
            invitees: currentInvitees
        };
        
        // Save the event to localStorage
        saveEvent(newEvent);
        
        // Show success message
        document.getElementById('eventCode').textContent = newEvent.id;
        const eventLink = `${window.location.origin}/event.html?code=${newEvent.id}`;
        document.getElementById('eventLink').value = eventLink;
        
        document.querySelector('.event-form').classList.add('hidden');
        document.getElementById('eventCreatedMessage').classList.remove('hidden');
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

// Functions for viewing an event
function loadEventDetails(eventCode) {
    // Load the event from localStorage
    const event = getEvent(eventCode);
    
    if (event) {
        currentEvent = event;
        
        // Update UI with event details
        document.getElementById('eventNameHeader').textContent = event.name;
        document.getElementById('eventDate').textContent = formatDate(event.date);
        document.getElementById('eventTime').textContent = formatTime(event.time);
        document.getElementById('eventLocation').textContent = event.location;
        document.getElementById('eventDescription').textContent = event.description;
        
        // Load guest list
        updateGuestList();
        updateGuestStats();
        
        // Check if the user has already RSVP'd
        checkUserRsvpStatus();
    } else {
        // Event not found
        document.getElementById('eventDetails').classList.add('hidden');
        document.getElementById('eventNotFound').classList.remove('hidden');
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
    // This is a simplified version - in a real app, you'd use authentication
    const guestEmail = localStorage.getItem(`rsvp_${currentEvent.id}_email`);
    const guestName = localStorage.getItem(`rsvp_${currentEvent.id}_name`);
    const guestResponse = localStorage.getItem(`rsvp_${currentEvent.id}_response`);
    
    if (guestEmail && guestName && guestResponse) {
        // User has already responded
        document.getElementById('rsvpForm').classList.add('hidden');
        document.getElementById('alreadyResponded').classList.remove('hidden');
        
        // Display their current response
        let responseText = '';
        switch(guestResponse) {
            case 'yes':
                responseText = 'Attending';
                break;
            case 'no':
                responseText = 'Not Attending';
                break;
            case 'maybe':
                responseText = 'Maybe';
                break;
        }
        document.getElementById('currentResponse').textContent = responseText;
        
        // Pre-fill the form in case they want to change their response
        document.getElementById('guestName').value = guestName;
        document.getElementById('guestEmail').value = guestEmail;
    }
}

function showRsvpForm() {
    document.getElementById('alreadyResponded').classList.add('hidden');
    document.getElementById('rsvpForm').classList.remove('hidden');
}

function respondToInvitation(response) {
    const guestName = document.getElementById('guestName').value.trim();
    const guestEmail = document.getElementById('guestEmail').value.trim();
    
    if (guestName && guestEmail) {
        // Current timestamp
        const responseDate = new Date().toISOString();
        
        // Save the response
        localStorage.setItem(`rsvp_${currentEvent.id}_name`, guestName);
        localStorage.setItem(`rsvp_${currentEvent.id}_email`, guestEmail);
        localStorage.setItem(`rsvp_${currentEvent.id}_response`, response);
        localStorage.setItem(`rsvp_${currentEvent.id}_date`, responseDate);
        
        // Update the invitee's status in the event
        let found = false;
        if (currentEvent && currentEvent.invitees) {
            for (let i = 0; i < currentEvent.invitees.length; i++) {
                if (currentEvent.invitees[i].email.toLowerCase() === guestEmail.toLowerCase()) {
                    currentEvent.invitees[i].status = response;
                    currentEvent.invitees[i].responseDate = responseDate; // Add response date
                    found = true;
                    break;
                }
            }
            
            // If the guest wasn't in the original invitee list, add them
            if (!found) {
                currentEvent.invitees.push({
                    name: guestName,
                    email: guestEmail,
                    status: response,
                    responseDate: responseDate // Add response date
                });
            }
            
            // Save the updated event
            saveEvent(currentEvent);
            
            // Update the UI
            updateGuestList();
            updateGuestStats();
            if (isHostAuthenticated) {
                updateDetailedGuestList(); // Update detailed view if host is authenticated
            }
            
            // Show success message
            document.getElementById('rsvpForm').classList.add('hidden');
            document.getElementById('rsvpSuccess').classList.remove('hidden');
        }
    } else {
        alert('Please enter your name and email');
    }
}

// Host authentication and management functions
function authenticateHost() {
    const inputCode = document.getElementById('hostEventCode').value.trim();
    
    if (currentEvent && inputCode === currentEvent.id) {
        // Successful authentication
        isHostAuthenticated = true;
        
        // Hide authentication form and show host panel
        document.getElementById('hostAuthSection').classList.add('hidden');
        document.getElementById('hostPanel').classList.remove('hidden');
        
        // Load detailed guest data
        updateDetailedGuestList();
    } else {
        alert('Invalid event code. Please try again.');
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
                <td>${invitee.email}</td>
                <td class="status-${invitee.status || 'pending'}">${statusText}</td>
                <td>${responseDate}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        // No invitees yet
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" class="empty-message">No guests have been invited yet</td>';
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
    
    let csvContent = 'Name,Email,Status,Response Date\n';
    
    currentEvent.invitees.forEach(invitee => {
        const status = getStatusText(invitee.status);
        const responseDate = invitee.responseDate ? new Date(invitee.responseDate).toLocaleString() : 'Not responded';
        
        // Create CSV row, properly escape values
        const row = [
            `"${invitee.name.replace(/"/g, '""')}"`,
            `"${invitee.email.replace(/"/g, '""')}"`,
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

// localStorage functions to persist data
function saveEvent(event) {
    localStorage.setItem(`event_${event.id}`, JSON.stringify(event));
}

function getEvent(eventId) {
    const eventData = localStorage.getItem(`event_${eventId}`);
    return eventData ? JSON.parse(eventData) : null;
}