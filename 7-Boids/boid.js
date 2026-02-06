/**
 * Classe Boid - Implémente les comportements de flocking
 * Basé sur l'algorithme de Craig Reynolds
 * 
 * Comportements implémentés :
 * - align : s'aligner avec les voisins
 * - cohesion : aller vers le centre des voisins  
 * - separation : éviter les voisins trop proches
 * - boundaries : rester dans une zone
 * - wander : déambulation aléatoire
 * - seek / flee : se diriger vers / fuir une cible
 * - fleeWithTargetRadius : fuir si dans un rayon
 */
class Boid {
  static debug = false;

  constructor(x, y, image = null) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.setMag(random(2, 4));
    this.acc = createVector();
    
    // Paramètres de mouvement
    this.maxForce = 0.2;
    this.maxSpeed = 5;
    this.r = 6;

    // Image du boid (optionnelle)
    if (image) {
      this.image = image;
      const ratio = image.width / image.height;
      this.imageL = this.r;
      this.imageH = this.r / ratio;
    }

    // Rayon de perception pour les comportements de flocking
    this.perceptionRadius = 25;
    
    // Poids des comportements de flocking
    this.alignWeight = 1.5;
    this.cohesionWeight = 1;
    this.separationWeight = 2;
    this.boundariesWeight = 10;
    this.wanderWeight = 1;

    // Paramètres du comportement boundaries (confinement)
    this.boundariesX = 0;
    this.boundariesY = 0;
    this.boundariesWidth = width;
    this.boundariesHeight = height;
    this.boundariesDistance = 25;

    // Paramètres du comportement wander
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = random(TWO_PI);
    this.displaceRange = 0.3;
    
    // Couleur (pour les boids sans image)
    this.color = color(255);
    
