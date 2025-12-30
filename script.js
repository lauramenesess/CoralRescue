// CORAL RESCUE: MISSIONE OASI

const GameApp = (function() {
            
    // --- SEZIONE COSTANTI CONFIGURAZIONE ---
    const CONFIG = {
        ITEMS: ['💧', '🌿', '☀️'],
        BONUS_ITEMS: ['🐚', '🐠', '🦀'],
        GRID_SIZE: 6,
        // RIDOTTA probabilità jolly
        BONUS_SPAWN_RATE: 0.02, // 2% invece di 8%
        COST_PER_ACTION: 3,
        // RIDOTTA guarigione strumenti
        HEAL_VALUES: { water: 8, algae: 10, sun: 12 },
        // RIDOTTA guarigione bonus
        BONUS_HEAL_VALUES: { shell: 10, fish1: 12, crab: 15 },
        // RIDOTTO EXP bonus
        BONUS_EXP_VALUES: { shell: 3, fish1: 4, crab: 5 },
        ANIMATION_DURATION: 600,
        CASCADE_DELAY: 800,
        MOVES_MIN: 15,
        MOVES_MAX: 53
    };

    // --- CONFIGURAZIONE DIFFICOLTÀ LIVELLI - MOLTO PIÙ DIFFICILE ---
    const LEVEL_CONFIG = {
        1: { 
            moves: 20, 
            matchSize: 3, 
            gridSize: 6, 
            targetHealth: 100,
            // Probabilità jolly diversa per livello
            bonusChance: 0.02, // Solo 🐚
            healthPerMatch: 3, // RIDOTTO drasticamente
            allowedBonuses: ['🐚'] // Solo conchiglia nel livello 1
        },
        2: { 
            moves: 18, 
            matchSize: 3, 
            gridSize: 6, 
            targetHealth: 100, 
            bonusChance: 0.03,
            healthPerMatch: 3,
            allowedBonuses: ['🐚', '🐠'] // 🐚 e 🐠 dal livello 2
        },
        3: { 
            moves: 16, 
            matchSize: 3, 
            gridSize: 6, 
            targetHealth: 100, 
            bonusChance: 0.035,
            healthPerMatch: 2.5,
            allowedBonuses: ['🐚', '🐠', '🦀'] // Tutti dal livello 3
        },
        4: { 
            moves: 14, 
            matchSize: 4, 
            gridSize: 6, 
            targetHealth: 100, 
            bonusChance: 0.04,
            healthPerMatch: 2,
            allowedBonuses: ['🐚', '🐠', '🦀']
        },
        5: { 
            moves: 12, 
            matchSize: 4, 
            gridSize: 6, 
            targetHealth: 100, 
            bonusChance: 0.045,
            healthPerMatch: 1.5,
            allowedBonuses: ['🐚', '🐠', '🦀']
        },
        6: { 
            moves: 10, 
            matchSize: 5, 
            gridSize: 6, 
            targetHealth: 100, 
            bonusChance: 0.05,
            healthPerMatch: 1,
            allowedBonuses: ['🐚', '🐠', '🦀']
        }
    };

    // --- SEZIONE STATO DEL GIOCO ---
    let state = {
        screen: 'hero',
        username: '',
        avatar: '👤',
        selectedCoral: 'Rosso',
        currentLevel: 1,
        grid: [],
        selectedCell: null,
        resources: { water: 0, algae: 0, sun: 0 },
        bonusResources: { shell: 0, fish1: 0, crab: 0 },
        health: 0,
        exp: 0,
        expToNextLevel: 15, // AUMENTATO: ci vuole più EXP per 1% salute
        bonusMatches: 0,
        isProcessing: false,
        gameCompleted: false,
        movesRemaining: 0,
        moveCount: 0,
        bonusRewards: 0,
        levelUnlockedThisRound: false,
        audioEnabled: true,
        musicEnabled: true,
        nightMode: false
    };

    // --- SEZIONE GESTIONE AUDIO ---
    const AudioManager = {
        // URL dei file audio (Pixabay - gratuiti e royalty-free)
        sounds: {
            // Il suono arcade-ui che hai fornito
            buttonClick: 'assets/casual-click-pop-ui-1-262118.mp3',
            // Musica ambiente cozy ocean
            ambientMusic: 'https://pixabay.com/it/music/cozy-ocean-ambient-background-music-11895/', //https://pixabay.com/it/sound-effects/beach-waves-splashing-ambience-389186/
            // Suono di match/raccolta
            match: 'https://pixabay.com/it/sound-effects/arcade-ui-1-229498/',
            // Suono di bonus
            bonus: 'https://pixabay.com/it/sound-effects/arcade-ui-8-229505/',
            // Suono vittoria
            victory: 'https://pixabay.com/it/sound-effects/arcade-ui-18-229517/',
            // Suono game over
            gameOver: 'https://pixabay.com/it/users/floraphonic-38928062/'
        },
        
        audioElements: {},
        musicPlaying: false,
        
        init() {
            // Crea elementi audio per i suoni
            this.createAudioElement('buttonClick', this.sounds.buttonClick, 0.3);
            this.createAudioElement('match', this.sounds.match, 0.4);
            this.createAudioElement('bonus', this.sounds.bonus, 0.5);
            this.createAudioElement('victory', this.sounds.victory, 0.6);
            this.createAudioElement('gameOver', this.sounds.gameOver, 0.4);
            
            // Musica di sottofondo con loop
            this.createAudioElement('ambientMusic', this.sounds.ambientMusic, 0.2, true);
        },
        
        createAudioElement(name, src, volume = 0.3, loop = false) {
            try {
                const audio = new Audio(src);
                audio.volume = volume;
                audio.loop = loop;
                audio.crossOrigin = 'anonymous';
                this.audioElements[name] = audio;
            } catch (e) {
                console.log('Audio non disponibile: ' + name);
            }
        },
        
        playSound(soundName) {
            if (!state.audioEnabled || !this.audioElements[soundName]) return;
            
            try {
                const audio = this.audioElements[soundName];
                audio.currentTime = 0;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Riproduzione audio interrotta:', error);
                    });
                }
            } catch (e) {
                console.log('Errore durante la riproduzione:', e);
            }
        },
        
        playButtonClick() {
            this.playSound('buttonClick');
        },
        
        playMatch() {
            this.playSound('match');
        },
        
        playBonusCollect() {
            this.playSound('bonus');
        },
        
        playVictory() {
            this.playSound('victory');
        },
        
        playGameOver() {
            this.playSound('gameOver');
        },
        
        playAmbientMusic() {
            if (!state.musicEnabled || this.musicPlaying) return;
            
            try {
                const music = this.audioElements['ambientMusic'];
                if (music) {
                    music.volume = 0.15;
                    music.currentTime = 0;
                    const playPromise = music.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            this.musicPlaying = true;
                        }).catch(error => {
                            console.log('Musica non disponibile:', error);
                        });
                    }
                }
            } catch (e) {
                console.log('Errore musica:', e);
            }
        },
        
        stopAmbientMusic() {
            const music = this.audioElements['ambientMusic'];
            if (music) {
                music.pause();
                music.currentTime = 0;
                this.musicPlaying = false;
            }
        },
        
        toggleMusic() {
            if (state.musicEnabled) {
                this.playAmbientMusic();
            } else {
                this.stopAmbientMusic();
            }
        }
    };

    // --- SEZIONE GESTIONE SCHERMATE ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.add('active');
        window.scrollTo({top: 0, behavior: 'smooth'});
        
        // Riproduci suono vittoria se è la schermata di vittoria
        if (screenId === 'win') {
            AudioManager.playVictory();
            
            // Aggiorna statistiche dopo un breve delay
            setTimeout(() => {
                const victoryExpEl = document.getElementById('victory-exp');
                const victoryBonusEl = document.getElementById('victory-bonus-matches');
                const victoryMovesEl = document.getElementById('victory-moves');
                
                if (victoryExpEl) victoryExpEl.textContent = state.exp;
                if (victoryBonusEl) victoryBonusEl.textContent = state.bonusMatches;
                if (victoryMovesEl) victoryMovesEl.textContent = state.moveCount;
            }, 50);
        }
        
        if (screenId === 'map') {
            updateUnlockedLevels();
        }
    }

    // MODIFICATA: SBLOCCA SOLO UN LIVELLO ALLA VOLTA
    function updateUnlockedLevels() {
        for (let i = 1; i <= 6; i++) {
            const levelEl = document.getElementById(`level-${i}`);
            if (!levelEl) continue;
            
            // Rimuovi sempre il badge "APERTO" verde
            const openBadge = levelEl.querySelector('.bg-green-200');
            if (openBadge) openBadge.remove();
            
            if (i === 1) {
                // Livello 1 sempre sbloccato
                levelEl.style.pointerEvents = 'auto';
                levelEl.style.opacity = '1';
                levelEl.classList.remove('opacity-60', 'bg-gray-300');
                levelEl.classList.add('bg-[#fffbf0]', 'cursor-pointer', 'hover:scale-105');
                
                const lock = levelEl.querySelector('.absolute');
                if (lock) lock.remove();
                
                const lockIcon = levelEl.querySelector('.text-6xl');
                if (lockIcon && lockIcon.textContent === '🔒') {
                    lockIcon.parentElement.remove();
                }
                
                // Aggiungi indicatore "attuale" per il livello 1
                if (!levelEl.querySelector('.text-red-500')) {
                    const currentIndicator = document.createElement('div');
                    currentIndicator.className = 'absolute top-2 right-2 text-red-500 animate-pulse';
                    currentIndicator.textContent = '▶';
                    currentIndicator.title = 'Livello attuale';
                    levelEl.appendChild(currentIndicator);
                }
            }
            else if (i === state.currentLevel) {
                // Livello attuale (completato il precedente)
                levelEl.style.pointerEvents = 'auto';
                levelEl.style.opacity = '1';
                levelEl.classList.remove('opacity-60', 'bg-gray-300');
                levelEl.classList.add('bg-[#fffbf0]', 'cursor-pointer', 'hover:scale-105');
                
                const lock = levelEl.querySelector('.absolute');
                if (lock) lock.remove();
                
                // Aggiungi indicatore "nuovo"
                if (!levelEl.querySelector('.text-yellow-500')) {
                    const newIndicator = document.createElement('div');
                    newIndicator.className = 'absolute top-2 right-2 text-yellow-500 animate-bounce';
                    newIndicator.textContent = '⭐';
                    newIndicator.title = 'Nuovo livello sbloccato!';
                    levelEl.appendChild(newIndicator);
                }
            }
            else if (i < state.currentLevel) {
                // Livelli già completati
                levelEl.style.pointerEvents = 'auto';
                levelEl.style.opacity = '1';
                levelEl.classList.remove('opacity-60', 'bg-gray-300');
                levelEl.classList.add('bg-[#fffbf0]', 'cursor-pointer', 'hover:scale-105');
                
                const lock = levelEl.querySelector('.absolute');
                if (lock) lock.remove();
                
                // Aggiungi indicatore "completato"
                if (!levelEl.querySelector('.text-green-600')) {
                    const completedIndicator = document.createElement('div');
                    completedIndicator.className = 'absolute top-2 right-2 text-green-600 text-xl';
                    completedIndicator.textContent = '✓';
                    completedIndicator.title = 'Completato';
                    levelEl.appendChild(completedIndicator);
                }
            }
            else {
                // Livelli non ancora sbloccati
                levelEl.style.pointerEvents = 'none';
                levelEl.classList.add('opacity-60', 'bg-gray-300');
                levelEl.classList.remove('bg-[#fffbf0]', 'hover:scale-105');
                
                // Assicurati che ci sia il lucchetto
                if (!levelEl.querySelector('.text-6xl')) {
                    const lockIcon = document.createElement('div');
                    lockIcon.className = 'absolute inset-0 flex items-center justify-center z-10';
                    lockIcon.innerHTML = '<span class="text-6xl drop-shadow-md">🔒</span>';
                    levelEl.appendChild(lockIcon);
                }
                
                // Rimuovi eventuali indicatori
                const indicators = levelEl.querySelectorAll('.absolute.top-2');
                indicators.forEach(ind => ind.remove());
            }
        }
    }

    // --- SEZIONE CONTROLLO SCORRIMENTO PAGINA ---
    function scrollUp() {
        window.scrollBy({ top: -200, behavior: 'smooth' });
    }

    function scrollDown() {
        window.scrollBy({ top: 200, behavior: 'smooth' });
    }

    function updateScrollButtons() {
        const scrollUpBtn = document.querySelector('.scroll-up');
        const scrollDownBtn = document.querySelector('.scroll-down');
        
        if (window.scrollY <= 0) {
            scrollUpBtn?.classList.add('hidden');
        } else {
            scrollUpBtn?.classList.remove('hidden');
        }
        
        if (window.scrollY >= document.documentElement.scrollHeight - window.innerHeight) {
            scrollDownBtn?.classList.add('hidden');
        } else {
            scrollDownBtn?.classList.remove('hidden');
        }
    }

    window.addEventListener('scroll', updateScrollButtons);
    document.addEventListener('DOMContentLoaded', updateScrollButtons);

    // --- SEZIONE LOGICA INIZIO GIOCO ---
    function startGame() {
        showScreen('profile');
        createBubbles();
    }

    function selectAvatar(emoji) {
        state.avatar = emoji;
        document.getElementById('selected-avatar-display').innerText = emoji;
    }

    function continueToCoralChoice() {
        const usernameInput = document.getElementById('username-input').value.trim();
        if (usernameInput === '') {
            alert('Per favore, inserisci un nome!');
            return;
        }
        state.username = usernameInput;
        showScreen('coral-choice');
    }

    function selectCoral(coralName) {
        state.selectedCoral = coralName;
        document.getElementById('intro-player-avatar').innerText = state.avatar;
        document.getElementById('intro-player-name').innerText = state.username;
        showScreen('intro');
    }

    function goToMap() {
        showScreen('map');
    }

    function enterZone(levelNumber) {
        if (levelNumber > state.currentLevel) {
            alert('Livello non ancora sbloccato! Completa prima i livelli precedenti.');
            return;
        }
        
        state.currentLevel = levelNumber;
        state.gameCompleted = false;
        
        const levelConfig = LEVEL_CONFIG[levelNumber] || LEVEL_CONFIG[1];
        
        state.health = 0;
        state.movesRemaining = levelConfig.moves;
        state.exp = 0;
        state.bonusMatches = 0;
        
        state.resources = { water: 0, algae: 0, sun: 0 };
        state.bonusResources = { shell: 0, fish1: 0, crab: 0 };
        state.selectedCell = null;
        state.isProcessing = false;
        state.moveCount = 0;
        state.levelUnlockedThisRound = false;
        
        const zoneNames = {
            1: 'Barriera Solare',
            2: 'Foresta di Alghe',
            3: 'Caverna dei Cristalli',
            4: 'Abisso Oscuro',
            5: 'Giardino di Coralli',
            6: 'Oasi Finale'
        };
        
        const zoneTitle = document.getElementById('zone-title');
        if (zoneTitle) {
            zoneTitle.innerText = zoneNames[levelNumber] || 'Zona Sconosciuta';
        }
        
        const levelIndicator = document.getElementById('level-indicator');
        if (levelIndicator) {
            levelIndicator.innerText = levelNumber;
        }
        
        const movesElement = document.getElementById('moves-remaining');
        if (movesElement) {
            movesElement.innerText = state.movesRemaining;
        }
        
        updateUI();
        initGrid(levelConfig);
        showScreen('game');
    }

    // --- SEZIONE LOGICA GRIGLIA PUZZLE - MIGLIORATA PER EVITARE MATCH FACILI ---
    function initGrid(levelConfig) {
        const gridEl = document.getElementById('game-grid');
        gridEl.innerHTML = '';
        state.grid = [];
        
        const config = levelConfig || LEVEL_CONFIG[1];
        const size = config.gridSize;
        const allowedBonuses = config.allowedBonuses || ['🐚'];
        
        // Crea griglia senza match iniziali
        let attempts = 0;
        let hasInitialMatches = true;
        
        while (hasInitialMatches && attempts < 50) {
            state.grid = [];
            hasInitialMatches = false;
            
            for (let i = 0; i < size * size; i++) {
                // Probabilità molto bassa per bonus, con distribuzione per livello
                if (Math.random() < config.bonusChance) {
                    // Scegli tra i bonus consentiti per questo livello
                    const randomBonus = allowedBonuses[Math.floor(Math.random() * allowedBonuses.length)];
                    state.grid.push(randomBonus);
                } else {
                    // Evita di creare troppi dello stesso simbolo consecutivo
                    const availableItems = [...CONFIG.ITEMS];
                    
                    // Controlla le celle vicine per evitare match facili
                    if (i > 0) {
                        const leftItem = state.grid[i - 1];
                        const aboveItem = i >= size ? state.grid[i - size] : null;
                        
                        // Rimuovi simboli che creerebbero match orizzontale
                        if (i % size >= 2) {
                            const twoLeft = state.grid[i - 2];
                            if (twoLeft === leftItem) {
                                const index = availableItems.indexOf(twoLeft);
                                if (index > -1) {
                                    availableItems.splice(index, 1);
                                }
                            }
                        }
                        
                        // Rimuovi simboli che creerebbero match verticale
                        if (i >= size * 2) {
                            const twoAbove = state.grid[i - size * 2];
                            if (twoAbove === aboveItem) {
                                const index = availableItems.indexOf(twoAbove);
                                if (index > -1) {
                                    availableItems.splice(index, 1);
                                }
                            }
                        }
                    }
                    
                    // Se non ci sono simboli disponibili, usa uno random
                    const item = availableItems.length > 0 
                        ? availableItems[Math.floor(Math.random() * availableItems.length)]
                        : CONFIG.ITEMS[Math.floor(Math.random() * CONFIG.ITEMS.length)];
                    
                    state.grid.push(item);
                }
            }
            
            // Controlla se ci sono ancora match iniziali
            const tempMatches = findMatches();
            hasInitialMatches = tempMatches.size > 0;
            attempts++;
        }
        
        CONFIG.GRID_SIZE = size;
        renderGridVisuals();
        
        // Rimuovi il controllo match iniziali - ora la griglia è già pronta
    }

    function renderGridVisuals() {
        const gridEl = document.getElementById('game-grid');
        gridEl.innerHTML = '';

        state.grid.forEach((item, i) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (state.isProcessing) cell.classList.add('processing');
            if (state.selectedCell === i) cell.classList.add('selected');
            
            if (CONFIG.BONUS_ITEMS.includes(item)) {
                cell.classList.add('bonus-cell');
                cell.style.animation = 'bonusPulse 3s infinite';
            }
            
            cell.textContent = item;
            cell.dataset.index = i;
            cell.onclick = () => handleCellClick(i);
            gridEl.appendChild(cell);
        });
    }

    function handleCellClick(index) {
        if (state.isProcessing || state.gameCompleted) return;

        const cells = document.querySelectorAll('.cell');
        
        if (state.selectedCell === null) {
            state.selectedCell = index;
            cells[index].classList.add('selected');
        } else if (state.selectedCell === index) {
            cells[index].classList.remove('selected');
            state.selectedCell = null;
        } else {
            const prevIndex = state.selectedCell;
            
            if (areAdjacent(prevIndex, index)) {
                state.isProcessing = true;
                renderGridVisuals();
                
                swapCellsWithAnimation(prevIndex, index).then(() => {
                    setTimeout(() => {
                        const matches = findMatches();
                        if (matches.size > 0) {
                            processMatches(matches);
                            state.moveCount++;
                            state.movesRemaining--;
                            updateUI();
                        } else {
                            swapCellsWithAnimation(index, prevIndex).then(() => {
                                state.isProcessing = false;
                                renderGridVisuals();
                            });
                        }
                        cells[prevIndex]?.classList.remove('selected');
                        state.selectedCell = null;
                    }, 200);
                });
            } else {
                cells[prevIndex].classList.remove('selected');
                state.selectedCell = index;
                cells[index].classList.add('selected');
            }
        }
    }

    function swapCellsWithAnimation(i1, i2) {
        return new Promise((resolve) => {
            const temp = state.grid[i1];
            state.grid[i1] = state.grid[i2];
            state.grid[i2] = temp;
            
            const cells = document.querySelectorAll('.cell');
            if (cells[i1] && cells[i2]) {
                cells[i1].style.transform = 'scale(0.8)';
                cells[i2].style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    cells[i1].textContent = state.grid[i1];
                    cells[i2].textContent = state.grid[i2];
                    
                    cells[i1].style.transform = 'scale(1)';
                    cells[i2].style.transform = 'scale(1)';
                    
                    setTimeout(() => resolve(), 200);
                }, 200);
            } else {
                resolve();
            }
        });
    }

    function areAdjacent(i1, i2) {
        const r1 = Math.floor(i1 / CONFIG.GRID_SIZE), c1 = i1 % CONFIG.GRID_SIZE;
        const r2 = Math.floor(i2 / CONFIG.GRID_SIZE), c2 = i2 % CONFIG.GRID_SIZE;
        return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
    }

    function findMatches() {
        let matches = new Set();
        const size = CONFIG.GRID_SIZE;
        const matchSize = LEVEL_CONFIG[state.currentLevel]?.matchSize || 3;

        // --- VERIFICA ORIZZONTALE ---
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - (matchSize - 1); c++) {
                const i = r * size + c;
                const cells = [];
                let hasBonus = false;
                let baseItem = null;
                
                for (let k = 0; k < matchSize; k++) {
                    const cellIndex = i + k;
                    const item = state.grid[cellIndex];
                    cells.push({ index: cellIndex, item: item });
                    
                    if (CONFIG.BONUS_ITEMS.includes(item)) {
                        hasBonus = true;
                    } else if (!baseItem) {
                        baseItem = item;
                    }
                }
                
                let isMatch = false;
                
                if (hasBonus) {
                    const nonBonusItems = cells.filter(c => !CONFIG.BONUS_ITEMS.includes(c.item));
                    if (nonBonusItems.length === 0) {
                        isMatch = true;
                    } else {
                        const firstNonBonus = nonBonusItems[0].item;
                        const allSame = nonBonusItems.every(c => c.item === firstNonBonus);
                        if (allSame) {
                            isMatch = true;
                        } else if (nonBonusItems.length >= matchSize - 1) {
                            const itemCounts = {};
                            nonBonusItems.forEach(c => {
                                itemCounts[c.item] = (itemCounts[c.item] || 0) + 1;
                            });
                            for (const count of Object.values(itemCounts)) {
                                if (count >= matchSize - 1) {
                                    isMatch = true;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    const firstItem = cells[0].item;
                    isMatch = cells.every(c => c.item === firstItem);
                }
                
                if (isMatch) {
                    cells.forEach(c => matches.add(c.index));
                }
            }
        }

        // --- VERIFICA VERTICALE ---
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - (matchSize - 1); r++) {
                const i = r * size + c;
                const cells = [];
                let hasBonus = false;
                let baseItem = null;
                
                for (let k = 0; k < matchSize; k++) {
                    const cellIndex = i + (k * size);
                    const item = state.grid[cellIndex];
                    cells.push({ index: cellIndex, item: item });
                    
                    if (CONFIG.BONUS_ITEMS.includes(item)) {
                        hasBonus = true;
                    } else if (!baseItem) {
                        baseItem = item;
                    }
                }
                
                let isMatch = false;
                
                if (hasBonus) {
                    const nonBonusItems = cells.filter(c => !CONFIG.BONUS_ITEMS.includes(c.item));
                    if (nonBonusItems.length === 0) {
                        isMatch = true;
                    } else {
                        const firstNonBonus = nonBonusItems[0].item;
                        const allSame = nonBonusItems.every(c => c.item === firstNonBonus);
                        if (allSame) {
                            isMatch = true;
                        } else if (nonBonusItems.length >= matchSize - 1) {
                            const itemCounts = {};
                            nonBonusItems.forEach(c => {
                                itemCounts[c.item] = (itemCounts[c.item] || 0) + 1;
                            });
                            for (const count of Object.values(itemCounts)) {
                                if (count >= matchSize - 1) {
                                    isMatch = true;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    const firstItem = cells[0].item;
                    isMatch = cells.every(c => c.item === firstItem);
                }
                
                if (isMatch) {
                    cells.forEach(c => matches.add(c.index));
                }
            }
        }
        return matches;
    }

    function processMatches(matches) {
        if (state.gameCompleted) return;
        
        // Riproduci suono di match
        AudioManager.playMatch();
        
        collectResources(matches);

        matches.forEach(idx => {
            const cell = document.querySelector(`.cell[data-index='${idx}']`);
            if(cell) cell.classList.add('match-anim');
        });

        setTimeout(() => {
            applyGravity(matches);
            renderGridVisuals();

            setTimeout(() => {
                const newMatches = findMatches();
                if (newMatches.size > 0) {
                    processMatches(newMatches);
                } else {
                    state.isProcessing = false;
                    renderGridVisuals();
                    checkGameEnd();
                }
            }, CONFIG.CASCADE_DELAY);

        }, CONFIG.ANIMATION_DURATION);
    }

    function applyGravity(matchedIndices) {
        const size = CONFIG.GRID_SIZE;
        let newGrid = new Array(size * size).fill(null);
        const levelConfig = LEVEL_CONFIG[state.currentLevel];
        const allowedBonuses = levelConfig?.allowedBonuses || ['🐚'];

        for (let c = 0; c < size; c++) {
            let activeItems = [];
            for (let r = 0; r < size; r++) {
                let idx = r * size + c;
                if (!matchedIndices.has(idx)) {
                    activeItems.push(state.grid[idx]);
                }
            }
            let missingCount = size - activeItems.length;
            for (let k = 0; k < missingCount; k++) {
                // Probabilità molto bassa per nuovi bonus
                const bonusChance = levelConfig?.bonusChance || 0.02;
                if (Math.random() < bonusChance) {
                    const randomBonus = allowedBonuses[Math.floor(Math.random() * allowedBonuses.length)];
                    activeItems.unshift(randomBonus);
                } else {
                    activeItems.unshift(CONFIG.ITEMS[Math.floor(Math.random() * CONFIG.ITEMS.length)]);
                }
            }
            for (let r = 0; r < size; r++) {
                newGrid[r * size + c] = activeItems[r];
            }
        }
        state.grid = newGrid;
    }

    function checkGameEnd() {
        if (state.gameCompleted) return false;
        
        const movesLeft = Math.max(0, state.movesRemaining - state.moveCount);
        
        if (movesLeft <= 0) {
            const targetHealth = LEVEL_CONFIG[state.currentLevel]?.targetHealth || 50;
            
            if (state.health >= targetHealth) {
                state.gameCompleted = true;
                
                setTimeout(() => {
                    if (state.gameCompleted) {
                        // SBLOCCA SOLO IL LIVELLO SUCCESSIVO
                        if (!state.levelUnlockedThisRound && state.currentLevel < 6) {
                            state.currentLevel = state.currentLevel + 1; // Solo +1, non di più
                            state.levelUnlockedThisRound = true;
                        }
                        showScreen('win');
                    }
                }, 1000);
            } else {
                setTimeout(() => {
                    alert(`Mosse finite! Il corallo ha bisogno di almeno ${targetHealth}% di salute per sopravvivere. Hai raggiunto solo ${state.health}%. Riprova!`);
                    goToMap();
                }, 500);
            }
            return true;
        }
        return false;
    }

    // MODIFICATA: RACCOLTA RISORSE PIÙ LENTA
    function collectResources(matchSet) {
        if (state.gameCompleted) return;
        
        const matchArray = Array.from(matchSet);
        const firstIdx = matchArray[0];
        const type = state.grid[firstIdx];
        
        // Conta bonus items nel match
        const bonusItemsInMatch = matchArray.filter(idx => 
            CONFIG.BONUS_ITEMS.includes(state.grid[idx])
        ).length;
        
        // Se ci sono bonus items nel match, aggiungi EXP
        if (bonusItemsInMatch > 0) {
            state.bonusMatches++;
            let totalExp = 0;
            
            matchArray.forEach(idx => {
                const item = state.grid[idx];
                if (CONFIG.BONUS_ITEMS.includes(item)) {
                    const expValue = CONFIG.BONUS_EXP_VALUES[getBonusType(item)] || 3;
                    totalExp += expValue;
                    
                    animateExpGain(idx, expValue);
                }
            });
            
            state.exp += totalExp;
            
            // Converti EXP in salute (15 EXP = 1% salute)
            const healthFromExp = Math.floor(totalExp / 15);
            if (healthFromExp > 0) {
                state.health += healthFromExp;
                AudioManager.playBonusCollect();
            }
        }
        
        // Incrementa risorse basate sul tipo principale del match
        const mainItems = matchArray.filter(idx => 
            CONFIG.ITEMS.includes(state.grid[idx])
        );
        
        if (mainItems.length > 0) {
            const mainType = state.grid[mainItems[0]];
            const amount = Math.max(1, Math.floor(mainItems.length / 2));
            
            if (mainType === '💧') state.resources.water += amount;
            if (mainType === '🌿') state.resources.algae += amount;
            if (mainType === '☀️') state.resources.sun += amount;
            
            // Aggiungi salute per match normali (MOLTO RIDOTTA)
            const levelConfig = LEVEL_CONFIG[state.currentLevel];
            const healthGain = levelConfig ? levelConfig.healthPerMatch * amount : 3 * amount;
            state.health += healthGain;
        }
        
        // Limita salute massima a 100
        state.health = Math.min(100, state.health);
        
        // Controlla vittoria
        const targetHealth = LEVEL_CONFIG[state.currentLevel]?.targetHealth || 50;
        if (!state.gameCompleted && state.health >= targetHealth) {
            state.health = Math.min(100, state.health);
            state.gameCompleted = true;
            
            const movesLeft = Math.max(0, state.movesRemaining - state.moveCount);
            if (movesLeft > 0) {
                state.bonusRewards++;
            }
            
            if (!state.levelUnlockedThisRound && state.currentLevel < 6) {
                state.currentLevel = state.currentLevel + 1;
                state.levelUnlockedThisRound = true;
            }
            
            setTimeout(() => {
                if (state.gameCompleted) {
                    showScreen('win');
                }
            }, 1000);
        }
        
        updateUI();
    }

    function getBonusType(emoji) {
        if (emoji === '🐚') return 'shell';
        if (emoji === '🐠') return 'fish1';
        if (emoji === '🦀') return 'crab';
        return 'shell';
    }

    function animateExpGain(cellIndex, expValue) {
        const cell = document.querySelector(`.cell[data-index='${cellIndex}']`);
        if (!cell) return;
        
        const expPopup = document.createElement('div');
        expPopup.className = 'exp-popup';
        expPopup.textContent = `+${expValue} EXP`;
        expPopup.style.position = 'absolute';
        expPopup.style.color = '#ffd700';
        expPopup.style.fontWeight = 'bold';
        expPopup.style.textShadow = '2px 2px 0 #000';
        expPopup.style.zIndex = '100';
        
        const rect = cell.getBoundingClientRect();
        expPopup.style.left = rect.left + rect.width / 2 + 'px';
        expPopup.style.top = rect.top + 'px';
        
        document.body.appendChild(expPopup);
        
        expPopup.animate([
            { transform: 'translate(-50%, 0)', opacity: 1 },
            { transform: 'translate(-50%, -50px)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });
        
        setTimeout(() => expPopup.remove(), 1000);
    }

    // --- SEZIONE LOGICA CURA CORALLO ---
    function useTool(type) {
        if (state.gameCompleted) return;
        
        const cost = CONFIG.COST_PER_ACTION;
        let healed = 0;

        if (type === 'water' && state.resources.water >= cost) {
            state.resources.water -= cost;
            healed = CONFIG.HEAL_VALUES.water;
        } else if (type === 'algae' && state.resources.algae >= cost) {
            state.resources.algae -= cost;
            healed = CONFIG.HEAL_VALUES.algae;
        } else if (type === 'sun' && state.resources.sun >= cost) {
            state.resources.sun -= cost;
            healed = CONFIG.HEAL_VALUES.sun;
        } else if (type === 'shell' && state.bonusResources.shell >= 1) {
            state.bonusResources.shell -= 1;
            healed = CONFIG.BONUS_HEAL_VALUES.shell;
        } else if (type === 'fish1' && state.bonusResources.fish1 >= 1) {
            state.bonusResources.fish1 -= 1;
            healed = CONFIG.BONUS_HEAL_VALUES.fish1;
        } else if (type === 'crab' && state.bonusResources.crab >= 1) {
            state.bonusResources.crab -= 1;
            healed = CONFIG.BONUS_HEAL_VALUES.crab;
        }

        if (healed > 0) {
            state.health += healed;
            state.health = Math.min(100, state.health);
            
            const targetHealth = LEVEL_CONFIG[state.currentLevel]?.targetHealth || 50;
            if (!state.gameCompleted && state.health >= targetHealth) {
                state.health = Math.min(100, state.health);
                state.gameCompleted = true;
                
                updateUI();
                const movesLeft = Math.max(0, state.movesRemaining - state.moveCount);
                if (movesLeft > 0) {
                    state.bonusRewards++;
                }
                
                if (!state.levelUnlockedThisRound && state.currentLevel < 6) {
                    state.currentLevel = state.currentLevel + 1;
                    state.levelUnlockedThisRound = true;
                }
                
                setTimeout(() => {
                    if (state.gameCompleted) {
                        showScreen('win');
                    }
                }, 1500);
            } else {
                updateUI();
            }
        }
    }

    // --- SEZIONE AGGIORNAMENTO INTERFACCIA ---
    function updateUI() {
        const resWaterEl = document.getElementById('res-water');
        if (resWaterEl) resWaterEl.innerText = state.resources.water;
        const resAlgaeEl = document.getElementById('res-algae');
        if (resAlgaeEl) resAlgaeEl.innerText = state.resources.algae;
        const resSunEl = document.getElementById('res-sun');
        if (resSunEl) resSunEl.innerText = state.resources.sun;
        
        const bonusWaterEl = document.getElementById('bonus-shell');
        const bonusFish1El = document.getElementById('bonus-fish1');
        const bonusFish2El = document.getElementById('bonus-fish2');
        if (bonusWaterEl) bonusWaterEl.innerText = state.bonusResources.shell;
        if (bonusFish1El) bonusFish1El.innerText = state.bonusResources.fish1;
        if (bonusFish2El) bonusFish2El.innerText = state.bonusResources.crab;
        
        const movesEl = document.getElementById('moves-remaining');
        if (movesEl) movesEl.innerText = Math.max(0, state.movesRemaining - state.moveCount);
        
        const levelEl = document.getElementById('level-indicator');
        if (levelEl) levelEl.innerText = state.currentLevel;
        
        const healthFillEl = document.getElementById('health-fill');
        if (healthFillEl) {
            healthFillEl.style.width = state.health + '%';
            
            if (state.health < 30) {
                healthFillEl.style.backgroundColor = '#e74c3c';
            } else if (state.health < 70) {
                healthFillEl.style.backgroundColor = '#f39c12';
            } else {
                healthFillEl.style.backgroundColor = '#2ecc71';
            }
        }
        
        const expValueDisplay = document.getElementById('exp-value-display');
        if (expValueDisplay) expValueDisplay.innerText = state.exp;
        
        const bonusMatchDisplay = document.getElementById('bonus-match-display');
        if (bonusMatchDisplay) bonusMatchDisplay.innerText = state.bonusMatches;
        
        const targetHealthDisplay = document.getElementById('target-health');
        if (targetHealthDisplay) {
            const target = LEVEL_CONFIG[state.currentLevel]?.targetHealth || 50;
            targetHealthDisplay.innerText = target;
        }
        
        const btnWaterEl = document.getElementById('btn-water');
        if (btnWaterEl) btnWaterEl.disabled = state.resources.water < CONFIG.COST_PER_ACTION;
        const btnAlgaeEl = document.getElementById('btn-algae');
        if (btnAlgaeEl) btnAlgaeEl.disabled = state.resources.algae < CONFIG.COST_PER_ACTION;
        const btnSunEl = document.getElementById('btn-sun');
        if (btnSunEl) btnSunEl.disabled = state.resources.sun < CONFIG.COST_PER_ACTION;
        
        const btnShellEl = document.getElementById('btn-shell');
        if (btnShellEl) btnShellEl.disabled = state.bonusResources.shell < 1;
        const btnFish1El = document.getElementById('btn-fish1');
        if (btnFish1El) btnFish1El.disabled = state.bonusResources.fish1 < 1;
        const btnCrabEl = document.getElementById('btn-crab');
        if (btnCrabEl) btnCrabEl.disabled = state.bonusResources.crab < 1;
        
        updateCoralVisuals();
    }

    function updateCoralVisuals() {
        const sprite = document.getElementById('coral-sprite');
        const emotion = document.getElementById('coral-emotion');
        const container = document.getElementById('coral-monitor');
        
        if (state.health === 0) {
            sprite.style.filter = 'grayscale(100%) brightness(50%)';
            emotion.innerText = '😵';
            container.style.backgroundColor = '#e0f7fa';
        } else if (state.health < 30) {
            sprite.style.filter = 'grayscale(80%) brightness(70%)';
            emotion.innerText = '😓';
            container.style.backgroundColor = '#e0f7fa';
        } else if (state.health < 70) {
            sprite.style.filter = 'grayscale(30%)';
            emotion.innerText = '😐';
            container.style.backgroundColor = '#b2ebf2';
        } else {
            sprite.style.filter = 'grayscale(0%) sepia(0%) saturate(1.2)';
            emotion.innerText = '🥰';
            container.style.backgroundColor = '#4dd0e1';
        }
    }

    // --- SEZIONE EFFETTI VISIVI ---
    function createBubbles() {
        const bg = document.getElementById('ocean-bg');
        if(bg.children.length > 20) return;
        
        for(let i=0; i<8; i++) {
            let b = document.createElement('div');
            b.className = 'bubble';
            let size = Math.random() * 15 + 5;
            b.style.width = size + 'px';
            b.style.height = size + 'px';
            b.style.left = Math.random() * 100 + '%';
            b.style.animationDuration = (Math.random() * 8 + 4) + 's';
            b.style.animationDelay = Math.random() * 5 + 's';
            bg.appendChild(b);
        }
    }

    // --- FUNZIONI IMPOSTAZIONI ---
    function updateSettingsDisplay() {
        const audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
        const musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        const nightMode = localStorage.getItem('nightMode') === 'true';
        
        const audioStatusEl = document.getElementById('audio-status');
        const musicStatusEl = document.getElementById('music-status');
        const nightmodeStatusEl = document.getElementById('nightmode-status');
        
        if (audioStatusEl) audioStatusEl.textContent = audioEnabled ? '🔊 ATTIVO' : '🔇 DISATTIVO';
        if (musicStatusEl) musicStatusEl.textContent = musicEnabled ? '🎵 ATTIVA' : '🎵 DISATTIVA';
        if (nightmodeStatusEl) nightmodeStatusEl.textContent = nightMode ? '🌙 ATTIVA' : '🌙 DISATTIVA';
    }

    function toggleAudio() {
        const audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
        const newState = !audioEnabled;
        localStorage.setItem('audioEnabled', newState);
        state.audioEnabled = newState;
        updateSettingsDisplay();
        AudioManager.playButtonClick();
    }

    function toggleMusic() {
        const musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        const newState = !musicEnabled;
        localStorage.setItem('musicEnabled', newState);
        state.musicEnabled = newState;
        updateSettingsDisplay();
        AudioManager.toggleMusic();
        AudioManager.playButtonClick();
    }

    function toggleNightMode() {
        const nightMode = localStorage.getItem('nightMode') === 'true';
        const newState = !nightMode;
        localStorage.setItem('nightMode', newState);
        state.nightMode = newState;
        updateSettingsDisplay();
        AudioManager.playButtonClick();
        
        if (newState) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
    }

    function returnToMapAfterWin() {
        state.gameCompleted = false;
        goToMap();
    }

    // --- FUNZIONI GETTER PER STATISTICHE (aggiunte) ---
    function getBonusCount(type) {
        return state.bonusResources[type] || 0;
    }

    function getHealth() {
        return Math.round(state.health);
    }

    function getExp() {
        return state.exp;
    }

    function getBonusMatches() {
        return state.bonusMatches;
    }

    function getMoveCount() {
        return state.moveCount;
    }

    // --- INIZIALIZZAZIONE ---
    document.addEventListener('DOMContentLoaded', () => {
        AudioManager.init();
        updateUI();
        updateUnlockedLevels();
        
        // Carica le impostazioni dal localStorage
        state.audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
        state.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        state.nightMode = localStorage.getItem('nightMode') === 'true';
        
        // Applica night mode se attivo
        if (state.nightMode) {
            document.body.classList.add('night-mode');
        }
    });
    
    // --- ESPOSIZIONE FUNZIONI PUBBLICHE ---
    return {
        startGame,
        selectAvatar,
        continueToCoralChoice,
        selectCoral,
        goToMap,
        enterZone,
        useTool,
        showScreen,
        scrollUp,
        scrollDown,
        updateUnlockedLevels,
        toggleAudio,
        toggleMusic,
        toggleNightMode,
        returnToMapAfterWin,
        getBonusCount,
        getHealth,
        getExp,
        getBonusMatches,
        getMoveCount
    };

})();