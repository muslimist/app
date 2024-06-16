document.addEventListener('DOMContentLoaded', function() {
    const PrayTimes = window.PrayTimes; // Ensure PrayTimes is accessible

    const athanAudio = document.getElementById('athanAudio');
    const duaaAudio = document.getElementById('duaaAudio');
    const startButton = document.getElementById('startButton');
    const currentTimeDisplay = document.getElementById('current-time');
    const currentPrayerTimeDisplay = document.getElementById('current-prayer-time');
    const timeLeftDisplay = document.getElementById('time-left');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalButton = document.querySelector('.close');
    const getLocationButton = document.getElementById('getLocationButton');
    const fullscreenButton = document.getElementById('fullscreenButton');
    const prayerTimesElements = {
        fajr: document.getElementById('fajr'),
        dhuhr: document.getElementById('dhuhr'),
        asr: document.getElementById('asr'),
        maghrib: document.getElementById('maghrib'),
        isha: document.getElementById('isha')
    };
    const athanSettings = {
        fajr: document.getElementById('fajrAthan'),
        dhuhr: document.getElementById('dhuhrAthan'),
        asr: document.getElementById('asrAthan'),
        maghrib: document.getElementById('maghribAthan'),
        isha: document.getElementById('ishaAthan')
    };
    const duaaIntervalSetting = document.getElementById('duaaInterval');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const timezoneSetting = document.getElementById('timezone');
    const dstSetting = document.getElementById('dst');
    const calculationMethodSetting = document.getElementById('calculationMethod');
    const backgroundIntervalSetting = document.getElementById('backgroundInterval');
    const duaaFiles = ['eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'eid.mp3', 'duaa_a.wav', 'duaa_b.wav', 'duaa_c.wav', 'duaa_d.wav', 'duaa_e.wav', 'duaa_f.wav', 'duaa_g.wav', 'duaa_h.wav', 'duaa_i.wav', 'duaa_j.wav', 'duaa_k.wav'];

    let lastCheckedSecond = null;
    let lastPlayedPrayer = null;
    let lastDuaaTime = 0;
    let backgroundChangeTimeout;
    let wakeLock = null;

    // Initialize settings in local storage if not already set
    function initializeSettings() {
        for (const prayer in athanSettings) {
            if (!localStorage.getItem(`${prayer}Athan`)) {
                localStorage.setItem(`${prayer}Athan`, athanSettings[prayer].value);
            } else {
                athanSettings[prayer].value = localStorage.getItem(`${prayer}Athan`);
            }
        }
        if (!localStorage.getItem('duaaInterval')) {
            localStorage.setItem('duaaInterval', duaaIntervalSetting.value);
        } else {
            duaaIntervalSetting.value = localStorage.getItem('duaaInterval');
        }
        if (!localStorage.getItem('latitude')) {
            localStorage.setItem('latitude', latitudeInput.value);
        } else {
            latitudeInput.value = localStorage.getItem('latitude');
        }
        if (!localStorage.getItem('longitude')) {
            localStorage.setItem('longitude', longitudeInput.value);
        } else {
            longitudeInput.value = localStorage.getItem('longitude');
        }
        if (!localStorage.getItem('timezone')) {
            localStorage.setItem('timezone', timezoneSetting.value);
        } else {
            timezoneSetting.value = localStorage.getItem('timezone');
        }
        if (!localStorage.getItem('dst')) {
            localStorage.setItem('dst', dstSetting.value);
        } else {
            dstSetting.value = localStorage.getItem('dst');
        }
        if (!localStorage.getItem('calculationMethod')) {
            localStorage.setItem('calculationMethod', calculationMethodSetting.value);
        } else {
            calculationMethodSetting.value = localStorage.getItem('calculationMethod');
        }
        if (!localStorage.getItem('backgroundInterval')) {
            localStorage.setItem('backgroundInterval', backgroundIntervalSetting.value);
        } else {
            backgroundIntervalSetting.value = localStorage.getItem('backgroundInterval');
        }
    }

    // Load settings from local storage
    function loadSettings() {
        for (const prayer in athanSettings) {
            const savedValue = localStorage.getItem(`${prayer}Athan`);
            if (savedValue) {
                athanSettings[prayer].value = savedValue;
            }
        }
        duaaIntervalSetting.value = localStorage.getItem('duaaInterval');
        latitudeInput.value = localStorage.getItem('latitude');
        longitudeInput.value = localStorage.getItem('longitude');
        timezoneSetting.value = localStorage.getItem('timezone');
        dstSetting.value = localStorage.getItem('dst');
        calculationMethodSetting.value = localStorage.getItem('calculationMethod');
        backgroundIntervalSetting.value = localStorage.getItem('backgroundInterval');
    }

    // Save settings to local storage
    function saveSettings() {
        for (const prayer in athanSettings) {
            localStorage.setItem(`${prayer}Athan`, athanSettings[prayer].value);
        }
        localStorage.setItem('duaaInterval', duaaIntervalSetting.value);
        localStorage.setItem('latitude', latitudeInput.value);
        localStorage.setItem('longitude', longitudeInput.value);
        localStorage.setItem('timezone', timezoneSetting.value);
        localStorage.setItem('dst', dstSetting.value);
        localStorage.setItem('calculationMethod', calculationMethodSetting.value);
        localStorage.setItem('backgroundInterval', backgroundIntervalSetting.value);
        console.log('Settings saved');
    }

    // Autosave settings on change and recalculate prayer times
    function handleSettingsChange() {
        saveSettings();
        calculatePrayerTimes();
        resetBackgroundChangeInterval();
    }

    for (const prayer in athanSettings) {
        athanSettings[prayer].addEventListener('change', saveSettings);
    }
    duaaIntervalSetting.addEventListener('change', saveSettings);
    latitudeInput.addEventListener('change', handleSettingsChange);
    longitudeInput.addEventListener('change', handleSettingsChange);
    timezoneSetting.addEventListener('change', handleSettingsChange);
    dstSetting.addEventListener('change', handleSettingsChange);
    calculationMethodSetting.addEventListener('change', handleSettingsChange);
    backgroundIntervalSetting.addEventListener('change', handleSettingsChange);

    // Open and close settings modal
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Get current location
    getLocationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                latitudeInput.value = position.coords.latitude.toFixed(6);
                longitudeInput.value = position.coords.longitude.toFixed(6);
                handleSettingsChange();
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // Fullscreen toggle
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });

    // Screen Wake Lock
    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Screen Wake Lock released');
            });
            console.log('Screen Wake Lock is active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    // Calculate and display prayer times
    function calculatePrayerTimes() {
        const prayTimes = new PrayTimes(calculationMethodSetting.value);
        const times = prayTimes.getTimes(new Date(), [latitudeInput.value, longitudeInput.value], timezoneSetting.value, dstSetting.value === 'auto' ? 'auto' : parseInt(dstSetting.value, 10));

        // Filter only the five daily prayers
        const filteredTimes = {
            fajr: times.fajr,
            dhuhr: times.dhuhr,
            asr: times.asr,
            maghrib: times.maghrib,
            isha: times.isha
        };

        for (const [prayer, time] of Object.entries(filteredTimes)) {
            prayerTimesElements[prayer].textContent = time;
        }
        return filteredTimes; // Return filtered times for further processing
    }

    function getCurrentAndNextPrayerTimes(times) {
        const now = new Date();
        const today = now.toDateString();
        const currentDateTime = new Date(`${today} ${now.toTimeString().split(' ')[0]}`);
        let currentPrayer = null;
        let nextPrayer = null;
        let nextPrayerTime = null;

        const prayerTimes = Object.keys(times).map(prayer => ({
            name: prayer,
            time: new Date(`${today} ${times[prayer]}`)
        })).sort((a, b) => a.time - b.time);

        for (let i = 0; i < prayerTimes.length; i++) {
            if (prayerTimes[i].time > currentDateTime) {
                nextPrayer = prayerTimes[i].name;
                nextPrayerTime = prayerTimes[i].time;
                break;
            } else {
                currentPrayer = prayerTimes[i].name;
            }
        }

        // If no more prayers for today, the next prayer is tomorrow's Fajr
        if (!nextPrayer) {
            nextPrayer = 'fajr';
            nextPrayerTime = new Date(new Date().setDate(now.getDate() + 1));
            nextPrayerTime.setHours(...times.fajr.split(':').map(Number));
        }

        return { currentPrayer, nextPrayer, nextPrayerTime };
    }

    function getTimeLeftUntil(nextPrayerTime) {
        const now = new Date();
        let diffMs = nextPrayerTime - now;

        // If the next prayer time is in the past, adjust it to the next day
        if (diffMs < 0) {
            nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
            diffMs = nextPrayerTime - now;
        }

        const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
        const diffMins = Math.floor(((diffMs % 86400000) % 3600000) / 60000);
        const diffSecs = Math.floor((((diffMs % 86400000) % 3600000) % 60000) / 1000);

        return `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
    }

    function getRandomDuaaFile() {
        const randomIndex = Math.floor(Math.random() * duaaFiles.length);
        return duaaFiles[randomIndex];
    }

    function playAthan(prayer) {
        const athanFile = athanSettings[prayer].value;
        if (athanFile === 'none') {
            console.log(`Skipping athan for ${prayer} (set to none)`);
            return;
        }

        console.log(`Playing athan for ${prayer}: ${athanFile}`);
        duaaAudio.pause();
        athanAudio.src = `athan/${athanFile}`;
        athanAudio.play().catch(error => console.error('Audio play error:', error));

        // Ensure duaa is not played while athan is playing
        athanAudio.onended = () => {
            console.log(`Athan for ${prayer} ended`);
        };
    }

    function checkPrayerTimes() {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS format

        const times = calculatePrayerTimes();
        const { currentPrayer, nextPrayer, nextPrayerTime } = getCurrentAndNextPrayerTimes(times);

        if (currentPrayer) {
            currentPrayerTimeDisplay.textContent = `Current Prayer: ${currentPrayer.charAt(0).toUpperCase() + currentPrayer.slice(1)}`;
        } else {
            currentPrayerTimeDisplay.textContent = `Current Prayer: None`;
        }
        timeLeftDisplay.textContent = `Time Left: ${getTimeLeftUntil(nextPrayerTime)}`;

        if (currentTime === times.fajr && lastPlayedPrayer !== 'fajr') {
            console.log('Time for Fajr prayer');
            playAthan('fajr');
            lastPlayedPrayer = 'fajr';
        } else if (currentTime === times.dhuhr && lastPlayedPrayer !== 'dhuhr') {
            console.log('Time for Dhuhr prayer');
            playAthan('dhuhr');
            lastPlayedPrayer = 'dhuhr';
        } else if (currentTime === times.asr && lastPlayedPrayer !== 'asr') {
            console.log('Time for Asr prayer');
            playAthan('asr');
            lastPlayedPrayer = 'asr';
        } else if (currentTime === times.maghrib && lastPlayedPrayer !== 'maghrib') {
            console.log('Time for Maghrib prayer');
            playAthan('maghrib');
            lastPlayedPrayer = 'maghrib';
        } else if (currentTime === times.isha && lastPlayedPrayer !== 'isha') {
            console.log('Time for Isha prayer');
            playAthan('isha');
            lastPlayedPrayer = 'isha';
        }
    }

    function updateCurrentTime() {
        const now = new Date();
        currentTimeDisplay.textContent = now.toTimeString().substring(0, 8); // HH:MM:SS format
    }

    function checkTime() {
        const now = new Date();
        const seconds = now.getSeconds();
        const currentTime = now.getTime();

        // Ensure we only check each second once
        if (seconds !== lastCheckedSecond) {
            lastCheckedSecond = seconds;

            checkPrayerTimes();
            updateCurrentTime();

            const duaaInterval = parseInt(localStorage.getItem('duaaInterval'), 10) * 1000; // Convert seconds to milliseconds
            if (currentTime - lastDuaaTime >= duaaInterval) {
                const athanIsPlaying = !athanAudio.paused && !athanAudio.ended && athanAudio.currentTime > 0;
                const duaaIsPlaying = !duaaAudio.paused && !duaaAudio.ended && duaaAudio.currentTime > 0;

                if (athanIsPlaying || duaaIsPlaying) {
                    console.log('Skipping duaa due to athan or another duaa playing');
                } else {
                    const duaaFile = getRandomDuaaFile();
                    console.log(`Playing random duaa: ${duaaFile}`);
                    duaaAudio.src = 'duaa/' + duaaFile;
                    duaaAudio.play().catch(error => console.error('Audio play error:', error));
                    lastDuaaTime = currentTime;
                }
            }
        }
    }

    function getRandomBackground() {
        const randomIndex = Math.floor(Math.random() * 10) + 1;
        document.body.style.backgroundImage = `url('bg/bg${randomIndex}.jpg')`;
    }

    function resetBackgroundChangeInterval() {
        clearTimeout(backgroundChangeTimeout);
        const interval = parseInt(localStorage.getItem('backgroundInterval'), 10) * 1000;
        backgroundChangeTimeout = setTimeout(() => {
            getRandomBackground();
            resetBackgroundChangeInterval();
        }, interval);
    }

    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        setInterval(checkTime, 200); // Check the time every 200 milliseconds
        startButton.style.display = 'none';
        resetBackgroundChangeInterval();
        requestWakeLock();
    });

    initializeSettings(); // Initialize settings if not already set
    loadSettings(); // Load settings on page load
    calculatePrayerTimes(); // Calculate and display prayer times
    getRandomBackground(); // Set initial random background
});
