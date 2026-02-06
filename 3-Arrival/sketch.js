let nbVehicules = 20;
let target;
let vehicle;
let vehicles = [];
// Texte
let font;
let points = [];
// mode (snake ou text ou grid)
let mode = "snake";

// Variables pour le mode snake amélioré
let snakeEntities = []; // Tableau de serpents
let currentSnakeLength = 10; // Longueur par défaut d'un nouveau snake

// Variables pour l'exercice 2 (mode grid)
let targets = [];
let snakes = [];
let allArrived = false;
let targetsMoving = false;
const ROWS = 4;
const COLS = 5;
const TARGET_SIZE = 8; // Taille des cibles (petite pour meilleur effet)

// Variables pour le mode formation
let leader;
let followers = [];
let formationOffsets = []; // Offsets en V autour du leader

// Variables pour le mode GAME (Snake.io)
let gameSnake; // Le snake du joueur
let foodTargets = []; // Cibles à manger
let enemySnakes = []; // Snakes ennemis
let gameLevel = 1;
let gameScore = 0;
let gameState = "playing"; // playing, gameOver, menu
let foodEaten = 0;

// === CONSTANTES DU JEU ===
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const NUM_ENEMIES = 8;
const NUM_FOOD = 200;
const DANGER_DISTANCE = 150; // Distance d'avertissement bordure
const SPAWN_MARGIN = 100; // Marge pour spawn
const BORDER_KILL_DIST = 10; // Distance de mort aux bordures

// === SNAKE.IO VARIABLES ===
// Monde (variables modifiables si besoin)
let worldWidth = WORLD_WIDTH;
let worldHeight = WORLD_HEIGHT;

// Caméra
let cameraX = 0;
let cameraY = 0;
let cameraZoom = 1;

// Boost
let isBoosting = false;
const BOOST_SEGMENT_INTERVAL = 15; // Frames avant de perdre un segment
let boostTimer = 0;

// Noms de snakes
let playerName = "Joueur";
const ENEMY_NAMES = ["Speedy", "Viper", "Cobra", "Python", "Mamba", "Boa", "Anaconda", "Rattler", "Asp", "Sidewinder", "Toxic", "Shadow", "Hunter", "Blaze", "Frost"];

// Skins disponibles
const SNAKE_SKINS = [
  { name: "Vert", color: [50, 200, 50] },
  { name: "Rouge", color: [200, 50, 50] },
  { name: "Bleu", color: [50, 100, 200] },
  { name: "Jaune", color: [255, 220, 50] },
  { name: "Violet", color: [150, 50, 200] },
  { name: "Cyan", color: [50, 200, 200] },
  { name: "Orange", color: [255, 150, 50] },
  { name: "Rose", color: [255, 100, 150] }
];
let selectedSkin = 0;

// Particules d'effet
let particles = [];

// Grille de fond
const GRID_SIZE = 50;

// ==================== FONCTIONS UTILITAIRES ====================

// Dessiner une grille de fond animée (utilisée dans menu et game over)
function drawAnimatedGrid(animated = true) {
  stroke(30, 40, 60);
  strokeWeight(1);
  let offset = animated ? (frameCount * 0.5) % GRID_SIZE : 0;
  for (let x = -offset; x < width + GRID_SIZE; x += GRID_SIZE) {
    line(x, 0, x, height);
  }
  for (let y = -offset; y < height + GRID_SIZE; y += GRID_SIZE) {
    line(0, y, width, y);
  }
}

// Dessiner un bouton avec effet hover et pulsation
function drawButton(x, y, w, h, label, baseColor, hoverColor) {
  let isHover = mouseX > x - w/2 && mouseX < x + w/2 &&
                mouseY > y - h/2 && mouseY < y + h/2;
  let btnPulse = isHover ? sin(frameCount * 0.2) * 5 : 0;
  
  fill(isHover ? hoverColor : baseColor);
  stroke(255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(x, y, w + btnPulse, h + btnPulse, 15);
  
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(label, x, y);
  
  return isHover;
}

// Vérifier si un bouton est cliqué
function isButtonClicked(x, y, w, h) {
  return mouseX > x - w/2 && mouseX < x + w/2 &&
         mouseY > y - h/2 && mouseY < y + h/2;
}

// Dessiner un titre avec effet de lueur
function drawGlowTitle(titleText, x, y, size, glowColor) {
  textAlign(CENTER, CENTER);
  // Lueur
  for (let i = 3; i >= 0; i--) {
    fill(red(glowColor), green(glowColor), blue(glowColor), 50 - i * 15);
    textSize(size + i * 4);
    noStroke();
    text(titleText, x, y);
  }
  // Titre principal
  fill(glowColor);
  textSize(size);
  stroke(0);
  strokeWeight(5);
  text(titleText, x, y);
}

// Appelée avant de démarrer l'animation
function preload() {
  // en général on charge des images, des fontes de caractères etc.
  font = loadFont('./assets/inconsolata.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // On crée un véhicule à la position (100, 100)
  vehicle = new Vehicle(100, 100);

  // La cible, ce sera la position de la souris
  target = createVector(random(width), random(height));

  // Texte qu'on affiche avec textToPoint
  // Get the point array.
  points = font.textToPoints('Hello!', 350, 250, 305, { sampleFactor: 0.03 });

  // on cree des vehicules, autant que de points
  nbVehicules = points.length;
  for (let i = 0; i < nbVehicules; i++) {
    let v = new GridVehicle(random(width), random(height), null, i);
    vehicles.push(v);
  }

  // Exercice 2 : Créer 20 cibles alignées sur 4 lignes de 5
  setupGridMode();

  // Mode formation : leader + 5 suiveurs en V
  setupFormationMode();

  // Créer le premier snake
  createNewSnake();
}

// Initialisation du mode formation (véhicules en V autour du leader)
function setupFormationMode() {
  // Créer le leader au centre de l'écran
  leader = new Vehicle(width / 2, height / 2);
  leader.r = 20;

  // Définir les offsets en formation V (5 positions)
  formationOffsets = [
    createVector(-60, -40),   // Arrière gauche niveau 1
    createVector(-60, 40),    // Arrière droit niveau 1
    createVector(-120, -80),  // Arrière gauche niveau 2
    createVector(-120, 80),   // Arrière droit niveau 2
    createVector(-180, 0)     // Queue centrale
  ];

  // Créer les suiveurs
  followers = [];
  for (let i = 0; i < formationOffsets.length; i++) {
    let f = new Vehicle(random(width), random(height));
    f.r = 14;
    followers.push(f);
  }
}

// Initialisation du mode grid (exercice 2)
function setupGridMode() {
  targets = [];
  snakes = [];
  allArrived = false;
  targetsMoving = false;

  // Calcul de l'espacement pour centrer la grille
  let spacingX = width / (COLS + 1);
  let spacingY = height / (ROWS + 1);

  // Créer 20 cibles alignées sur 4 lignes de 5
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let x = spacingX * (col + 1);
      let y = spacingY * (row + 1);
      let t = new Target(x, y);
      t.r = TARGET_SIZE; // Taille petite pour meilleur effet
      t.vel.set(0, 0); // Les cibles sont immobiles au départ
      targets.push(t);
    }
  }

  // Créer 20 GridVehicles à des positions aléatoires
  for (let i = 0; i < targets.length; i++) {
    let snake = new GridVehicle(
      random(width), 
      random(height), 
      targets[i], 
      i + 1
    );
    snakes.push(snake);
  }
}

