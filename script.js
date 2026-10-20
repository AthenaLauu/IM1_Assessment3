/*
  FEED THE FROG
  My main interaction is hover. The player searches the pond using
  a spotlight and feeds the frog by hovering over mosquitoes.
*/

// FIND THE ELEMENTS
const game = document.getElementById('game');
const world = document.getElementById('world');
const scenery = document.getElementById('scenery');
const insectsLayer = document.getElementById('insects');
const light = document.getElementById('light');
const frog = document.getElementById('frog');
const tongue = document.getElementById('tongue');
const scoreDisplay = document.getElementById('score');
const heartsDisplay = document.getElementById('hearts');
const message = document.getElementById('message');
const ending = document.getElementById('ending');
const endingFrog = document.getElementById('ending-frog');
const endingTitle = document.getElementById('ending-title');
const endingDescription = document.getElementById('ending-description');
const restartButton = document.getElementById('restart-button');

// IMAGES
// I used different frog drawings for the mouth and the three endings.
const frogClosed = 'images/frog.png';
const frogOpen = 'images/frog6.png';
const frogHappy = 'images/frog8.png';
const frogPoisoned = 'images/frog9.png';
const frogCaptured = 'images/frog7.png';

// GAME SETTINGS
const worldWidth = 2600;
const worldHeight = 1900;
const edgeSize = 125;
const scrollSpeed = 8;
const targetScore = 3;
const maxHearts = 3;

// I added a delay because the ending was showing too quickly.
// 1500 = 1.5 seconds, 2000 = 2 seconds.
const captureDelay = 1500;

// GAME VALUES
let score = 0;
let hearts = maxHearts;
let cameraX = 0;
let cameraY = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseInside = false;
let busy = false;
let gameOver = false;
let capturing = false;
let lastFrame = 0;
let timers = [];
const insects = [];

/*
  RANDOM POSITIONS
  Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  I used Math.random() to spread the insects and decorations around
  the pond. This makes searching less predictable. In a larger game,
  I could use the same idea to vary different pond environments.
*/
function randomNumber(min, max) {
  return min + Math.random() * (max - min);
}

