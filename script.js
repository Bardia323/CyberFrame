let soundEnabled = true;
const audioFiles = Array.from({ length: 31 }, (_, i) => `clicks/segment_${i + 1}.opus`);
let currentVolume = 0.5;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, (err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function overrideTab(event) {
    const textArea = event.target;
    const fullText = textArea.value;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const beforeSelection = fullText.substring(0, start);
    const selection = fullText.substring(start, end);
    const afterSelection = fullText.substring(end);

    if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
            // Shift+Tab: Remove three spaces from the start of the current line or each selected line
            const startOfLine = beforeSelection.lastIndexOf('\n') + 1;
            const endOfLine = end + (afterSelection.indexOf('\n') === -1 ? afterSelection.length : afterSelection.indexOf('\n'));

            const beforeLine = fullText.substring(0, startOfLine);
            const currentLine = fullText.substring(startOfLine, endOfLine);
            const afterLine = fullText.substring(endOfLine);

            // Remove up to three leading spaces from the current line
            const modifiedLine = currentLine.replace(/^( {0,3})/, '');
            textArea.value = beforeLine + modifiedLine + afterLine;

            // Update selection
            textArea.selectionStart = start - (currentLine.length - modifiedLine.length);
            textArea.selectionEnd = end - (currentLine.length - modifiedLine.length);
        } else {
            // Tab: Insert three spaces at the cursor position
            const tabSpaces = "   ";
            textArea.value = beforeSelection + tabSpaces + selection + afterSelection;
            const newCursorPos = start + tabSpaces.length;
            textArea.selectionStart = textArea.selectionEnd = newCursorPos;
        }
    }
}




function checkTextDirection(input) {
    const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u07BF\uFB50-\uFDFF\uFE70-\uFEFF\u200F]/gm;
    const containsRTL = rtlChars.test(input);
    const textArea = document.getElementById('textArea');
    
    if (containsRTL) {
        textArea.style.direction = "rtl";
        textArea.style.textAlign = "right";
    } else {
        textArea.style.direction = "ltr";
        textArea.style.textAlign = "left";
    }
}




function setVolume(volume) {
    currentVolume = volume;
}


const positiveAdjectives = [
    'Distinguished', 'Awesome', 'Respectable', 'Admirable', 'Amazing',
    'Brilliant', 'Charming', 'Delightful', 'Excellent', 'Fabulous',
    'Fantastic', 'Glorious', 'Great', 'Incredible', 'Marvelous',
    'Outstanding', 'Phenomenal', 'Remarkable', 'Sensational', 'Spectacular',
    'Splendid', 'Superb', 'Terrific', 'Wonderful', 'Radiant',
    'Vibrant', 'Impressive', 'Magnificent', 'Flawless', 'Graceful',
    'Joyful', 'Luminous', 'Majestic', 'Noble', 'Peaceful',
    'Pristine', 'Refreshing', 'Resplendent', 'Serene', 'Sparkling',
    'Spirited', 'Stupendous', 'Sublime', 'Thrilling', 'Triumphant',
    'Uplifting', 'Venerable', 'Virtuous', 'Wondrous'
  ];
  
  const synonymsForClient = [
    'Client', 'Friend', 'Homie', 'Buddy', 'Pal',
    'Mate', 'Companion', 'Comrade', 'Partner', 'Associate',
    'Ally', 'Confidant', 'Acquaintance', 'Cohort', 'Collaborator',
    'Colleague', 'Contact', 'Croney', 'Fellow', 'Sidekick',
    'Bro', 'Amigo', 'Chum', 'Compeer', 'Confidante',
    'Cuz', 'Fella', 'Homeboy', 'Homegirl', 'Kin',
    'Peep', 'Compadre', 'Playmate', 'Roomie', 'Soulmate',
    'Peer', 'Neighbor', 'Squad', 'Posse', 'Clique',
    'Clubmate', 'Teammate', 'Shipmate', 'Schoolmate', 'Classmate',
    'Tribe', 'Crew', 'Groupmate', 'Bestie'
  ];

function getRandomWord(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function updateWordCount() {
    const text = document.getElementById('textArea').value;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    document.getElementById('wordCounter').innerText = `Word Counter: ${words}`;
}

function generateFilename() {
    const adjective = getRandomWord(positiveAdjectives);
    const clientSynonym = getRandomWord(synonymsForClient);
    return `for_${adjective}_${clientSynonym}.txt`;
}


function saveFile() {
    const text = document.getElementById('textArea').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = generateFilename();
    a.click();
    playSound();
}


function loadFile() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('textArea').value = e.target.result;
            updateWordCount();
            playSound();
        };
        reader.readAsText(file);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.querySelector('#menu button:nth-child(3)').textContent = soundEnabled ? 'Disable Sound' : 'Enable Sound';
    playSound();
}

function playSound(file) {
    if (soundEnabled && file) {
        const audio = new Audio(file);
        audio.currentTime = 0;
        audio.play();
        audio.volume = currentVolume;
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 200); // Stop after 0.2 seconds
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

document.getElementById('textArea').addEventListener('input', (event) => {
    checkTextDirection(event.target.value); // Check and adjust text direction on input
});




document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveFile();
        return;
    }
    
    overrideTab(event);

    let file;
    if (event.code === 'Space') {
        file = 'clicks/segment_4.opus';
    } else if (event.code === 'Backspace') {
        file = 'clicks/segment_18.opus';
    } else if (event.code === 'Enter') {
        file = 'clicks/segment_25.opus';
    } else if (event.code === 'ShiftLeft') {
        file = null;
    } else if (event.code === 'ShiftRight') {
        file = null;
    }
    else {
        const otherFiles = audioFiles.filter(f => f !== 'clicks/segment_4.opus' && f !== 'clicks/segment_18.opus'  && f !== 'clicks/segment_25.opus');
        file = otherFiles[Math.floor(Math.random() * otherFiles.length)];
    }
    playSound(file);
});
