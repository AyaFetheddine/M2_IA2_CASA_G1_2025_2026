/**
 * Classe Vaisseau - Véhicule poursuiveur qui suit la souris
 * Hérite de Vehicle et implémente les comportements arrive + avoid + separation
 */
class Vaisseau extends Vehicle {
  constructor(x, y, couleur = null) {
    super(x, y);
    
    // Couleur aléatoire si non spécifiée
    this.color = couleur || color(
      random(100, 255),
      random(100, 255),
      random(100, 255)
    );
    
    // Poids personnalisés pour le vaisseau
    this.seekWeight = 0.5;
    this.avoidWeight = 3;
    this.separateWeight = 1.5;
    this.boundariesWeight = 2;
    this.wanderWeight = 0;
    
    // Paramètres spécifiques
    this.maxSpeed = 5;
    this.maxForce = 0.25;
  }

  /**
   * Applique tous les comportements du vaisseau
   */
  applyBehaviors(target, obstacles, vehicules) {
    // Comportement arrive : suivre la cible (souris)
    let seekForce = this.arrive(target);
    
    // Comportement avoid : choisir entre version améliorée ou standard
    let avoidForce;
    if (window.useAvoidAmeliore) {
      // Version améliorée avec 3 points de détection adaptatifs
      avoidForce = this.avoidAmeliore(obstacles);
      // Ajouter l'évitement des véhicules
      let avoidVehicules = this.avoidVehiculesDynamique(vehicules);
      avoidForce.add(avoidVehicules);
    } else {
      // Version standard
      avoidForce = this.avoidAvecVehicules(obstacles, vehicules);
    }
    
    // Comportement separation : garder ses distances
    let separateForce = this.separate(vehicules);
    
    // Comportement boundaries : rester dans le canvas
    let boundariesForce = this.boundaries(0, 0, width, height, 50);

    // Appliquer les poids
    seekForce.mult(this.seekWeight);
    avoidForce.mult(this.avoidWeight);
    separateForce.mult(this.separateWeight);
    boundariesForce.mult(this.boundariesWeight);

    // Appliquer les forces
    this.applyForce(seekForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
    this.applyForce(boundariesForce);
  }

  /**
   * Affichage amélioré du vaisseau
   */
  drawVehicle() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Ombre du vaisseau
    fill(0, 0, 0, 50);
    noStroke();
    triangle(
      -this.r_pourDessin + 3, -this.r_pourDessin / 2 + 3,
      -this.r_pourDessin + 3, this.r_pourDessin / 2 + 3,
      this.r_pourDessin + 3, 3
    );

    // Corps du vaisseau
    stroke(255);
    strokeWeight(2);
    fill(this.color);
    triangle(
      -this.r_pourDessin, -this.r_pourDessin / 2,
      -this.r_pourDessin, this.r_pourDessin / 2,
      this.r_pourDessin, 0
    );

    // Détail central
    fill(255, 255, 255, 150);
    noStroke();
    ellipse(-this.r_pourDessin / 3, 0, 6, 6);

    pop();

    // Cercle englobant en mode debug
    if (Vehicle.debug) {
      push();
      stroke(this.color);
      strokeWeight(1);
      noFill();
      // Cercle plein autour pour l'évitement
      circle(this.pos.x, this.pos.y, this.r * 2);
      pop();
    }
  }
}

/**
 * Classe VaisseauRapide - Version rapide du vaisseau (pour la touche 's')
 */
class VaisseauRapide extends Vaisseau {
  constructor(x, y) {
    super(x, y, color(255, 50, 50));
    
    this.maxSpeed = 10;
    this.maxForce = 0.4;
    this.r_pourDessin = 20;
    this.r = 50;
    
    // Plus agressif dans la poursuite
    this.seekWeight = 0.8;
    this.avoidWeight = 2;
  }

  drawVehicle() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Effet de vitesse (flammes)
    if (this.vel.mag() > 3) {
      fill(255, 100, 0, 150);
      noStroke();
      for (let i = 0; i < 3; i++) {
        let flameSize = random(5, 15);
        ellipse(-this.r_pourDessin - 5 - i * 8, random(-5, 5), flameSize, flameSize);
      }
    }

    // Corps du vaisseau
    stroke(255);
    strokeWeight(2);
    fill(this.color);
    triangle(
      -this.r_pourDessin, -this.r_pourDessin / 2,
      -this.r_pourDessin, this.r_pourDessin / 2,
      this.r_pourDessin, 0
    );

    // Détail
    fill(255, 200, 0);
    noStroke();
    ellipse(0, 0, 8, 8);

    pop();

    if (Vehicle.debug) {
      push();
      stroke(255, 0, 0, 150);
      noFill();
      circle(this.pos.x, this.pos.y, this.r * 2);
      pop();
    }
  }
}