// appelée 60 fois par seconde
function draw() {
  // couleur pour effacer l'écran
  background(0);
  // pour effet psychedelique
  //background(0, 0, 0, 10);

  // Afficher le texte "Hello!" dans tous les modes
  drawHelloText();

  switch (mode) {
    case "snake":
      // Cible qui suit la souris
      target.x = mouseX;
      target.y = mouseY;

      // dessin de la cible (blanc)
      push();
      fill(255);
      noStroke();
      ellipse(target.x, target.y, 20);
      pop();

      // Mettre à jour et afficher tous les snakes
      drawSnakeMode();
      break;

    case "formation":
      // Mode formation : leader suit la souris, suiveurs en V
      drawFormationMode();
      break;

    case "text":
      // Chaque véhicule va vers un point du texte
      vehicles.forEach((vehicle, index) => {
        // chaque véhicule vise un point du texte
        if (index < points.length) {
          let pt = points[index];
          let targetPt = createVector(pt.x, pt.y);
          let steeringForce = vehicle.arrive(targetPt);
          vehicle.applyForce(steeringForce);
        }
        vehicle.update();
        vehicle.show();
      });
      break;

    case "grid":
      // Mode exercice 2 : 20 cibles sur grille 4x5, 20 snakes
      drawGridMode();
      break;

    case "game":
      // Mode jeu Snake Game
      drawGameMode();
      break;
  }
 
}

// Fonction pour créer un nouveau snake
function createNewSnake() {
  let newColor = color(random(100, 255), random(100, 255), random(100, 255));
  
  // Trouver une position qui ne superpose pas les autres snakes
  let spawnX, spawnY;
  let attempts = 0;
  do {
    spawnX = random(100, width - 100);
    spawnY = random(100, height - 100);
    attempts++;
  } while (attempts < 50 && isTooCloseToOtherSnakes(spawnX, spawnY, 150));
  
  let newSnake = new SnakeEntity(
    spawnX, 
    spawnY, 
    currentSnakeLength, 
    newColor
  );
  snakeEntities.push(newSnake);
}

// Vérifier si une position est trop proche des autres snakes
function isTooCloseToOtherSnakes(x, y, minDistance) {
  for (let snake of snakeEntities) {
    let headPos = snake.getHeadPos();
    if (dist(x, y, headPos.x, headPos.y) < minDistance) {
      return true;
    }
  }
  return false;
}

