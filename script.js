let debounceTimer;
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

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('visible');
    } else {
        mobileMenu.classList.remove('visible');
        mobileMenu.classList.add('hidden');
    }
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

  const wackyItems = ["Blink", "Fizz", "Jolt", "Zap", "Boing", "Zing", "Quirk", "Whizz", "Gloop", "Clank", "Splat", "Glitch", "Plop", "Zonk", "Squib", "Fuzz", "Spork", "Wobble", "Glop", "Blob", "Ping", "Blip", "Wham", "Ploop", "Thunk", "Zoom", "Swish", "Twist", "Jive", "Snip", "Flick", "Blitz", "Jazz", "Ding", "Whiz", "Pop", "Quack", "Bop", "Snazzy", "Loom", "Quip", "Zap", "Swoosh", "Ping", "Whip", "Zing", "Zip", "Clonk", "Buzz", "Quirk"];

function getRandomWord(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function updateWordCount() {
    const words = currentBranch.text.split(/\s+/).filter(word => word.length > 0).length;
    document.getElementById('wordCounter').innerText = `Word Counter: ${words}`;
}


function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateFilename() {
    const currentDate = getCurrentDate();
    if (branches.root.title === "root") {
        const adjective = getRandomWord(positiveAdjectives);
        const clientSynonym = getRandomWord(synonymsForClient);
        return `${currentDate}_${adjective}_${clientSynonym}.txt`;
    } else {
        return `${branches.root.title}.txt`;
    }
}


function generateReST(branch, level = 1) {
    let restContent = '';

    const title = branch.title;
    const underline = '$+=' + '='.repeat(level*2) + '+$';

    if (level === 1) {
        restContent += `${title}\n${underline}\n${branch.text}\n\n`;
    } else {
        const subUnderline = '$+-' + '-'.repeat(level*2) + '+$';
        restContent += `${title}\n${subUnderline}\n${branch.text}\n\n`;
    }

    branch.children.forEach(child => {
        restContent += generateReST(child, level + 1);
    });

    return restContent;
}

function saveFile() {
    let content;
    if (branches.root.children.length === 0) {
        content = branches.root.text;
    } else {
        content = generateReST(branches.root);
    }

    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([BOM, content], { type: 'text/plain;charset=UTF-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = generateFilename();
    a.click();
    playSound();
}

function parseReST(content) {
    const lines = content.split('\n');
    let root = { title: 'root', text: '', children: [], path: '' };
    let stack = [root];
    let currentText = [];
    let expectingText = false;
    let underlineLevels = {};

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Check for title underlines
        if (trimmedLine.match(/^\$\+[\=\-]+\+\$$/)) {
            if (currentText.length > 0) {
                const lastLine = currentText.pop().trim();
                const cleanUnderline = trimmedLine.slice(2, -2); // Remove '$+' and '+$'
                if (!underlineLevels[cleanUnderline]) {
                    underlineLevels[cleanUnderline] = Object.keys(underlineLevels).length + 1;
                }
                const level = underlineLevels[cleanUnderline];

                while (level < stack.length) {
                    stack.pop();
                }

                if (level > stack.length) {
                    console.error("Structure error: skipping levels is not allowed.");
                    return root;
                }

                const newBranch = { title: lastLine, text: '', children: [], path: stack[stack.length - 1].path + '/' + lastLine };
                stack[stack.length - 1].children.push(newBranch);
                stack.push(newBranch);
                expectingText = true;
            }
        } else if (!trimmedLine && expectingText) {
            // Only add a newline to text if we're expecting text and there's something to add
            if (currentText.length) {
                stack[stack.length - 1].text += currentText.join('\n') + '\n\n';
                currentText = [];
            }
        } else {
            currentText.push(line);
        }
    });

    // Handle any remaining text
    if (currentText.length > 0) {
        stack[stack.length - 1].text += currentText.join('\n');
    }

    return root.children.length > 0 ? root.children[0] : root;
}


function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            try {
                const parsedRoot = parseReST(content);
                if (parsedRoot.title === 'root' && parsedRoot.children.length === 0 && !parsedRoot.text) {
                    throw new Error("Parsing failed, loading raw content");
                }
                branches.root = parsedRoot; // This should reset or overwrite correctly
            } catch (error) {
                // If parsing fails or results in incorrect structure, load raw content
                branches.root = { title: 'root', text: content, children: [] };
            }
            currentBranch = branches.root;
            navigationStack = [branches.root];
            updateTextArea();
            updateDirectoryTree();
            playSound();
        };
        reader.readAsText(file);
    }
}


