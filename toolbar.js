    const targetElement = document.querySelector('#leftright_page_wrapper.bgagame-terramystica');

    if (!targetElement) {
        console.error('Target element not found!');
        return;
    }

    const toolbarDiv = document.createElement('div');
    toolbarDiv.id = 'nicks_cool_toolbar';
        toolbarDiv.style.position = 'absolute'; // Take it out of normal document flow
        toolbarDiv.style.display = 'flex';
        toolbarDiv.style.justifyContent = 'flex-start';
        toolbarDiv.style.transform = 'translate(20rem, -3.5rem)'; // You can adjust this as needed
        toolbarDiv.style.backgroundColor = 'transparent';
        toolbarDiv.style.padding = '5px';
        toolbarDiv.style.zIndex = '9999';


    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    const buttonStyle = 'padding: 5px 10px; background-color: #090446; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; margin: 0 5px;';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Tile Labels';
    toggleButton.style.cssText = buttonStyle;

    const roundLogButton = document.createElement('button');
    roundLogButton.textContent = 'Current Round Log';
    roundLogButton.style.cssText = buttonStyle.replace('#090446', '#786F52');

    const lastTurnLogButton = document.createElement('button');
    lastTurnLogButton.textContent = 'Logs Since Last Turn';
    lastTurnLogButton.style.cssText = buttonStyle.replace('#090446', '#EAC435');

    buttonContainer.appendChild(toggleButton);
    buttonContainer.appendChild(roundLogButton);
    buttonContainer.appendChild(lastTurnLogButton);
    toolbarDiv.appendChild(buttonContainer);
    targetElement.parentNode.insertBefore(toolbarDiv, targetElement);

    toggleButton.addEventListener('click', function() {
        document.querySelectorAll('.terrain_space_name').forEach(function(element) {
            element.style.visibility = (element.style.visibility === 'visible') ? 'hidden' : 'visible';
        });
    });

    function getFilteredLogs(logs, currentActionPhaseId) {
        return logs.filter(log =>
            log.id > currentActionPhaseId &&
            !log.content.textContent.includes("is now online") &&
            !log.content.textContent.includes("is now offline") &&
            !log.content.textContent.includes("declines doing Conversions") &&
            log.playerName !== ''
        ).sort((a, b) => a.id - b.id);
    }

    function makeLetterNumberClickable(node) {
        // Replace text nodes within the provided element with clickable spans
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let currentNode;

        while (currentNode = walker.nextNode()) {
            const text = currentNode.textContent;
            const parent = currentNode.parentNode;

            // Check for patterns matching "[A-Z][0-9]+" and replace them with clickable spans
            const newText = text.replace(/\[([A-Z]\d+)\]/g, (match, p1) => {
                const span = document.createElement('span');
                span.className = 'letter-number';
                span.style.color = 'blue';
                span.style.cursor = 'pointer';
                span.textContent = p1;
                parent.insertBefore(span, currentNode.nextSibling);
                return ''; // Remove the original matched text
            });

            currentNode.textContent = newText; // Update the remaining text content
        }

        return node; // Return the modified node
    }


    // Updated groupLogs to make LetterNumber clickable in the logs
    function groupLogs(filteredLogs) {
        const groupedActions = [];
        let previousPlayerName = '';

        filteredLogs.forEach(log => {
            const cleanedLogContent = log.content.cloneNode(true); // Clone the node to retain HTML
            const timestamps = cleanedLogContent.querySelectorAll('.timestamp');
            timestamps.forEach(timestamp => timestamp.remove()); // Remove timestamps if not needed

            const strongLabel = cleanedLogContent.querySelector('strong');
            if (strongLabel) {
                strongLabel.remove(); // Remove strong tags if not needed
            }

            // Apply the function to make letter-number patterns clickable
            const logContentWithClickable = makeLetterNumberClickable(cleanedLogContent);

            const currentPlayerName = log.playerName;
            if (currentPlayerName !== previousPlayerName && !logContentWithClickable.textContent.includes("via Structures")) {
                groupedActions.push({ playerName: currentPlayerName, actions: [logContentWithClickable.outerHTML] });
            } else if (groupedActions.length > 0) {
                groupedActions[groupedActions.length - 1].actions.push(logContentWithClickable.outerHTML);
            }

            previousPlayerName = currentPlayerName;
        });

        return groupedActions;
    }


    // Event listener to log clicked LetterNumber to the console
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('letter-number')) {
            document.querySelectorAll('.terrain_space_name').forEach(function(element) {
                element.style.visibility = 'visible';
            });

            const terrainSpace = Array.from(document.getElementsByClassName('terrain_space_name'))
                .find(el => el.innerHTML.trim() === event.target.textContent);

            if (terrainSpace) {
                // Apply the initial grow animation
                terrainSpace.style.transition = 'transform 0.5s ease-in-out';
                terrainSpace.style.transform = 'scale(2)'; // Grow the element to twice its size

                // Shrink it back to normal after 1 second
                setTimeout(() => {
                    terrainSpace.style.transform = 'scale(1)'; // Return to normal size
                }, 1000); // Timing for shrinking back
            }
        }
    });

    function createLogContainer() {
        const logContainer = document.createElement('div');
        logContainer.id = 'filtered-logs';
        logContainer.style.marginTop = '10px';
        logContainer.style.border = '1px solid #ccc';
        logContainer.style.padding = '10px';
        logContainer.style.display = 'none';
        logContainer.style.maxHeight = '160px';
        logContainer.style.overflowY = 'auto';

        return logContainer;
    }

    function updateLogContainer(logContainer, groupedActions) {
        logContainer.innerHTML = '';
        groupedActions.forEach(group => {
            const actionElement = document.createElement('div');
            actionElement.innerHTML = `<strong>Player:</strong> ${group.playerName}<br>`;
            group.actions.forEach(action => {
                actionElement.innerHTML += `<div>${action}</div>`;
            });
            actionElement.innerHTML += '<hr>';
            logContainer.appendChild(actionElement);
        });
    }

    function fetchAndDisplayCurrentRoundLog() {
        const logsDiv = document.getElementById('logs');
        const allLogs = Array.from(logsDiv.getElementsByClassName('log'));

        const logs = allLogs.map(log => {
            const id = log.id.split('_')[1];
            const playerName = getPlayerName(log);
            return { id: parseInt(id, 10), content: log, playerName: playerName };
        });

        let currentActionPhaseId = -1;
        logs.forEach(log => {
            if (log.content.textContent.includes("~ Action phase ~") && log.id > currentActionPhaseId) {
                currentActionPhaseId = log.id;
            }
        });

        const filteredLogs = getFilteredLogs(logs, currentActionPhaseId);
        return { filteredLogs, currentActionPhaseId };
    }

    function fetchAndDisplayLastTurnLog() {
        const logsDiv = document.getElementById('logs');
        const allLogs = Array.from(logsDiv.getElementsByClassName('log'));

        const logs = allLogs.map(log => {
            const id = log.id.split('_')[1];
            const playerName = getPlayerName(log);
            return { id: parseInt(id, 10), content: log, playerName: playerName };
        });

        const playerBoard = document.querySelector('.player-board.current-player-board');
        const playerNameElement = playerBoard.querySelector('.player-name a');
        const subjectName = playerNameElement.textContent;
        var isLocked = false;
        let lastActionPhaseStartId = -1;
        let currentActionPhaseId = -1;
        logs.forEach(log => {
            let cleanedLogContent = log.content.cloneNode(true);
            let timestamps = cleanedLogContent.querySelectorAll('.timestamp');
            timestamps.forEach(timestamp => timestamp.remove());
            let strongLabel = cleanedLogContent.querySelector('strong');
            if (strongLabel) {
                strongLabel.remove();
            }
            let logContentText = cleanedLogContent.textContent.trim();

            // Ensure isLocked is only used to track if Arnold Palmtree's last move is already found
            if (log.playerName === subjectName && log.id > lastActionPhaseStartId && !isLocked && !logContentText.includes("via Structures")) {
                lastActionPhaseStartId = log.id;  // Capture this log as the starting point
                isLocked = true; // Lock to avoid capturing further logs until we reset
            } else if (log.playerName !== subjectName) {
                // Reset the lock if it's not Arnold Palmtree
                isLocked = false;
            }

            if (log.content.textContent.includes(" declines doing Conversions") && log.playerName === subjectName && log.id > currentActionPhaseId) {
                currentActionPhaseId = log.id; // Capture the last action phase ID for filtering
            }
        });

        const filteredLogs = getFilteredLogs(logs, lastActionPhaseStartId);
        return { filteredLogs, currentActionPhaseId };
    }

    const logContainer = createLogContainer();
    const turnLogContainer = createLogContainer();
    toolbarDiv.parentNode.insertBefore(logContainer, toolbarDiv.nextSibling);
    toolbarDiv.parentNode.insertBefore(turnLogContainer, toolbarDiv.nextSibling);

    roundLogButton.addEventListener('click', function() {
        const { filteredLogs } = fetchAndDisplayCurrentRoundLog();
        const groupedActions = groupLogs(filteredLogs);
        updateLogContainer(logContainer, groupedActions);
        turnLogContainer.style.display = 'none';
        logContainer.style.display = (logContainer.style.display === 'none') ? 'block' : 'none';
    });

    lastTurnLogButton.addEventListener('click', function() {
        const { filteredLogs } = fetchAndDisplayLastTurnLog();
        const groupedActions = groupLogs(filteredLogs);
        updateLogContainer(turnLogContainer, groupedActions);
        logContainer.style.display = 'none';
        turnLogContainer.style.display = (turnLogContainer.style.display === 'none') ? 'block' : 'none';
    });

    function getPlayerName(log) {
        const playerNameSpan = log.querySelector('.roundedbox .playername');
        return playerNameSpan ? playerNameSpan.textContent.trim() : '';
    }
