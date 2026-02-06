/**
 * Obstacle Avoidance - Version Améliorée
 * 
 * Fonctionnalités :
 * - Évitement d'obstacles avec double vecteur ahead (amélioré)
 * - Évitement entre véhicules (cercles englobants)
 * - Véhicules wander qui déambulent en évitant les obstacles
 * - Comportement separation pour garder les distances
 * - Prédiction de position future des véhicules
 * - Interface avec sliders pour régler les paramètres
 * - Différents types de véhicules (normal, rapide, wander)
 */

let vehicules = [];
let obstacles = [];
let target;

// Sliders
let sliders = {};

function setup() {
  createCanvas(windowWidth - 250, windowHeight);
  
  // Créer un obstacle initial au centre
  obstacles.push(new Obstacle(width / 2, height / 2, 80, color(50, 200, 100)));
  
  // Ajouter quelques obstacles supplémentaires
  obstacles.push(new Obstacle(width / 4, height / 3, 50, color(100, 150, 200)));
  obstacles.push(new Obstacle(3 * width / 4, 2 * height / 3, 60, color(200, 100, 150)));
  
  // Créer un vaisseau initial
  vehicules.push(new Vaisseau(100, 100));
  
  // Créer les sliders
  creerSliders();
}

function creerSliders() {
  let yPos = 10;
  const xPos = 10;
  const step = 40;
  
  // Titre
  let titre = createDiv('⚙️ Paramètres');
  titre.position(xPos, yPos);
  titre.style('color', '#4ecca3');
  titre.style('font-size', '18px');
  titre.style('font-weight', 'bold');
  yPos += 30;
  
  // Slider vitesse max
  sliders.maxSpeed = creerSlider('Vitesse Max', 'maxSpeed', 1, 15, 5, 0.5, xPos, yPos);
  yPos += step;
  
  // Slider force max
  sliders.maxForce = creerSlider('Force Max', 'maxForce', 0.05, 1, 0.25, 0.05, xPos, yPos);
  yPos += step;
  
  // Slider distance ahead
  sliders.aheadDistance = creerSlider('Distance Ahead', 'aheadDistance', 20, 150, 50, 5, xPos, yPos);
  yPos += step;
  
  // Slider poids évitement
  sliders.avoidWeight = creerSlider('Poids Évitement', 'avoidWeight', 0.5, 10, 3, 0.5, xPos, yPos);
  yPos += step;
  
  // Slider poids séparation
  sliders.separateWeight = creerSlider('Poids Séparation', 'separateWeight', 0, 5, 1.5, 0.1, xPos, yPos);
  yPos += step;
  
  // Slider poids seek
  sliders.seekWeight = creerSlider('Poids Seek', 'seekWeight', 0, 2, 0.5, 0.1, xPos, yPos);
  yPos += step;
  
  // Slider longueur trainée
  sliders.pathMaxLength = creerSlider('Longueur Trainée', 'pathMaxLength', 5, 100, 30, 5, xPos, yPos);
  yPos += step;
  
  // Slider rayon cercle wander
  sliders.wanderRadius = creerSlider('Rayon Wander', 'wanderRadius', 20, 150, 50, 5, xPos, yPos);
  yPos += step;
  
  // Slider distance cercle wander
  sliders.distanceCercle = creerSlider('Distance Cercle', 'distanceCercle', 50, 250, 150, 10, xPos, yPos);
  yPos += step;
  
  // Checkbox pour utiliser avoidAmeliore
  let avoidCheckbox = createCheckbox(' Évitement Amélioré', true);
  avoidCheckbox.position(xPos, yPos);
  avoidCheckbox.style('color', '#4ecca3');
  avoidCheckbox.style('font-size', '14px');
  avoidCheckbox.changed(() => {
    window.useAvoidAmeliore = avoidCheckbox.checked();
  });
  window.useAvoidAmeliore = true;
  yPos += step;

  // Checkbox debug
  let debugCheckbox = createCheckbox(' Mode Debug', false);
  debugCheckbox.position(xPos, yPos);
  debugCheckbox.style('color', 'white');
  debugCheckbox.style('font-size', '16px');
  debugCheckbox.changed(() => {
    Vehicle.debug = debugCheckbox.checked();
  });
  yPos += step;
  
  // Statistiques
  yPos += 20;
  let statsDiv = createDiv('📊 Statistiques');
  statsDiv.position(xPos, yPos);
  statsDiv.style('color', '#4ecca3');
  statsDiv.style('font-size', '16px');
  statsDiv.style('font-weight', 'bold');
}

function creerSlider(labelText, propertyName, min, max, initialValue, step, posX, posY) {
  let container = createDiv();
  container.position(posX, posY);
  
  let label = createSpan(labelText + ': ');
  label.parent(container);
  label.style('color', 'white');
  label.style('font-size', '14px');
  
  let slider = createSlider(min, max, initialValue, step);
  slider.parent(container);
  slider.style('width', '120px');
  slider.style('vertical-align', 'middle');
  
  let valueDisplay = createSpan(' ' + initialValue);
  valueDisplay.parent(container);
  valueDisplay.style('color', '#4ecca3');
  valueDisplay.style('font-size', '14px');
  
  slider.input(() => {
    valueDisplay.html(' ' + slider.value());
    // Mettre à jour tous les véhicules
    vehicules.forEach(v => {
      if (v[propertyName] !== undefined) {
        v[propertyName] = slider.value();
      }
    });
  });
  
  return slider;
}

