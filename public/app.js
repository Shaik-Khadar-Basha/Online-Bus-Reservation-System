// State variables
let currentBuses = [];
let allFleetBuses = [];
let selectedBus = null;
let selectedSeats = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set default travel date
    const travelDateInput = document.getElementById('travelDate');
    const today = new Date().toISOString().split('T')[0];
    if (travelDateInput) {
        travelDateInput.value = today;
        travelDateInput.min = today;
    }

    // Load dynamic cities from server
    loadCitiesDropdown();

    // Show initial search prompt (do not load buses until search is entered)
    showInitialPrompt();
});

// Load dynamic cities from server and synchronize dropdowns
async function loadCitiesDropdown() {
    try {
        const res = await fetch('/api/cities');
        const data = await res.json();
        if (data.success && data.allCities) {
            updateCitySelect('fromCity', data.allCities, 'departure');
            updateCitySelect('toCity', data.allCities, 'destination');
            updateCitiesDatalist('citiesDatalist', data.allCities);
        }
    } catch (err) {
        console.warn('Could not fetch dynamic cities list, using static options:', err);
    }
}

function updateCitiesDatalist(datalistId, cities) {
    const dl = document.getElementById(datalistId);
    if (!dl) return;
    dl.innerHTML = cities.map(c => `<option value="${escapeHtml(c)}">`).join('');
}

function updateCitySelect(selectId, cities, placeholderType) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentVal = select.value;

    let html = `<option value="">Select ${placeholderType} city</option>`;
    cities.forEach(city => {
        html += `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`;
    });
    select.innerHTML = html;
    if (currentVal) {
        select.value = currentVal;
    }
}

// Swap Source and Destination cities
function swapCities() {
    const fromSelect = document.getElementById('fromCity');
    const toSelect = document.getElementById('toCity');
    const swapBtn = document.getElementById('swapCitiesBtn');

    if (!fromSelect || !toSelect) return;

    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    if (swapBtn) {
        swapBtn.classList.add('rotating');
        setTimeout(() => swapBtn.classList.remove('rotating'), 350);
    }

    if (fromSelect.value && toSelect.value) {
        showToast(`Route swapped: ${fromSelect.value} ➔ ${toSelect.value}`);
    }
}

// Show initial search prompt
function showInitialPrompt() {
    const busList = document.getElementById('busList');
    const titleBar = document.getElementById('resultsTitleBar');
    if (titleBar) titleBar.style.display = 'none';
    if (busList) {
        busList.innerHTML = `
            <div class="search-hero-prompt">
                <div class="prompt-icon">🚍</div>
                <h3>Search Intercity Buses</h3>
                <p>Enter your <strong>Source</strong> and <strong>Destination</strong> above and click <strong>Search Buses</strong> to see live available buses and reserve seats.</p>
            </div>
        `;
    }
}

// Fill popular route and search
function fillAndSearch(source, destination) {
    document.getElementById('fromCity').value = source;
    document.getElementById('toCity').value = destination;
    const submitBtn = document.getElementById('searchSubmitBtn');
    if (submitBtn) submitBtn.click();
}

// Toast notification helper
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = isError ? '#ef4444' : '#0f172a';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// 1. Tab Switcher
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'buses') {
        document.getElementById('busesTab').classList.add('active');
        document.getElementById('navBusesBtn').classList.add('active');
        if (currentBuses.length === 0) {
            showInitialPrompt();
        }
    } else if (tabName === 'fleet') {
        document.getElementById('fleetTab').classList.add('active');
        document.getElementById('navFleetBtn').classList.add('active');
        loadFleetTable();
    } else if (tabName === 'bookings') {
        document.getElementById('bookingsTab').classList.add('active');
        document.getElementById('navBookingsBtn').classList.add('active');
        loadBookings();
    }
}

// Helper: Format time (e.g., 21:00:00 -> 09:00 PM)
function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Helper: Format date (e.g., "2026-10-15T18:30:00.000Z" -> "2026-10-15")
function formatDate(dateStr) {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && dateStr.length >= 10) {
        return dateStr.slice(0, 10);
    }
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toISOString().split('T')[0];
}

