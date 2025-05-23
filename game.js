// Words of Havoc - Multi-level Synonym Game
// Uses 'levels' from word-pairs.js

if (typeof window.levels === 'undefined') {
    alert('Levels data not loaded! Please check word-pairs.js is loaded before game.js.');
}

let currentLevelIndex = 0;
let levelScore = 0;
let overallScore = 0;
let leftWords = [];
let rightWords = [];
let selectedWord = null;
let selectedElement = null;
let isAiming = false;
let aimAngle = 0;
let power = 0;
let gameWords = [];
let leaderboard = [];
const wordsPerLevel = 10; // Number of word pairs to use in each level
let isMobileDevice = true; // Always use mobile interface

// Leaderboard server settings
const LEADERBOARD_SERVER_ENABLED = false; // Set to true if using the PHP leaderboard
const LEADERBOARD_API_URL = '/.netlify/functions/leaderboard'; // Path to the PHP file

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize welcome screen
    initWelcomeScreen();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Set up touch events for mobile
    setupTouchEvents();
    
    // Set up the restart button
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // Update welcome screen with first level info
    updateWelcomeScreenLevelInfo();
    
    // Add window resize handler
    window.addEventListener('resize', handleScreenResize);
    
    // Detect if we're on Netlify or other static hosting
    detectStaticHosting();
});

// Detect if we're on static hosting like Netlify
function detectStaticHosting() {
    // Check for common Netlify environment
    if (window.location.hostname.includes('netlify.app') || 
        window.location.hostname === 'localhost' ||
        !LEADERBOARD_SERVER_ENABLED) {
        console.log('Static hosting detected or server disabled. Using local storage only.');
        // Force local storage mode
        window.FORCE_LOCAL_STORAGE = true;
    }
}

// Update welcome screen with level info
function updateWelcomeScreenLevelInfo() {
    const level = getCurrentLevel();
    const welcomeScreen = document.getElementById('welcome-screen');
    const welcomeLevelName = document.querySelector('.welcome-level-name');
    const welcomeLevelTagline = document.querySelector('.welcome-level-tagline');
    
    welcomeLevelName.textContent = `Level ${currentLevelIndex + 1}: ${level.name}`;
    welcomeLevelTagline.textContent = level.tagline;
    
    // Add some bottom padding to ensure scrollability on small screens
    welcomeScreen.style.paddingBottom = '50px';
    
    // Scroll to the top when showing a new level
    welcomeScreen.scrollTop = 0;
}

// Initialize the welcome screen
function initWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const startBtn = document.getElementById('welcome-start-btn');
    
    // Make sure welcome screen is scrollable on mobile
    welcomeScreen.style.overflowY = 'auto';
    welcomeScreen.style.maxHeight = '100%';
    
    // Ensure start button is always visible by adding additional styling
    startBtn.style.position = 'relative';
    startBtn.style.marginTop = '20px';
    startBtn.style.marginBottom = '30px'; // Extra space at bottom
    
    // Start button
    startBtn.addEventListener('click', function() {
        welcomeScreen.style.display = 'none';
        initializeGame();
    });
    
    // Make sure the welcome screen is visible
    welcomeScreen.style.display = 'flex';
}

// Mobile menu functionality
function initMobileMenu() {
    const burgerMenu = document.getElementById('burger-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('mobile-menu-close');
    
    // Toggle menu
    burgerMenu.addEventListener('click', function() {
        mobileMenu.classList.toggle('open');
    });
    
    // Close menu
    closeBtn.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
    });
    
    // Mobile menu items
    document.getElementById('mobile-restart').addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        restartGame();
    });
    
    document.getElementById('mobile-leaderboard').addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        showLeaderboardOnly();
    });
    
    document.getElementById('mobile-how-to-play').addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        showHowToPlay();
    });
    
    document.getElementById('mobile-about').addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        showAbout();
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(function(button) {
        button.addEventListener('click', function() {
            document.getElementById('how-to-play-modal').style.display = 'none';
            document.getElementById('about-modal').style.display = 'none';
            document.getElementById('game-container').style.opacity = '1';
        });
    });
}

