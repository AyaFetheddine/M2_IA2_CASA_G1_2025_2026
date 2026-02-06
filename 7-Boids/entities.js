/**
 * Classe Obstacle - Obstacle circulaire (rocher, corail)
 * Les poissons doivent éviter ces obstacles
 */
class Obstacle {
  constructor(x, y, r, couleur = "lightgreen") {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = couleur;
    this.isMouseObstacle = false; // Si c'est l'obstacle qui suit la souris
  }

  show() {
    push();
    
    if (this.isMouseObstacle) {
      // Obstacle souris : effet de bulle
      noFill();
      stroke(100, 255, 100, 150);
      strokeWeight(3);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
      
      // Cercle intérieur
      fill(100, 255, 100, 50);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.r * 1.5);
    } else {
      // Rocher/Corail : effet 3D
      // Ombre
      fill(0, 0, 0, 50);
      noStroke();
      ellipse(this.pos.x + 5, this.pos.y + 5, this.r * 2);
      
      // Corps principal avec dégradé
      fill(this.color);
      stroke(0);
      strokeWeight(2);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
      
      // Highlight (reflet de lumière)
      let c = this.color;
      fill(red(c) + 50, green(c) + 50, blue(c) + 50, 150);
      noStroke();
      ellipse(this.pos.x - this.r * 0.3, this.pos.y - this.r * 0.3, this.r * 0.6);
      
      // Détails (texture)
      fill(red(c) - 30, green(c) - 30, blue(c) - 30, 100);
      ellipse(this.pos.x + this.r * 0.2, this.pos.y + this.r * 0.2, this.r * 0.4);
      ellipse(this.pos.x - this.r * 0.1, this.pos.y + this.r * 0.3, this.r * 0.25);
    }
    
    pop();
  }
}

/**
 * Classe Predator - Prédateur qui chasse les proies
 * Hérite de Boid avec des comportements spéciaux
 */
class Predator extends Boid {
  constructor(x, y, image = null) {
    super(x, y, image);
    
    this.type = "predator";
    this.r = 40;
    this.maxSpeed = 6;
    this.maxForce = 0.4;
    this.color = color(255, 0, 0);
    
    // Rayon de détection des proies
    this.detectionRadius = 100;
    
    // Compteur de proies mangées
    this.score = 0;
    
    // Paramètres wander pour le prédateur
    this.distanceCercle = 100;
    this.wanderRadius = 40;
    this.displaceRange = 0.2;
  }
  
  /**
   * Comportement de chasse
   * Wander + Poursuite si proie détectée
   */
  hunt(preys, eatDistance = 15) {
    // Toujours appliquer wander comme comportement de base
    let wanderForce = this.wander();
    wanderForce.mult(0.5);
    this.applyForce(wanderForce);
    
    // Chercher la proie la plus proche
    let closest = this.getVehiculeLePlusProche(preys);
    
    if (closest) {
      let d = this.pos.dist(closest.pos);
      
      // Si dans le rayon de détection -> poursuite
      if (d < this.detectionRadius) {
        let seekForce = this.seek(closest.pos);
        seekForce.mult(5);
        this.applyForce(seekForce);
        
        // Manger si assez proche
        if (d < eatDistance) {
          return closest; // Retourne la proie mangée
        }
      }
    }
    
    return null; // Pas de proie mangée
  }
  
  /**
   * Affichage du prédateur avec zone de détection
   */
  show() {
    // Zone de détection
    push();
    noFill();
    stroke(255, 255, 0, 100);
    strokeWeight(2);
    ellipse(this.pos.x, this.pos.y, this.detectionRadius * 2);
    pop();
    
    // Appel au show parent
    super.show();
    
    // Score au-dessus
    push();
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text("🦈 " + this.score, this.pos.x, this.pos.y - this.r - 10);
    pop();
  }
}

/**
 * Classe Prey - Proie qui fuit les prédateurs
 */
class Prey extends Boid {
  constructor(x, y, image = null) {
    super(x, y, image);
    
    this.type = "prey";
    this.r = random(8, 25);
    this.maxSpeed = 4;
    this.color = color(100, 200, 255);
  }
}