function draw() {
  // Fond avec léger effet de trainée
  background(26, 26, 46, 240);
  
  // Cible = position de la souris
  target = createVector(mouseX, mouseY);
  
  // Dessiner la cible
  dessinerCible();
  
  // Reset des états de collision des obstacles
  obstacles.forEach(o => o.setColliding(false));
  
  // Dessiner les obstacles
  obstacles.forEach(o => o.show());
  
  // Mettre à jour et dessiner les véhicules
  vehicules.forEach(v => {
    v.applyBehaviors(target, obstacles, vehicules);
    v.update();
    v.show();
  });
  
  // Afficher les statistiques
  afficherStats();
}

function dessinerCible() {
  push();
  
  // Effet de pulsation
  let pulse = sin(frameCount * 0.1) * 5;
  
  // Cercle externe
  noFill();
  stroke(255, 0, 0, 100);
  strokeWeight(2);
  circle(target.x, target.y, 40 + pulse);
  
  // Cercle interne
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 20);
  
  // Croix au centre
  stroke(255);
  strokeWeight(2);
  line(target.x - 8, target.y, target.x + 8, target.y);
  line(target.x, target.y - 8, target.x, target.y + 8);
  
  pop();
}

function afficherStats() {
  push();
  fill(255);
  textSize(14);
  textAlign(LEFT);
  
  let y = height - 80;
  let x = 10;
  
  fill(255);
  text('Véhicules: ' + vehicules.length, x, y);
  y += 20;
  
  let nbWanderers = vehicules.filter(v => v instanceof Wanderer).length;
  fill(0, 255, 100);
  text('Wanderers: ' + nbWanderers, x, y);
  y += 20;
  
  let nbVaisseaux = vehicules.filter(v => v instanceof Vaisseau && !(v instanceof VaisseauRapide)).length;
  fill(100, 200, 255);
  text('Vaisseaux: ' + nbVaisseaux, x, y);
  y += 20;
  
  fill(255, 100, 100);
  text('Obstacles: ' + obstacles.length, x, y);
  
  pop();
}

// ============================================
// GESTION DES ENTRÉES
// ============================================

function mousePressed() {
  // Vérifier qu'on ne clique pas sur les sliders
  if (mouseX < 250 && mouseY < 400) return;
  
  // Ajouter un obstacle à la position de la souris
  let rayon = random(30, 80);
  let couleur = color(
    random(50, 200),
    random(100, 200),
    random(50, 200)
  );
  obstacles.push(new Obstacle(mouseX, mouseY, rayon, couleur));
}

function mouseDragged() {
  // Ajouter des obstacles en traînant la souris
  if (frameCount % 10 === 0) {
    if (mouseX > 250 || mouseY > 400) {
      let rayon = random(20, 40);
      let couleur = color(
        random(50, 200),
        random(100, 200),
        random(50, 200)
      );
      obstacles.push(new Obstacle(mouseX, mouseY, rayon, couleur));
    }
  }
}

function keyPressed() {
  switch (key.toLowerCase()) {
    case 'v':
      // Ajouter un vaisseau poursuiveur
      vehicules.push(new Vaisseau(random(width), random(height)));
      break;
      
    case 'w':
      // Ajouter un véhicule wander (vert)
      vehicules.push(new Wanderer(random(width), random(height)));
      break;
      
    case 's':
      // Ajouter un vaisseau rapide (rouge)
      vehicules.push(new VaisseauRapide(random(width), random(height)));
      break;
      
    case 'f':
      // Ajouter 10 vaisseaux
      for (let i = 0; i < 10; i++) {
        let v = new Vaisseau(random(50, 150), height / 2 + random(-100, 100));
        v.vel = createVector(random(2, 5), random(-1, 1));
        vehicules.push(v);
      }
      break;
      
    case 'd':
      // Toggle mode debug
      Vehicle.debug = !Vehicle.debug;
      break;
      
    case 'c':
      // Effacer tous les obstacles
      obstacles = [];
      break;
      
    case 'r':
      // Réinitialiser la scène
      vehicules = [];
      obstacles = [];
      vehicules.push(new Vaisseau(100, 100));
      obstacles.push(new Obstacle(width / 2, height / 2, 80, color(50, 200, 100)));
      break;
      
    case 'm':
      // Ajouter un mix de véhicules
      for (let i = 0; i < 5; i++) {
        vehicules.push(new Vaisseau(random(width), random(height)));
      }
      for (let i = 0; i < 5; i++) {
        vehicules.push(new Wanderer(random(width), random(height)));
      }
      vehicules.push(new VaisseauRapide(random(width), random(height)));
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth - 250, windowHeight);
}
