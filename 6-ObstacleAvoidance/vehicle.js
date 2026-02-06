/**
 * Fonction utilitaire : Calcule la projection orthogonale du point a sur le vecteur b
 */
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

/**
 * Classe Vehicle - Classe de base pour tous les véhicules autonomes
 * Implémente les comportements de steering : seek, flee, arrive, avoid, wander, separation, etc.
 */
class Vehicle {
  static debug = false;

  constructor(x, y) {
    // Position du véhicule
    this.pos = createVector(x, y);
    // Vitesse du véhicule
    this.vel = createVector(random(-1, 1), random(-1, 1));
    // Accélération du véhicule
    this.acc = createVector(0, 0);
    
    // Paramètres de mouvement
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    
    // Apparence
    this.color = "white";
    this.r_pourDessin = 16;
    // Rayon pour l'évitement (cercle englobant)
    this.r = this.r_pourDessin * 3;

    // Zone d'évitement devant le véhicule
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    
    // Distance du vecteur "ahead" pour l'évitement
    this.aheadDistance = 50;

    // Chemin (trainée) derrière le véhicule
    this.path = [];
    this.pathMaxLength = 30;

    // Paramètres pour le comportement Wander
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = random(TWO_PI);
    this.displaceRange = 0.3;

    // Poids pour les différents comportements
    this.seekWeight = 0.3;
    this.avoidWeight = 3;
    this.separateWeight = 0.5;
    this.boundariesWeight = 2;
    this.wanderWeight = 1;
  }

  /**
   * Méthode à redéfinir dans les sous-classes
   */
  applyBehaviors() {
    // Implémenté dans les sous-classes
  }

  // ============================================
  // COMPORTEMENT : AVOID (Évitement d'obstacles)
  // ============================================
  
