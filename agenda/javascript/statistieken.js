// statistieken.js - Handles S-team statistics for phone numbers collected at festivals

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const notLoggedInSection = document.getElementById('not-logged-in');
  const userFestivalsSection = document.getElementById('user-festivals-section');
  const noFestivalsSection = document.getElementById('no-festivals');
  const rankingsContainer = document.getElementById('rankingsContainer');
  const userFestivalsContainer = document.getElementById('userFestivalsContainer');
  
  // Modal Elements
  const phoneModal = document.getElementById('phoneModal');
  const modalFestivalName = document.getElementById('modalFestivalName');
  const phoneNumberInput = document.getElementById('phoneNumberInput');
  const submitPhoneNumberBtn = document.getElementById('submitPhoneNumber');
  const closeModalBtn = document.querySelector('.close-modal');
  
  // User authentication check
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('email');
  
  // Festival date information (same as in script.js)
  const festivalDates = {
    "Wavy": "2024-12-21",
    "DGTL": "2025-04-18",
    "Free your mind Kingsday": "2025-04-26",
    "Loveland Kingsday": "2025-04-26",
    "Verbond": "2025-05-05",
    "Awakenings Upclose": "2025-05-17",
    "Soenda": "2025-05-31",
    "Toffler": "2025-05-31",
    "909": "2025-06-07",
    "Diynamic": "2025-06-07",
    "Open Air": "2025-06-08",
    "Free Your Mind": "2025-06-08",
    "Mystic Garden Festival": "2025-06-14",
    "Vunzige Deuntjes": "2025-07-05",
    "KeineMusik": "2025-07-05",
    "Awakenings Festival": "2025-07-11",
    "Tomorrowland": "2025-07-18",
    "Mysteryland": "2025-07-22",
    "No Art": "2025-07-26",
    "Loveland": "2025-08-09",
    "Strafwerk": "2025-08-16",
    "Latin Village": "2025-08-17",
    "Parels van de stad": "2025-09-13",
    "Into the woods": "2025-09-19",
    "PIV": "2025-05-30",
    "Boothstock Festival": "2025-07-12"
  };

  // Helper functions
  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // If user is not logged in, show message
  if (!token || !userEmail) {
    notLoggedInSection.classList.remove('hidden');
    userFestivalsSection.classList.add('hidden');
    rankingsContainer.innerHTML = '<div class="message-box">Log in om de ranglijst te bekijken.</div>';
    return;
  }

  // Initialize modal functionality
  function setupModal() {
    let currentFestival = '';
    let currentPhoneCount = 0;

    // Open modal to add/update phone numbers
    window.openPhoneModal = function(festivalName, currentCount = 0) {
      console.log('Opening modal for festival:', festivalName, 'Current count:', currentCount);
      modalFestivalName.textContent = festivalName;
      currentFestival = festivalName;
      currentPhoneCount = currentCount;
      
      // Set the input to current value if it exists
      phoneNumberInput.value = currentCount;
      
      phoneModal.classList.add('show');
      phoneModal.classList.remove('hidden');
    };

    // Close modal
    function closeModal() {
      phoneModal.classList.remove('show');
      phoneModal.classList.add('hidden');
    }

    // Close button and click outside
    closeModalBtn.addEventListener('click', closeModal);
    phoneModal.addEventListener('click', (e) => {
      if (e.target === phoneModal) {
        closeModal();
      }
    });

    // Submit phone number
    submitPhoneNumberBtn.addEventListener('click', async () => {
      const phoneCount = parseInt(phoneNumberInput.value) || 0;
      
      if (phoneCount < 0) {
        alert('Het aantal telefoonnummers kan niet negatief zijn.');
        return;
      }
      
      console.log('Submitting phone count:', phoneCount, 'for festival:', currentFestival);
      
      try {
        const response = await fetch('/phone-numbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail,
            festival: currentFestival,
            phoneCount: phoneCount
          })
        });
        
        if (response.ok) {
          alert('Telefoonnummers succesvol opgeslagen!');
          closeModal();
          // Refresh data to show the new counts
          await loadData();
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          alert(`Fout bij opslaan: ${errorText}`);
        }
      } catch (error) {
        console.error('Error submitting phone count:', error);
        alert('Netwerkfout bij het opslaan van je gegevens. Probeer het later opnieuw.');
      }
    });
  }

  // Load all rankings and user festivals
  async function loadData() {
    try {
      // 1. Fetch rankings data
      const rankingsResponse = await fetch('/phone-number-rankings');
      
      if (!rankingsResponse.ok) {
        throw new Error(`Server error: ${rankingsResponse.status}`);
      }
      
      const rankingsData = await rankingsResponse.json();
      displayRankings(rankingsData.rankings || []);
      
      // 2. Fetch user's attended festivals
      const userFestivalsResponse = await fetch(`/my-festivals?email=${encodeURIComponent(userEmail)}`);
      
      if (!userFestivalsResponse.ok) {
        throw new Error(`Server error: ${userFestivalsResponse.status}`);
      }
      
      const userFestivalsData = await userFestivalsResponse.json();
      const userFestivals = userFestivalsData.festivals || [];
      
      // 3. Fetch user's phone numbers for each festival
      const phoneNumbersResponse = await fetch(`/my-phone-numbers?email=${encodeURIComponent(userEmail)}`);
      
      if (!phoneNumbersResponse.ok) {
        throw new Error(`Server error: ${phoneNumbersResponse.status}`);
      }
      
      const phoneNumbersData = await phoneNumbersResponse.json();
      const phoneNumbers = phoneNumbersData.phoneNumbers || {};
      
      // 4. Filter to past festivals and display
      displayUserFestivals(userFestivals, phoneNumbers);
      
    } catch (error) {
      console.error('Error loading data:', error);
      rankingsContainer.innerHTML = `
        <div class="message-box">
          Er is een fout opgetreden bij het laden van de gegevens.
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }

  // Display rankings
  function displayRankings(rankings) {
    if (rankings.length === 0) {
      rankingsContainer.innerHTML = `
        <div class="message-box">
          Er zijn nog geen telefoonnummers verzameld.
        </div>
      `;
      return;
    }

    // Sort by total phone numbers (highest first)
    rankings.sort((a, b) => b.totalPhoneNumbers - a.totalPhoneNumbers);

    let html = '';
    rankings.forEach((user, index) => {
      const rankClass = index < 3 ? `rank-${index + 1}` : '';
      const isCurrentUser = user.email === userEmail || user.username === userEmail;
      const currentUserClass = isCurrentUser ? 'current-user' : '';
      
      html += `
        <div class="user-rank-card ${rankClass} ${currentUserClass}">
          <div class="rank-number">#${index + 1}</div>
          <div class="user-info">
            <div class="user-name">${user.username || user.email}</div>
            <div class="user-festivals-count">${user.festivalCount} festivals bijgewoond</div>
          </div>
          <div class="phone-numbers-display">
            <div class="phone-count">${user.totalPhoneNumbers}</div>
            <div class="phone-label">nummers</div>
          </div>
        </div>
      `;
    });

    rankingsContainer.innerHTML = html;
  }

  // Display user festivals
  function displayUserFestivals(festivals, phoneNumbers) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filter to past festivals only
    const pastFestivals = festivals.filter(festName => {
      const dateStr = festivalDates[festName];
      if (!dateStr) return false;
      
      const festDate = new Date(dateStr);
      festDate.setHours(0, 0, 0, 0);
      return festDate < now;
    });
    
    if (pastFestivals.length === 0) {
      userFestivalsSection.classList.add('hidden');
      noFestivalsSection.classList.remove('hidden');
      return;
    }
    
    userFestivalsSection.classList.remove('hidden');
    noFestivalsSection.classList.add('hidden');
    
    // Sort by date (most recent first)
    pastFestivals.sort((a, b) => {
      const dateA = festivalDates[a] ? new Date(festivalDates[a]) : new Date(0);
      const dateB = festivalDates[b] ? new Date(festivalDates[b]) : new Date(0);
      return dateB - dateA;
    });
    
    let html = '';
    pastFestivals.forEach(festName => {
      const dateStr = festivalDates[festName];
      const formattedDate = dateStr ? formatDate(dateStr) : 'Onbekende datum';
      const phoneCount = phoneNumbers[festName] || 0;
      
      html += `
        <div class="user-festival-card">
          <div class="user-festival-info">
            <div class="user-festival-name">${festName}</div>
            <div class="user-festival-date">${formattedDate}</div>
          </div>
          <div class="user-festival-score">
            <div class="current-score">${phoneCount} nummers</div>
            <button class="phone-btn" onclick="openPhoneModal('${festName}', ${phoneCount})">
              ${phoneCount > 0 ? 'Bijwerken' : 'Toevoegen'}
            </button>
          </div>
        </div>
      `;
    });
    
    userFestivalsContainer.innerHTML = html || '<div class="message-box">Geen festivals gevonden.</div>';
  }

  // Initialize
  setupModal();
  await loadData();
});