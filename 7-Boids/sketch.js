/**
 * 🐟 JEU : Requin vs Poissons 🦈
 * 
 * Basé sur les comportements Boids (flocking) de Craig Reynolds
 * Comportements implémentés : align, cohesion, separation, boundaries, wander, flee, seek
 * 
 * Règles du jeu :
 * - Les poissons forment un banc (flocking)
 * - Le requin chasse les poissons (wander + seek)
 * - Les poissons fuient le requin (fleeWithTargetRadius)
 * - Cliquez pour ajouter des poissons
 * - Le requin gagne si tous les poissons sont mangés
 * 
 * Contrôles :
 * - Clic / Drag : Ajouter des poissons
 * - 'd' : Mode debug
 * - 'o' : Ajouter un obstacle
 * - 'r' : Réinitialiser
 * - 'p' : Pause/Play
 */

// Tableaux des entités
let flock = [];
let obstacles = [];
let predators = [];

// Images
let fishImage;
let sharkImage;

// Interface
let sliders = {};
let labelNbBoids;
let isPaused = false;

// Score et temps
let gameTime = 0;
let gameOver = false;

function preload() {
  // Charger les images
  fishImage = loadImage('assets/niceFishTransparent.png');
  sharkImage = loadImage('assets/requin.png');
}

function setup() {
  createCanvas(windowWidth - 220, windowHeight);
  
  // Créer les sliders
  creerInterface();
  
  // Créer les poissons initiaux
  for (let i = 0; i < 150; i++) {
    let fish = new Prey(random(50, width - 50), random(50, height - 50), fishImage);
    fish.r = random(10, 30);
    flock.push(fish);
  }
  
  // Créer le requin (prédateur)
  let shark = new Predator(width / 2, height / 2, sharkImage);
  shark.r = 50;
  shark.detectionRadius = 120;
  predators.push(shark);
  
  // Obstacle souris (premier obstacle, sera mis à jour avec la position de la souris)
  let mouseObs = new Obstacle(mouseX, mouseY, 40, color(100, 255, 100, 150));
  mouseObs.isMouseObstacle = true;
  obstacles.push(mouseObs);
  
  // Créer des obstacles fixes (rochers)
  creerObstaclesFixes();
}

function creerInterface() {
  let yPos = 10;
  const xPos = 10;
  const step = 35;
  
  // Titre
  let titre = createDiv('🐟 Requin vs Poissons 🦈');
  titre.position(xPos, yPos);
  titre.style('color', '#4ecca3');
  titre.style('font-size', '16px');
  titre.style('font-weight', 'bold');
  yPos += 30;
  
  // Sliders pour les comportements de flocking
  sliders.alignWeight = creerSlider('Alignement', 'alignWeight', 0, 3, 1.5, 0.1, xPos, yPos);
  yPos += step;
  
  sliders.cohesionWeight = creerSlider('Cohésion', 'cohesionWeight', 0, 3, 1, 0.1, xPos, yPos);
  yPos += step;
  
  sliders.separationWeight = creerSlider('Séparation', 'separationWeight', 0, 10, 3, 0.1, xPos, yPos);
  yPos += step;
  
  sliders.boundariesWeight = creerSlider('Confinement', 'boundariesWeight', 0, 15, 10, 1, xPos, yPos);
  yPos += step;
  
  sliders.perceptionRadius = creerSlider('Perception', 'perceptionRadius', 10, 100, 30, 5, xPos, yPos);
  yPos += step;
  
  // Slider pour le prédateur
  yPos += 10;
  let predLabel = createDiv('🦈 Prédateur');
  predLabel.position(xPos, yPos);
  predLabel.style('color', '#ff6b6b');
  predLabel.style('font-size', '14px');
  yPos += 25;
  
  sliders.detectionRadius = creerSliderPredator('Détection', 'detectionRadius', 50, 200, 120, 10, xPos, yPos);
  yPos += step;
  
  sliders.predMaxSpeed = creerSliderPredator('Vitesse', 'maxSpeed', 3, 12, 6, 0.5, xPos, yPos);
  yPos += step;
  
  // Checkbox debug
  yPos += 10;
  let debugCheckbox = createCheckbox(' Mode Debug', false);
  debugCheckbox.position(xPos, yPos);
  debugCheckbox.style('color', 'white');
  debugCheckbox.style('font-size', '14px');
  debugCheckbox.changed(() => {
    Boid.debug = debugCheckbox.checked();
  });
  yPos += 30;
  
  // Label nombre de poissons
  labelNbBoids = createDiv('🐟 Poissons: 0');
  labelNbBoids.position(xPos, yPos);
  labelNbBoids.style('color', 'white');
  labelNbBoids.style('font-size', '14px');
  yPos += 25;
  
  // Instructions
  yPos += 20;
  let instrTitle = createDiv('📋 Contrôles');
  instrTitle.position(xPos, yPos);
  instrTitle.style('color', '#4ecca3');
  instrTitle.style('font-size', '14px');
  yPos += 20;
  
  let instr = [
    'Clic/Drag: Ajouter poissons',
    'd: Mode debug',
    'o: Ajouter obstacle',
    'r: Réinitialiser',
    'p: Pause/Play'
  ];
  
  for (let i of instr) {
    let line = createDiv(i);
    line.position(xPos, yPos);
    line.style('color', '#aaa');
    line.style('font-size', '12px');
    yPos += 18;
  }
}