// Show How to Play modal
function showHowToPlay() {
    document.getElementById('how-to-play-modal').style.display = 'block';
    document.getElementById('game-container').style.opacity = '0.2';
}

// Show About modal
function showAbout() {
    document.getElementById('about-modal').style.display = 'block';
    document.getElementById('game-container').style.opacity = '0.2';
}

// Setup touch events for mobile gameplay
function setupTouchEvents() {
    const gameContainer = document.getElementById('game-container');
    
    // Handle document-level touch events for aiming after initial touch
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

// Custom event for when a word element is created
function dispatchWordCreatedEvent(element) {
    const event = new CustomEvent('wordElementCreated', {
        detail: { element: element }
    });
    document.dispatchEvent(event);
}

// Handle touch start on words directly
function handleWordTouchStart(e, element) {
    if (!isAiming) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        const word = element.dataset.word;
        const touch = e.touches[0];
        
        // Pass the touch event correctly
        startAiming(word, element, {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: function() {} // Add empty preventDefault for compatibility
        });
    }
}

// Touch event handlers
function handleTouchMove(e) {
    if (isAiming && selectedElement) {
        e.preventDefault();
        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            updateAimLine({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: function() {}
            });
        }
    }
}

function handleTouchEnd(e) {
    if (isAiming && selectedElement) {
        if (e && e.preventDefault && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        shootWord({
            preventDefault: function() {}
        });
    }
}

// Update modals for mobile devices
function updateModalsForTouch() {
    // Add touch handlers to close modals
    document.querySelectorAll('.modal-close').forEach(function(closeBtn) {
        closeBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            document.getElementById('how-to-play-modal').style.display = 'none';
            document.getElementById('about-modal').style.display = 'none';
            document.getElementById('game-container').style.opacity = '1';
        });
    });
}

function getCurrentLevel() {
    return window.levels[currentLevelIndex];
}