function loadFile() {
    document.getElementById('fileInput').click();
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
    currentBranch.text = event.target.value;  // Save the current text to the current branch
    checkTextDirection(event.target.value);   // Check and adjust text direction on input
    updateWordCount();                        // Update word count display
    
});

document.getElementById('textArea').addEventListener('input', (event) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentBranch.text = event.target.value;  // Save the current text to the current branch only after a pause in typing
        checkTextDirection(event.target.value);   // Check and adjust text direction on input
        updateWordCount();                        // Update word count display
    }, 300);  // Delay in milliseconds (e.g., 300 ms)
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

// BRANCHING

let branches = {
    root: {
        title: "root",
        text: "",
        children: [],
        path:""
    }
};

let currentBranch = branches.root;
let navigationStack = [branches.root];  // Initialize with root in the stack


function createNewBranch() {
    const textArea = document.getElementById('textArea');
    const selection = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd).trim();
    let title, path, newBranch;

    if (!selection) {
        title = getRandomWord(wackyItems);  // Default title, consider prompting the user or generating a unique title
        path = currentBranch.path + '/' + title;
        title = getUniqueSiblingTitle(title, currentBranch);
        newBranch = getOrCreateBranch(title, path);
        linkBranchToParent(newBranch);
        navigateToBranch(newBranch);
        return;
    }

    title = getBranchTitle(selection);
    path = currentBranch.path + '/' + title;
    title = getUniqueSiblingTitle(title, currentBranch);
    newBranch = getOrCreateBranch(title, path);
    linkBranchToParent(newBranch);
    updateBranchContent(textArea, selection, newBranch);
    navigateToBranch(newBranch);
}


function navigateToChildBranch() {
    if (currentBranch.children.length > 0) {
        currentBranch = currentBranch.children[0];
        navigationStack.push(currentBranch);
        updateView();
    } else {
        createNewBranch();  // Create a new branch if no children are available
    }
}

function navigateToBranch(branch) {
    navigationStack.push(branch);
    currentBranch = branch;
    updateView();
}

function linkBranchToParent(branch) {
    if (!branch.parent) {
        currentBranch.children.push(branch);
    }
}

function updateBranchContent(textArea, selection, newBranch) {
    let beforeSelection = textArea.value.substring(0, textArea.selectionStart);
    let afterSelection = textArea.value.substring(textArea.selectionEnd);
    let newText = beforeSelection + afterSelection;
    textArea.value = newText.trim(); // Update the textarea's value
    currentBranch.text = newText.trim();
    newBranch.text = selection;
}


function updateView() {
    updateTextArea();
    updateDirectoryTree();
}

function getBranchTitle(selection) {
    let title = selection.split(/\n/)[0].split(/\s+/).slice(0, 3).join(" ");
    return title.length > 20 ? title.substring(0, 20) : title;
}


function getOrCreateBranch(title, path) {
    let index = 1;
    while (currentBranch.children.some(branch => branch.title === title)) {
        let existingBranch = currentBranch.children.find(branch => branch.title === title);
        if (existingBranch) return existingBranch;
        title = `${title} (${index++})`;
    }
    return {
        title: title,
        path: path,
        text: "",
        children: []
    };
}

function getUniqueSiblingTitle(baseTitle, currentBranch) {
    let title = baseTitle;
    let index = 1;
    while (currentBranch.children.some(branch => branch.title === title)) {
        title = `${baseTitle} (${index++})`;
    }
    return title;
}