    // Type de boid (pour identifier proie/prédateur)
    this.type = "boid";
  }

  // ============================================
  // COMPORTEMENT PRINCIPAL : FLOCK
  // ============================================
  
  /**
   * Applique les 4 comportements de flocking :
   * align, cohesion, separation, boundaries
   */
  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);
    let boundaries = this.boundaries(
      this.boundariesX, 
      this.boundariesY, 
      this.boundariesWidth, 
      this.boundariesHeight, 
      this.boundariesDistance
    );

    // Appliquer les poids
    alignment.mult(this.alignWeight);
    cohesion.mult(this.cohesionWeight);
    separation.mult(this.separationWeight);
    boundaries.mult(this.boundariesWeight);

    // Appliquer les forces
    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(separation);
    this.applyForce(boundaries);
  }

  // ============================================
  // COMPORTEMENT : ALIGN (Alignement)
  // ============================================
  
  /**
   * S'aligner avec la direction moyenne des voisins
   * @param {Array} boids - Tableau de tous les boids
   * @returns {p5.Vector} Force d'alignement
   */
  align(boids) {
    let steering = createVector();
    let total = 0;
    
    for (let other of boids) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      
      if (other !== this && d < this.perceptionRadius) {
        steering.add(other.vel);
        total++;
      }
    }
    
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  // ============================================
  // COMPORTEMENT : SEPARATION
  // ============================================
  
  /**
   * S'éloigner des voisins trop proches
   * Force inversement proportionnelle à la distance
   * @param {Array} boids - Tableau de tous les boids
   * @returns {p5.Vector} Force de séparation
   */
  separation(boids) {
    let steering = createVector();
    let total = 0;

    for (let other of boids) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      
      if (other !== this && d < this.perceptionRadius) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.div(d * d); // Force inversement proportionnelle au carré de la distance
        steering.add(diff);
        total++;
      }
    }
    
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  // ============================================
  // COMPORTEMENT : COHESION
  // ============================================
  
  /**
   * Se diriger vers le centre de masse des voisins
   * @param {Array} boids - Tableau de tous les boids
   * @returns {p5.Vector} Force de cohésion
   */
  cohesion(boids) {
    // Rayon de perception plus grand pour la cohésion
    let perceptionRadius = 2 * this.perceptionRadius;
    
    let steering = createVector();
    let total = 0;

    for (let other of boids) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      
      if (other !== this && d < perceptionRadius) {
        steering.add(other.pos);
        total++;
      }
    }
    
    if (total > 0) {
      steering.div(total); // Centre de masse
      steering.sub(this.pos); // Vecteur vers le centre
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  // ============================================
  // COMPORTEMENT : SEEK / FLEE
  // ============================================
  
  /**
   * Se diriger vers une cible
   * @param {p5.Vector} target - Position de la cible
   * @returns {p5.Vector} Force de seek
   */
  seek(target) {
    let vitesseSouhaitee = p5.Vector.sub(target, this.pos);
    vitesseSouhaitee.setMag(this.maxSpeed);
    
    let force = p5.Vector.sub(vitesseSouhaitee, this.vel);
    force.limit(this.maxForce);
    
    return force;
  }

  /**
   * Fuir une cible (inverse de seek)
   * @param {p5.Vector} target - Position à fuir
   * @returns {p5.Vector} Force de fuite
   */
  flee(target) {
    return this.seek(target).mult(-1);
  }

  /**
   * Fuir une cible seulement si elle est dans un certain rayon
   * @param {Object} target - Objet avec pos et r (rayon)
   */
  fleeWithTargetRadius(target) {
    const d = this.pos.dist(target.pos);
    let rayonZoneAFuir = target.r + 10;

    if (d < rayonZoneAFuir) {
      // Dessiner le cercle de danger
      if (Boid.debug) {
        push();
        stroke(255, 0, 0, 150);
        strokeWeight(2);
        noFill();
        circle(target.pos.x, target.pos.y, rayonZoneAFuir * 2);
        pop();
      }

      // Appliquer une force de fuite puissante
      const fleeForce = this.flee(target.pos);
      fleeForce.mult(100);
      this.applyForce(fleeForce);
    }
  }

  // ============================================
  // COMPORTEMENT : AVOID (Évitement d'obstacles)
  // ============================================
  
  /**
   * Éviter un obstacle en utilisant le vecteur ahead
   * @param {Array} obstacles - Tableau d'obstacles
   * @returns {p5.Vector} Force d'évitement
   */
  avoid(obstacles) {
    // Vecteur ahead (regarde devant le boid)
    let aheadDistance = 40;
    let ahead = this.vel.copy();
    ahead.setMag(aheadDistance);
    
    // Vecteur ahead2 (plus court)
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    // Points au bout des vecteurs
    let pointAhead = p5.Vector.add(this.pos, ahead);
    let pointAhead2 = p5.Vector.add(this.pos, ahead2);

    if (Boid.debug) {
      push();
      stroke(255, 255, 0, 100);
      strokeWeight(2);
      line(this.pos.x, this.pos.y, pointAhead.x, pointAhead.y);
      fill(255, 255, 0);
      noStroke();
      circle(pointAhead.x, pointAhead.y, 4);
      pop();
    }

    // Trouver l'obstacle le plus menaçant
    let obstacleProche = null;
    let distanceMin = Infinity;

    for (let obs of obstacles) {
      // Distances depuis les points ahead et la position
      let d1 = pointAhead.dist(obs.pos);
      let d2 = pointAhead2.dist(obs.pos);
      let d3 = this.pos.dist(obs.pos);
      let dMin = min(d1, d2, d3);

      if (dMin < distanceMin) {
        distanceMin = dMin;
        obstacleProche = obs;
      }
    }

    if (!obstacleProche) {
      return createVector(0, 0);
    }

    // Seuil de collision = rayon obstacle + marge
    let seuilCollision = obstacleProche.r + this.r + 15;

    if (distanceMin < seuilCollision) {
      // Calculer la force d'évitement
      let pointTest = distanceMin === pointAhead.dist(obstacleProche.pos) ? pointAhead : 
                      distanceMin === pointAhead2.dist(obstacleProche.pos) ? pointAhead2 : this.pos;
      
      let force = p5.Vector.sub(pointTest, obstacleProche.pos);
      
      // Force inversement proportionnelle à la distance
      let urgence = map(distanceMin, 0, seuilCollision, 3, 1);
      force.setMag(this.maxSpeed * urgence);
      force.sub(this.vel);
      force.limit(this.maxForce * urgence);

      if (Boid.debug) {
        push();
        stroke(255, 0, 255);
        strokeWeight(2);
        line(obstacleProche.pos.x, obstacleProche.pos.y, 
             obstacleProche.pos.x + force.x * 20, obstacleProche.pos.y + force.y * 20);
        pop();
      }

      return force;
    }

    return createVector(0, 0);
  }

  /**
   * Éviter tous les obstacles (version simplifiée avec fleeWithTargetRadius)
   * @param {Array} obstacles - Tableau d'obstacles
   */
  avoidObstacles(obstacles) {
    for (let obs of obstacles) {
      this.fleeWithTargetRadius(obs);
    }
  }

  // ============================================
  // COMPORTEMENT : WANDER (Déambulation)
  // ============================================
  
  /**
   * Déambulation aléatoire avec cercle de wander
   * @returns {p5.Vector} Force de wander
   */
  wander() {
    // Point devant le véhicule (centre du cercle de wander)
    let centreCercleDevant = this.vel.copy();
    centreCercleDevant.setMag(this.distanceCercle);
    centreCercleDevant.add(this.pos);

    if (Boid.debug) {
      push();
      // Cercle rouge au centre
      fill(255, 0, 0);
      noStroke();
      circle(centreCercleDevant.x, centreCercleDevant.y, 8);

      // Cercle de wander
      noFill();
      stroke(255);
      circle(centreCercleDevant.x, centreCercleDevant.y, this.wanderRadius * 2);

      // Ligne vers le centre
      stroke(255, 100);
      line(this.pos.x, this.pos.y, centreCercleDevant.x, centreCercleDevant.y);
      pop();
    }

    // Point sur le cercle
    let wanderAngle = this.vel.heading() + this.wanderTheta;
    let pointSurCercle = createVector(
      this.wanderRadius * cos(wanderAngle), 
      this.wanderRadius * sin(wanderAngle)
    );
    pointSurCercle.add(centreCercleDevant);

    if (Boid.debug) {
      push();
      fill(0, 255, 0);
      noStroke();
      circle(pointSurCercle.x, pointSurCercle.y, 8);
      
      stroke(255, 255, 0);
      line(this.pos.x, this.pos.y, pointSurCercle.x, pointSurCercle.y);
      pop();
    }

    // Calculer la force
    let desiredSpeed = p5.Vector.sub(pointSurCercle, this.pos);
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.setMag(this.maxForce);

    // Varier l'angle aléatoirement
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    return force;
  }

  // ============================================
  // COMPORTEMENT : BOUNDARIES (Confinement)
  // ============================================
  
  /**
   * Rester dans une zone rectangulaire
   * Effet miroir comme au billard
   */
  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;

    const xBordGauche = bx + d;
    const xBordDroite = bx + bw - d;
    const yBordHaut = by + d;
    const yBordBas = by + bh - d;

    if (this.pos.x < xBordGauche) {
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > xBordDroite) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < yBordHaut) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > yBordBas) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }

    if (vitesseDesiree !== null) {
      vitesseDesiree.setMag(this.maxSpeed);
      const force = p5.Vector.sub(vitesseDesiree, this.vel);
      force.limit(this.maxForce);
      return force;
    }

    if (Boid.debug) {
      push();
      noFill();
      stroke(255);
      rect(bx, by, bw, bh);
      stroke(255, 0, 0, 100);
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
      pop();
    }

    return createVector(0, 0);
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  
  /**
   * Réapparition de l'autre côté du canvas
   */
  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
    } else if (this.pos.x < 0) {
      this.pos.x = width;
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
    } else if (this.pos.y < 0) {
      this.pos.y = height;
    }
  }

  /**
   * Trouver le boid le plus proche
   */
  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche = null;

    for (let v of vehicules) {
      if (v !== this) {
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    }

    return vehiculeLePlusProche;
  }

  /**
   * Appliquer une force au boid
   */
  applyForce(force) {
    this.acc.add(force);
  }

  /**
   * Mise à jour position et vitesse
   */
  update() {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.acc.mult(0);
  }

  /**
   * Affichage du boid
   */
  show() {
    if (this.image) {
      push();
      imageMode(CENTER);
      translate(this.pos.x, this.pos.y);
      // Rotation vers la direction + PI car l'image peut être inversée
      rotate(this.vel.heading() + PI);
      image(this.image, 0, 0, this.r, this.r);
      pop();
    } else {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading());
      
      // Triangle
      fill(this.color);
      stroke(255);
      strokeWeight(1);
      triangle(-this.r, -this.r/2, -this.r, this.r/2, this.r, 0);
      pop();
    }
    
    // Cercle de perception en mode debug
    if (Boid.debug) {
      push();
      noFill();
      stroke(255, 50);
      circle(this.pos.x, this.pos.y, this.perceptionRadius * 2);
      pop();
    }
  }
}