function creerSlider(labelText, propertyName, min, max, val, step, posX, posY) {
  let container = createDiv();
  container.position(posX, posY);
  
  let label = createSpan(labelText + ': ');
  label.parent(container);
  label.style('color', 'white');
  label.style('font-size', '12px');
  
  let slider = createSlider(min, max, val, step);
  slider.parent(container);
  slider.style('width', '80px');
  slider.style('vertical-align', 'middle');
  
  let valueDisplay = createSpan(' ' + val);
  valueDisplay.parent(container);
  valueDisplay.style('color', '#4ecca3');
  valueDisplay.style('font-size', '12px');
  
  slider.input(() => {
    valueDisplay.html(' ' + slider.value());
    flock.forEach(b => {
      if (b[propertyName] !== undefined) {
        b[propertyName] = slider.value();
      }
    });
  });
  
  return slider;
}

function creerSliderPredator(labelText, propertyName, min, max, val, step, posX, posY) {
  let container = createDiv();
  container.position(posX, posY);
  
  let label = createSpan(labelText + ': ');
  label.parent(container);
  label.style('color', '#ff6b6b');
  label.style('font-size', '12px');
  
  let slider = createSlider(min, max, val, step);
  slider.parent(container);
  slider.style('width', '80px');
  slider.style('vertical-align', 'middle');
  
  let valueDisplay = createSpan(' ' + val);
  valueDisplay.parent(container);
  valueDisplay.style('color', '#ff6b6b');
  valueDisplay.style('font-size', '12px');
  
  slider.input(() => {
    valueDisplay.html(' ' + slider.value());
    predators.forEach(p => {
      if (p[propertyName] !== undefined) {
        p[propertyName] = slider.value();
      }
    });
  });
  
  return slider;
}

function draw() {
  // Fond océan
  background(10, 30, 60);
  
  // Effet de vagues
  drawWaves();
  
  if (isPaused) {
    afficherPause();
    return;
  }
  
  if (gameOver) {
    afficherGameOver();
    return;
  }
  
  gameTime++;
  
  // Mettre à jour l'obstacle souris
  if (obstacles.length > 0) {
    obstacles[0].pos.x = mouseX;
    obstacles[0].pos.y = mouseY;
  }
  
  // Mettre à jour et afficher les obstacles
  for (let o of obstacles) {
    o.show();
  }
  
  // Mettre à jour et afficher les poissons
  for (let boid of flock) {
    // Comportement de flocking
    boid.flock(flock);
    
    // Fuir les prédateurs
    for (let pred of predators) {
      boid.fleeWithTargetRadius(pred);
    }
    
    // Éviter les obstacles (utilise le comportement avoid)
    let avoidForce = boid.avoid(obstacles);
    avoidForce.mult(5); // Poids de l'évitement
    boid.applyForce(avoidForce);
    
    // Également fuir si trop proche (double protection)
    boid.avoidObstacles(obstacles);
    
    boid.update();
    boid.show();
  }
  
  // Mettre à jour les prédateurs
  for (let pred of predators) {
    // Chasser les proies
    let eaten = pred.hunt(flock);
    
    if (eaten) {
      // Retirer le poisson mangé
      let index = flock.indexOf(eaten);
      if (index > -1) {
        flock.splice(index, 1);
        pred.score++;
      }
    }
    
    pred.edges();
    pred.update();
    pred.show();
  }
  
  // Vérifier fin de partie
  if (flock.length === 0) {
    gameOver = true;
  }
  
  // Mettre à jour les stats
  labelNbBoids.html('🐟 Poissons: ' + flock.length);
  
  // Afficher le score
  afficherScore();
}

function drawWaves() {
  push();
  noFill();
  stroke(255, 255, 255, 20);
  strokeWeight(1);
  
  for (let y = 0; y < height; y += 30) {
    beginShape();
    for (let x = 0; x < width; x += 10) {
      let yOffset = sin((x + frameCount) * 0.02) * 5;
      vertex(x, y + yOffset);
    }
    endShape();
  }
  pop();
}

function afficherScore() {
  push();
  fill(255);
  textSize(16);
  textAlign(RIGHT);
  
  let minutes = floor(gameTime / 3600);
  let seconds = floor((gameTime / 60) % 60);
  let timeStr = nf(minutes, 2) + ':' + nf(seconds, 2);
  
  text('⏱️ ' + timeStr, width - 20, 30);
  
  // Score total des prédateurs
  let totalScore = predators.reduce((sum, p) => sum + p.score, 0);
  text('🦈 Score: ' + totalScore, width - 20, 55);
  
  pop();
}