function goToPreviousBranch() {
    if (navigationStack.length <= 1) {
        alert("You are already at the root branch.");
        return;
    }

    navigationStack.pop();  // Remove the current branch from the stack
    currentBranch = navigationStack[navigationStack.length - 1];  // Set the current branch to the last element of the stack
    updateTextArea();
    updateDirectoryTree();
}


function getUniqueBranchTitle(baseTitle) {
    let title = baseTitle;
    let index = 1;
    while (currentBranch.children.some(branch => branch.title === title)) {
        title = `${baseTitle} (${index++})`;
    }
    return title;
}

function findParentBranch(root, targetBranch) {
    if (root.children.includes(targetBranch)) {
        return root;
    }
    for (let child of root.children) {
        const result = findParentBranch(child, targetBranch);
        if (result) return result;
    }
    return null;
}

function updateTextArea() {
    const textArea = document.getElementById('textArea');
    textArea.value = currentBranch.text;
    document.getElementById('branchTitle').value = currentBranch.title;
    updateWordCount();
}

function updateBranchTitle() {
    const newTitle = document.getElementById('branchTitle').value;
    if (newTitle.length > 20) {
        alert('Title must be 20 characters or less.');
        return;
    }
    if (findSiblingWithTitle(newTitle, currentBranch)) {
        alert('A sibling with this title already exists. Please choose a different title.');
        return;
    }
    currentBranch.title = newTitle;
    updateDirectoryTree();
}

function findSiblingWithTitle(title, branch) {
    const parentBranch = findParentBranch(branches.root, branch);
    return parentBranch && parentBranch.children.some(child => child !== branch && child.title === title);
}

function updateDirectoryTree() {
    const treeContainer = document.getElementById('directoryTree');
    treeContainer.innerHTML = generateCurrentBranchTreeHTML(currentBranch);
}

function generateCurrentBranchTreeHTML(branch) {
    let html = '';

    // Find and display parent branch if not at root
    if (navigationStack.length > 1) {
        const parentBranch = navigationStack[navigationStack.length - 2];
        html += `<div class="branch-link" onclick="switchBranch('${parentBranch.path}')"><b>Parent:</b> ${parentBranch.title}</div>`;
    }

    // Display current branch
    html += `<div class="branch-link current-branch"><b>Current:</b> ${branch.title}</div>`;

    // Display sibling branches if there are any and not at root
    if (navigationStack.length > 1) {
        const parentBranch = navigationStack[navigationStack.length - 2];
        const siblings = parentBranch.children.filter(sibling => sibling !== branch);
        if (siblings.length > 0) {
            html += '<div><b>Siblings:</b></div>';
            siblings.forEach(sibling => {
                html += `<div class="branch-link" onclick="switchBranch('${sibling.path}')">&nbsp;&nbsp;${sibling.title}</div>`;
            });
        }
    }

    // Display children of the current branch
    if (branch.children.length > 0) {
        html += '<div><b>Children:</b></div>';
        branch.children.forEach(child => {
            html += `<div class="branch-link" onclick="switchBranch('${child.path}')">&nbsp;&nbsp;${child.title}</div>`;
        });
    }

    return html;
}


function cycleSibling(direction) {
    const parentBranch = findParentBranch(branches.root, currentBranch);
    if (!parentBranch) return; // No parent, no siblings

    const siblings = parentBranch.children;
    const currentIndex = siblings.indexOf(currentBranch);
    let newIndex = currentIndex + direction;

    // Wrap around the index
    if (newIndex >= siblings.length) newIndex = 0;
    if (newIndex < 0) newIndex = siblings.length - 1;

    currentBranch = siblings[newIndex];
    navigationStack[navigationStack.length - 1] = currentBranch; // Update current branch in the stack
    updateTextArea();
    updateDirectoryTree();
}

