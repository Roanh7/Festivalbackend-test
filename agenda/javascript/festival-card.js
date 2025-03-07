// festival-card.js - Handles both personal and other users' festival cards

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Personal Card
  const notLoggedInSection = document.getElementById('not-logged-in');
  const myFestivalCard = document.getElementById('my-festival-card');
  const usernameDisplay = document.getElementById('username-display');
  const upcomingCountEl = document.getElementById('upcoming-count');
  const pastCountEl = document.getElementById('past-count');
  const totalCountEl = document.getElementById('total-count');
  
  // DOM Elements - Other Users Section
  const viewOtherUsers = document.getElementById('view-other-users');
  const userFestivalCard = document.getElementById('user-festival-card');
  const backToListBtn = document.getElementById('back-to-list');
  const userCardName = document.getElementById('user-card-name');
  const userUpcomingCount = document.getElementById('user-upcoming-count');
  const userPastCount = document.getElementById('user-past-count');
  const userTotalCount = document.getElementById('user-total-count');
  const userMedals = document.getElementById('user-medals');
  const commonFestivalsList = document.getElementById('common-festivals-list');
  
  // DOM Elements - New Collapsible Users List
  const toggleUsersListBtn = document.getElementById('toggle-users-list');
  const usersListContainer = document.getElementById('users-list-container');
  const usersList = document.getElementById('users-list');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const currentUserEmail = localStorage.getItem('email');
  
  // Festival date information
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
    "PIV": "2025-09-30",
    "Boothstock Festival": "2025-07-12"
  };
  
  // Helper function to format date
  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  // If user is not logged in, show message and return
  if (!token || !currentUserEmail) {
    notLoggedInSection.classList.remove('hidden');
    myFestivalCard.classList.add('hidden');
    viewOtherUsers.classList.add('hidden');
    return;
  }
  
  // If user is logged in, hide message and show cards
  notLoggedInSection.classList.add('hidden');
  myFestivalCard.classList.remove('hidden');
  viewOtherUsers.classList.remove('hidden');
  
  // Load the user's display name (username or email)
  async function loadCurrentUserInfo() {
    try {
      const response = await fetch(`/display-name?email=${encodeURIComponent(currentUserEmail)}`);
      if (response.ok) {
        const data = await response.json();
        usernameDisplay.textContent = data.displayName;
      } else {
        // If unable to get display name, use email
        usernameDisplay.textContent = currentUserEmail;
      }
    } catch (error) {
      console.error('Error fetching display name:', error);
      usernameDisplay.textContent = currentUserEmail;
    }
  }
  
  // Load the user's festival data
  async function loadCurrentUserFestivals() {
    try {
      const response = await fetch(`/my-festivals?email=${encodeURIComponent(currentUserEmail)}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const userFestivals = data.festivals || [];
      
      // Divide festivals into upcoming and past
      const now = new Date();
      let upcomingFests = [];
      let pastFests = [];
      
      userFestivals.forEach(name => {
        const dateStr = festivalDates[name];
        if (!dateStr) return; // Skip if festival date is not defined
        
        const festDate = new Date(dateStr);
        if (festDate > now) {
          upcomingFests.push(name);
        } else {
          pastFests.push(name);
        }
      });
      
      // Update the counters
      upcomingCountEl.textContent = upcomingFests.length;
      pastCountEl.textContent = pastFests.length;
      totalCountEl.textContent = userFestivals.length;
      
      // Update medals based on total past festivals
      updateMedals(pastFests.length, 'medal');
      
      return {
        upcoming: upcomingFests,
        past: pastFests,
        all: userFestivals
      };
    } catch (error) {
      console.error('Error fetching festival data:', error);
      
      // Show error message to user
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Er is een probleem opgetreden bij het laden van je festival gegevens.';
      myFestivalCard.appendChild(errorDiv);
      
      return { upcoming: [], past: [], all: [] };
    }
  }
  
  // Update medal display based on achievement
  function updateMedals(pastCount, elementIdPrefix) {
    // Define medal thresholds and their element IDs
    const medals = [
      { threshold: 1, id: `${elementIdPrefix}-1` },
      { threshold: 3, id: `${elementIdPrefix}-3` },
      { threshold: 5, id: `${elementIdPrefix}-5` },
      { threshold: 10, id: `${elementIdPrefix}-10` },
      { threshold: 15, id: `${elementIdPrefix}-15` },
      { threshold: 20, id: `${elementIdPrefix}-20` },
      { threshold: 21, id: `${elementIdPrefix}-20plus` } // 21+ festivals
    ];
    
    // Update each medal's appearance based on achievement
    medals.forEach(medal => {
      const medalElement = document.getElementById(medal.id);
      if (!medalElement) return;
      
      const statusElement = medalElement.querySelector('.medal-status');
      
      if (pastCount >= medal.threshold) {
        // Medal earned
        medalElement.classList.add('earned');
        statusElement.textContent = 'Behaald!';
      } else {
        // Medal not earned
        medalElement.classList.remove('earned');
        
        // Calculate how many more festivals needed
        const remaining = medal.threshold - pastCount;
        statusElement.textContent = `Nog ${remaining} te gaan`;
      }
    });
  }
  
  // Create user medals HTML for other users' cards
  function createMedalsHTML(pastCount) {
    const medalConfigs = [
      { threshold: 1, icon: "🥉", label: "Eerste Festival" },
      { threshold: 3, icon: "🥈", label: "3 Festivals" },
      { threshold: 5, icon: "🥇", label: "5 Festivals" },
      { threshold: 10, icon: "🏆", label: "10 Festivals" },
      { threshold: 15, icon: "💎", label: "15 Festivals" },
      { threshold: 20, icon: "👑", label: "20 Festivals" },
      { threshold: 21, icon: "⭐", label: "Festival Legende" }
    ];
    
    let html = '';
    
    medalConfigs.forEach(medal => {
      const earned = pastCount >= medal.threshold;
      const earnedClass = earned ? 'earned' : '';
      const status = earned ? 'Behaald!' : `Nog ${medal.threshold - pastCount} te gaan`;
      
      html += `
        <div class="medal ${earnedClass}">
          <div class="medal-icon">${medal.icon}</div>
          <div class="medal-label">${medal.label}</div>
          <div class="medal-status">${status}</div>
        </div>
      `;
    });
    
    return html;
  }
  
  // New function to load all users
  async function loadAllUsers() {
    try {
      // Show loading indicator
      usersList.innerHTML = '<div class="loading-indicator">Gebruikers laden...</div>';
      
      // Fetch all users from the server
      const response = await fetch('/all-users');
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const users = data.users || [];
      
      // Clear loading indicator
      usersList.innerHTML = '';
      
      // If no users found
      if (users.length === 0) {
        usersList.innerHTML = '<div class="loading-indicator">Geen gebruikers gevonden</div>';
        return;
      }
      
      // Display all users
      users.forEach(user => {
        // Skip the current user
        if (user.email === currentUserEmail) return;
        
        const displayName = user.username || user.email;
        const initial = displayName.charAt(0).toUpperCase();
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.email = user.email;
        userItem.innerHTML = `
          <div class="user-avatar">${initial}</div>
          <div class="user-details">
            <div class="user-item-name">${displayName}</div>
            ${user.username ? `<div class="user-item-email">${user.email}</div>` : ''}
          </div>
        `;
        
        // Add click event to view user's festival card
        userItem.addEventListener('click', () => {
          loadUserFestivalCard(user.email, displayName);
        });
        
        usersList.appendChild(userItem);
      });
    } catch (error) {
      console.error('Error loading users:', error);
      usersList.innerHTML = `
        <div class="loading-indicator">
          Er is een probleem opgetreden bij het laden van gebruikers.
        </div>
      `;
    }
  }
  
  // Load user's festival card
  async function loadUserFestivalCard(userEmail, displayName) {
    // Hide users list and show user festival card
    usersListContainer.classList.remove('active');
    userFestivalCard.classList.remove('hidden');
    
    // Update user card title
    userCardName.textContent = `${displayName}'s Festival Card`;
    
    try {
      // Get user's festivals
      const response = await fetch(`/my-festivals?email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const userFestivals = data.festivals || [];
      
      // Divide festivals into upcoming and past
      const now = new Date();
      let upcomingFests = [];
      let pastFests = [];
      
      userFestivals.forEach(name => {
        const dateStr = festivalDates[name];
        if (!dateStr) return; // Skip if festival date is not defined
        
        const festDate = new Date(dateStr);
        if (festDate > now) {
          upcomingFests.push(name);
        } else {
          pastFests.push(name);
        }
      });
      
      // Update the counters
      userUpcomingCount.textContent = upcomingFests.length;
      userPastCount.textContent = pastFests.length;
      userTotalCount.textContent = userFestivals.length;
      
      // Update medals
      userMedals.innerHTML = createMedalsHTML(pastFests.length);
      
      // Find common festivals between current user and selected user
      const currentUserData = await loadCurrentUserFestivals();
      const commonFestivals = userFestivals.filter(festival => 
        currentUserData.all.includes(festival)
      );
      
      // Display common festivals
      if (commonFestivals.length === 0) {
        commonFestivalsList.innerHTML = `
          <div class="no-common-festivals">
            Geen gemeenschappelijke festivals gevonden.
          </div>
        `;
      } else {
        commonFestivalsList.innerHTML = '';
        
        // Sort common festivals chronologically
        commonFestivals.sort((a, b) => {
          const dateA = festivalDates[a] ? new Date(festivalDates[a]) : new Date(0);
          const dateB = festivalDates[b] ? new Date(festivalDates[b]) : new Date(0);
          return dateA - dateB;
        });
        
        commonFestivals.forEach(festival => {
          const dateStr = festivalDates[festival];
          const festivalElement = document.createElement('div');
          festivalElement.className = 'common-festival-item';
          
          const formattedDate = dateStr ? formatDate(dateStr) : 'Onbekende datum';
          
          festivalElement.innerHTML = `
            <div class="common-festival-name">${festival}</div>
            <div class="common-festival-date">${formattedDate}</div>
          `;
          
          commonFestivalsList.appendChild(festivalElement);
        });
      }
      
    } catch (error) {
      console.error('Error loading user festival card:', error);
      userFestivalCard.innerHTML = `
        <div class="error-message">
          Er is een probleem opgetreden bij het laden van deze Festival Card.
        </div>
      `;
    }
  }
  
  // Initialize the page
  loadCurrentUserInfo();
  loadCurrentUserFestivals();
  
  // Set up collapsible users list
  toggleUsersListBtn.addEventListener('click', () => {
    // Toggle active class on button
    toggleUsersListBtn.classList.toggle('active');
    
    // Toggle active class on content
    const isActive = usersListContainer.classList.toggle('active');
    
    // Toggle icon text
    const icon = toggleUsersListBtn.querySelector('.collapsible-icon');
    icon.textContent = isActive ? '▲' : '▼';
    
    // Load users when opening for the first time
    if (isActive && usersList.children.length === 0) {
      loadAllUsers();
    }
  });
  
  // Back to list button
  backToListBtn.addEventListener('click', () => {
    userFestivalCard.classList.add('hidden');
    usersListContainer.classList.add('active');
  });
  
  // We need to add this endpoint to index.js
  // Add this to index.js:
  /*
  // GET /all-users => get list of all registered users (for festival cards)
  app.get('/all-users', async (req, res) => {
    try {
      const result = await client.query(
        'SELECT email, username FROM users ORDER BY COALESCE(username, email)'
      );
      
      const users = result.rows;
      res.json({ users });
    } catch (err) {
      console.error('Error in /all-users:', err);
      res.status(500).json({ message: 'Could not get users list' });
    }
  });
  */
});