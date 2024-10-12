const targetElement = document.querySelector('#leftright_page_wrapper.bgagame-terramystica');

if (!targetElement) {
    console.error('Target element not found!');
    return;
}

const toolbarDiv = document.createElement('div');
toolbarDiv.id = 'nicks_cool_toolbar';
toolbarDiv.style.display = 'flex';
toolbarDiv.style.justifyContent = 'center';
toolbarDiv.style.marginBottom = '10px';
toolbarDiv.style.backgroundColor = '#f4f4f4';
toolbarDiv.style.padding = '10px';
toolbarDiv.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.1)';
toolbarDiv.style.zIndex = '9999';
toolbarDiv.style.borderRadius = '4px';

const buttonContainer = document.createElement('div');
buttonContainer.style.display = 'flex';
buttonContainer.style.gap = '10px';

const toggleButton = document.createElement('button');
toggleButton.textContent = 'Toggle Tile Labels';
toggleButton.style.padding = '8px 12px';
toggleButton.style.backgroundColor = '#090446';
toggleButton.style.color = 'white';
toggleButton.style.border = 'none';
toggleButton.style.borderRadius = '4px';
toggleButton.style.cursor = 'pointer';

const roundLogButton = document.createElement('button');
roundLogButton.textContent = 'Current Round Log';
roundLogButton.style.padding = '8px 12px';
roundLogButton.style.backgroundColor = '#786F52';
roundLogButton.style.color = '#ffffff';
roundLogButton.style.border = 'none';
roundLogButton.style.borderRadius = '4px';
roundLogButton.style.cursor = 'pointer';

const lastTurnLogButton = document.createElement('button');
lastTurnLogButton.textContent = 'Logs Since Last Turn';
lastTurnLogButton.style.padding = '8px 12px';
lastTurnLogButton.style.backgroundColor = '#EAC435';
lastTurnLogButton.style.color = '#ffffff';
lastTurnLogButton.style.border = 'none';
lastTurnLogButton.style.borderRadius = '4px';
lastTurnLogButton.style.cursor = 'pointer';

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

function groupLogs(filteredLogs) {
const groupedActions = [];
let previousPlayerName = '';

filteredLogs.forEach(log => {
const cleanedLogContent = log.content.cloneNode(true);
const timestamps = cleanedLogContent.querySelectorAll('.timestamp');
timestamps.forEach(timestamp => timestamp.remove());
const strongLabel = cleanedLogContent.querySelector('strong');
if (strongLabel) {
strongLabel.remove();
}

const currentPlayerName = log.playerName;
const logContentText = cleanedLogContent.textContent.trim();

if (currentPlayerName !== previousPlayerName && !logContentText.includes("via Structures")) {
groupedActions.push({ playerName: currentPlayerName, actions: [cleanedLogContent.innerHTML] });
} else if (groupedActions.length > 0) {
groupedActions[groupedActions.length - 1].actions.push(cleanedLogContent.innerHTML);
}

previousPlayerName = currentPlayerName;
});

const mergedActions = [];
for (let i = 0; i < groupedActions.length; i++) {
if (i > 0 && groupedActions[i].playerName === groupedActions[i - 1].playerName) {
mergedActions[mergedActions.length - 1].actions.push(...groupedActions[i].actions);
} else {
mergedActions.push(groupedActions[i]);
}
}

return mergedActions;
}

function createLogContainer() {
    const logContainer = document.createElement('div');
    logContainer.id = 'filtered-logs';
    logContainer.style.marginTop = '10px';
    logContainer.style.border = '1px solid #ccc';
    logContainer.style.padding = '10px';
    logContainer.style.display = 'none';
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