// 2. Load & Search Buses
async function loadBuses(query = {}, fromCity = '', toCity = '') {
    const busList = document.getElementById('busList');
    const resultsCount = document.getElementById('resultsCount');
    const titleBar = document.getElementById('resultsTitleBar');

    if (titleBar) titleBar.style.display = 'block';
    busList.innerHTML = '<div class="loading-cell">Searching for available buses...</div>';

    try {
        const params = new URLSearchParams(query);
        const res = await fetch(`/api/buses?${params.toString()}`);
        const result = await res.json();

        if (result.success) {
            currentBuses = result.data;
            renderBuses(currentBuses, fromCity, toCity);
            if (resultsCount) {
                let routeText = '';
                if (fromCity && toCity) routeText = ` from ${fromCity} to ${toCity}`;
                else if (fromCity) routeText = ` from ${fromCity}`;
                else if (toCity) routeText = ` to ${toCity}`;
                resultsCount.textContent = `Available Buses${routeText} (${currentBuses.length} found)`;
            }
        } else {
            busList.innerHTML = '<p class="loading-cell">Failed to load buses.</p>';
        }
    } catch (err) {
        console.error('Error fetching buses:', err);
        busList.innerHTML = '<p class="loading-cell">Error connecting to server.</p>';
    }
}

// Helper: Get realistic image based on bus type
function getBusImage(busType) {
    if (!busType) return 'images/seater.jpg';
    const lower = busType.toLowerCase();
    if (lower.includes('sleeper')) return 'images/sleeper.jpg';
    if (lower.includes('volvo') || lower.includes('luxury') || lower.includes('delux')) return 'images/volvo.jpg';
    return 'images/seater.jpg';
}

