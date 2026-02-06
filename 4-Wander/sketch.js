let vehicles = [];
let imageFusee;
let debugCheckbox;
let nbVehiclesSlider;
let pathLengthSlider;

function preload() {
  // on charge une image de fusée pour le vaisseau
  imageFusee = loadImage('./assets/vehicule.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  const nbVehicles = 20;
  creerVehicules(nbVehicles);

  // On cree des sliders pour régler les paramètres
  creerSlidersPourProprietesVehicules();
}

// Crée des véhicules avec positions aléatoires, couleurs et tailles différentes
function creerVehicules(nb) {
  vehicles = [];
  for (let i = 0; i < nb; i++) {
    let vehicle = new Vehicle(
      random(width), 
      random(height), 
      imageFusee,
      color(random(100, 255), random(100, 255), random(100, 255))
    );
    // Tailles différentes
    vehicle.r = random(30, 60);
    // Vitesses légèrement différentes
    vehicle.maxSpeed = random(3, 8);
    vehicles.push(vehicle);
  }
}

function creerSlidersPourProprietesVehicules() {
  let yPos = 10;
  
  // Slider pour régler le nombre de véhicules
  creerSliderNombreVehicules(10, yPos);
  yPos += 35;
  
  // Slider pour régler la longueur du chemin
  creerSliderLongueurChemin(10, yPos);
  yPos += 35;

  // Slider pour régler la vitesse max
  creerSliderPourProprieteVehicules(
    'Vitesse Max:', 'maxSpeed', 1, 20, 6, 1, 10, yPos);
  yPos += 35;

  // Slider pour régler la force max
  creerSliderPourProprieteVehicules(
    'Force Max:', 'maxForce', 0.05, 2, 0.2, 0.05, 10, yPos);
  yPos += 35;

  // Slider pour régler la taille du cercle de wander
  creerSliderPourProprieteVehicules(
    'Rayon Wander:', 'wanderRadius', 5, 100, 50, 5, 10, yPos);
  yPos += 35;

  // Slider pour régler la distance du cercle de wander
  creerSliderPourProprieteVehicules(
    'Distance Wander:', 'distanceCercle', 10, 300, 150, 10, 10, yPos);
  yPos += 35;
  
  // Slider pour régler la variation de l'angle (displaceRange)
  creerSliderPourProprieteVehicules(
    'Variation Angle:', 'displaceRange', 0.05, 1, 0.3, 0.05, 10, yPos);
  yPos += 35;

  // Checkbox pour activer/désactiver le mode debug
  debugCheckbox = createCheckbox(' Mode Debug (touche d)', false);
  debugCheckbox.position(10, yPos);
  debugCheckbox.style('color', 'white');
  debugCheckbox.style('font-size', '18px');
  debugCheckbox.changed(() => {
    Vehicle.debug = debugCheckbox.checked();
  }); 
}

// Slider pour contrôler le nombre de véhicules
function creerSliderNombreVehicules(posX, posY) {
  nbVehiclesSlider = createSlider(1, 50, 20, 1);
  nbVehiclesSlider.position(posX + 180, posY);
  nbVehiclesSlider.size(150);

  let label = createDiv('Nombre véhicules:');
  label.position(posX, posY - 3);
  label.style('color', '#4ecca3');
  label.style('font-size', '18px');
  label.style('font-weight', 'bold');

  let valueDisplay = createDiv(nbVehiclesSlider.value());
  valueDisplay.position(posX + 350, posY - 3);
  valueDisplay.style('color', '#4ecca3');
  valueDisplay.style('font-size', '18px');

  nbVehiclesSlider.input(() => {
    valueDisplay.html(nbVehiclesSlider.value());
    creerVehicules(nbVehiclesSlider.value());
  });
}

// Slider pour contrôler la longueur de la trainée
function creerSliderLongueurChemin(posX, posY) {
  pathLengthSlider = createSlider(0, 100, 30, 5);
  pathLengthSlider.position(posX + 180, posY);
  pathLengthSlider.size(150);

  let label = createDiv('Longueur trainée:');
  label.position(posX, posY - 3);
  label.style('color', '#4ecca3');
  label.style('font-size', '18px');
  label.style('font-weight', 'bold');

  let valueDisplay = createDiv(pathLengthSlider.value());
  valueDisplay.position(posX + 350, posY - 3);
  valueDisplay.style('color', '#4ecca3');
  valueDisplay.style('font-size', '18px');

  pathLengthSlider.input(() => {
    valueDisplay.html(pathLengthSlider.value());
    vehicles.forEach(v => {
      v.pathLength = pathLengthSlider.value();
      // Tronquer le chemin si nécessaire
      while (v.path.length > v.pathLength) {
        v.path.shift();
      }
    });
  });
}

function creerSliderPourProprieteVehicules(labelText, propertyName,
  min, max, initialValue, step, posX, posY) {
  let slider = createSlider(min, max, initialValue, step);
  slider.position(posX + 180, posY);
  slider.size(150);

  let label = createDiv(labelText);
  label.position(posX, posY - 3);
  label.style('color', 'white');
  label.style('font-size', '18px');

  let valueDisplay = createDiv(slider.value());
  valueDisplay.position(posX + 350, posY - 3);
  valueDisplay.style('color', 'white');
  valueDisplay.style('font-size', '18px');

  slider.input(() => {
    valueDisplay.html(slider.value());
    // on met à jour la propriété pour tous les véhicules
    vehicles.forEach(vehicle => {
      vehicle[propertyName] = slider.value();
    });
  });
}


// appelée 60 fois par seconde
function draw() {
  // Effet de trainée légère
  background(0, 0, 0, 30);

  vehicles.forEach(vehicle => {
    vehicle.wander();

    vehicle.update();
    vehicle.show();
    vehicle.edges();
  });
  
  // Afficher les statistiques
  afficherStats();
}

function afficherStats() {
  push();
  fill(255);
  textSize(14);
  text('Véhicules: ' + vehicles.length, width - 150, 30);
  text('FPS: ' + floor(frameRate()), width - 150, 50);
  pop();
}

function keyPressed() {
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
    // changer la checkbox, elle doit être checkée si debug est true
    debugCheckbox.checked(Vehicle.debug);
  } else if (key === 'c') {
    // Ajouter un véhicule à la position de la souris
    let v = new Vehicle(
      mouseX, mouseY, imageFusee,
      color(random(100, 255), random(100, 255), random(100, 255))
    );
    v.r = random(30, 60);
    vehicles.push(v);
  }
}

// Ajouter un véhicule en cliquant
function mousePressed() {
  // Éviter les clics sur les sliders
  if (mouseX < 400 && mouseY < 320) return;
  
  let v = new Vehicle(
    mouseX, mouseY, imageFusee,
    color(random(100, 255), random(100, 255), random(100, 255))
  );
  v.r = random(30, 60);
  vehicles.push(v);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