// Fonction pour dessiner le mode snake
function drawSnakeMode() {
  // Tous les snakes suivent la souris avec un décalage pour éviter la superposition
  snakeEntities.forEach((snake, index) => {
    // Calculer une cible décalée pour chaque snake
    let offsetAngle = (index / snakeEntities.length) * TWO_PI;
    let offsetDistance = 50 + index * 30; // Distance croissante
    let targetX = target.x + cos(offsetAngle) * offsetDistance;
    let targetY = target.y + sin(offsetAngle) * offsetDistance;
    let snakeTarget = createVector(targetX, targetY);
    
    snake.followTarget(snakeTarget);
    snake.update();
    snake.show();
  });

  // Afficher les instructions
  push();
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Snakes: ${snakeEntities.length}`, 10, 10);
  text("N: Nouveau snake | R: Reset", 10, 28);
  pop();
}

// Fonction pour dessiner le texte "Hello!" dans tous les modes
function drawHelloText() {
  points.forEach(pt => {
    push();
    fill(80, 80, 80); // Gris foncé discret
    noStroke();
    circle(pt.x, pt.y, 10);
    pop();
  });
}

// Fonction pour dessiner les lignes entre les anneaux du serpent
function drawSnakeLines(vehiclesList, targetPos) {
  push();
  strokeCap(ROUND); // Bords arrondis
  
  // Ligne de la cible au premier véhicule
  if (vehiclesList.length > 0) {
    let v = vehiclesList[0];
    stroke(255, 255, 255, 100); // Blanc avec transparence
    strokeWeight(v.r);
    line(targetPos.x, targetPos.y, v.pos.x, v.pos.y);
  }

  // Lignes entre chaque véhicule
  for (let i = 1; i < vehiclesList.length; i++) {
    let prev = vehiclesList[i - 1];
    let curr = vehiclesList[i];
    
    // Blanc avec transparence décroissante
    let alpha = map(i, 0, vehiclesList.length, 150, 30);
    stroke(255, 255, 255, alpha);
    strokeWeight(curr.r);
    line(prev.pos.x, prev.pos.y, curr.pos.x, curr.pos.y);
  }
  pop();
}

// Fonction pour dessiner le mode formation (véhicules en V)
function drawFormationMode() {
  // Cible qui suit la souris
  target.x = mouseX;
  target.y = mouseY;

  // Le leader suit la souris
  let leaderForce = leader.arrive(target);
  leader.applyForce(leaderForce);
  leader.update();

  // Calculer l'angle du leader (basé sur sa vélocité ou direction vers cible)
  let leaderAngle = 0;
  if (leader.vel.mag() > 0.5) {
    leaderAngle = leader.vel.heading();
  } else {
    // Si le leader est arrêté, garder l'angle vers la cible
    let dirToTarget = p5.Vector.sub(target, leader.pos);
    if (dirToTarget.mag() > 1) {
      leaderAngle = dirToTarget.heading();
    }
  }

  // Dessiner les lignes de formation
  push();
  strokeCap(ROUND);
  stroke(255, 255, 255, 80);
  strokeWeight(2);
  
  // Mettre à jour et afficher les suiveurs
  followers.forEach((f, index) => {
    // Calculer la position cible en tenant compte de la rotation du leader
    let offset = formationOffsets[index].copy();
    offset.rotate(leaderAngle);
    let targetPos = p5.Vector.add(leader.pos, offset);

    // Le suiveur arrive sur sa position cible
    let force = f.arrive(targetPos);
    f.applyForce(force);
    f.update();

    // Dessiner la ligne entre le leader et le suiveur
    line(leader.pos.x, leader.pos.y, f.pos.x, f.pos.y);

    // Dessiner la position cible (petit cercle discret)
    push();
    fill(255, 255, 255, 30);
    noStroke();
    circle(targetPos.x, targetPos.y, 8);
    pop();

    f.show();
  });
  pop();

  // Dessiner la cible (souris)
  push();
  fill(255);
  noStroke();
  ellipse(target.x, target.y, 24);
  pop();

  // Dessiner le leader
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  translate(leader.pos.x, leader.pos.y);
  rotate(leaderAngle);
  triangle(-leader.r, -leader.r / 2, -leader.r, leader.r / 2, leader.r, 0);
  pop();

  // Instructions
  push();
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Mode Formation - Le leader suit la souris, les suiveurs maintiennent la formation en V", 10, 10);
  pop();
}

// Fonction pour dessiner le mode grid (exercice 2)
function drawGridMode() {
  // Afficher les cibles
  targets.forEach((t, index) => {
    t.update();
    // Dessiner la cible (petit cercle blanc)
    push();
    fill(255, 200);
    noStroke();
    circle(t.pos.x, t.pos.y, t.r * 2);
    // Afficher le numéro de la cible
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(index + 1, t.pos.x, t.pos.y);
    pop();
  });

  // Mettre à jour et afficher les snakes
  let arrivedCount = 0;
  snakes.forEach((snake) => {
    snake.followTarget();
    snake.update();
    snake.show();
    
    if (snake.checkArrival()) {
      arrivedCount++;
    }
  });

  // Vérifier si tous les snakes sont arrivés
  if (arrivedCount === snakes.length && !allArrived && !targetsMoving) {
    allArrived = true;
    // Attendre 2 secondes puis faire partir les cibles
    setTimeout(() => {
      targetsMoving = true;
      targets.forEach(t => {
        t.startMoving();
      });
    }, 2000);
  }

  // Afficher le statut
  push();
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Snakes arrivés: ${arrivedCount}/${snakes.length}`, 10, 10);
  if (allArrived && !targetsMoving) {
    text("Tous arrivés! Les cibles vont partir dans 2 secondes...", 10, 30);
  }
  if (targetsMoving) {
    text("Les cibles sont en mouvement! Les snakes les suivent.", 10, 30);
  }
  pop();
}

// ==================== MODE GAME ====================

// Score cible pour gagner
let targetScore = 500;

// Initialiser le mode jeu (Snake.io) - affiche le menu
function setupGameMode() {
  gameLevel = 1;
  gameScore = 0;
  gameState = "menu"; // Commencer par le menu
  foodEaten = 0;
  targetScore = 1000;
  particles = [];
  cameraZoom = 1;
}

// Démarrer la partie (appelé depuis le menu)
function startGame() {
  gameState = "playing";
  
  // Créer le snake du joueur avec le skin sélectionné
  let skinColor = SNAKE_SKINS[selectedSkin].color;
  gameSnake = new SnakeEntity(
    worldWidth / 2, 
    worldHeight / 2, 
    10, 
    color(skinColor[0], skinColor[1], skinColor[2])
  );
  gameSnake.name = playerName;
  gameSnake.segments[0].maxSpeed = 4;
  
  // Centrer la caméra
  cameraX = gameSnake.getHeadPos().x - width / 2;
  cameraY = gameSnake.getHeadPos().y - height / 2;
  
  // Créer la nourriture
  spawnFood();
  
  // Créer des ennemis
  spawnEnemies();
}

// Créer de la nourriture (Snake.io style)
function spawnFood() {
  foodTargets = [];
  
  for (let i = 0; i < NUM_FOOD; i++) {
    spawnOneFood();
  }
}

// Créer une seule nourriture
function spawnOneFood() {
  // Couleurs vives comme snake.io
  let foodColors = [
    color(255, 50, 50),   // Rouge
    color(50, 255, 50),   // Vert
    color(50, 50, 255),   // Bleu
    color(255, 255, 50),  // Jaune
    color(255, 50, 255),  // Magenta
    color(50, 255, 255),  // Cyan
    color(255, 150, 50),  // Orange
    color(255, 100, 150)  // Rose
  ];
  
  let food = {
    pos: createVector(random(SPAWN_MARGIN, worldWidth - SPAWN_MARGIN), random(SPAWN_MARGIN, worldHeight - SPAWN_MARGIN)),
    size: random(5, 12),
    color: random(foodColors),
    glow: random(0.5, 1),
    pulseOffset: random(TWO_PI)
  };
  foodTargets.push(food);
  return food;
}

// Créer des snakes ennemis (Snake.io style)
function spawnEnemies() {
  enemySnakes = [];
  
  for (let i = 0; i < NUM_ENEMIES; i++) {
    spawnOneEnemyWithName(i);
  }
}