function showFullDirectoryTree() {
    const popup = document.getElementById('fullTreePopup');
    const content = document.getElementById('fullTreeContent');
    content.innerHTML = generateFullDirectoryTreeHTML(branches.root, 0);
    popup.style.display = "block";
    highlightFirstElement();
}

function highlightFirstElement() {
    const firstElement = document.querySelector('#fullTreeContent .branch-link');
    if (firstElement) {
        firstElement.classList.add('highlighted');
        firstElement.focus();
    }
}

function navigateTree(event) {
    const highlighted = document.querySelector('#fullTreeContent .branch-link.highlighted');
    if (highlighted) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                let next = highlighted.nextElementSibling;
                if (next) {
                    highlighted.classList.remove('highlighted');
                    next.classList.add('highlighted');
                    next.focus();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                let previous = highlighted.previousElementSibling;
                if (previous) {
                    highlighted.classList.remove('highlighted');
                    previous.classList.add('highlighted');
                    previous.focus();
                }
                break;
            case 'Enter':
                event.preventDefault();
                highlighted.click();
                break;
            case 'Escape':
                closeFullTreePopup();
                break;
        }
    }
}


function closeFullTreePopup() {
    const popup = document.getElementById('fullTreePopup');
    popup.style.display = "none";
}


function switchBranch(branchPath) {
    let targetBranch = findBranchByPath(branches.root, branchPath);
    if (targetBranch) {
        currentBranch = targetBranch;
        // Rebuild the navigation stack to reflect the correct path to the new current branch
        navigationStack = buildNavigationStack(branches.root, branchPath);
        updateTextArea();
        updateDirectoryTree();
        closeFullTreePopup();
    }
}

function findBranchByPath(branch, path) {
    if (branch.path === path) return branch; // Check by path comparison
    for (let child of branch.children) {
        let found = findBranchByPath(child, path);
        if (found) return found;
    }
    return null;
}

function buildNavigationStack(branch, targetPath, stack = []) {
    if (branch.path === targetPath) {
        stack.push(branch);
        return stack;
    }
    for (let child of branch.children) {
        let result = buildNavigationStack(child, targetPath, stack.concat(branch));
        if (result) return result;
    }
    return null;
}

function generateFullDirectoryTreeHTML(branch, depth) {
    let html = `<div class="branch-link" onclick="switchBranch('${branch.path}')" style="margin-left: ${depth * 10}px;">${branch.title}</div>`;
    branch.children.forEach(child => {
        html += generateFullDirectoryTreeHTML(child, depth + 1);
    });
    return html;
}

// Call this function on page load to initialize the tree
updateDirectoryTree();

function deleteBranch() {
    parent = findParentBranch(branches.root, currentBranch)
    if (!parent) {
        alert("Cannot delete the root branch.");
        return;
    }

    const index = parent.children.indexOf(currentBranch);
    if (index === -1) {
        alert("Current branch is not found in its parent's children.");
        return;
    }

    // Move current branch's children to its parent
    currentBranch.children.forEach(child => {
        child.parent = parent;
        parent.children.push(child);
    });

    // Remove current branch from its parent
    parent.children.splice(index, 1);

    // Navigate to parent branch after deletion
    currentBranch = parent;
    navigationStack.pop(); // Remove last entry from navigation stack
    updateTextArea();
    updateDirectoryTree();
}

function branchMergeUpstream() {
    parent = findParentBranch(branches.root, currentBranch)

    if (!parent) {
        alert("Cannot merge the root branch.");
        return;
    }

    const textArea = document.getElementById('textArea');
    const selection = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd).trim();

    if (selection) {
        // Append selected text to parent branch's text
        parent.text += "\n\n" + selection;
        currentBranch.text = currentBranch.text.replace(selection, "").trim();
    } else {
        // Append current branch's text to parent branch's text
        parent.text += "\n\n" + currentBranch.text;

        // Move current branch's children to its parent
        currentBranch.children.forEach(child => {
            child.parent = parent;
            parent.children.push(child);
        });

        // Remove current branch from its parent
        const index = parent.children.indexOf(currentBranch);
        if (index !== -1) {
            parent.children.splice(index, 1);
        }

        // Navigate to parent branch after merging
        currentBranch = parent;
        navigationStack.pop(); // Remove last entry from navigation stack
    }
    
    updateTextArea();
    updateDirectoryTree();
}

