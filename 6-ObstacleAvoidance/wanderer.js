/**
 * Classe Wanderer - Véhicule avec comportement de déambulation (wander)
 * Évite les obstacles et les autres véhicules tout en se déplaçant aléatoirement
 */
class Wanderer extends Vehicle {
  constructor(x, y) {
    super(x, y);
    
    // Couleur verte pour les distinguer
    this.color = color(0, 255, 100);
    
    // Paramètres de wander
    this.distanceCercle = 100;
    this.wanderRadius = 50;
    this.wanderTheta = random(TWO_PI);
    this.displaceRange = 0.4;
    
    // Paramètres de mouvement
    this.maxSpeed = 3;
    this.maxForce = 0.15;
    this.r_pourDessin = 14;
    this.r = 40;
    
    // Poids des comportements
    this.wanderWeight = 1.0;
    this.avoidWeight = 4;
    this.separateWeight = 1;
    this.boundariesWeight = 0; // Utilise edges() à la place
    
    // Trainée plus longue
    this.pathMaxLength = 50;
  }

  /**
   * Applique les comportements wander + avoid + separation
   */
  applyBehaviors(target, obstacles, vehicules) {
    // Comportement principal : wander
    let wanderForce = this.wander();
    
    // Évitement des obstacles (version améliorée ou standard)
    let avoidForce;
    if (window.useAvoidAmeliore) {
      avoidForce = this.avoidAmeliore(obstacles);
      let avoidVehicules = this.avoidVehiculesDynamique(vehicules);
      avoidForce.add(avoidVehicules);
    } else {
      avoidForce = this.avoidAvecVehicules(obstacles, vehicules);
    }
    
    // Séparation des autres véhicules
    let separateForce = this.separate(vehicules);

    // Appliquer les poids
    wanderForce.mult(this.wanderWeight);
    avoidForce.mult(this.avoidWeight);
    separateForce.mult(this.separateWeight);

    // Appliquer les forces
    this.applyForce(wanderForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
  }

  /**
   * Mise à jour avec réapparition de l'autre côté
   */
  update() {
    super.update();
    this.edges(); // Réapparition de l'autre côté
  }

  /**
   * Affichage du wanderer (rond au lieu de triangle)
   */
  drawVehicle() {
    push();
    translate(this.pos.x, this.pos.y);

    // Effet de glow
    noStroke();
    fill(0, 255, 100, 30);
    circle(0, 0, this.r_pourDessin * 3);
    fill(0, 255, 100, 60);
    circle(0, 0, this.r_pourDessin * 2);

    // Corps principal
    stroke(255);
    strokeWeight(2);
    fill(this.color);
    circle(0, 0, this.r_pourDessin * 1.5);

    // Indicateur de direction
    rotate(this.vel.heading());
    fill(255);
    noStroke();
    ellipse(this.r_pourDessin * 0.5, 0, 6, 6);

    pop();

    // Cercle englobant en mode debug
    if (Vehicle.debug) {
      push();
      stroke(0, 255, 100, 150);
      noFill();
      circle(this.pos.x, this.pos.y, this.r * 2);
      pop();
    }
  }

  /**
   * Trainée avec effet dégradé vert
   */
  drawPath() {
    if (this.path.length < 2) return;
    
    push();
    noFill();
    
    for (let i = 1; i < this.path.length; i++) {
      let alpha = map(i, 0, this.path.length, 0, 150);
      let size = map(i, 0, this.path.length, 1, 4);
      
      stroke(0, 255, 100, alpha);
      strokeWeight(size);
      
      let p1 = this.path[i - 1];
      let p2 = this.path[i];
      line(p1.x, p1.y, p2.x, p2.y);
    }
    
    pop();
  }
}
