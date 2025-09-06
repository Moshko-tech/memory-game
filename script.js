// Налаштування гри
const cardIcons = ['⭐️', '🚀', '🐠', '🌊', '🔷', '🐬', '🌌', '🔵']; // Символи для карток
let cards = []; // Масив для перемішаних карт
let flippedCards = []; // Масив для перевернутих карт
let moveCount = 0; // Лічильник ходів
let timer; // Змінна для таймеру
let seconds = 0; // Лічильник секунд
let gameStarted = false; // Прапорець початку гри
// Отримуємо елементи з HTML
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const restartButton = document.getElementById('restart-btn');

// Створюємо колоду карт: кожна картка зустрічається двічі
function createCardArray(icons) {
    let cardArray = [];
    icons.forEach(icon => {
        cardArray.push(icon, icon); // Додаємо дві однакові картки
    });
    return cardArray.sort(() => Math.random() - 0.5); // Перемішуємо масив
}
// Функція для старту/перезапуску гри
function startGame() {
    // Зупиняємо старий таймер і скидаємо значення
    clearInterval(timer);
    seconds = 0;
    moveCount = 0;
    flippedCards = [];
    gameStarted = false;
    movesDisplay.textContent = moveCount;
    timerDisplay.textContent = seconds;

    // Створюємо нову колоду і очищаємо поле
    cards = createCardArray(cardIcons);
    gameBoard.innerHTML = '';

    // Створюємо картки на полі
    cards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index; // Зберігаємо індекс картки
        card.dataset.icon = icon;   // Зберігаємо значення картки

        // Створюємо "лицьову" і "зворотну" сторони картки
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.textContent = icon;

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        
        // Додаємо сторони в картку і картку на поле
        card.appendChild(cardFront);
        card.appendChild(cardBack);
        gameBoard.appendChild(card);

        // Додаємо обробник кліку на картку
        card.addEventListener('click', flipCard);
    });
}
// Функція перевороту картки
function flipCard() {
    // Якщо картка вже перевернута або вже перевернуті дві - виходимо
    if (this.classList.contains('flipped') || flippedCards.length >= 2) {
        return;
    }

    // Запускаємо таймер при першому кліку
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }
   // Перевертаємо картку
    this.classList.add('flipped');
    // Додаємо її в масив перевернутих
    flippedCards.push(this);

    // Якщо перевернуто дві картки, перевіряємо на збіг
    if (flippedCards.length === 2) {
        moveCount++;
        movesDisplay.textContent = moveCount;
        checkForMatch();
    }
}
// Функція перевірки збігу карток
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.icon === card2.dataset.icon;

    // Якщо не збіглися, перевертаємо назад через затримку
    if (!isMatch) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    } else {
        // Якщо збіглися, очищаємо масив для наступних ходів
        flippedCards = [];
        
        // Перевіряємо чи гра завершена
        checkGameCompletion();
    }
}

// Функція перевірки завершення гри
function checkGameCompletion() {
    const allCards = document.querySelectorAll('.card');
    const allFlipped = document.querySelectorAll('.card.flipped');

    if (allCards.length === allFlipped.length) {
        setTimeout(() => {
            clearInterval(timer);
            alert(`Вітаю! Ви знайшли всі пари за ${moveCount} ходів та ${seconds} секунд!`);
        }, 500);
    }
}
// Функція запуску таймеру
function startTimer() {
    timer = setInterval(() => {
        seconds++;
        timerDisplay.textContent = seconds;
    }, 1000);
}
// Вішаємо обробник на кнопку перезапуску
restartButton.addEventListener('click', startGame);

// Запускаємо гру при першому завантаженні
startGame();