// Spawn un ennemi avec nom
function spawnOneEnemyWithName(index) {
  // Spawn loin du joueur si possible
  let spawnX, spawnY;
  let attempts = 0;
  let playerPos = gameSnake ? gameSnake.getHeadPos() : createVector(worldWidth/2, worldHeight/2);
  
  do {
    spawnX = random(100, worldWidth - 100);
    spawnY = random(100, worldHeight - 100);
    attempts++;
  } while (attempts < 30 && dist(spawnX, spawnY, playerPos.x, playerPos.y) < 400);
  
  // Créer un EnemySnake
  let enemy = new EnemySnake(spawnX, spawnY, random(8, 20), null);
  enemy.name = ENEMY_NAMES[index % ENEMY_NAMES.length];
  enemy.score = enemy.segments.length * 10;
  enemySnakes.push(enemy);
  return enemy;
}

// Dessiner le mode jeu
function drawGameMode() {
  switch (gameState) {
    case "menu":
      drawMenu();
      break;
    case "playing":
      updateGame();
      break;
    case "gameOver":
      drawGameOver();
      break;
  }
}

// Dessiner le menu principal
function drawMenu() {
  push();
  // Fond animé
  background(15, 20, 30);
  
  // Grille de fond animée (fonction utilitaire)
  drawAnimatedGrid(true);
  
  // Dessiner quelques "fausses" nourritures en arrière-plan
  drawMenuBackgroundFood();
  
  // Titre avec effet de lueur (fonction utilitaire)
  drawGlowTitle("SNAKE.IO", width / 2, height / 4, 72, color(50, 255, 50));
  
  // Sous-titre
  fill(200);
  textSize(16);
  noStroke();
  textAlign(CENTER, CENTER);
  text("Mangez, grandissez, dominez!", width / 2, height / 4 + 50);
  
  // Zone nom avec cadre
  drawNameInputBox();
  
  // Sélecteur de skin
  drawSkinSelector();
  
  // Bouton jouer (fonction utilitaire)
  textSize(28);
  drawButton(width / 2, height / 2 + 150, 220, 55, "▶ JOUER", color(50, 200, 50), color(80, 255, 80));
  
  // Instructions en bas
  drawMenuInstructions();
  
  pop();
}

// Dessiner la nourriture décorative du menu
function drawMenuBackgroundFood() {
  noStroke();
  for (let i = 0; i < 30; i++) {
    let x = (i * 97 + frameCount * 0.2) % width;
    let y = (i * 73) % height;
    let pulse = sin(frameCount * 0.1 + i) * 0.3 + 1;
    let c = SNAKE_SKINS[i % SNAKE_SKINS.length].color;
    fill(c[0], c[1], c[2], 100);
    circle(x, y, 8 * pulse);
  }
}

// Dessiner la zone de saisie du nom
function drawNameInputBox() {
  fill(30, 40, 60);
  stroke(80);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, height / 2 - 50, 250, 70, 10);
  
  fill(255);
  textSize(14);
  noStroke();
  textAlign(CENTER, CENTER);
  text("Entrez votre nom:", width / 2, height / 2 - 75);
  
  // Afficher le nom avec curseur clignotant
  fill(50, 255, 50);
  textSize(28);
  let displayName = playerName;
  if (frameCount % 60 < 30) {
    displayName += "_";
  }
  text(displayName || "_", width / 2, height / 2 - 45);
}

// Dessiner le sélecteur de skin
function drawSkinSelector() {
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Choisir votre couleur:", width / 2, height / 2 + 20);
  
  let skinStartX = width / 2 - (SNAKE_SKINS.length * 40) / 2 + 20;
  for (let i = 0; i < SNAKE_SKINS.length; i++) {
    let skin = SNAKE_SKINS[i];
    let x = skinStartX + i * 40;
    let y = height / 2 + 65;
    drawSkinOption(x, y, skin, i === selectedSkin);
  }
}

// Dessiner une option de skin
function drawSkinOption(x, y, skin, isSelected) {
  let size = 30;
  
  if (isSelected) {
    size = 35 + sin(frameCount * 0.15) * 3;
    // Halo
    fill(skin.color[0], skin.color[1], skin.color[2], 100);
    noStroke();
    circle(x, y, size + 15);
    stroke(255);
    strokeWeight(3);
  } else {
    stroke(60);
    strokeWeight(1);
  }
  
  // Snake miniature
  fill(skin.color[0], skin.color[1], skin.color[2]);
  circle(x, y, size);
  
  // Yeux miniatures
  fill(255);
  noStroke();
  circle(x - 5, y - 3, 8);
  circle(x + 5, y - 3, 8);
  fill(0);
  circle(x - 4, y - 2, 4);
  circle(x + 6, y - 2, 4);
}

// Dessiner les instructions du menu
function drawMenuInstructions() {
  fill(120);
  textSize(13);
  textAlign(CENTER, CENTER);
  text("🖱️ Souris = Direction  |  🖱️ Clic = Boost (perd des segments)", width / 2, height - 60);
  text("🐍 Coupez les autres snakes pour les manger et grandir!", width / 2, height - 40);
  text("⚠️ Évitez les bordures et les têtes des autres snakes!", width / 2, height - 20);
}