  /**
   * Évitement d'obstacles simple avec deux vecteurs ahead
   * Version améliorée qui utilise ahead et ahead2 pour une meilleure détection
   */
  avoid(obstacles) {
    // Vecteur ahead principal (regarde loin devant)
    let ahead = this.vel.copy();
    ahead.setMag(this.aheadDistance);
    
    // Vecteur ahead2 (moitié de la distance) pour meilleure détection
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    // Points au bout des vecteurs ahead
    let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);
    let pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2);

    if (Vehicle.debug) {
      // Dessiner les vecteurs ahead
      this.drawVector(this.pos, ahead, color(255, 255, 0));
      this.drawVector(this.pos, ahead2, color(255, 165, 0));
      
      // Zone d'évitement (corridor)
      push();
      stroke(100, 100, 100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
      pop();
    }

    // Trouver l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
    
    if (obstacleLePlusProche === undefined) {
      return createVector(0, 0);
    }

    // Calculer les distances depuis les trois points de test
    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    let distance3 = this.pos.dist(obstacleLePlusProche.pos);
    
    // Prendre la distance minimale
    let minDist = min(distance1, distance2, distance3);

    if (Vehicle.debug) {
      // Afficher les points de test
      fill(255, 0, 0);
      noStroke();
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
      fill(0, 0, 255);
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 8);
    }

    // Seuil de collision
    let seuilCollision = obstacleLePlusProche.r + this.r/2;

    if (minDist < seuilCollision) {
      // Collision possible ! Feedback visuel
      obstacleLePlusProche.setColliding(true);
      
      // Déterminer quel point utiliser pour le calcul de la force
      let pointUtilise;
      if (minDist === distance1) {
        pointUtilise = pointAuBoutDeAhead;
      } else if (minDist === distance2) {
        pointUtilise = pointAuBoutDeAhead2;
      } else {
        pointUtilise = this.pos;
      }

      // Force d'évitement : du centre de l'obstacle vers le point de test
      let force = p5.Vector.sub(pointUtilise, obstacleLePlusProche.pos);
      
      if (Vehicle.debug) {
        this.drawVector(obstacleLePlusProche.pos, force, color(255, 255, 0));
      }
      
      // Limiter la force
      force.setMag(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
      
      return force;
    } else {
      // Pas de collision
      obstacleLePlusProche.setColliding(false);
      return createVector(0, 0);
    }
  }

  /**
   * Version améliorée de l'évitement qui prend en compte les autres véhicules
   * Les véhicules sont considérés comme des obstacles dynamiques
   */
  avoidAvecVehicules(obstacles, vehicules) {
    // Vecteurs ahead
    let ahead = this.vel.copy();
    ahead.setMag(this.aheadDistance);
    
    let ahead2 = this.vel.copy();
    ahead2.setMag(this.aheadDistance * 0.5);

    let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);
    let pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2);

    if (Vehicle.debug) {
      this.drawVector(this.pos, ahead, color(255, 255, 0));
      this.drawVector(this.pos, ahead2, color(255, 165, 0));
    }

    // Trouver l'obstacle et le véhicule les plus proches
    let obstacleLePlusProche1 = this.getClosestObstacle(pointAuBoutDeAhead, obstacles);
    let obstacleLePlusProche2 = this.getClosestObstacle(pointAuBoutDeAhead2, obstacles);
    let obstacleLePlusProche3 = this.getClosestObstacle(this.pos, obstacles);
    let vehiculeLePlusProche = this.getVehiculeLePlusProche(vehicules);

    // Calculer les distances
    let distance1 = obstacleLePlusProche1 ? pointAuBoutDeAhead.dist(obstacleLePlusProche1.pos) : Infinity;
    let distance2 = obstacleLePlusProche2 ? pointAuBoutDeAhead2.dist(obstacleLePlusProche2.pos) : Infinity;
    let distance3 = obstacleLePlusProche3 ? this.pos.dist(obstacleLePlusProche3.pos) : Infinity;
    let distance4 = vehiculeLePlusProche ? this.pos.dist(vehiculeLePlusProche.pos) : Infinity;

    // Déterminer quel obstacle/point utiliser
    let pointUtilise;
    let obstacleCible;
    let distanceMin = min(distance1, distance2, distance3, distance4);

    if (distance1 === distanceMin && obstacleLePlusProche1) {
      pointUtilise = pointAuBoutDeAhead;
      obstacleCible = obstacleLePlusProche1;
    } else if (distance2 === distanceMin && obstacleLePlusProche2) {
      pointUtilise = pointAuBoutDeAhead2;
      obstacleCible = obstacleLePlusProche2;
    } else if (distance3 === distanceMin && obstacleLePlusProche3) {
      pointUtilise = this.pos;
      obstacleCible = obstacleLePlusProche3;
    } else if (vehiculeLePlusProche) {
      // L'obstacle le plus proche est un véhicule
      pointUtilise = this.pos;
      // Créer un pseudo-obstacle à partir du véhicule
      obstacleCible = { pos: vehiculeLePlusProche.pos, r: vehiculeLePlusProche.r };
      distanceMin = distance4;
    } else {
      return createVector(0, 0);
    }

    if (Vehicle.debug) {
      fill(255, 0, 0);
      noStroke();
      circle(pointUtilise.x, pointUtilise.y, 12);
    }

    // Vérifier collision
    let seuilCollision = obstacleCible.r + this.largeurZoneEvitementDevantVaisseau;

    if (distanceMin < seuilCollision) {
      // Force d'évitement
      let force = p5.Vector.sub(pointUtilise, obstacleCible.pos);
      
      if (Vehicle.debug) {
        this.drawVector(obstacleCible.pos, force, color(255, 255, 0));
      }
      
      force.setMag(this.maxForce);
      return force;
    }

    return createVector(0, 0);
  }

  /**
   * Version avec prédiction de position future des véhicules
   * Amélioration : anticipe où seront les autres véhicules
   */
  avoidAvecPrediction(obstacles, vehicules, predictionFrames = 10) {
    let ahead = this.vel.copy();
    ahead.setMag(this.aheadDistance);
    
    let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);

    // Pour les véhicules, on prédit leur position future
    let vehiculeLePlusProche = null;
    let distanceMin = Infinity;

    for (let v of vehicules) {
      if (v !== this) {
        // Position prédite du véhicule
        let posFuture = p5.Vector.add(v.pos, p5.Vector.mult(v.vel, predictionFrames));
        let d = this.pos.dist(posFuture);
        
        if (d < distanceMin) {
          distanceMin = d;
          vehiculeLePlusProche = { pos: posFuture, r: v.r, original: v };
        }
      }
    }

    // Combiner avec évitement d'obstacles classique
    let forceObstacles = this.avoid(obstacles);
    let forceVehicules = createVector(0, 0);

    if (vehiculeLePlusProche && distanceMin < vehiculeLePlusProche.r + this.r) {
      forceVehicules = p5.Vector.sub(this.pos, vehiculeLePlusProche.pos);
      forceVehicules.setMag(this.maxForce);
    }

    // Combiner les forces
    let forceTotale = p5.Vector.add(forceObstacles, forceVehicules);
    forceTotale.limit(this.maxForce);
    
    return forceTotale;
  }

  /**
   * AMÉLIORATION MAJEURE: avoidAmeliore 
   * Utilise 3 points de détection qui s'adaptent à la vitesse du véhicule
   * - ahead : regarde loin devant (adapté à la vitesse)
   * - ahead2 : point intermédiaire
   * - position actuelle du véhicule
   * Plus le véhicule va vite, plus il regarde loin devant
   */
  avoidAmeliore(obstacles) {
    // Distance de détection adaptée à la vitesse
    let speedFactor = map(this.vel.mag(), 0, this.maxSpeed, 0.5, 1.5);
    let dynamicAheadDistance = this.aheadDistance * speedFactor;
    
    // Vecteur ahead principal (adapté à la vitesse)
    let ahead = this.vel.copy();
    ahead.setMag(dynamicAheadDistance);
    
    // Vecteur ahead2 (2/3 de la distance)
    let ahead2 = ahead.copy();
    ahead2.mult(0.66);
    
    // Vecteur ahead3 (1/3 de la distance)
    let ahead3 = ahead.copy();
    ahead3.mult(0.33);

    // Points au bout des vecteurs
    let point1 = p5.Vector.add(this.pos, ahead);
    let point2 = p5.Vector.add(this.pos, ahead2);
    let point3 = p5.Vector.add(this.pos, ahead3);

    if (Vehicle.debug) {
      // Dessiner les 3 vecteurs ahead
      this.drawVector(this.pos, ahead, color(255, 255, 0));
      this.drawVector(this.pos, ahead2, color(255, 200, 0));
      this.drawVector(this.pos, ahead3, color(255, 150, 0));
      
      // Zone d'évitement (corridor) avec opacité croissante
      push();
      noFill();
      stroke(255, 255, 0, 50);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, point1.x, point1.y);
      pop();
      
      // Afficher la distance de détection
      fill(255);
      noStroke();
      textSize(10);
      text("Ahead: " + dynamicAheadDistance.toFixed(0), this.pos.x + 20, this.pos.y - 20);
    }

    // Trouver l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
    
    if (!obstacleLePlusProche) {
      return createVector(0, 0);
    }

    // Calculer les distances depuis les 4 points de test
    let dist1 = point1.dist(obstacleLePlusProche.pos);
    let dist2 = point2.dist(obstacleLePlusProche.pos);
    let dist3 = point3.dist(obstacleLePlusProche.pos);
    let dist4 = this.pos.dist(obstacleLePlusProche.pos);
    
    // Trouver le point le plus proche de l'obstacle
    let distances = [
      { point: point1, dist: dist1, name: "ahead" },
      { point: point2, dist: dist2, name: "ahead2" },
      { point: point3, dist: dist3, name: "ahead3" },
      { point: this.pos, dist: dist4, name: "position" }
    ];
    
    distances.sort((a, b) => a.dist - b.dist);
    let closest = distances[0];

    if (Vehicle.debug) {
      // Points de test avec couleurs différentes
      fill(255, 0, 0);
      circle(point1.x, point1.y, 8);
      fill(255, 128, 0);
      circle(point2.x, point2.y, 6);
      fill(255, 200, 0);
      circle(point3.x, point3.y, 4);
    }

    // Seuil de collision adaptatif (plus large si on va vite)
    let seuilCollision = obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau * speedFactor;

    if (closest.dist < seuilCollision) {
      // Collision possible !
      obstacleLePlusProche.setColliding(true);
      
      // Force d'évitement proportionnelle à la proximité
      let urgence = map(closest.dist, 0, seuilCollision, 2, 0.5);
      
      let force = p5.Vector.sub(closest.point, obstacleLePlusProche.pos);
      
      if (Vehicle.debug) {
        this.drawVector(obstacleLePlusProche.pos, force, color(0, 255, 255));
        // Afficher l'urgence
        fill(255, 0, 0);
        textSize(12);
        text("URGENCE: " + urgence.toFixed(2), obstacleLePlusProche.pos.x, obstacleLePlusProche.pos.y - obstacleLePlusProche.r - 10);
      }
      
      // Limiter la force avec le facteur d'urgence
      force.setMag(this.maxSpeed * urgence);
      force.sub(this.vel);
      force.limit(this.maxForce * urgence);
      
      return force;
    } else {
      obstacleLePlusProche.setColliding(false);
      return createVector(0, 0);
    }
  }

  /**
   * Évitement dynamique des autres véhicules
   * Utilise la position future prédite des véhicules
   */
  avoidVehiculesDynamique(vehicules, predictionFrames = 15) {
    let force = createVector(0, 0);
    let count = 0;
    
    // Distance de détection adaptée à la vitesse
    let speedFactor = map(this.vel.mag(), 0, this.maxSpeed, 0.5, 1.5);
    let detectionRadius = this.r * 3 * speedFactor;
    
    for (let v of vehicules) {
      if (v !== this) {
        // Prédire où sera l'autre véhicule
        let posFuture = p5.Vector.add(v.pos, p5.Vector.mult(v.vel, predictionFrames));
        let d = this.pos.dist(posFuture);
        
        // Si dans la zone de détection
        if (d < detectionRadius + v.r) {
          // Force de répulsion
          let diff = p5.Vector.sub(this.pos, posFuture);
          diff.normalize();
          diff.div(max(d, 1)); // Éviter division par zéro
          force.add(diff);
          count++;
          
          if (Vehicle.debug) {
            // Dessiner la position future prédite
            push();
            stroke(255, 0, 255, 100);
            strokeWeight(1);
            noFill();
            circle(posFuture.x, posFuture.y, v.r);
            // Ligne de prédiction
            stroke(255, 0, 255, 50);
            line(v.pos.x, v.pos.y, posFuture.x, posFuture.y);
            pop();
          }
        }
      }
    }
    
    if (count > 0) {
      force.div(count);
      force.setMag(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
    }
    
    return force;
  }

  // ============================================
  // COMPORTEMENT : WANDER (Déambulation)
  // ============================================
  
  wander() {
    // Point devant le véhicule (centre du cercle de wander)
    let pointDevant = this.vel.copy();
    pointDevant.setMag(this.distanceCercle);
    pointDevant.add(this.pos);

    if (Vehicle.debug) {
      push();
      // Cercle rouge au centre
      fill(255, 0, 0);
      noStroke();
      circle(pointDevant.x, pointDevant.y, 8);

      // Cercle de wander
      noFill();
      stroke(255);
      strokeWeight(1);
      circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2);

      // Ligne vers le centre du cercle
      stroke(255, 255, 255, 80);
      strokeWeight(2);
      drawingContext.setLineDash([5, 15]);
      line(this.pos.x, this.pos.y, pointDevant.x, pointDevant.y);
      drawingContext.setLineDash([]);
      pop();
    }

    // Point sur le cercle (cible du wander)
    let theta = this.wanderTheta + this.vel.heading();
    let pointSurLeCercle = createVector(
      this.wanderRadius * cos(theta),
      this.wanderRadius * sin(theta)
    );
    pointSurLeCercle.add(pointDevant);

    if (Vehicle.debug) {
      push();
      // Point vert sur le cercle
      fill(0, 255, 0);
      noStroke();
      circle(pointSurLeCercle.x, pointSurLeCercle.y, 16);

      // Ligne vers le point cible
      stroke(255, 255, 0);
      strokeWeight(1);
      line(this.pos.x, this.pos.y, pointSurLeCercle.x, pointSurLeCercle.y);
      pop();
    }

    // Variation aléatoire de l'angle
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    // Calculer la force de wander
    let force = p5.Vector.sub(pointSurLeCercle, this.pos);
    force.setMag(this.maxForce);

    return force;
  }

  // ============================================
  // COMPORTEMENT : SEEK, FLEE, ARRIVE
  // ============================================
  
  seek(target, arrival = false) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    }
    
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    
    return force;
  }

  arrive(target) {
    return this.seek(target, true);
  }

  flee(target) {
    return this.seek(target).mult(-1);
  }

  pursue(vehicle) {
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10);
    target.add(prediction);
    
    if (Vehicle.debug) {
      fill(0, 255, 0);
      noStroke();
      circle(target.x, target.y, 16);
    }
    
    return this.seek(target);
  }

  evade(vehicle) {
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1);
    return pursuit;
  }

  // ============================================
  // COMPORTEMENT : BOUNDARIES (Rester dans le canvas)
  // ============================================
  
  boundaries(bx, by, bw, bh, d = 50) {
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

    if (Vehicle.debug) {
      push();
      noFill();
      stroke(255);
      strokeWeight(1);
      rect(bx, by, bw, bh);
      stroke(255, 0, 0, 100);
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
      pop();
    }

    return createVector(0, 0);
  }

  // Réapparition de l'autre côté du canvas
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }

  // ============================================
  // COMPORTEMENT : SEPARATION
  // ============================================
  
  separate(boids) {
    let desiredSeparation = this.r * 1.5;
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of boids) {
      let d = p5.Vector.dist(this.pos, other.pos);
      
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // Poids inversement proportionnel à la distance
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }

    if (steer.mag() > 0) {
      steer.setMag(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  
  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = Infinity;
    let obstacleLePlusProche = undefined;

    for (let o of obstacles) {
      const distance = this.pos.dist(o.pos);
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    }

    return obstacleLePlusProche;
  }

  getClosestObstacle(pos, obstacles) {
    let closestObstacle = null;
    let closestDistance = Infinity;
    
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    
    return closestObstacle;
  }

  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche = undefined;

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

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // Mise à jour de la vitesse
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    
    // Mise à jour de la position
    this.pos.add(this.vel);
    
    // Reset de l'accélération
    this.acc.set(0, 0);

    // Mise à jour de la trainée
    this.ajoutePosAuPath();
  }

  ajoutePosAuPath() {
    this.path.push(this.pos.copy());
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  show() {
    this.drawPath();
    this.drawVehicle();
  }

  drawVehicle() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Triangle du véhicule
    stroke(255);
    strokeWeight(2);
    fill(this.color);
    triangle(
      -this.r_pourDessin, -this.r_pourDessin / 2,
      -this.r_pourDessin, this.r_pourDessin / 2,
      this.r_pourDessin, 0
    );

    pop();

    // Cercle englobant en mode debug
    if (Vehicle.debug) {
      push();
      stroke(255, 100);
      noFill();
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, this.r * 2);
      pop();
    }
  }

  drawPath() {
    if (this.path.length < 2) return;
    
    push();
    noFill();
    strokeWeight(2);
    
    // Dessiner la trainée avec dégradé d'opacité
    for (let i = 1; i < this.path.length; i++) {
      let alpha = map(i, 0, this.path.length, 0, 200);
      stroke(red(color(this.color)), green(color(this.color)), blue(color(this.color)), alpha);
      
      let p1 = this.path[i - 1];
      let p2 = this.path[i];
      line(p1.x, p1.y, p2.x, p2.y);
    }
    
    pop();
  }

  drawVector(pos, v, col) {
    push();
    strokeWeight(2);
    stroke(col);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    
    // Flèche au bout
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    let arrowSize = 6;
    fill(col);
    noStroke();
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }
}
