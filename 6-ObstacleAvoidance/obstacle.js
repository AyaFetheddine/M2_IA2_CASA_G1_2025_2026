/**
 * Classe Obstacle - représente un obstacle circulaire dans la scène
 * Les véhicules doivent éviter ces obstacles
 */
class Obstacle {
  constructor(x, y, r, couleur = "green") {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = couleur;
    this.originalColor = couleur;
    this.isColliding = false; // Pour le feedback visuel
  }

  /**
   * Met en évidence l'obstacle (quand collision possible)
   */
  setColliding(colliding) {
    this.isColliding = colliding;
    this.color = colliding ? color(255, 0, 0, 200) : this.originalColor;
  }

  /**
   * Affiche l'obstacle
   */
  show() {
    push();
    
    // Effet de glow si en collision
    if (this.isColliding) {
      // Cercle externe pour l'effet glow
      noStroke();
      fill(255, 0, 0, 50);
      ellipse(this.pos.x, this.pos.y, this.r * 2.5);
      fill(255, 0, 0, 100);
      ellipse(this.pos.x, this.pos.y, this.r * 2.2);
    }
    
    // Corps principal de l'obstacle
    fill(this.color);
    stroke(0);
    strokeWeight(3);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    
    // Point central
    fill(0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 10);
    
    // Cercle décoratif intérieur
    noFill();
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    ellipse(this.pos.x, this.pos.y, this.r);
    
    pop();
  }
}