// Mettre à jour le jeu (Snake.io style)
function updateGame() {
  let headPos = gameSnake.getHeadPos();
  
  // Mise à jour caméra
  updateCamera(headPos);
  
  // Gestion du boost
  handleBoost();
  
  // ===== TRANSLATION CAMÉRA =====
  push();
  translate(-cameraX, -cameraY);
  
  // Dessiner le monde
  drawWorldBackground();
  drawWorldBorders();
  
  // Dessiner et mettre à jour le curseur cible
  drawWorldCursor();
  
  // Mettre à jour le joueur
  gameSnake.followTarget(target);
  gameSnake.update();
  gameSnake.show();
  drawSnakeName(gameSnake, playerName, true);
  
  // Recalculer headPos après update
  headPos = gameSnake.getHeadPos();
  
  // Vérifier collision bordures joueur
  if (checkBorderCollision(headPos)) {
    createDeathParticles(headPos);
    convertSnakeToFood(gameSnake);
    gameState = "gameOver";
    pop();
    drawGameHUD();
    drawMinimap();
    return;
  }
  
  // Gérer la nourriture
  handleFoodCollisions(headPos);
  
  // Dessiner les particules
  updateParticles();
  
  // Gérer les ennemis et collisions
  if (handleEnemyCollisions(headPos)) {
    pop();
    drawGameHUD();
    drawMinimap();
    return;
  }
  
  // Collisions entre ennemis
  handleEnemyVsEnemyCollisions();
  
  // Nettoyer et respawn ennemis
  cleanupAndRespawnEnemies();
  
  // Fin de la translation caméra
  pop();
  
  // HUD (affiché en coordonnées écran)
  drawGameHUD();
  drawMinimap();
  drawLeaderboard();
}

// ===== SOUS-FONCTIONS DE updateGame =====

// Mettre à jour la caméra pour suivre le joueur
function updateCamera(headPos) {
  let targetCamX = headPos.x - width / 2;
  let targetCamY = headPos.y - height / 2;
  cameraX = lerp(cameraX, targetCamX, 0.1);
  cameraY = lerp(cameraY, targetCamY, 0.1);
}

// Gérer le boost du joueur
function handleBoost() {
  if (isBoosting && gameSnake.segments.length > 3) {
    gameSnake.segments[0].maxSpeed = 8;
    boostTimer++;
    
    if (boostTimer >= BOOST_SEGMENT_INTERVAL) {
      boostTimer = 0;
      let lastSeg = gameSnake.segments.pop();
      gameSnake.length--;
      // Laisser de la nourriture derrière
      foodTargets.push({
        pos: lastSeg.pos.copy(),
        size: 6,
        color: gameSnake.snakeColor,
        glow: 1,
        pulseOffset: random(TWO_PI)
      });
      createBoostParticles(lastSeg.pos);
    }
  } else {
    gameSnake.segments[0].maxSpeed = 4;
  }
}

// Dessiner le curseur cible dans le monde
function drawWorldCursor() {
  let worldMouseX = mouseX + cameraX;
  let worldMouseY = mouseY + cameraY;
  target.x = worldMouseX;
  target.y = worldMouseY;
  
  push();
  noFill();
  stroke(255, 150);
  strokeWeight(2);
  circle(target.x, target.y, 20);
  line(target.x - 15, target.y, target.x + 15, target.y);
  line(target.x, target.y - 15, target.x, target.y + 15);
  pop();
}

// Vérifier collision avec les bordures
function checkBorderCollision(pos) {
  return pos.x < BORDER_KILL_DIST || pos.x > worldWidth - BORDER_KILL_DIST || 
         pos.y < BORDER_KILL_DIST || pos.y > worldHeight - BORDER_KILL_DIST;
}

// Gérer les collisions avec la nourriture
function handleFoodCollisions(headPos) {
  for (let i = foodTargets.length - 1; i >= 0; i--) {
    let food = foodTargets[i];
    
    if (isOnScreen(food.pos)) {
      drawFood(food);
    }
    
    // Joueur mange la nourriture
    if (dist(headPos.x, headPos.y, food.pos.x, food.pos.y) < gameSnake.segments[0].r + food.size) {
      foodTargets.splice(i, 1);
      foodEaten++;
      gameScore += Math.floor(food.size);
      addSegmentToGameSnake();
      spawnOneFood();
      continue;
    }
    
    // Ennemis mangent la nourriture
    for (let enemy of enemySnakes) {
      let enemyHead = enemy.getHeadPos();
      if (dist(enemyHead.x, enemyHead.y, food.pos.x, food.pos.y) < enemy.segments[0].r + food.size) {
        foodTargets.splice(i, 1);
        enemy.score += Math.floor(food.size);
        enemy.addSegment();
        spawnOneFood();
        break;
      }
    }
  }
}

// Gérer les collisions joueur vs ennemis (retourne true si joueur meurt)
function handleEnemyCollisions(headPos) {
  for (let i = enemySnakes.length - 1; i >= 0; i--) {
    let enemy = enemySnakes[i];
    
    if (!enemy || enemy.segments.length < 2) {
      enemySnakes.splice(i, 1);
      continue;
    }
    
    // Collision bordures ennemis
    let eHead = enemy.getHeadPos();
    if (checkBorderCollision(eHead)) {
      createDeathParticles(eHead);
      convertSnakeToFood(enemy);
      enemySnakes.splice(i, 1);
      continue;
    }
    
    // IA de l'ennemi
    enemy.updateAI(gameSnake, foodTargets, worldWidth, worldHeight);
    enemy.show();
    drawSnakeName(enemy, enemy.name, false);
    
    let enemyHead = enemy.getHeadPos();
    let enemyKilled = false;
    
    // Collision tête à tête
    if (dist(headPos.x, headPos.y, enemyHead.x, enemyHead.y) < gameSnake.segments[0].r + enemy.segments[0].r) {
      if (gameSnake.segments.length > enemy.segments.length) {
        let scoreGain = enemy.segments.length * 5;
        createDeathParticles(enemyHead);
        convertSnakeToFood(enemy);
        enemySnakes.splice(i, 1);
        gameScore += scoreGain;
        enemyKilled = true;
      } else if (gameSnake.segments.length < enemy.segments.length) {
        createDeathParticles(headPos);
        convertSnakeToFood(gameSnake);
        gameState = "gameOver";
        return true;
      } else {
        createDeathParticles(headPos);
        createDeathParticles(enemyHead);
        convertSnakeToFood(enemy);
        convertSnakeToFood(gameSnake);
        enemySnakes.splice(i, 1);
        gameState = "gameOver";
        return true;
      }
    }
    
    if (enemyKilled) continue;
    
    // Tête du joueur touche corps ennemi → joueur meurt
    for (let j = 1; j < enemy.segments.length; j++) {
      let seg = enemy.segments[j];
      if (dist(headPos.x, headPos.y, seg.pos.x, seg.pos.y) < gameSnake.segments[0].r + seg.r) {
        createDeathParticles(headPos);
        convertSnakeToFood(gameSnake);
        gameState = "gameOver";
        return true;
      }
    }
    
    // Tête ennemi touche corps joueur → ennemi meurt
    for (let j = 1; j < gameSnake.segments.length; j++) {
      let seg = gameSnake.segments[j];
      if (dist(enemyHead.x, enemyHead.y, seg.pos.x, seg.pos.y) < enemy.segments[0].r + seg.r) {
        let scoreGain = enemy.segments.length * 5;
        createDeathParticles(enemyHead);
        convertSnakeToFood(enemy);
        enemySnakes.splice(i, 1);
        gameScore += scoreGain;
        enemyKilled = true;
        break;
      }
    }
    
    if (enemyKilled) continue;
    
    if (enemy.segments.length < 2) {
      convertSnakeToFood(enemy);
      enemySnakes.splice(i, 1);
    }
  }
  return false;
}

