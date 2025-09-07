document.addEventListener('DOMContentLoaded', () => {
    // Елементи DOM
    const gameBoard = document.getElementById('game-board');
    const movesElement = document.getElementById('moves');
    const timerElement = document.getElementById('timer');
    const pairsElement = document.getElementById('pairs');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetLeaderboardBtn = document.getElementById('reset-leaderboard-btn');
    const playerForm = document.getElementById('player-form');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const winnerBanner = document.getElementById('winner-banner');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    
    // Замініть цей URL на URL з вашого Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhO7X3sTAJAD3pG8HNCX2RB0jUB_4Xp8IEsLvRrCJyoHIT3rer7T5HLt19ET2ULCROXA/exec';
    
    // Морські символи для карток
    const symbols = ['🐠', '🐟', '🐡', '🦀', '🐙', '🐬', '🦈', '🐋', 
                    '⚓', '🛥', '🌊', '🐚', '🏝', '🤿', '🌅', '🧜'];
    
    // Змінні гри
    let cards = [];
    let flippedCards = [];
    let matchedCards = [];
    let moves = 0;
    let timer = 0;
    let timerInterval;
    let gameStarted = false;
    let totalPairs = 8;
    
    // Завантаження рейтингу з локального сховища
    let leaderboard = JSON.parse(localStorage.getItem('memoryLeaderboard')) || [];
    
    // Відображення рейтингу
    function displayLeaderboard() {
        leaderboardBody.innerHTML = '';
        
        // Сортування за часом (менше = краще)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => {
  if (a.time === b.time) {
    return a.moves - b.moves; // при однаковому часі - менше ходів краще
  }
  return a.time - b.time; // менший час краще
});
        
        sortedLeaderboard.forEach((player, index) => {
            const row = document.createElement('tr');
            
            if (index === 0) {
                row.classList.add('first-place', 'glow');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.name} <span class="cups">🏆</span></td>
                    <td>${player.time} сек</td>
                    <td>${player.moves}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.name}</td>
                    <td>${player.time} сек</td>
                    <td>${player.moves}</td>
                `;
            }
            
            leaderboardBody.appendChild(row);
        });
    }
    
    // Збереження результату
    async function saveScore(name, time, moves) {
        // Збереження в локальне сховище
        const existingPlayerIndex = leaderboard.findIndex(player => player.name === name);
        
        if (existingPlayerIndex !== -1) {
            const player = leaderboard[existingPlayerIndex];
            
            if (time < player.bestTime) {
                player.bestTime = time;
                player.time = time;
                player.moves = moves;
                if (isFirstPlace(time)) {
                    player.cups += 1;
                }
            }
        } else {
            leaderboard.push({
                name,
                time,
                moves,
                bestTime: time,
                cups: isFirstPlace(time) ? 1 : 0
            });
        }
        
        localStorage.setItem('memoryLeaderboard', JSON.stringify(leaderboard));
        displayLeaderboard();
        
        // Збереження в онлайн-базу
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveScore',
                    name: name,
                    time: time,
                    moves: moves
                })
            });
            console.log('Дані відправлено на сервер');
        } catch (error) {
            console.error('Помилка збереження в онлайн-базу:', error);
        }
    }
    
    // Завантаження рейтингу з онлайн-бази
    async function loadOnlineLeaderboard() {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getScores&t=${new Date().getTime()}`);
            const onlineLeaderboard = await response.json();
            
            if (onlineLeaderboard && onlineLeaderboard.length > 0) {
                leaderboard = onlineLeaderboard;
                localStorage.setItem('memoryLeaderboard', JSON.stringify(leaderboard));
                displayLeaderboard();
            }
        } catch (error) {
            console.error('Помилка завантаження з онлайн-бази:', error);
        }
    }
    
    // Перевірка, чи результат є першим місцем
    function isFirstPlace(time) {
        if (leaderboard.length === 0) return true;
        const bestTime = Math.min(...leaderboard.map(player => player.bestTime));
        return time < bestTime;
    }
    
    // Скидання рейтингу
    function resetLeaderboard() {
        leaderboard = [];
        localStorage.removeItem('memoryLeaderboard');
        displayLeaderboard();
    }
    
    // Ініціалізація гри
    function initGame() {
        gameBoard.innerHTML = '';
        flippedCards = [];
        matchedCards = [];
        moves = 0;
        timer = 0;
        movesElement.textContent = moves;
        timerElement.textContent = timer;
        pairsElement.textContent = `0/${totalPairs}`;
        winnerBanner.style.display = 'none';
        
        // Створення пар символів
        let gameSymbols = symbols.slice(0, totalPairs);
        gameSymbols = [...gameSymbols, ...gameSymbols];
        
        // Перемішування символів
        gameSymbols.sort(() => Math.random() - 0.5);
        
        // Створення карток
        cards = gameSymbols.map((symbol, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            
            const cardFront = document.createElement('div');
            cardFront.classList.add('card-front');
            cardFront.textContent = symbol;
            
            const cardBack = document.createElement('div');
            cardBack.classList.add('card-back');
            
            card.appendChild(cardFront);
            card.appendChild(cardBack);
            
            card.addEventListener('click', () => flipCard(card));
            
            gameBoard.appendChild(card);
            return card;
        });
    }
    
    // Перевертання картки
    function flipCard(card) {
        if (!gameStarted) return;
        if (flippedCards.length === 2 || card.classList.contains('flipped') || matchedCards.includes(card)) return;
        
        card.classList.add('flipped');
        flippedCards.push(card);
        
        if (flippedCards.length === 2) {
            moves++;
            movesElement.textContent = moves;
            
            setTimeout(checkMatch, 700);
        }
    }
    
    // Перевірка на збіг
    function checkMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.symbol === card2.dataset.symbol) {
            matchedCards.push(card1, card2);
            pairsElement.textContent = `${matchedCards.length/2}/${totalPairs}`;
            
            if (matchedCards.length === cards.length) {
                clearInterval(timerInterval);
                playerForm.style.display = 'block';
                winnerBanner.style.display = 'block';
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }
        
        flippedCards = [];
    }
    
    // Запуск таймера
    function startTimer() {
        clearInterval(timerInterval);
        timer = 0;
        timerElement.textContent = timer;
        
        timerInterval = setInterval(() => {
            timer++;
            timerElement.textContent = timer;
        }, 1000);
    }
    
    // Обробники подій
    startBtn.addEventListener('click', () => {
        gameStarted = true;
        initGame();
        startTimer();
        playerForm.style.display = 'none';
        startBtn.disabled = true;
    });
    
    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        gameStarted = false;
        initGame();
        playerForm.style.display = 'none';
        winnerBanner.style.display = 'none';
        startBtn.disabled = false;
    });
    
    resetLeaderboardBtn.addEventListener('click', () => {
        passwordModal.style.display = 'flex';
    });
    
    confirmResetBtn.addEventListener('click', () => {
        if (passwordInput.value === '1357924680') {
            resetLeaderboard();
            passwordModal.style.display = 'none';
            passwordInput.value = '';
            alert('Рейтинг успішно скинуто!');
        } else {
            alert('Невірний пароль! Спробуйте ще раз.');
        }
    });
    
    cancelResetBtn.addEventListener('click', () => {
        passwordModal.style.display = 'none';
        passwordInput.value = '';
    });
    
    saveScoreBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            saveScore(name, timer, moves);
            playerForm.style.display = 'none';
            playerNameInput.value = '';
            startBtn.disabled = false;
        } else {
            alert('Будь ласка, введіть ваше ім\'я');
        }
    });
    
    // Початкова ініціалізація
    initGame();
    loadOnlineLeaderboard();
});