function initializeGame() {
    const level = getCurrentLevel();
    document.getElementById('level-name').textContent = `Level ${currentLevelIndex + 1}: ${level.name}`;
    document.getElementById('level-tagline').textContent = ` - ${level.tagline}`;
    document.getElementById('level-display').textContent = `Level: ${currentLevelIndex + 1}`;
    document.getElementById('overall-score').textContent = `Overall Score: ${overallScore}`;
    document.getElementById('promotion-message').style.display = 'none';
    document.getElementById('leaderboard-section').style.display = 'none';

    const leftContainer = document.getElementById('words-left');
    const rightContainer = document.getElementById('words-right');
    
    // Explicitly set widths
    leftContainer.style.width = '33%';
    rightContainer.style.width = '33%';
    
    // Clear existing content
    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';

    // Select a random subset of word pairs from this level
    const allPairs = [...level.pairs];
    shuffleArray(allPairs);
    // Use only a subset of pairs (wordsPerLevel or fewer if not enough words)
    gameWords = allPairs.slice(0, Math.min(wordsPerLevel, allPairs.length));
    
    leftWords = gameWords.map(pair => pair[0]);
    rightWords = shuffleArray([...gameWords.map(pair => pair[1])]);

    // Create aim line element
    const existingLine = document.getElementById('aim-line');
    if (existingLine) existingLine.remove();
    const aimLine = document.createElement('div');
    aimLine.id = 'aim-line';
    document.getElementById('game-container').appendChild(aimLine);

    // Create left words with more direct styling
    leftWords.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word word-left';
        wordElement.textContent = word;
        wordElement.dataset.word = word;
        
        // Directly set styles to ensure visibility
        const pos = getRandomPosition(true, index);
        wordElement.style.position = 'absolute';
        wordElement.style.left = pos.left;
        wordElement.style.right = pos.right;
        wordElement.style.top = pos.top;
        wordElement.style.zIndex = '10';
        wordElement.style.backgroundColor = '#2a6478';
        
        // Add mouse events
        wordElement.addEventListener('mousedown', (e) => startAiming(word, wordElement, e));
        
        // Add direct touch events
        wordElement.addEventListener('touchstart', function(e) {
            if (e && e.touches && e.touches[0]) {
                e.preventDefault();
                startAiming(word, wordElement, {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY,
                    preventDefault: function() {}
                });
            }
        }, { passive: false });
        
        leftContainer.appendChild(wordElement);
        
        // Smoother animation
        wordElement.style.opacity = '0';
        wordElement.style.transform = 'scale(0.9)';
        wordElement.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        setTimeout(() => {
            wordElement.style.opacity = '1';
            wordElement.style.transform = 'scale(1)';
        }, index * 80);
        
        // Dispatch event for touch handling
        dispatchWordCreatedEvent(wordElement);
    });
    
    // Create right words with more direct styling
    rightWords.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word word-right';
        wordElement.textContent = word;
        wordElement.dataset.word = word;
        
        // Directly set styles to ensure visibility
        const pos = getRandomPosition(false, index);
        wordElement.style.position = 'absolute';
        wordElement.style.left = pos.left;
        wordElement.style.right = pos.right;
        wordElement.style.top = pos.top;
        wordElement.style.zIndex = '10';
        wordElement.style.backgroundColor = '#78412a';
        
        rightContainer.appendChild(wordElement);
        
        // Smoother animation
        wordElement.style.opacity = '0';
        wordElement.style.transform = 'scale(0.9)';
        wordElement.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        setTimeout(() => {
            wordElement.style.opacity = '1';
            wordElement.style.transform = 'scale(1)';
        }, (index + leftWords.length) * 80);
    });
    
    // Reset level score
    levelScore = 0;
    updateScore();
    addParticleEffects();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomPosition(isLeft, index) {
    const gameContainer = document.getElementById('game-container');
    const containerHeight = gameContainer.clientHeight;
    const containerWidth = gameContainer.clientWidth;
    
    // Adjust for very small screens
    const isSmallScreen = containerHeight < 500;
    const isMediumScreen = containerHeight < 700 && containerHeight >= 500;
    
    // Calculate vertical spacing to center all words
    // For 10 words, distribute them in the middle portion of the screen height
    const totalWords = wordsPerLevel;
    const usableHeightPercent = isSmallScreen ? 0.8 : (isMediumScreen ? 0.75 : 0.7);
    const usableHeight = containerHeight * usableHeightPercent;
    const startY = containerHeight * ((1 - usableHeightPercent) / 2); // Center the words
    const wordSpacing = usableHeight / totalWords;
    
    // Vertical position with slight randomness but centered in the screen
    const baseVerticalPos = startY + (index * wordSpacing);
    const maxOffset = isSmallScreen ? wordSpacing * 0.1 : wordSpacing * 0.2; // Less randomness on small screens
    const randomOffset = (Math.random() * maxOffset * 2) - maxOffset; // +/- offset
    const verticalPosition = baseVerticalPos + randomOffset;
    
    // Horizontal position with much more randomness
    // Calculate available width for each side (33% of screen minus some margin)
    const containerThird = containerWidth / 3;
    const minMargin = containerThird * 0.05; // 5% margin from edges
    const maxMargin = containerThird * 0.1; // 10% margin for larger screens
    const margin = Math.min(minMargin, 15); // Cap at 15px
    
    // Calculate random position with full use of the space
    let horizontalPosition;
    if (isLeft) {
        // Left words: distribute across entire left third with margin
        const usableWidth = containerThird - (margin * 2);
        horizontalPosition = margin + (Math.random() * usableWidth);
        
        // Add oscillation pattern for more natural distribution
        const oscillation = Math.sin(index * 0.7) * (usableWidth * 0.2);
        horizontalPosition += oscillation;
        
        // Ensure it stays within bounds
        horizontalPosition = Math.max(margin, Math.min(containerThird - margin, horizontalPosition));
    } else {
        // Right words: distribute across entire right third with margin
        const usableWidth = containerThird - (margin * 2);
        horizontalPosition = margin + (Math.random() * usableWidth);
        
        // Add oscillation pattern for more natural distribution
        const oscillation = Math.cos(index * 0.7) * (usableWidth * 0.2);
        horizontalPosition += oscillation;
        
        // Ensure it stays within bounds
        horizontalPosition = Math.max(margin, Math.min(containerThird - margin, horizontalPosition));
    }
    
    return {
        left: isLeft ? `${horizontalPosition}px` : 'auto',
        right: isLeft ? 'auto' : `${horizontalPosition}px`,
        top: `${verticalPosition}px`,
        position: 'absolute'
    };
}