// Gérer les collisions entre ennemis
function handleEnemyVsEnemyCollisions() {
  for (let i = enemySnakes.length - 1; i >= 0; i--) {
    let e1 = enemySnakes[i];
    if (!e1 || e1.segments.length < 2) continue;
    
    let h1 = e1.getHeadPos();
    let e1Killed = false;
    
    for (let j = 0; j < enemySnakes.length; j++) {
      if (i === j) continue;
      
      let e2 = enemySnakes[j];
      if (!e2 || e2.segments.length < 2) continue;
      
      for (let k = 1; k < e2.segments.length; k++) {
        let seg = e2.segments[k];
        if (seg && dist(h1.x, h1.y, seg.pos.x, seg.pos.y) < e1.segments[0].r + seg.r) {
          createDeathParticles(h1);
          convertSnakeToFood(e1);
          e2.score += e1.segments.length * 5;
          enemySnakes.splice(i, 1);
          e1Killed = true;
          break;
        }
      }
      
      if (e1Killed) break;
    }
  }
}

// Nettoyer les ennemis morts et respawn
function cleanupAndRespawnEnemies() {
  enemySnakes = enemySnakes.filter(e => e && e.segments && e.segments.length >= 2);
  
  while (enemySnakes.length < NUM_ENEMIES) {
    spawnOneEnemyWithName(enemySnakes.length);
  }
}

// ===== FONCTIONS SNAKE.IO =====

// Vérifier si un point est visible à l'écran
function isOnScreen(pos) {
  let margin = 100;
  return pos.x > cameraX - margin && pos.x < cameraX + width + margin &&
         pos.y > cameraY - margin && pos.y < cameraY + height + margin;
}

// Dessiner le fond du monde avec grille
function drawWorldBackground() {
  // Fond sombre
  push();
  fill(15, 20, 30);
  noStroke();
  rect(0, 0, worldWidth, worldHeight);
  
  // Grille hexagonale/carrée
  stroke(30, 40, 60);
  strokeWeight(1);
  
  // Lignes verticales
  for (let x = 0; x <= worldWidth; x += GRID_SIZE) {
    line(x, 0, x, worldHeight);
  }
  
  // Lignes horizontales
  for (let y = 0; y <= worldHeight; y += GRID_SIZE) {
    line(0, y, worldWidth, y);
  }
  pop();
}

// Dessiner les bordures du monde
function drawWorldBorders() {
  push();
  // Bordure rouge clignotante
  let pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 100, 255);
  stroke(255, 0, 0, pulseAlpha);
  strokeWeight(10);
  noFill();
  rect(0, 0, worldWidth, worldHeight);
  
  // Zone de danger (proche des bordures)
  let headPos = gameSnake.getHeadPos();
  let dangerDist = 100;
  
  if (headPos.x < dangerDist || headPos.x > worldWidth - dangerDist ||
      headPos.y < dangerDist || headPos.y > worldHeight - dangerDist) {
    // Effet de vignette rouge
    // (sera affiché dans drawGameHUD)
  }
  pop();
}

// Dessiner le nom au-dessus d'un snake
function drawSnakeName(snake, name, isPlayer) {
  let headPos = snake.getHeadPos();
  push();
  textAlign(CENTER, BOTTOM);
  textSize(14);
  
  if (isPlayer) {
    fill(100, 255, 100);
    stroke(0);
    strokeWeight(2);
  } else {
    fill(255);
    stroke(0);
    strokeWeight(1);
  }
  
  text(name, headPos.x, headPos.y - 25);
  
  // Afficher la taille
  textSize(10);
  fill(200);
  noStroke();
  text(snake.segments.length, headPos.x, headPos.y - 10);
  pop();
}

// Créer des particules d'effet
function createDeathParticles(pos) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      pos: pos.copy(),
      vel: p5.Vector.random2D().mult(random(2, 8)),
      size: random(3, 10),
      color: color(255, random(100, 200), 50),
      life: 60
    });
  }
}

