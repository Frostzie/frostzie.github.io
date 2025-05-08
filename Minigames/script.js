document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const resetGameButton = document.getElementById('reset-game');
    const pingInput = document.getElementById('ping');
    const styleRadios = document.querySelectorAll('input[name="style"]');
    const bestTimesList = document.getElementById('best-times-list');
    const resetScoresButton = document.getElementById('reset-scores');
    const gameTimerDisplay = document.querySelector('.game-timer-display');
    
    const TOTAL_NUMBERS = 14;
    let currentNumbersOnBoard = []; 
    let nextNumberToClick = 1;
    let timerInterval;
    let startTime;
    let gameActive = false;
    let bestTimes = JSON.parse(localStorage.getItem('clickOrderBestTimes')) || [];
    let currentStyle = 'custom-odin'; // This refers to the value, Custom is "custom-odin"

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupBoard() {
        gameBoard.innerHTML = ''; 
        currentNumbersOnBoard = []; 
        gameTimerDisplay.textContent = '';
        gameTimerDisplay.style.display = 'none'; 
        gameBoard.style.display = 'grid';   

        const numbersToPlace = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
        const shuffledNumbers = shuffleArray([...numbersToPlace]); 

        shuffledNumbers.forEach(numValue => {
            const box = document.createElement('div');
            box.classList.add('number-box');
            
            const numberTextSpan = document.createElement('span');
            numberTextSpan.classList.add('number-text');
            numberTextSpan.textContent = numValue;
            box.appendChild(numberTextSpan);
            
            box.dataset.number = numValue; 
            box.addEventListener('click', handleNumberClick);
            gameBoard.appendChild(box);
            currentNumbersOnBoard.push({ value: numValue, element: box, textElement: numberTextSpan });
        });

        nextNumberToClick = 1;
        gameActive = true;
        stopTimer(); 
        updateNumberHighlights(); 
    }

    function updateNumberHighlights() {
        const highlightingStyles = ['custom-odin', 'skytils', 'odin']; 

        document.querySelectorAll('.number-box').forEach(box => {
            box.classList.remove('current-to-click', 'second-to-click', 'third-to-click');
        });

        if (!highlightingStyles.includes(currentStyle) || !gameActive) {
            return; 
        }

        currentNumbersOnBoard.forEach(item => {
            const boxElement = item.element;
            const boxNumberValue = item.value;

            if (!boxElement.classList.contains('deactivated')) { 
                if (boxNumberValue === nextNumberToClick) {
                    boxElement.classList.add('current-to-click');
                } else if (boxNumberValue === nextNumberToClick + 1) {
                    boxElement.classList.add('second-to-click');
                } else if (boxNumberValue === nextNumberToClick + 2) {
                    boxElement.classList.add('third-to-click');
                }
            }
        });
    }

    function handleNumberClick(event) {
        if (!gameActive) return;

        const clickedBox = event.currentTarget; 
        const item = currentNumbersOnBoard.find(i => i.element === clickedBox);
        if (!item) return;
        
        const clickedNumber = item.value;
        const pingDelay = parseInt(pingInput.value) || 0;

        if (clickedBox.classList.contains('processing') || clickedBox.classList.contains('deactivated')) {
            return;
        }
        clickedBox.classList.add('processing');

        setTimeout(() => {
            clickedBox.classList.remove('processing');
            if (!gameActive) { 
                 updateNumberHighlights(); 
                 return;
            }

            if (clickedNumber === nextNumberToClick) {
                clickedBox.classList.add('deactivated');
                clickedBox.classList.remove('current-to-click', 'second-to-click', 'third-to-click');

                // Handle text disappearance based on style
                // "Custom" uses value 'custom-odin'
                if (currentStyle === 'custom-odin' || currentStyle === 'skytils' || currentStyle === 'odin') {
                    item.textElement.textContent = ''; 
                }
                // For Vanilla, text remains. This condition is met.

                if (nextNumberToClick === 1 && !startTime) {
                    startTimer();
                }
                nextNumberToClick++;

                if (nextNumberToClick > TOTAL_NUMBERS) {
                    finishGame();
                } else {
                    updateNumberHighlights(); 
                }
            }
        }, pingDelay);
    }

    function finishGame() {
        gameActive = false;
        stopTimer();
        const timeTaken = (Date.now() - startTime) / 1000;
        startTime = null; 
        gameBoard.style.display = 'none'; 
        gameTimerDisplay.style.display = 'block'; 
        gameTimerDisplay.textContent = `Time: ${timeTaken.toFixed(3)}s`;
        addScore(timeTaken);
        updateNumberHighlights();
    }

    function startTimer() { startTime = Date.now(); }
    function stopTimer() { clearInterval(timerInterval); }

    function addScore(newTime) {
        bestTimes.push(newTime);
        bestTimes.sort((a, b) => a - b); 
        bestTimes = bestTimes.slice(0, 5); 
        localStorage.setItem('clickOrderBestTimes', JSON.stringify(bestTimes));
        renderBestTimes();
    }

    function renderBestTimes() {
        bestTimesList.innerHTML = ''; 
        if (bestTimes.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No scores yet!';
            bestTimesList.appendChild(li);
        } else {
            bestTimes.forEach(time => {
                const li = document.createElement('li');
                li.textContent = `${time.toFixed(3)}s`;
                bestTimesList.appendChild(li);
            });
        }
    }

    function resetAllScores() {
        if (confirm("Are you sure you want to reset all scores?")) {
            bestTimes = [];
            localStorage.removeItem('clickOrderBestTimes');
            renderBestTimes();
        }
    }

    function applyStyle(styleValue) {
        currentStyle = styleValue; // styleValue is 'vanilla', 'skytils', 'odin', 'custom-odin'
        const selectedRadio = document.querySelector(`input[name="style"][value="${styleValue}"]`);
        const styleClass = selectedRadio ? selectedRadio.dataset.style : `${styleValue}-style`;

        const KNOWN_STYLE_CLASSES = ['custom-odin-style', 'vanilla-style', 'skytils-style', 'odin-style'];
        document.body.classList.remove(...KNOWN_STYLE_CLASSES);
        
        if (styleClass) {
            document.body.classList.add(styleClass);
        }
        localStorage.setItem('selectedGameStyle', styleValue); 
        setupBoard(); 
    }
    
    resetGameButton.addEventListener('click', () => {
        setupBoard(); 
    });
    resetScoresButton.addEventListener('click', resetAllScores);

    styleRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            applyStyle(event.target.value);
        });
    });

    const savedStyleValue = localStorage.getItem('selectedGameStyle');
    // Default to 'custom-odin' if nothing is saved (this value corresponds to "Custom" display name)
    const initialStyleValue = savedStyleValue || 'custom-odin'; 
    
    const radioToSelect = document.querySelector(`input[name="style"][value="${initialStyleValue}"]`);
    if (radioToSelect) {
        radioToSelect.checked = true;
        applyStyle(initialStyleValue);
    } else { 
        document.querySelector('input[name="style"][value="custom-odin"]').checked = true;
        applyStyle('custom-odin');
    }
    
    renderBestTimes(); 
    if (!gameActive) { // Should be set by applyStyle->setupBoard, but as a fallback.
        setupBoard(); 
    }
});