function keepBetween(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

/*
  TIMING AND RESTART
  Reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
  I used setTimeout() to separate the tongue animation into stages.
  I save the timer IDs so I can cancel unfinished actions when the
  player restarts or encounters the collector. This avoids an old
  animation changing the score after a new game has started.
*/
function wait(callback, time) {
  const timer = setTimeout(callback, time);
  timers.push(timer);
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

// FROG IMAGES
function openMouth() {
  frog.src = frogOpen;
}

function closeMouth() {
  frog.src = frogClosed;
}

// POND DECORATIONS
/*
  GENERATING SCENERY
  References:
  https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
  https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
  I used createElement() and appendChild() to make repeated pond
  decorations. I chose simple CSS shapes rather than many image files,
  which makes the background easier to edit and expand later.
*/
function makeScenery() {
  for (let i = 0; i < 34; i++) {
    const lily = document.createElement('div');
    lily.className = 'lily';
    lily.style.left = randomNumber(40, worldWidth - 310) + 'px';
    lily.style.top = randomNumber(50, worldHeight - 150) + 'px';
    lily.style.setProperty('--s', randomNumber(120, 310) + 'px');
    lily.style.setProperty('--r', randomNumber(-35, 35) + 'deg');
    scenery.appendChild(lily);
  }

  for (let i = 0; i < 42; i++) {
    const reed = document.createElement('div');
    reed.className = 'reed';
    reed.style.left = randomNumber(15, worldWidth - 15) + 'px';
    reed.style.top = randomNumber(90, worldHeight - 100) + 'px';
    reed.style.setProperty('--h', randomNumber(70, 180) + 'px');
    reed.style.setProperty('--r', randomNumber(-30, 30) + 'deg');
    scenery.appendChild(reed);
  }

  for (let i = 0; i < 80; i++) {
    const firefly = document.createElement('div');
    firefly.className = 'firefly';
    firefly.style.left = randomNumber(0, worldWidth) + 'px';
    firefly.style.top = randomNumber(0, worldHeight) + 'px';
    firefly.style.animationDelay = randomNumber(0, 3) + 's';
    scenery.appendChild(firefly);
  }
}

// CREATE INSECTS
function moveInsect(insect) {
  insect.style.left = randomNumber(140, worldWidth - 140) + 'px';
  insect.style.top = randomNumber(180, worldHeight - 140) + 'px';
}

function makeInsect(type) {
  const insect = document.createElement('img');
  insect.className = 'insect ' + type;
  insect.src = type === 'mosquito' ? 'images/mosquito.png' : 'images/ladybug.png';
  insect.alt = type;
  insect.draggable = false;
  insect.tabIndex = 0;
  moveInsect(insect);
  insectsLayer.appendChild(insect);

  /*
  HOVER INTERACTION

  Reference:
  https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event

  I referred to the MDN documentation to understand
  how the mouseenter event works.

  I used this event instead of click because hover
  is the main interaction type for my project.

  When the cursor enters an insect, the event
  calls catchInsect() and starts the frog animation.

  I also used the same event for the collector,
  but changed the result to a bad ending.
*/
  insect.addEventListener('mouseenter', function () {
    catchInsect(insect, type);
  });
  insect.addEventListener('focus', function () {
    catchInsect(insect, type);
  });
  insects.push(insect);
}

// COLLECTOR
// The collector is hidden in a different area of the pond.
const collector = document.createElement('img');
collector.id = 'collector';
collector.src = 'images/collector.png';
collector.alt = 'Insect collector with a net';
collector.draggable = false;
collector.tabIndex = 0;
collector.style.left = '2100px';
collector.style.top = '1400px';
insectsLayer.appendChild(collector);

function catchByCollector() {
  if (gameOver || capturing) {
    return;
  }

  // I stop the other actions so the collector ending is not interrupted.
  capturing = true;
  busy = true;
  clearTimers();
  tongue.style.width = '0px';
  closeMouth();
  frog.classList.remove('eating');
  collector.classList.add('capturing');
  message.textContent = 'OH NO! A COLLECTOR!';

  // Give the player enough time to see the collector before the ending.
  wait(function () {
    showEnding('captured');
  }, captureDelay);
}

collector.addEventListener('mouseenter', catchByCollector);
collector.addEventListener('focus', catchByCollector);

// SPOTLIGHT
/*
  CURSOR SPOTLIGHT
  References:
  https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
  I used the mouse coordinates and CSS custom properties to move the
  spotlight. This makes the cursor both the exploration tool and the
  way to interact, which fits my hover-based game idea.
  The CSS spotlight itself uses a radial mask; see style.css.
*/
game.addEventListener('mousemove', function (event) {
  const gameRect = game.getBoundingClientRect();
  mouseInside = true;
  mouseX = event.clientX - gameRect.left;
  mouseY = event.clientY - gameRect.top;

  game.style.setProperty('--mx', mouseX + 'px');
  game.style.setProperty('--my', mouseY + 'px');
  light.style.left = mouseX + 'px';
  light.style.top = mouseY + 'px';
});

game.addEventListener('mouseleave', function () {
  mouseInside = false;
});

// EDGE EXPLORATION
// This is similar to the moving cloud class exercise from Study With Me,
// but I move the whole pond instead of individual clouds.
// requestAnimationFrame reference:
// https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
function edgeMovement(position, size) {
  if (position < edgeSize) {
    return -scrollSpeed * (1 - position / edgeSize);
  } else if (position > size - edgeSize) {
    return scrollSpeed * (1 - (size - position) / edgeSize);
  }
  return 0;
}

function moveWorld(time) {
  // Using elapsed time keeps movement similar on different refresh rates.
  const frameSpeed = lastFrame ? Math.min((time - lastFrame) / 16.67, 2) : 1;
  lastFrame = time;

  if (mouseInside && !busy && !gameOver) {
    const maxX = Math.max(0, worldWidth - game.clientWidth);
    const maxY = Math.max(0, worldHeight - game.clientHeight);

    cameraX = keepBetween(
      cameraX + edgeMovement(mouseX, game.clientWidth) * frameSpeed,
      0, maxX
    );
    cameraY = keepBetween(
      cameraY + edgeMovement(mouseY, game.clientHeight) * frameSpeed,
      0, maxY
    );
  }

  world.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
  requestAnimationFrame(moveWorld);
}

// SCORE AND HEARTS
function updateScore() {
  scoreDisplay.textContent = score + ' / ' + targetScore;
  heartsDisplay.textContent = hearts > 0 ? '♥ '.repeat(hearts).trim() : '♡ ♡ ♡';
}

// FROG CATCHING AN INSECT
function catchInsect(insect, type) {
  if (busy || gameOver || capturing || insect.classList.contains('caught')) {
    return;
  }
  busy = true;
  openMouth();
  frog.classList.add('eating');

  /*
    TONGUE POSITION AND ANGLE
    References:
    https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
    I used bounding rectangles to find the frog and insect on screen.
    Math.hypot() gives the tongue length and Math.atan2() gives its
    angle. Matching the tongue to my own frog drawing was challenging,
    so I adjusted the mouth position using percentages of its size.
  */
  const frogRect = frog.getBoundingClientRect();
  const insectRect = insect.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();

  const frogX = frogRect.left - gameRect.left + frogRect.width * 0.69;
  const frogY = frogRect.top - gameRect.top + frogRect.height * 0.42;
  const insectX = insectRect.left - gameRect.left + insectRect.width / 2;
  const insectY = insectRect.top - gameRect.top + insectRect.height / 2;

  const xDistance = insectX - frogX;
  const yDistance = insectY - frogY;
  const tongueLength = Math.hypot(xDistance, yDistance);
  const tongueAngle = Math.atan2(yDistance, xDistance) * 180 / Math.PI;

  tongue.style.left = frogX + 'px';
  tongue.style.top = frogY + 'px';
  tongue.style.transform = `rotate(${tongueAngle}deg)`;
  tongue.style.transition = 'none';
  tongue.style.width = '0px';
  void tongue.offsetWidth;
  tongue.style.transition = 'width 0.18s ease';
  tongue.style.width = tongueLength + 'px';

  if (type === 'mosquito') {
    message.textContent = 'YUM! MOSQUITO FOUND!';
  } else {
    message.textContent = 'OH NO! WRONG INSECT!';
  }

  // setTimeout helps separate the tongue animation into small steps.
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
  wait(function () {
    if (gameOver || capturing) return;
    insect.classList.add('caught');
    tongue.style.width = '0px';
  }, 220);

  wait(function () {
    if (gameOver || capturing) return;
    closeMouth();
    frog.classList.remove('eating');
  }, 440);

  wait(function () {
    if (gameOver || capturing) return;

    if (type === 'mosquito') {
      score++;
    } else {
      hearts--;
    }
    updateScore();

    if (score >= targetScore) {
      showEnding('good');
    } else if (hearts <= 0) {
      showEnding('poisoned');
    } else {
      message.textContent = type === 'mosquito'
        ? 'FIND ANOTHER MOSQUITO!'
        : 'BE CAREFUL! AVOID LADYBUGS!';
      moveInsect(insect);
      insect.classList.remove('caught');
      busy = false;
    }
  }, 570);
}

// ENDINGS
/*
  REUSING THE ENDING SCREEN
  References:
  https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
  https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden
  I reused one ending box and changed its text and image for each
  outcome. This keeps the HTML simpler than making three pages and
  makes it easier for players to restart without reloading.
*/
function showEnding(type) {
  if (gameOver) return;
  gameOver = true;
  capturing = false;
  busy = false;
  clearTimers();
  tongue.style.width = '0px';
  closeMouth();
  frog.classList.remove('eating');

  if (type === 'good') {
    endingFrog.src = frogHappy;
    endingTitle.textContent = 'FROG IS FULL!';
    endingDescription.textContent = 'You caught three mosquitoes. The frog is happy!';
    message.textContent = 'GOOD ENDING!';
  } else if (type === 'poisoned') {
    endingFrog.src = frogPoisoned;
    endingTitle.textContent = 'POISONED!';
    endingDescription.textContent = 'The frog ate too many harmful insects.';
    message.textContent = 'BAD ENDING!';
  } else if (type === 'captured') {
    endingFrog.src = frogCaptured;
    endingTitle.textContent = 'CAPTURED!';
    endingDescription.textContent = 'Oh no! The collector caught the frog in a net!';
    message.textContent = 'BAD ENDING!';
  }

  // The collector already had its warning delay, so show its ending now.
  if (type === 'captured') {
    ending.hidden = false;
    restartButton.focus();
  } else {
    wait(function () {
      ending.hidden = false;
      restartButton.focus();
    }, 320);
  }
}

// RESTART GAME
// Future development: the hover controls work best with a mouse.
// I would need to test a tap or drag alternative for touchscreens.
// I would also test whether the spotlight size and scrolling speed
// are comfortable for different players before expanding the game.
// A larger version could include more frog species and an insect book.
function resetGame() {
  clearTimers();
  score = 0;
  hearts = maxHearts;
  busy = false;
  gameOver = false;
  capturing = false;
  closeMouth();
  frog.classList.remove('eating');
  tongue.style.transition = 'none';
  tongue.style.width = '0px';
  ending.hidden = true;

  cameraX = Math.max(0, (worldWidth - game.clientWidth) / 2);
  cameraY = Math.max(0, (worldHeight - game.clientHeight) / 2);
  world.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;

  insects.forEach(function (insect) {
    moveInsect(insect);
    insect.classList.remove('caught');
    insect.blur();
  });

  collector.style.left = '2100px';
  collector.style.top = '1400px';
  collector.classList.remove('capturing');
  collector.blur();
  message.textContent = 'FIND THE MOSQUITOES!';
  updateScore();
}

// START THE GAME
restartButton.addEventListener('click', resetGame);
makeScenery();
for (let i = 0; i < 7; i++) makeInsect('mosquito');
for (let i = 0; i < 4; i++) makeInsect('ladybug');
resetGame();
requestAnimationFrame(moveWorld);