function createBoostParticles(pos) {
  for (let i = 0; i < 5; i++) {
    particles.push({
      pos: pos.copy(),
      vel: p5.Vector.random2D().mult(random(1, 3)),
      size: random(2, 5),
      color: color(50, 200, 50, 200),
      life: 30
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.pos.add(p.vel);
    p.vel.mult(0.95);
    p.life--;
    
    if (p.life > 0) {
      push();
      let alpha = map(p.life, 0, 60, 0, 255);
      fill(red(p.color), green(p.color), blue(p.color), alpha);
      noStroke();
      circle(p.pos.x, p.pos.y, p.size);
      pop();
    } else {
      particles.splice(i, 1);
    }
  }
}

// Dessiner la nourriture avec effet glow
function drawFood(food) {
  push();
  // Pulsation
  let pulse = sin(frameCount * 0.1 + food.pulseOffset) * 0.2 + 1;
  let glowSize = food.size * pulse * 2;
  
  // Effet glow
  for (let i = 3; i >= 0; i--) {
    let alpha = map(i, 0, 3, 150, 30);
    fill(red(food.color), green(food.color), blue(food.color), alpha * food.glow);
    noStroke();
    circle(food.pos.x, food.pos.y, glowSize + i * 4);
  }
  
  // Nourriture principale
  fill(food.color);
  stroke(255, 100);
  strokeWeight(1);
  circle(food.pos.x, food.pos.y, glowSize);
  pop();
}

// Convertir un snake entier en nourriture
function convertSnakeToFood(snake) {
  for (let seg of snake.segments) {
    foodTargets.push({
      pos: seg.pos.copy(),
      size: seg.r * 0.8,
      color: snake.snakeColor || color(255, 150, 50),
      glow: 1,
      pulseOffset: random(TWO_PI)
    });
  }
}

// Ajouter un segment au snake du joueur
function addSegmentToGameSnake() {
  let lastSegment = gameSnake.segments[gameSnake.segments.length - 1];
  let newSegment = new SnakeSegment(
    lastSegment.pos.x,
    lastSegment.pos.y,
    gameSnake.snakeColor,
    max(6, gameSnake.segmentSize - gameSnake.segments.length * 0.1)
  );
  gameSnake.segments.push(newSegment);
  gameSnake.length++;
}

// Afficher le HUD du jeu (Snake.io style)
function drawGameHUD() {
  push();
  
  // Indicateur de boost (en bas de l'écran)
  let boostWidth = 200;
  let boostHeight = 10;
  let boostX = width / 2 - boostWidth / 2;
  let boostY = height - 30;
  
  // Fond de la barre
  fill(50);
  stroke(100);
  strokeWeight(2);
  rect(boostX, boostY, boostWidth, boostHeight, 5);
  
  // Barre de segments (indicateur de boost disponible)
  let boostPercent = min(1, gameSnake.segments.length / 50);
  fill(isBoosting ? color(255, 100, 50) : color(50, 200, 50));
  noStroke();
  rect(boostX + 2, boostY + 2, (boostWidth - 4) * boostPercent, boostHeight - 4, 3);
  
  // Score en haut à gauche
  textAlign(LEFT, TOP);
  textSize(24);
  fill(255);
  stroke(0);
  strokeWeight(3);
  text(`Score: ${gameScore}`, 15, 15);
  
  textSize(16);
  noStroke();
  fill(200);
  text(`Longueur: ${gameSnake.segments.length}`, 15, 45);
  
  // Instructions boost
  textAlign(CENTER, BOTTOM);
  textSize(12);
  fill(150);
  text("Clic gauche = Boost (consomme des segments)", width / 2, height - 40);
  
  // Avertissement bordure
  let headPos = gameSnake.getHeadPos();
  let dangerDist = 150;
  if (headPos.x < dangerDist || headPos.x > worldWidth - dangerDist ||
      headPos.y < dangerDist || headPos.y > worldHeight - dangerDist) {
    // Effet vignette rouge
    push();
    noFill();
    for (let i = 0; i < 5; i++) {
      stroke(255, 0, 0, 100 - i * 20);
      strokeWeight(20 + i * 10);
      rect(0, 0, width, height);
    }
    
    // Texte d'avertissement
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 0, 0);
    stroke(0);
    strokeWeight(3);
    text("⚠️ DANGER - BORDURE ⚠️", width / 2, 80);
    pop();
  }
  
  pop();
}

// Dessiner la minimap
function drawMinimap() {
  let mapSize = 150;
  let mapX = width - mapSize - 15;
  let mapY = height - mapSize - 15;
  let scale = mapSize / max(worldWidth, worldHeight);
  
  push();
  // Fond de la minimap
  fill(0, 150);
  stroke(100);
  strokeWeight(2);
  rect(mapX, mapY, mapSize, mapSize, 5);
  
  // Bordure du monde
  stroke(255, 50, 50);
  strokeWeight(1);
  noFill();
  let worldW = worldWidth * scale;
  let worldH = worldHeight * scale;
  rect(mapX, mapY, worldW, worldH);
  
  // Nourriture (points)
  noStroke();
  for (let food of foodTargets) {
    fill(food.color);
    let fx = mapX + food.pos.x * scale;
    let fy = mapY + food.pos.y * scale;
    circle(fx, fy, 2);
  }
  
  // Ennemis (points rouges)
  fill(255, 100, 100);
  for (let enemy of enemySnakes) {
    let ePos = enemy.getHeadPos();
    let ex = mapX + ePos.x * scale;
    let ey = mapY + ePos.y * scale;
    circle(ex, ey, 4);
  }
  
  // Joueur (point vert brillant)
  let pPos = gameSnake.getHeadPos();
  let px = mapX + pPos.x * scale;
  let py = mapY + pPos.y * scale;
  
  // Halo autour du joueur
  fill(50, 255, 50, 100);
  circle(px, py, 12);
  fill(50, 255, 50);
  circle(px, py, 6);
  
  pop();
}

// Dessiner le leaderboard
function drawLeaderboard() {
  // Créer la liste de tous les snakes avec leurs scores
  let leaderboard = [];
  
  // Joueur
  leaderboard.push({
    name: playerName,
    score: gameScore,
    length: gameSnake.segments.length,
    isPlayer: true
  });
  
  // Ennemis
  for (let enemy of enemySnakes) {
    leaderboard.push({
      name: enemy.name || "Bot",
      score: enemy.score,
      length: enemy.segments.length,
      isPlayer: false
    });
  }
  
  // Trier par score
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Afficher top 5
  let lbX = width - 170;
  let lbY = 15;
  let lbWidth = 155;
  
  push();
  // Titre
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  stroke(0);
  strokeWeight(2);
  text("🏆 Classement", lbX, lbY);
  
  // Lignes du leaderboard
  textSize(12);
  noStroke();
  for (let i = 0; i < min(5, leaderboard.length); i++) {
    let entry = leaderboard[i];
    let y = lbY + 22 + i * 18;
    
    // Fond pour le joueur
    if (entry.isPlayer) {
      fill(50, 200, 50, 100);
      noStroke();
      rect(lbX - 5, y - 2, lbWidth, 16, 3);
    }
    
    // Texte
    fill(entry.isPlayer ? color(100, 255, 100) : color(255));
    textAlign(LEFT, TOP);
    text(`${i + 1}. ${entry.name}`, lbX, y);
    textAlign(RIGHT, TOP);
    text(`${entry.score}`, lbX + lbWidth - 5, y);
  }
  pop();
}

// Afficher l'écran de game over (Snake.io style)
function drawGameOver() {
  push();
  
  // Fond semi-transparent qui s'assombrit progressivement
  background(15, 20, 30, 220);
  
  // Grille de fond (fonction utilitaire - non animée)
  drawAnimatedGrid(false);
  
  // Effet de particules de mort
  drawGameOverParticles();
  
  // Titre GAME OVER avec effet de lueur
  drawGlowTitle("GAME OVER", width / 2, height / 3, 64, color(255, 80, 80));
  
  // Statistiques dans un cadre
  drawGameOverStats();
  
  // Boutons
  textSize(24);
  drawButton(width / 2, height / 2 + 170, 220, 55, "↻ REJOUER", color(50, 200, 50), color(80, 255, 80));
  
  // Lien menu
  let menuBtnY = height / 2 + 240;
  let menuHover = mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
                  mouseY > menuBtnY - 20 && mouseY < menuBtnY + 20;
  fill(menuHover ? 255 : 150);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("← Retour au menu (R)", width / 2, menuBtnY);
  
  pop();
}

// Dessiner les particules décoratives du game over
function drawGameOverParticles() {
  for (let i = 0; i < 20; i++) {
    let x = width/2 + cos(frameCount * 0.02 + i) * (100 + i * 5);
    let y = height/3 + sin(frameCount * 0.02 + i) * (50 + i * 2);
    let c = SNAKE_SKINS[i % SNAKE_SKINS.length].color;
    fill(c[0], c[1], c[2], 150);
    noStroke();
    circle(x, y, 10 + sin(frameCount * 0.1 + i) * 3);
  }
}

// Dessiner les statistiques du game over
function drawGameOverStats() {
  // Cadre
  fill(30, 40, 60, 200);
  stroke(80);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 30, 350, 150, 15);
  
  textAlign(CENTER, CENTER);
  
  // Score final
  fill(50, 255, 50);
  noStroke();
  textSize(20);
  text("SCORE FINAL", width / 2, height / 2 - 20);
  
  textSize(48);
  text(gameScore, width / 2, height / 2 + 25);
  
  // Longueur atteinte
  fill(200);
  textSize(16);
  text(`Longueur maximale: ${gameSnake ? gameSnake.length : 0} segments`, width / 2, height / 2 + 70);
  
  // Position dans le classement
  let rank = 1;
  for (let enemy of enemySnakes) {
    if (enemy.score > gameScore) rank++;
  }
  fill(255, 200, 50);
  text(`Classement: #${rank}`, width / 2, height / 2 + 95);
}

