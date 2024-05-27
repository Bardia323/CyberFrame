

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

    if (!selection && currentBranch.children.length > 0) {
        currentBranch = currentBranch.children[0];
        navigationStack.push(currentBranch);
        updateTextArea();
        updateDirectoryTree();
        return;
    } else if (!selection) {
        alert("No text selected and no child branches to navigate to.");
        return;
    }

    let title = selection.split(/\n/)[0].split(/\s+/).slice(0, 3).join(" ");
    if (title.length > 20) title = title.substring(0, 20);

    let path = currentBranch.path + '/' + title;

    title = getUniqueSiblingTitle(title, currentBranch);

    let newBranch = getOrCreateBranch(title, path);
    if (!newBranch.parent) {
        currentBranch.children.push(newBranch);
    }

    // Move selection to new branch and remove it from current branch
    let newText = textArea.value.replace(selection, "").trim();
    currentBranch.text = newText;
    newBranch.text = selection;

    navigationStack.push(newBranch);
    currentBranch = newBranch;
    updateTextArea();
    updateDirectoryTree();
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

function onDocumentAltKeydown(event) {
    if (event.altKey){
        event.preventDefault(); 
    }
    if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        createNewBranch();
    } else if (event.altKey && event.key === 'ArrowLeft' && !event.shiftKey) {
        event.preventDefault();
        goToPreviousBranch();
    } else if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault();
        cycleSibling(-1); // Move to previous sibling
    } else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        cycleSibling(1); // Move to next sibling
    } else if (event.altKey && event.key === 'Delete') {
        event.preventDefault();
        deleteBranch();
    } else if (event.altKey && event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        branchMergeUpstream();
    } if (document.getElementById('fullTreePopup').style.display === 'block') {
        navigateTree(event);
    } else if (event.altKey && event.key === 'f') {
        event.preventDefault();
        showFullDirectoryTree();
    }
}


export {
    branches,
    currentBranch,
    navigationStack,
    createNewBranch,
    getOrCreateBranch,
    getUniqueSiblingTitle,
    goToPreviousBranch,
    getUniqueBranchTitle,
    findParentBranch,
    updateTextArea,
    updateBranchTitle,
    findSiblingWithTitle,
    updateDirectoryTree,
    generateCurrentBranchTreeHTML,
    cycleSibling,
    showFullDirectoryTree,
    highlightFirstElement,
    navigateTree,
    closeFullTreePopup,
    switchBranch,
    findBranchByPath,
    buildNavigationStack,
    generateFullDirectoryTreeHTML,
    deleteBranch,
    branchMergeUpstream,
    onTextAreaInput,
    onTextAreaDebouncedInput,
    onDocumentKeydown,
    onDocumentAltKeydown
};