function withStateChange(fn) {
    return function(...args) {
        saveState();
        return fn(...args);
    };
}

createNewBranch = withStateChange(createNewBranch);

deleteBranch = withStateChange(deleteBranch);
branchMergeUpstream = withStateChange(branchMergeUpstream);

document.addEventListener('keydown', (event) => {
    if (event.altKey) {
        event.preventDefault(); 
        handleAltKeyEvent(event);
    }
});

function handleAltKeyEvent(event) {
    const keyActions = {
        'ArrowRight': () => event.shiftKey ? createNewBranch() : navigateToChildBranch(),
        'ArrowLeft': () => event.shiftKey ? branchMergeUpstream() : goToPreviousBranch(),
        'ArrowUp': () => cycleSibling(-1),
        'ArrowDown': () => cycleSibling(1),
        'Delete': deleteBranch,
        'f': showFullDirectoryTree
    };

    if (keyActions[event.key]) {
        keyActions[event.key]();
    }
}



// UNDO BUFFER
let undoBuffer = [];
let redoBuffer = [];
const bufferSize = 256;

function saveState() {
    if (undoBuffer.length >= bufferSize) {
        undoBuffer.shift(); // Remove the oldest state
    }
    undoBuffer.push(JSON.stringify({ branches: branches, currentBranchPath: currentBranch.path }, replacer));
    redoBuffer = []; // Clear redo buffer on new action
}

function replacer(key, value) {
    // Filtering out properties to prevent circular references
    if (key === 'parent') return undefined;  // do not serialize 'parent' property
    return value;
}

function restoreState(state) {
    console.log("Restoring state");
    const savedState = JSON.parse(state);
    branches = savedState.branches;
    currentBranch = findBranchByPath(branches.root, savedState.currentBranchPath);
    navigationStack = buildNavigationStack(branches.root, currentBranch.path);
    updateTextArea();
    updateDirectoryTree();
}



function undo() {
    if (undoBuffer.length > 0) {
        const currentState = JSON.stringify({ branches: branches, currentBranchPath: currentBranch.path });
        redoBuffer.push(currentState);
        const previousState = undoBuffer.pop();
        restoreState(previousState);
        if (undoBuffer.length === 0) {
            saveState(); // Save the state after it reaches the initial condition
        }
    } else {
        console.log('No more states to undo. Reverting to initial state.');
        // Optionally, restore initial state explicitly here if it differs from current state
    }
}


function redo() {
    if (redoBuffer.length > 0) {
        const currentState = JSON.stringify({ branches: branches, currentBranchPath: currentBranch.path });
        undoBuffer.push(currentState);
        const nextState = redoBuffer.pop();
        restoreState(nextState);
    } else {
        console.log('No more states to redo.');
    }
}

function handleStateChange() {
    saveState();
}


document.addEventListener('keydown', (event) => {
    const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
    const isRedo = (event.ctrlKey || event.metaKey) && ((event.key.toLowerCase() === 'z' && event.shiftKey) || event.key.toLowerCase() === 'y');
    if (isUndo) {
        event.preventDefault();
        undo();
    } else if (isRedo) {
        event.preventDefault();
        redo();
    }
});

// Add handlers for paste, cut, and input actions
document.getElementById('textArea').addEventListener('paste', handleStateChange);
document.getElementById('textArea').addEventListener('cut', handleStateChange);
document.getElementById('textArea').addEventListener('input', (event) => {
    if (event.inputType === 'insertText' && event.data === ' ') {
        handleStateChange();
    }
});

document.getElementById('textArea').addEventListener('keydown', overrideTab);


function initialize() {
    updateDirectoryTree();
    updateTextArea();
    saveState();
    console.log("Initialization complete");
}

initialize();   