// Gestion du clic sur Game Over
function handleGameOverClick() {
  // Bouton rejouer
  if (isButtonClicked(width / 2, height / 2 + 170, 220, 55)) {
    startGame();
    return;
  }
  
  // Lien menu
  let menuBtnY = height / 2 + 240;
  if (mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
      mouseY > menuBtnY - 20 && mouseY < menuBtnY + 20) {
    gameState = "menu";
  }
}

// Gestion des clics souris pour le boost et le menu
function mousePressed() {
  if (mode === "game") {
    if (gameState === "menu") {
      // Vérifier clic sur les skins
      let skinStartX = width / 2 - (SNAKE_SKINS.length * 40) / 2 + 20;
      for (let i = 0; i < SNAKE_SKINS.length; i++) {
        let x = skinStartX + i * 40;
        let y = height / 2 + 65;
        if (dist(mouseX, mouseY, x, y) < 20) {
          selectedSkin = i;
          return;
        }
      }
      
      // Vérifier clic sur bouton jouer
      let btnX = width / 2;
      let btnY = height / 2 + 150;
      let btnW = 220;
      let btnH = 55;
      if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
          mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
        startGame();
      }
    } else if (gameState === "playing") {
      isBoosting = true;
    } else if (gameState === "gameOver") {
      handleGameOverClick();
    }
  }
}

function mouseReleased() {
  isBoosting = false;
}

function keyPressed() {
  // Gestion du nom dans le menu
  if (mode === "game" && gameState === "menu") {
    if (keyCode === BACKSPACE) {
      playerName = playerName.slice(0, -1);
      return false; // Empêcher le comportement par défaut
    } else if (keyCode === ENTER) {
      startGame();
      return false;
    } else if (key.length === 1 && playerName.length < 15) {
      // Ajouter le caractère au nom
      playerName += key;
      return false;
    }
    return false;
  }
  
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  } else if (key === 's') {
    // Mode = Snake (suivre la souris)
    mode = "snake";
  } else if (key === 't') {
    // Mode = Text (chaque véhicule va vers un point du texte "Hello!")
    mode = "text";
  } else if (key === 'g') {
    // Mode = Grid (exercice 2)
    mode = "grid";
    setupGridMode();
  } else if (key === 'f') {
    // Mode = Formation (véhicules en V autour du leader)
    mode = "formation";
    setupFormationMode();
  } else if (key === 'p' || key === 'P') {
    // Mode = Game (Snake.io)
    mode = "game";
    setupGameMode();
  } else if (key === 'n' || key === 'N') {
    // Créer un nouveau snake (seulement en mode snake)
    if (mode === "snake") {
      createNewSnake();
    }
  } else if (key === 'r' || key === 'R') {
    // Reset le mode actuel
    if (mode === "grid") {
      setupGridMode();
    } else if (mode === "formation") {
      setupFormationMode();
    } else if (mode === "snake") {
      snakeEntities = [];
      createNewSnake();
    } else if (mode === "game") {
      setupGameMode();
    } else if (mode === "text") {
      vehicles.forEach(v => {
        v.pos.set(random(width), random(height));
        v.vel.set(0, 0);
      });
    }
  }
}