// Vérifie sur quelle page on se trouve
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    // Page d'inscription des joueurs et définition des rôles
    const playerForm = document.getElementById('player-form');
    const playerNameInput = document.getElementById('player-name');
    const playerList = document.getElementById('player-list');
    const rolesForm = document.getElementById('roles-form');

    let players = [];

    // Charger les joueurs depuis le stockage local si existant
    if (localStorage.getItem('players')) {
        players = JSON.parse(localStorage.getItem('players'));
        updatePlayerList();
    }

    playerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = playerNameInput.value.trim();
        if (name !== '') {
            players.push({ name: name });
            localStorage.setItem('players', JSON.stringify(players));
            updatePlayerList();
            playerNameInput.value = '';
        }
    });

    rolesForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const numRoles = getRoleCounts();
        const totalRoles = Object.values(numRoles).reduce((a, b) => a + b, 0);
        if (totalRoles !== players.length) {
            alert("Le nombre total de rôles doit être égal au nombre de joueurs (" + players.length + ").");
            return;
        }
        localStorage.setItem('roleCounts', JSON.stringify(numRoles));
        // Redirige vers la distribution des rôles
        window.location.href = 'role.html';
    });

    function updatePlayerList() {
        playerList.innerHTML = '';
        players.forEach(function (player) {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });
        if (players.length >= 4) {
            rolesForm.style.display = 'block';
        } else {
            rolesForm.style.display = 'none';
        }
    }

    function getRoleCounts() {
        return {
            'Loup-Garou': parseInt(document.getElementById('num-loup-garou').value) || 0,
            'Sorcière': parseInt(document.getElementById('num-sorciere').value) || 0,
            'Voyante': parseInt(document.getElementById('num-voyante').value) || 0,
            'Petite Fille': parseInt(document.getElementById('num-petite-fille').value) || 0,
            'Villageois': parseInt(document.getElementById('num-villageois').value) || 0
        };
    }

} else if (window.location.pathname.endsWith('role.html')) {
    // Page de distribution des rôles
    let players = JSON.parse(localStorage.getItem('players')) || [];
    const roleCounts = JSON.parse(localStorage.getItem('roleCounts')) || {};

    const roles = assignRoles(roleCounts);

    // Stocker les rôles assignés pour le Maître du Jeu
    localStorage.setItem('assignedRoles', JSON.stringify(roles));

    let currentPlayerIndex = 0;

    const roleDistributionDiv = document.getElementById('role-distribution');
    const roleDisplayDiv = document.getElementById('role-display');
    const showRoleButton = document.getElementById('show-role-button');
    const nextPlayerButton = document.getElementById('next-player-button');
    const playerNameSpan = document.getElementById('player-name');
    const playerRoleHeading = document.getElementById('player-role');
    const instructionParagraph = document.getElementById('instruction');

    showRoleButton.addEventListener('click', function () {
        roleDistributionDiv.style.display = 'none';
        roleDisplayDiv.style.display = 'block';
        const player = players[currentPlayerIndex];
        const role = roles[currentPlayerIndex];
        playerNameSpan.textContent = player.name;
        playerRoleHeading.textContent = role;
        document.getElementById('role-description').textContent = getRoleDescription(role);
        currentPlayerIndex++;
    });

    nextPlayerButton.addEventListener('click', function () {
        roleDistributionDiv.style.display = 'block';
        roleDisplayDiv.style.display = 'none';
        if (currentPlayerIndex >= players.length) {
            // Tous les joueurs ont vu leur rôle
            window.location.href = 'game_master.html';
        }
    });

    function assignRoles(roleCounts) {
        const roles = [];
        for (const [role, count] of Object.entries(roleCounts)) {
            for (let i = 0; i < count; i++) {
                roles.push(role);
            }
        }
        // Mélanger les rôles
        shuffleArray(roles);
        return roles;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getRoleDescription(role) {
        const descriptions = {
            'Loup-Garou': 'Vous êtes un Loup-Garou. Chaque nuit, vous vous réveillez pour choisir une victime.',
            'Sorcière': 'Vous êtes la Sorcière. Vous disposez d\'une potion de vie et d\'une potion de mort.',
            'Voyante': 'Vous êtes la Voyante. Chaque nuit, vous pouvez découvrir le rôle d\'un joueur.',
            'Petite Fille': 'Vous êtes la Petite Fille. Vous pouvez espionner les Loups-Garous la nuit.',
            'Villageois': 'Vous êtes un Villageois. Votre objectif est de démasquer les Loups-Garous.'
            // Ajoutez d'autres descriptions si nécessaire
        };
        return descriptions[role] || '';
    }

} else if (window.location.pathname.endsWith('game_master.html')) {
    // Interface du Maître du Jeu

    let players = JSON.parse(localStorage.getItem('players')) || [];
    const roles = JSON.parse(localStorage.getItem('assignedRoles')) || [];
    const roleCounts = JSON.parse(localStorage.getItem('roleCounts')) || {};

    // Initialisation des données du jeu
    let gameData = {
        players: [],
        phase: 'Nuit',
        dayNumber: 1,
        log: [],
        gameOver: false,
        witchHasHealingPotion: true,
        witchHasPoisonPotion: true
    };

    // Si le jeu est déjà en cours, charger les données
    if (localStorage.getItem('gameData')) {
        gameData = JSON.parse(localStorage.getItem('gameData'));
    } else {
        // Initialiser les joueurs avec leur statut
        players.forEach((player, index) => {
            gameData.players.push({
                name: player.name,
                role: roles[index],
                alive: true
            });
        });
        localStorage.setItem('gameData', JSON.stringify(gameData));
    }

    // Sélection des éléments du DOM
    const phaseTitle = document.getElementById('phase-title');
    const currentPhaseSpan = document.getElementById('current-phase');
    const phaseContentDiv = document.getElementById('phase-content');
    const playerStatusList = document.getElementById('player-status-list');
    const logList = document.getElementById('log-list');

    // Fonction pour mettre à jour l'affichage du statut des joueurs
    function updatePlayerStatus() {
        playerStatusList.innerHTML = '';
        gameData.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} - ${player.alive ? 'Vivant' : 'Éliminé'}${player.alive ? '' : ` (${player.role})`}`;
            if (!player.alive) {
                li.classList.add('eliminated');
            }
            playerStatusList.appendChild(li);
        });
    }
    

    // Fonction pour ajouter un événement au journal du jeu
    function addToLog(message) {
        gameData.log.push(message);
        const li = document.createElement('li');
        li.textContent = message;
        logList.appendChild(li);
        localStorage.setItem('gameData', JSON.stringify(gameData));
    }

    // Fonction pour gérer les phases du jeu
    function handlePhase() {
        if (gameData.gameOver) {
            phaseTitle.textContent = 'Le jeu est terminé !';
            phaseContentDiv.innerHTML = '';
            endPhaseButton.style.display = 'none';
            return;
        }
    
        if (gameData.phase === 'Nuit') {
            handleNightPhase();
        } else if (gameData.phase === 'Jour') {
            handleDayPhase();
        }
    }
    

    // Fonction pour gérer la phase de nuit
    function handleNightPhase() {
        addToLog(`La nuit ${gameData.dayNumber} tombe.`);
        updatePlayerStatus();
    
        currentPhaseSpan.textContent = `Nuit ${gameData.dayNumber}`;
    
        // Nettoyer le contenu de la phase
        phaseContentDiv.innerHTML = '';
    
        // Afficher le bouton "Fin de la nuit"
        const endPhaseButton = document.getElementById('end-phase-button');
        endPhaseButton.style.display = 'block';
        endPhaseButton.textContent = 'Fin de la nuit';
    
        // Créer une liste déroulante des joueurs vivants pour choisir la victime
        const alivePlayers = gameData.players.filter(p => p.alive);
        const selectVictim = document.createElement('select');
        selectVictim.id = 'select-victim';
    
        alivePlayers.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            selectVictim.appendChild(option);
        });
    
        const label = document.createElement('label');
        label.textContent = 'Sélectionnez le joueur à éliminer pendant la nuit :';
        label.htmlFor = 'select-victim';
    
        phaseContentDiv.appendChild(label);
        phaseContentDiv.appendChild(document.createElement('br'));
        phaseContentDiv.appendChild(selectVictim);
    
        // Lorsque le bouton "Fin de la nuit" est cliqué
        endPhaseButton.onclick = function () {
            let nightActions = [];
    
            const victimName = selectVictim.value;
            nightActions.push({ action: 'kill', target: victimName, by: 'Loups-Garous' });
    
            // Vous pouvez ajouter ici les actions des rôles spéciaux si nécessaire
    
            // Résolution des actions nocturnes
            resolveNightActions(nightActions);
    
            // Afficher le joueur éliminé et son rôle
            const eliminatedPlayer = gameData.players.find(p => p.name === victimName);
            if (eliminatedPlayer && !eliminatedPlayer.alive) {
                addToLog(`${eliminatedPlayer.name} a été éliminé pendant la nuit. Son rôle était : ${eliminatedPlayer.role}`);
            } else {
                addToLog(`Personne n'a été éliminé pendant la nuit.`);
            }
    
            // Passer à la phase de jour
            gameData.phase = 'Jour';
            localStorage.setItem('gameData', JSON.stringify(gameData));
    
            // Masquer le bouton
            endPhaseButton.style.display = 'none';
    
            handlePhase();
        };
    }
    

    // Fonction pour résoudre les actions nocturnes
    function resolveNightActions(actions) {
        let killedPlayers = [];
        let savedPlayers = [];
    
        actions.forEach(action => {
            const targetPlayer = gameData.players.find(p => p.name === action.target);
            if (targetPlayer) {
                if (action.action === 'kill') {
                    if (!savedPlayers.includes(targetPlayer.name)) {
                        killedPlayers.push(targetPlayer.name);
                    }
                } else if (action.action === 'save') {
                    savedPlayers.push(targetPlayer.name);
                }
            }
        });
    
        // Appliquer les décès
        killedPlayers.forEach(name => {
            if (!savedPlayers.includes(name)) {
                const player = gameData.players.find(p => p.name === name);
                if (player && player.alive) {
                    player.alive = false;
                }
            }
        });
    
        // Sauvegarder l'état du jeu
        localStorage.setItem('gameData', JSON.stringify(gameData));
    
        // Vérifier les conditions de victoire après la nuit
        checkWinConditions();
    }
    

    // Fonction pour gérer la phase de jour
    function handleDayPhase() {
        addToLog(`Le jour ${gameData.dayNumber} se lève.`);
        updatePlayerStatus();
    
        currentPhaseSpan.textContent = `Jour ${gameData.dayNumber}`;
    
        // Nettoyer le contenu de la phase
        phaseContentDiv.innerHTML = '';
    
        // Afficher le bouton "Fin du jour"
        const endPhaseButton = document.getElementById('end-phase-button');
        endPhaseButton.style.display = 'block';
        endPhaseButton.textContent = 'Fin du jour';
    
        // Créer une liste déroulante des joueurs vivants pour le vote
        const alivePlayers = gameData.players.filter(p => p.alive);
        const selectVotedPlayer = document.createElement('select');
        selectVotedPlayer.id = 'select-voted-player';
    
        alivePlayers.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            selectVotedPlayer.appendChild(option);
        });
    
        const label = document.createElement('label');
        label.textContent = 'Sélectionnez le joueur à éliminer pendant le jour :';
        label.htmlFor = 'select-voted-player';
    
        phaseContentDiv.appendChild(label);
        phaseContentDiv.appendChild(document.createElement('br'));
        phaseContentDiv.appendChild(selectVotedPlayer);
    
        // Lorsque le bouton "Fin du jour" est cliqué
        endPhaseButton.onclick = function () {
            const votedPlayerName = selectVotedPlayer.value;
            const votedPlayer = gameData.players.find(p => p.name === votedPlayerName);
    
            if (votedPlayer && votedPlayer.alive) {
                votedPlayer.alive = false;
                addToLog(`${votedPlayerName} a été éliminé par le village. Son rôle était : ${votedPlayer.role}`);
            } else {
                addToLog('Aucun joueur n\'a été éliminé pendant le jour.');
            }
    
            // Vérifier les conditions de victoire
            checkWinConditions();
    
            // Masquer le bouton
            endPhaseButton.style.display = 'none';
    
            if (!gameData.gameOver) {
                // Passer au prochain tour
                gameData.dayNumber++;
                gameData.phase = 'Nuit';
                localStorage.setItem('gameData', JSON.stringify(gameData));
                handlePhase();
            } else {
                updatePlayerStatus();
            }
        };
    }
    

    // Fonction pour vérifier les conditions de victoire
    function checkWinConditions() {
        const alivePlayers = gameData.players.filter(p => p.alive);
        const aliveWerewolves = alivePlayers.filter(p => p.role === 'Loup-Garou');
        const aliveVillagers = alivePlayers.filter(p => p.role !== 'Loup-Garou');
    
        if (aliveWerewolves.length === 0) {
            addToLog('Les Villageois ont gagné !');
            gameData.gameOver = true;
            alert('Les Villageois ont gagné !');
        } else if (aliveWerewolves.length >= aliveVillagers.length) {
            addToLog('Les Loups-Garous ont gagné !');
            gameData.gameOver = true;
            alert('Les Loups-Garous ont gagné !');
        }
    
        // Sauvegarder l'état du jeu
        localStorage.setItem('gameData', JSON.stringify(gameData));
    }

    // Initialiser l'affichage
    updatePlayerStatus();
    handlePhase();

}