function addParticleEffects() {
    const gameContainer = document.getElementById('game-container');
    let particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        particleContainer.style.position = 'absolute';
        particleContainer.style.top = '0';
        particleContainer.style.left = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        particleContainer.style.pointerEvents = 'none';
        particleContainer.style.zIndex = '1';
        gameContainer.appendChild(particleContainer);
    }
}

function createParticles(x, y, color, count) {
    const particleContainer = document.getElementById('particle-container');
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.pointerEvents = 'none';
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const life = 500 + Math.random() * 1000;
        particle.style.transition = `left ${life}ms linear, top ${life}ms linear, opacity ${life}ms linear, transform ${life}ms linear`;
        particleContainer.appendChild(particle);
        setTimeout(() => {
            const distance = 50 + Math.random() * 100;
            particle.style.left = `${x + Math.cos(angle) * distance}px`;
            particle.style.top = `${y + Math.sin(angle) * distance}px`;
            particle.style.opacity = '0';
            particle.style.transform = 'scale(0.5)';
            setTimeout(() => {
                particle.remove();
            }, life);
        }, 10);
    }
}

function startAiming(word, element, e) {
    // Check if preventDefault exists before calling it
    if (e && e.preventDefault && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    if (selectedElement) {
        selectedElement.style.pointerEvents = 'auto';
        selectedElement.style.opacity = '1';
    }
    const aimLine = document.getElementById('aim-line');
    aimLine.style.display = 'none';
    document.removeEventListener('mousemove', updateAimLine);
    document.removeEventListener('mouseup', shootWord);
    isAiming = true;
    selectedWord = word;
    selectedElement = element;
    aimLine.style.display = 'block';
    document.addEventListener('mousemove', updateAimLine);
    document.addEventListener('mouseup', shootWord);
    element.style.opacity = '0.8';
    updateAimLine(e);
}

function updateAimLine(e) {
    if (!isAiming || !selectedElement) return;
    const container = document.getElementById('game-container');
    const rect = selectedElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const startX = rect.left - containerRect.left + rect.width/2;
    const startY = rect.top - containerRect.top + rect.height/2;
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    const deltaX = mouseX - startX;
    const deltaY = mouseY - startY;
    const angle = Math.atan2(deltaY, deltaX);
    
    // Reduce maximum distance to limit power
    const maxDistance = 150; // Reduced from 200
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    
    power = Math.min((distance / maxDistance) * 100, 100);
    const aimLine = document.getElementById('aim-line');
    const minLength = 30;
    const maxLength = 80; // Reduced from 100
    const length = minLength + ((maxLength - minLength) * power / 100);
    aimLine.style.width = `${length}px`;
    aimLine.style.left = `${startX}px`;
    aimLine.style.top = `${startY}px`;
    aimLine.style.transform = `rotate(${angle}rad)`;
    aimAngle = angle;
}

function shootWord(e) {
    if (!isAiming || !selectedWord || !selectedElement) return;
    document.removeEventListener('mousemove', updateAimLine);
    document.removeEventListener('mouseup', shootWord);
    playSound('shoot-sound');
    const projectile = document.createElement('div');
    projectile.className = 'projectile';
    projectile.textContent = selectedWord;
    const container = document.getElementById('game-container');
    const rect = selectedElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const startX = rect.left - containerRect.left + rect.width/2;
    const startY = rect.top - containerRect.top + rect.height/2;
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;
    container.appendChild(projectile);
    selectedElement.style.pointerEvents = 'none';
    selectedElement.style.opacity = '0.5';
    document.getElementById('aim-line').style.display = 'none';
    
    // Adjust power based on screen size
    const containerWidth = containerRect.width;
    const baseSpeed = 4;
    
    // Make power relative to screen size - proportional scaling
    // Start with a lower base power factor and scale up with screen width
    const minPowerFactor = 0.08; // Weaker base power
    const maxPowerFactor = 0.15; // Maximum power factor for very large screens
    const referenceWidth = 1600; // Reference width for max power factor
    
    // Linear scaling of power factor based on screen width
    const powerFactor = minPowerFactor + 
        Math.min(1, containerWidth / referenceWidth) * (maxPowerFactor - minPowerFactor);
    
    const speed = baseSpeed + (power * powerFactor);
    
    const velocityX = Math.cos(aimAngle) * speed;
    const velocityY = Math.sin(aimAngle) * speed;
    let currentX = startX;
    let currentY = startY;
    let animationFrame;
    let time = 0;
    const gravity = 0.15;
    let currentVelocityY = velocityY;
    const currentSelectedElement = selectedElement;
    const currentSelectedWord = selectedWord;
    
    // Track if projectile has been off the top edge
    let wentOffTop = false;
    // Track horizontal wraps (only for debugging)
    let horizontalWraps = 0;
    
    function animate() {
        time += 0.016;
        currentVelocityY += gravity;
        currentX += velocityX;
        currentY += currentVelocityY;
        
        const projectileWidth = 80; // Width of projectile
        const projectileHeight = 30; // Height of projectile
        
        // Check if projectile is off screen
        const isOffLeft = currentX < -projectileWidth;
        const isOffRight = currentX > containerRect.width;
        const isOffTop = currentY < -projectileHeight;
        const isOffBottom = currentY > containerRect.height;
        
        // Only wrap for the top edge
        if (isOffTop) {
            // If it goes off the top, remember that it went off the top
            wentOffTop = true;
        }
        
        // If it went off the top and is still off the top, let it continue moving
        // until it's ready to come back on screen
        if (wentOffTop && currentY < -projectileHeight*2) {
            // Continue moving off-screen but check if it should come back
            if (currentVelocityY > 0) {
                // It's now moving downward, place it at the top to come back on screen
                currentY = -projectileHeight;
                wentOffTop = false; // Reset the flag
            }
        }
        
        // Remove if it goes off left, right, or bottom
        if (isOffLeft || isOffRight || isOffBottom) {
            cancelAnimationFrame(animationFrame);
            projectile.remove();
            currentSelectedElement.style.pointerEvents = 'auto';
            currentSelectedElement.style.opacity = '1';
            return;
        }
        
        // Update position
        projectile.style.left = `${currentX}px`;
        projectile.style.top = `${currentY}px`;
        
        // Check for collision with right words
        const projectileRect = projectile.getBoundingClientRect();
        const rightWords = document.querySelectorAll('#words-right .word');
        let hit = false;
        
        rightWords.forEach(rightWord => {
            if (hit) return;
            const rightRect = rightWord.getBoundingClientRect();
            if (isColliding(projectileRect, rightRect)) {
                hit = true;
                const correctSynonym = gameWords.find(pair => pair[0] === currentSelectedWord)?.[1];
                if (rightWord.textContent === correctSynonym) {
                    levelScore++;
                    rightWord.style.backgroundColor = '#4CAF50';
                    playSound('correct-sound');
                    createParticles(currentX, currentY, '#4CAF50', 20);
                    setTimeout(() => {
                        currentSelectedElement.style.transition = 'opacity 0.5s, transform 0.5s';
                        rightWord.style.transition = 'opacity 0.5s, transform 0.5s';
                        currentSelectedElement.style.opacity = '0';
                        rightWord.style.opacity = '0';
                        currentSelectedElement.style.transform = 'scale(0.5)';
                        rightWord.style.transform = 'scale(0.5)';
                        setTimeout(() => {
                            currentSelectedElement.remove();
                            rightWord.remove();
                            projectile.remove();
                            checkGameCompletion();
                        }, 500);
                    }, 300);
                } else {
                    levelScore--;
                    rightWord.style.backgroundColor = '#f44336';
                    playSound('incorrect-sound');
                    createParticles(currentX, currentY, '#f44336', 15);
                    setTimeout(() => {
                        projectile.remove();
                        currentSelectedElement.style.pointerEvents = 'auto';
                        currentSelectedElement.style.opacity = '1';
                        rightWord.style.backgroundColor = '';
                    }, 500);
                }
                updateScore();
                cancelAnimationFrame(animationFrame);
            }
        });
        
        // Continue animation if no hit
        if (!hit) {
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
    isAiming = false;
    selectedWord = null;
    selectedElement = null;
}

function isColliding(rect1, rect2) {
    const buffer = 5;
    return !(rect1.right - buffer < rect2.left || rect1.left + buffer > rect2.right || rect1.bottom - buffer < rect2.top || rect1.top + buffer > rect2.bottom);
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${levelScore}`;
    document.getElementById('overall-score').textContent = `Overall Score: ${overallScore + levelScore}`;
}

function checkGameCompletion() {
    const leftWordsRemaining = document.querySelectorAll('#words-left .word').length;
    if (leftWordsRemaining === 0) {
        playSound('game-complete-sound');
        if (currentLevelIndex < window.levels.length - 1) {
            if (levelScore > 0) {
                // Promote to next level
                overallScore += levelScore;
                currentLevelIndex++;
                setTimeout(() => {
                    updateWelcomeScreenLevelInfo();
                    document.getElementById('welcome-screen').style.display = 'flex';
                }, 1200);
            } else {
                // Not enough score to promote, restart this stage only
                setTimeout(() => {
                    levelScore = 0;
                    initializeGame();
                }, 1200);
            }
        } else {
            // Game complete, show leaderboard
            overallScore += levelScore;
            setTimeout(() => {
                showLeaderboard();
            }, 1200);
        }
    }
}

function showPromotionMessage() {
    const msg = document.getElementById('promotion-message');
    msg.innerHTML = `<div style='color:#FFC107;font-size:22px;margin:20px;'>You need a positive score to get promoted to the next level.<br><button id='retry-level-btn' class='control-btn'>Retry Level</button></div>`;
    msg.style.display = 'block';
    document.getElementById('game-container').style.opacity = '0.2';
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('retry-level-btn')?.removeEventListener('click', retryLevel);
    setTimeout(() => {
        document.getElementById('retry-level-btn').addEventListener('click', retryLevel);
    }, 100);
}

function retryLevel() {
    document.getElementById('promotion-message').style.display = 'none';
    document.getElementById('game-container').style.opacity = '1';
    document.getElementById('welcome-screen').style.display = 'flex';
    levelScore = 0;
}

function showLeaderboard() {
    const section = document.getElementById('leaderboard-section');
    section.innerHTML = `
        <div class="leaderboard-content">
            <div style='color:#4CAF50;font-size:24px;margin:20px;'>
                Congratulations!<br>Your final score: <b>${overallScore}</b><br><br>
                Enter your name for the leaderboard (optional):<br>
                <input id='player-name' maxlength='20' style='font-size:18px;padding:5px;'/>
                <button id='submit-score-btn' class='control-btn'>Submit</button>
                <button id='play-again-btn' class='control-btn'>Play Again</button>
            </div>
            <div id='leaderboard-list'></div>
        </div>
    `;
    section.style.display = 'flex';
    document.getElementById('game-container').style.opacity = '0.2';
    if (!isMobileDevice) {
        document.getElementById('instructions').style.opacity = '0.2';
        document.getElementById('level-info').style.opacity = '0.2';
    }
    document.getElementById('restart-btn').style.display = 'none';
    
    document.getElementById('submit-score-btn')?.removeEventListener('click', submitScore);
    document.getElementById('play-again-btn')?.removeEventListener('click', restartGame);
    
    setTimeout(() => {
        document.getElementById('submit-score-btn').addEventListener('click', submitScore);
        document.getElementById('play-again-btn').addEventListener('click', restartGame);
    }, 100);
    
    fetchLeaderboardFromServer();
}

function showLeaderboardOnly() {
    const section = document.getElementById('leaderboard-section');
    section.innerHTML = `
        <div class="leaderboard-content">
            <div style='color:#4CAF50;font-size:24px;margin:20px;'>
                Leaderboard<br>
                <button id='close-leaderboard-btn' class='control-btn'>Close</button>
            </div>
            <div id='leaderboard-list'><p>Loading leaderboard...</p></div>
        </div>
    `;
    section.style.display = 'flex';
    document.getElementById('game-container').style.opacity = '0.2';
    if (!isMobileDevice) {
        document.getElementById('instructions').style.opacity = '0.2';
        document.getElementById('level-info').style.opacity = '0.2';
    }
    document.getElementById('close-leaderboard-btn')?.removeEventListener('click', closeLeaderboard);
    setTimeout(() => {
        document.getElementById('close-leaderboard-btn').addEventListener('click', closeLeaderboard);
    }, 100);
    fetchLeaderboardFromServer();
}

function closeLeaderboard() {
    document.getElementById('leaderboard-section').style.display = 'none';
    document.getElementById('game-container').style.opacity = '1';
    if (!isMobileDevice) {
        document.getElementById('instructions').style.opacity = '1';
        document.getElementById('level-info').style.opacity = '1';
    }
}

function submitScore() {
    const name = document.getElementById('player-name').value.trim() || 'Anonymous';
    const entry = { name, score: overallScore };
    // Disable input and button
    document.getElementById('player-name').disabled = true;
    document.getElementById('submit-score-btn').disabled = true;
    // Hide the name input and submit button after submit
    document.getElementById('player-name').style.display = 'none';
    document.getElementById('submit-score-btn').style.display = 'none';
    // Submit to server
    fetch(LEADERBOARD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    })
    .then(res => res.json())
    .then(data => {
        fetchLeaderboardFromServer();
    })
    .catch(err => {
        document.getElementById('leaderboard-list').innerHTML = '<p style="color:red">Error submitting score.</p>';
    });
}

function fetchLeaderboardFromServer() {
    fetch(LEADERBOARD_API_URL)
        .then(res => res.json())
        .then(data => {
            renderLeaderboard(data);
        })
        .catch(err => {
            document.getElementById('leaderboard-list').innerHTML = '<p style="color:red">Error loading leaderboard.</p>';
        });
}

function renderLeaderboard(data) {
    if (!Array.isArray(data)) data = [];
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        } catch (e) {
            return '';
        }
    };
    const list = data.map((entry, i) => {
        const dateStr = entry.date ? ` - ${formatDate(entry.date)}` : '';
        return `<div style='margin:2px 0;'>${i + 1}. <b>${entry.name}</b>: ${entry.score}${dateStr}</div>`;
    }).join('');
    document.getElementById('leaderboard-list').innerHTML = `<h3>Top 50 Leaderboard</h3>${list || '<p>No scores yet. Be the first!</p>'}`;
}

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Error playing sound:', e));
    }
}

function getRandomColor() {
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function restartGame() {
    currentLevelIndex = 0;
    levelScore = 0;
    overallScore = 0;
    document.getElementById('leaderboard-section').style.display = 'none';
    document.getElementById('promotion-message').style.display = 'none';
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'flex';
    document.getElementById('how-to-play-modal').style.display = 'none';
    document.getElementById('about-modal').style.display = 'none';
    document.getElementById('game-container').style.opacity = '1';
    
    // Update welcome screen with first level info
    updateWelcomeScreenLevelInfo();
}

document.getElementById('restart-btn').addEventListener('click', restartGame);

// Start the game with the level 1 intro
window.addEventListener('load', () => {
    document.getElementById('restart-btn').style.display = 'none';
    showLevelIntro();
});

// Adjust the game for mobile view
function adjustForMobile() {
    // Recalculate positions of elements
    if (document.documentElement.clientWidth < document.documentElement.clientHeight) {
        // Portrait mode - show a message to rotate
        alert("Please rotate your device to landscape mode for the best experience.");
    }
    
    // Update word positions if the game is already initialized
    if (leftWords.length > 0) {
        updateWordPositions();
    }
}

// Handle screen resize
function handleScreenResize() {
    // Only update if we have active words
    if (leftWords.length > 0) {
        updateWordPositions();
    }
}

// Update word positions after screen resize or orientation change
function updateWordPositions() {
    // Update left words
    document.querySelectorAll('#words-left .word').forEach((wordElement, index) => {
        const pos = getRandomPosition(true, index);
        wordElement.style.left = pos.left;
        wordElement.style.right = pos.right;
        wordElement.style.top = pos.top;
    });
    
    // Update right words
    document.querySelectorAll('#words-right .word').forEach((wordElement, index) => {
        const pos = getRandomPosition(false, index);
        wordElement.style.left = pos.left;
        wordElement.style.right = pos.right;
        wordElement.style.top = pos.top;
    });
} 