// 3. Render Bus Cards
function renderBuses(buses, fromCity = '', toCity = '') {
    const busList = document.getElementById('busList');
    if (!busList) return;

    if (buses.length === 0) {
        const routeLabel = fromCity && toCity ? ` for route "${escapeHtml(fromCity)}" ➔ "${escapeHtml(toCity)}"` : '';
        busList.innerHTML = `
            <div class="empty-results-box">
                <div class="empty-icon">🔍</div>
                <h3>No buses found${routeLabel}</h3>
                <p>Try searching different city names or click the <strong>All Buses</strong> tab to view all scheduled buses.</p>
            </div>
        `;
        return;
    }

    busList.innerHTML = buses.map(bus => {
        const totalSeats = bus.total_seats || 40;
        const availSeats = bus.available_seats !== undefined ? bus.available_seats : totalSeats;
        const isSoldOut = availSeats <= 0;
        const busImg = getBusImage(bus.bus_type);

        return `
            <div class="bus-card">
                <!-- BUS REALISTIC PHOTO -->
                <div class="bus-card-media">
                    <img src="${busImg}" alt="${escapeHtml(bus.bus_type)}" class="bus-thumb-img">
                    <span class="rating-badge">★ 4.8</span>
                </div>

                <!-- BUS DETAILS & ROUTE -->
                <div class="bus-card-info">
                    <div class="bus-card-top-tags">
                        <span class="service-badge">${escapeHtml(bus.service_no)}</span>
                        <span class="bus-id-label">ID: #${bus.bus_id}</span>
                        <span class="bus-type-tag">${escapeHtml(bus.bus_type)}</span>
                        <button type="button" class="btn-card-delete" onclick="confirmDeleteBus(${bus.bus_id}, '${escapeHtml(bus.service_no)}', '${escapeHtml(bus.source)}', '${escapeHtml(bus.destination)}')" title="Delete bus from fleet">
                            🗑️ Delete
                        </button>
                    </div>

                    <div class="bus-route-visual">
                        <div class="route-point">
                            <span class="time-big">${formatTime(bus.departure_time)}</span>
                            <span class="city-name">${escapeHtml(bus.source)}</span>
                        </div>
                        <div class="route-line-wrap">
                            <span class="route-arrow-icon">➔</span>
                            <span class="direct-tag">Direct Express</span>
                        </div>
                        <div class="route-point text-right">
                            <span class="time-big">${formatTime(bus.arrival_time)}</span>
                            <span class="city-name">${escapeHtml(bus.destination)}</span>
                        </div>
                    </div>

                    <div class="bus-amenity-row">
                        <span>❄️ Climate AC</span>
                        <span>•</span>
                        <span>⚡ Mobile Charging</span>
                        <span>•</span>
                        <span>📶 Wi-Fi</span>
                        <span>•</span>
                        <span>💧 Water</span>
                    </div>
                </div>

                <!-- SEATS AVAILABILITY, FARE & ACTION -->
                <div class="bus-card-action">
                    <div class="seats-counter ${isSoldOut ? 'sold-out' : 'available'}">
                        <span class="seats-dot">●</span>
                        <span>${isSoldOut ? 'Sold Out' : `${availSeats} seats left`}</span>
                        <small>(Total ${totalSeats})</small>
                    </div>

                    <div class="fare-display">
                        <span class="fare-currency">₹</span>
                        <span class="fare-val">${parseFloat(bus.fare).toFixed(0)}</span>
                    </div>

                    <button class="btn btn-green-book" onclick="openBookingModal(${bus.bus_id})" ${isSoldOut ? 'disabled' : ''}>
                        ${isSoldOut ? 'Sold Out' : 'Select Seats ➔'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Load All Buses Table
async function loadFleetTable() {
    const tbody = document.getElementById('fleetTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">Loading registered buses...</td></tr>';

    try {
        const res = await fetch('/api/buses');
        const result = await res.json();

        if (result.success) {
            allFleetBuses = result.data;
            if (allFleetBuses.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">No buses added yet.</td></tr>';
                return;
            }

            tbody.innerHTML = allFleetBuses.map(bus => `
                <tr>
                    <td>
                        <img src="${getBusImage(bus.bus_type)}" class="table-bus-thumb" alt="${escapeHtml(bus.bus_type)}">
                    </td>
                    <td><strong>#${bus.bus_id}</strong></td>
                    <td><strong class="service-badge-sm">${escapeHtml(bus.service_no)}</strong></td>
                    <td><span class="bus-type-tag">${escapeHtml(bus.bus_type)}</span></td>
                    <td><strong>${escapeHtml(bus.source)} ➔ ${escapeHtml(bus.destination)}</strong></td>
                    <td>${formatTime(bus.departure_time)}</td>
                    <td>${bus.total_seats}</td>
                    <td><strong class="green-text">${bus.available_seats}</strong></td>
                    <td><strong>₹${parseFloat(bus.fare).toFixed(0)}</strong></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-green-book btn-sm" onclick="openBookingModal(${bus.bus_id})" ${bus.available_seats <= 0 ? 'disabled' : ''}>Book</button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteBus(${bus.bus_id}, '${escapeHtml(bus.service_no)}', '${escapeHtml(bus.source)}', '${escapeHtml(bus.destination)}')">🗑️ Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">Failed to load buses.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">Error loading buses table.</td></tr>';
    }
}

// Delete Bus
async function handleDeleteBus(busId, serviceNo) {
    if (!confirm(`Are you sure you want to delete bus ${serviceNo}?`)) return;

    try {
        const res = await fetch(`/api/buses/${busId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(`Bus ${serviceNo} deleted.`);
            loadFleetTable();
            loadBuses();
        } else {
            showToast(data.message || 'Error deleting bus.', true);
        }
    } catch (e) {
        showToast('Error deleting bus.', true);
    }
}

// Search Handler
function handleSearch(event) {
    event.preventDefault();
    const fromCity = document.getElementById('fromCity').value.trim();
    const toCity = document.getElementById('toCity').value.trim();
    const busType = document.getElementById('busTypeFilter').value;

    if (!fromCity && !toCity) {
        showToast('Please select Source (From) and Destination (To) to search buses.', true);
        return;
    }

    if (fromCity && toCity && fromCity.toLowerCase() === toCity.toLowerCase()) {
        showToast('Source and Destination cannot be the same city.', true);
        return;
    }

    const query = {};
    if (fromCity) query.source = fromCity;
    if (toCity) query.destination = toCity;
    if (busType && busType !== 'All') query.bus_type = busType;

    loadBuses(query, fromCity, toCity);
}

// Reset Search
function resetSearch() {
    document.getElementById('fromCity').value = '';
    document.getElementById('toCity').value = '';
    document.getElementById('busTypeFilter').value = 'All';
    currentBuses = [];
    showInitialPrompt();
}

// 5. Open Booking Modal
async function openBookingModal(busId) {
    try {
        const res = await fetch(`/api/buses/${busId}`);
        const data = await res.json();
        if (!data.success) {
            showToast('Unable to load bus details.', true);
            return;
        }

        selectedBus = data.data;
        selectedSeats = [];

        document.getElementById('modalBusTitle').textContent = `KhadarBus ${selectedBus.service_no} (${selectedBus.bus_type})`;
        document.getElementById('modalBusRoute').textContent = `${selectedBus.source} ➔ ${selectedBus.destination} • Departs ${formatTime(selectedBus.departure_time)}`;
        document.getElementById('modalFarePrice').textContent = `₹${parseFloat(selectedBus.fare).toFixed(0)}`;
        updateBookingSummary();

        buildSeatGrid(selectedBus);
        document.getElementById('bookingModal').classList.add('active');
    } catch (err) {
        showToast('Error opening booking modal.', true);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Build Seat Grid
function buildSeatGrid(bus) {
    const grid = document.getElementById('seatsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const totalSeats = bus.total_seats || 40;
    const availCount = bus.available_seats !== undefined ? bus.available_seats : totalSeats;
    const bookedCount = totalSeats - availCount;

    const bookedSeatSet = new Set();
    for (let i = 1; i <= bookedCount; i++) {
        bookedSeatSet.add(`S${i}`);
    }

    for (let i = 1; i <= totalSeats; i++) {
        const seatNo = `S${i}`;
        const isBooked = bookedSeatSet.has(seatNo);

        const seatBtn = document.createElement('button');
        seatBtn.type = 'button';
        seatBtn.className = `seat-btn ${isBooked ? 'booked' : 'available'}`;
        seatBtn.textContent = seatNo;
        seatBtn.disabled = isBooked;

        if (!isBooked) {
            seatBtn.addEventListener('click', () => toggleSeatSelection(seatNo, seatBtn));
        }

        grid.appendChild(seatBtn);
    }
}

function toggleSeatSelection(seatNo, seatBtn) {
    const index = selectedSeats.indexOf(seatNo);
    if (index === -1) {
        if (selectedSeats.length >= 6) {
            showToast('Maximum 6 seats per booking.', true);
            return;
        }
        selectedSeats.push(seatNo);
        seatBtn.classList.remove('available');
        seatBtn.classList.add('selected');
    } else {
        selectedSeats.splice(index, 1);
        seatBtn.classList.remove('selected');
        seatBtn.classList.add('available');
    }

    updateBookingSummary();
}

function updateBookingSummary() {
    const listEl = document.getElementById('selectedSeatsList');
    const totalEl = document.getElementById('modalTotalPrice');
    const bookBtn = document.getElementById('bookNowBtn');

    if (selectedSeats.length === 0) {
        listEl.textContent = 'None selected';
        totalEl.textContent = '₹0';
        bookBtn.disabled = true;
    } else {
        listEl.textContent = selectedSeats.join(', ');
        const total = (selectedBus.fare || 0) * selectedSeats.length;
        totalEl.textContent = `₹${total.toFixed(0)}`;
        bookBtn.disabled = false;
    }
}

// 6. Confirm Booking
async function handleConfirmBooking(event) {
    event.preventDefault();

    if (!selectedBus || selectedSeats.length === 0) {
        showToast('Please select at least one seat.', true);
        return;
    }

    const passengerName = document.getElementById('passengerName').value.trim();
    const phone = document.getElementById('passengerPhone').value.trim();
    const email = document.getElementById('passengerEmail').value.trim();
    const travelDate = document.getElementById('travelDate').value;

    const bookBtn = document.getElementById('bookNowBtn');
    bookBtn.disabled = true;
    bookBtn.textContent = 'Booking...';

    const payload = {
        bus_id: selectedBus.bus_id,
        passenger_name: passengerName,
        phone,
        email,
        seat_numbers: selectedSeats,
        journey_date: travelDate
    };

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            closeModal('bookingModal');
            showToast('Tickets Booked Successfully!');
            displayTicketReceipt(result.ticket);

            document.getElementById('confirmBookingForm').reset();
            loadBuses(); // refresh available seats
        } else {
            showToast(result.message || 'Booking failed.', true);
            bookBtn.disabled = false;
            bookBtn.textContent = 'Confirm Booking';
        }
    } catch (err) {
        showToast('Connection error during booking.', true);
        bookBtn.disabled = false;
        bookBtn.textContent = 'Confirm Booking';
    }
}

// Display Ticket Receipt
function displayTicketReceipt(ticket) {
    document.getElementById('ticketBookingId').textContent = `#${ticket.booking_id}`;
    document.getElementById('ticketServiceNo').textContent = ticket.service_no || 'KB-101';
    document.getElementById('ticketPassenger').textContent = ticket.passenger_name;
    document.getElementById('ticketPhone').textContent = ticket.phone;
    document.getElementById('ticketSource').textContent = ticket.source;
    document.getElementById('ticketDestination').textContent = ticket.destination;
    document.getElementById('ticketBusType').textContent = ticket.bus_type;
    document.getElementById('ticketDeparture').textContent = formatTime(ticket.departure_time);
    document.getElementById('ticketDate').textContent = formatDate(ticket.journey_date);
    document.getElementById('ticketSeats').textContent = ticket.seats;
    document.getElementById('ticketFare').textContent = `₹${parseFloat(ticket.total_amount).toFixed(0)}`;

    document.getElementById('ticketModal').classList.add('active');
}

// 7. Load Booked Tickets (NOW WORKS SEAMLESSLY!)
async function loadBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="11" class="loading-cell">Loading booked tickets...</td></tr>';

    try {
        const res = await fetch('/api/bookings');
        const result = await res.json();

        if (result.success) {
            const bookings = result.data;
            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="loading-cell">No booked tickets found.</td></tr>';
                return;
            }

            tbody.innerHTML = bookings.map(b => {
                const isConfirmed = (b.booking_status || 'CONFIRMED') === 'CONFIRMED';
                const statusHtml = isConfirmed
                    ? '<span class="status-confirmed">CONFIRMED</span>'
                    : '<span class="status-cancelled">CANCELLED</span>';

                const route = (b.source && b.destination) 
                    ? `${escapeHtml(b.source)} ➔ ${escapeHtml(b.destination)}`
                    : '-';

                return `
                    <tr>
                        <td><strong>#${b.booking_id}</strong></td>
                        <td><strong>${escapeHtml(b.passenger_name)}</strong></td>
                        <td>${escapeHtml(b.phone)}</td>
                        <td><strong>${escapeHtml(b.service_no || '-')}</strong></td>
                        <td>${escapeHtml(b.bus_type || '-')}</td>
                        <td>${route}</td>
                        <td><strong style="color: #2563eb;">${escapeHtml(b.seat_numbers)}</strong></td>
                        <td>${formatDate(b.journey_date)}</td>
                        <td><strong>₹${parseFloat(b.total_amount).toFixed(0)}</strong></td>
                        <td>${statusHtml}</td>
                        <td>
                            ${isConfirmed 
                                ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.booking_id})">Cancel</button>` 
                                : '<span style="color:#94a3b8; font-size:0.8rem;">Cancelled</span>'
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="11" class="loading-cell">Failed to load booked tickets.</td></tr>';
        }
    } catch (err) {
        console.error('Error fetching booked tickets:', err);
        tbody.innerHTML = '<tr><td colspan="11" class="loading-cell">Error loading booked tickets.</td></tr>';
    }
}

// 8. Cancel Booking
async function cancelBooking(bookingId) {
    if (!confirm(`Cancel booking #${bookingId}? Seats will be released back to the bus.`)) return;

    try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
        const result = await res.json();

        if (result.success) {
            showToast('Booking cancelled successfully.');
            loadBookings();
            loadBuses();
        } else {
            showToast(result.message || 'Failed to cancel booking.', true);
        }
    } catch (err) {
        showToast('Error cancelling booking.', true);
    }
}

// 9. Add New Bus
function openAddBusModal() {
    const form = document.getElementById('addBusForm');
    if (form) form.reset();

    const depInput = document.getElementById('newDepartureTime');
    const arrInput = document.getElementById('newArrivalTime');
    const seatsInput = document.getElementById('newTotalSeats');
    const fareInput = document.getElementById('newFare');

    if (depInput) depInput.value = '20:00';
    if (arrInput) arrInput.value = '06:00';
    if (seatsInput) seatsInput.value = '40';
    if (fareInput) fareInput.value = '750';

    document.getElementById('addBusModal').classList.add('active');
}

async function handleAddBus(event) {
    event.preventDefault();

    const serviceNo = document.getElementById('newServiceNo').value.trim().toUpperCase();
    const busType = document.getElementById('newBusType').value;
    const source = document.getElementById('newSource').value.trim();
    const destination = document.getElementById('newDestination').value.trim();
    const departureTime = document.getElementById('newDepartureTime').value;
    const arrivalTime = document.getElementById('newArrivalTime').value;
    const totalSeats = parseInt(document.getElementById('newTotalSeats').value);
    const fare = parseFloat(document.getElementById('newFare').value);

    if (source.toLowerCase() === destination.toLowerCase()) {
        showToast('Source and Destination cannot be the same city.', true);
        return;
    }

    const saveBtn = document.getElementById('saveBusBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>⏳</span> Saving...';
    }

    const payload = {
        service_no: serviceNo,
        bus_type: busType,
        source,
        destination,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        total_seats: totalSeats,
        fare
    };

    try {
        const res = await fetch('/api/buses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            closeModal('addBusModal');
            showToast(data.message || `Bus ${serviceNo} added successfully!`);

            // Refresh cities dropdown in search and datalist
            await loadCitiesDropdown();

            // Switch to fleet tab so user sees the newly added bus immediately
            switchTab('fleet');

            // If a search is currently open, refresh search results as well
            const fromCity = document.getElementById('fromCity').value.trim();
            const toCity = document.getElementById('toCity').value.trim();
            if (fromCity || toCity) {
                const query = {};
                if (fromCity) query.source = fromCity;
                if (toCity) query.destination = toCity;
                loadBuses(query, fromCity, toCity);
            }
        } else {
            showToast(data.message || 'Failed to add bus.', true);
        }
    } catch (err) {
        console.error('Error adding bus:', err);
        showToast('Network error while adding bus.', true);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>✓</span> Add Bus to Fleet';
        }
    }
}

// 10. Delete Bus Confirmation & Execution
function confirmDeleteBus(busId, serviceNo, source = '', destination = '') {
    const infoCard = document.getElementById('deleteBusInfoCard');
    const promptEl = document.getElementById('deleteBusPrompt');
    if (promptEl) {
        promptEl.textContent = `Are you sure you want to remove ${serviceNo} from the fleet?`;
    }

    if (infoCard) {
        const route = (source && destination) ? `${source} ➔ ${destination}` : 'Scheduled Route';
        infoCard.innerHTML = `
            <div class="delete-info-row">
                <span class="delete-info-badge">${escapeHtml(serviceNo)}</span>
                <span class="delete-info-route">${escapeHtml(route)}</span>
            </div>
            <div class="delete-info-id">System Bus ID: #${busId}</div>
        `;
    }

    const confirmBtn = document.getElementById('confirmDeleteBusBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => executeDeleteBus(busId, serviceNo);
    }

    document.getElementById('deleteBusModal').classList.add('active');
}

async function executeDeleteBus(busId, serviceNo) {
    const confirmBtn = document.getElementById('confirmDeleteBusBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
    }

    try {
        const res = await fetch(`/api/buses/${busId}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            closeModal('deleteBusModal');
            showToast(data.message || `Bus ${serviceNo} deleted.`);

            // Refresh fleet table
            loadFleetTable();

            // Refresh cities dropdown
            loadCitiesDropdown();

            // Refresh search results if active
            const fromCity = document.getElementById('fromCity').value.trim();
            const toCity = document.getElementById('toCity').value.trim();
            if (fromCity || toCity) {
                const query = {};
                if (fromCity) query.source = fromCity;
                if (toCity) query.destination = toCity;
                loadBuses(query, fromCity, toCity);
            } else if (currentBuses.length > 0) {
                currentBuses = currentBuses.filter(b => b.bus_id !== busId);
                renderBuses(currentBuses);
            }

            // Refresh bookings if active
            const bookingsTab = document.getElementById('bookingsTab');
            if (bookingsTab && bookingsTab.classList.contains('active')) {
                loadBookings();
            }
        } else {
            showToast(data.message || 'Error deleting bus.', true);
        }
    } catch (err) {
        console.error('Error deleting bus:', err);
        showToast('Connection error deleting bus.', true);
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete Coach';
        }
    }
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