function afficherPause() {
  push();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  text('⏸️ PAUSE', width / 2, height / 2);
  
  textSize(20);
  text('Appuyez sur P pour continuer', width / 2, height / 2 + 50);
  pop();
}

function afficherGameOver() {
  push();
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  fill(255, 100, 100);
  textSize(48);
  textAlign(CENTER, CENTER);
  text('🦈 LE REQUIN A GAGNÉ! 🦈', width / 2, height / 2 - 30);
  
  let totalScore = predators.reduce((sum, p) => sum + p.score, 0);
  fill(255);
  textSize(24);
  text('Poissons mangés: ' + totalScore, width / 2, height / 2 + 30);
  
  let minutes = floor(gameTime / 3600);
  let seconds = floor((gameTime / 60) % 60);
  text('Temps: ' + nf(minutes, 2) + ':' + nf(seconds, 2), width / 2, height / 2 + 60);
  
  textSize(18);
  text('Appuyez sur R pour rejouer', width / 2, height / 2 + 110);
  pop();
}

// ============================================
// ENTRÉES UTILISATEUR
// ============================================

function mousePressed() {
  if (mouseX < 220) return; // Éviter les clics sur l'interface
  
  // Ajouter un poisson
  let fish = new Prey(mouseX, mouseY, fishImage);
  fish.r = random(10, 25);
  flock.push(fish);
}

function mouseDragged() {
  if (mouseX < 220) return;
  
  // Ajouter des poissons en trainant
  if (frameCount % 5 === 0) {
    let fish = new Prey(mouseX + random(-20, 20), mouseY + random(-20, 20), fishImage);
    fish.r = random(8, 20);
    flock.push(fish);
  }
}

function keyPressed() {
  switch (key.toLowerCase()) {
    case 'd':
      Boid.debug = !Boid.debug;
      break;
      
    case 'o':
      // Ajouter un obstacle fixe
      obstacles.push(new Obstacle(mouseX, mouseY, random(30, 60), color(100, 255, 100)));
      break;
      
    case 'r':
      // Réinitialiser le jeu
      reinitialiser();
      break;
      
    case 'p':
      // Pause/Play
      isPaused = !isPaused;
      break;
  }
}

function reinitialiser() {
  flock = [];
  obstacles = [];
  predators = [];
  gameOver = false;
  gameTime = 0;
  
  // Recréer les entités
  for (let i = 0; i < 150; i++) {
    let fish = new Prey(random(50, width - 50), random(50, height - 50), fishImage);
    fish.r = random(10, 30);
    flock.push(fish);
  }
  
  let shark = new Predator(width / 2, height / 2, sharkImage);
  shark.r = 50;
  shark.detectionRadius = 120;
  predators.push(shark);
  
  obstacles.push(new Obstacle(mouseX, mouseY, 40, color(100, 255, 100, 150)));
  obstacles[0].isMouseObstacle = true;
  
  // Recréer les obstacles fixes
  creerObstaclesFixes();
}

/**
 * Crée des obstacles fixes (rochers, coraux) dans l'océan
 * Les poissons doivent les éviter
 */
function creerObstaclesFixes() {
  // Couleurs des rochers/coraux
  let couleurs = [
    color(80, 60, 40),      // Marron (rocher)
    color(100, 80, 60),     // Marron clair
    color(60, 100, 60),     // Vert mousse
    color(150, 100, 80),    // Beige
    color(255, 100, 100),   // Corail rouge
    color(255, 150, 50),    // Corail orange
  ];
  
  // Créer plusieurs groupes d'obstacles
  // Groupe 1 : En haut à gauche
  obstacles.push(new Obstacle(150, 150, 50, couleurs[0]));
  obstacles.push(new Obstacle(200, 120, 30, couleurs[1]));
  
  // Groupe 2 : En bas à droite  
  obstacles.push(new Obstacle(width - 200, height - 150, 60, couleurs[2]));
  obstacles.push(new Obstacle(width - 130, height - 180, 35, couleurs[3]));
  
  // Groupe 3 : Centre-bas
  obstacles.push(new Obstacle(width / 2, height - 100, 45, couleurs[4]));
  obstacles.push(new Obstacle(width / 2 + 70, height - 130, 25, couleurs[5]));
  
  // Groupe 4 : Centre-haut
  obstacles.push(new Obstacle(width / 2 - 100, 120, 40, couleurs[0]));
  
  // Ajouter quelques obstacles aléatoires
  for (let i = 0; i < 3; i++) {
    let x = random(300, width - 300);
    let y = random(200, height - 200);
    let r = random(25, 55);
    let c = random(couleurs);
    obstacles.push(new Obstacle(x, y, r, c));
  }
}

function windowResized() {
  resizeCanvas(windowWidth - 220, windowHeight);
}
