// Classe SnakeSegment - un anneau du serpent
class SnakeSegment extends Vehicle {
  constructor(x, y, snakeColor, size) {
    super(x, y);
    this.r = size;
    this.snakeColor = snakeColor;
  }

  show() {
    push();
    // Dessiner l'anneau avec effet 3D
    let darkColor = lerpColor(this.snakeColor, color(0), 0.3);
    let lightColor = lerpColor(this.snakeColor, color(255), 0.3);
    
    // Ombre
    fill(0, 50);
    noStroke();
    circle(this.pos.x + 2, this.pos.y + 2, this.r * 2);
    
    // Corps principal
    fill(this.snakeColor);
    stroke(darkColor);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);
    
    // Reflet
    fill(lightColor);
    noStroke();
    circle(this.pos.x - this.r * 0.2, this.pos.y - this.r * 0.2, this.r * 0.5);
    pop();
  }
}

// Classe SnakeEntity - un serpent complet avec plusieurs segments (Snake.io style)
class SnakeEntity {
  constructor(x, y, length, snakeColor) {
    this.segments = [];
    this.snakeColor = snakeColor || color(random(100, 255), random(100, 255), random(100, 255));
    this.length = length || 10;
    this.segmentSize = 14;
    this.followDistance = 20; // Distance entre segments
    this.name = "";
    
    // Pattern pour le snake (bandes)
    this.hasPattern = random() > 0.5;
    this.patternColor = lerpColor(this.snakeColor, color(255), 0.4);

    // Créer les segments
    for (let i = 0; i < this.length; i++) {
      let segColor = this.hasPattern && i % 3 === 0 ? this.patternColor : this.snakeColor;
      let segment = new SnakeSegment(
        x - i * 15, 
        y, 
        segColor,
        max(8, this.segmentSize - i * 0.15) // Taille minimale
      );
      this.segments.push(segment);
    }
  }

  // La tête suit une cible
  followTarget(targetPos) {
    if (this.segments.length > 0) {
      let head = this.segments[0];
      let steeringForce = head.arrive(targetPos);
      head.applyForce(steeringForce);
    }
  }

  update() {
    // Mettre à jour la tête
    if (this.segments.length > 0) {
      this.segments[0].update();
    }

    // Chaque segment suit le précédent
    for (let i = 1; i < this.segments.length; i++) {
      let current = this.segments[i];
      let previous = this.segments[i - 1];
      let steeringForce = current.arrive(previous.pos, this.followDistance);
      current.applyForce(steeringForce);
      current.update();
    }
  }

  // Dessiner les lignes entre segments puis les segments
  show() {
    // Dessiner le corps comme un tube continu
    push();
    strokeCap(ROUND);
    strokeJoin(ROUND);
    
    // Dessiner le tube principal (plusieurs passes pour l'effet 3D)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < this.segments.length; i++) {
        let prev = this.segments[i - 1];
        let curr = this.segments[i];
        
        let segSize = curr.r * 2;
        
        if (pass === 0) {
          // Ombre
          stroke(0, 80);
          strokeWeight(segSize + 4);
          line(prev.pos.x + 3, prev.pos.y + 3, curr.pos.x + 3, curr.pos.y + 3);
        } else {
          // Corps principal
          let segColor = this.hasPattern && i % 3 === 0 ? this.patternColor : this.snakeColor;
          stroke(segColor);
          strokeWeight(segSize);
          line(prev.pos.x, prev.pos.y, curr.pos.x, curr.pos.y);
        }
      }
    }
    pop();

    // Dessiner les reflets sur le corps
    push();
    noStroke();
    for (let i = 1; i < this.segments.length; i += 2) {
      let seg = this.segments[i];
      fill(255, 50);
      circle(seg.pos.x - seg.r * 0.3, seg.pos.y - seg.r * 0.3, seg.r * 0.4);
    }
    pop();

    // Dessiner la tête
    if (this.segments.length > 0) {
      this.drawHead(this.segments[0]);
    }
    
    // Dessiner la queue (pointe)
    if (this.segments.length > 1) {
      this.drawTail();
    }
  }
  
  // Dessiner la queue pointue
  drawTail() {
    let last = this.segments[this.segments.length - 1];
    let prev = this.segments[this.segments.length - 2];
    
    let dir = p5.Vector.sub(last.pos, prev.pos);
    dir.normalize();
    
    push();
    let tailEnd = p5.Vector.add(last.pos, p5.Vector.mult(dir, last.r));
    
    // Queue pointue
    stroke(this.snakeColor);
    strokeWeight(last.r);
    strokeCap(ROUND);
    line(last.pos.x, last.pos.y, tailEnd.x, tailEnd.y);
    pop();
  }

  // Dessiner la tête du snake (Snake.io style)
  drawHead(head) {
    push();
    translate(head.pos.x, head.pos.y);
    
    // Calculer l'angle vers la cible (direction du mouvement)
    let angle = head.vel.mag() > 0.1 ? head.vel.heading() : 0;
    
    // Tête plus grande
    let headSize = head.r * 1.4;
    
    // Ombre de la tête
    fill(0, 60);
    noStroke();
    ellipse(3, 3, headSize * 2.4, headSize * 2);
    
    // Tête principale (ovale)
    fill(this.snakeColor);
    stroke(lerpColor(this.snakeColor, color(0), 0.3));
    strokeWeight(2);
    ellipse(0, 0, headSize * 2.4, headSize * 2);
    
    // Reflet sur la tête
    fill(255, 80);
    noStroke();
    ellipse(-headSize * 0.3, -headSize * 0.4, headSize * 0.8, headSize * 0.5);
    
    // Langue (toujours visible, ondulante)
    push();
    rotate(angle);
    let tongueWave = sin(frameCount * 0.3) * 3;
    stroke(255, 50, 50);
    strokeWeight(3);
    strokeCap(ROUND);
    // Partie principale
    line(headSize * 0.8, 0, headSize * 1.6, tongueWave);
    // Fourche
    line(headSize * 1.6, tongueWave, headSize * 2, tongueWave - 5);
    line(headSize * 1.6, tongueWave, headSize * 2, tongueWave + 5);
    pop();
    
    // Yeux (style cartoon)
    let eyeOffsetX = headSize * 0.35;
    let eyeOffsetY = -headSize * 0.1;
    let eyeSize = headSize * 0.55;
    let pupilSize = eyeSize * 0.5;
    
    // Direction vers le curseur (utiliser l'angle de mouvement)
    let pupilOffset = eyeSize * 0.15;
    let dirX = cos(angle) * pupilOffset;
    let dirY = sin(angle) * pupilOffset;
    
    // Œil gauche
    fill(255);
    stroke(0);
    strokeWeight(1);
    ellipse(-eyeOffsetX, eyeOffsetY, eyeSize, eyeSize * 1.2);
    fill(0);
    noStroke();
    circle(-eyeOffsetX + dirX * 0.5, eyeOffsetY + dirY * 0.5, pupilSize);
    // Reflet
    fill(255);
    circle(-eyeOffsetX + dirX * 0.3 - 1, eyeOffsetY + dirY * 0.3 - 2, pupilSize * 0.3);
    
    // Œil droit
    fill(255);
    stroke(0);
    strokeWeight(1);
    ellipse(eyeOffsetX, eyeOffsetY, eyeSize, eyeSize * 1.2);
    fill(0);
    noStroke();
    circle(eyeOffsetX + dirX * 0.5, eyeOffsetY + dirY * 0.5, pupilSize);
    // Reflet
    fill(255);
    circle(eyeOffsetX + dirX * 0.3 - 1, eyeOffsetY + dirY * 0.3 - 2, pupilSize * 0.3);
    
    pop();
  }

  // Position de la tête
  getHeadPos() {
    return this.segments.length > 0 ? this.segments[0].pos : createVector(0, 0);
  }

  // Couper le snake à un certain index et retourner les segments coupés
  cutAt(index) {
    if (index < 1 || index >= this.segments.length) return [];
    let cutSegments = this.segments.splice(index);
    this.length = this.segments.length;
    return cutSegments;
  }
}

// ==================== ENEMY SNAKE (Snake Ordinateur) ====================
class EnemySnake extends SnakeEntity {
  constructor(x, y, length, snakeColor) {
    super(x, y, length, snakeColor || color(random(150, 255), random(50, 100), random(50, 100)));
    
    // Attributs aléatoires pour chaque snake ennemi
    this.perceptionRadius = random(100, 300); // Champ de perception
    this.wanderAngle = random(TWO_PI); // Angle de wander
    this.wanderRadius = random(30, 80); // Rayon du cercle de wander
    this.wanderDistance = random(50, 100); // Distance du cercle de wander
    this.wanderChange = random(0.2, 0.6); // Vitesse de changement de direction
    
    // Vitesse et agilité aléatoires
    this.baseSpeed = random(2, 5);
    this.agility = random(0.2, 0.5);
    this.aggressiveness = random(0.3, 0.9); // Probabilité de poursuivre vs wander
    
    // Appliquer la vitesse aux segments
    this.segments.forEach(seg => {
      seg.maxSpeed = this.baseSpeed;
      seg.maxForce = this.agility;
    });
    
    // État
    this.currentTarget = null;
    this.state = "wander"; // wander, chase, flee
    this.score = 0; // Score de l'ennemi
  }

  // Comportement Wander (errance) avec limites du monde
  wander(worldW, worldH) {
    // Calculer le point sur le cercle de wander
    this.wanderAngle += random(-this.wanderChange, this.wanderChange);
    
    let head = this.segments[0];
    
    // Centre du cercle de wander (devant le snake)
    let wanderCenter = head.vel.copy();
    if (wanderCenter.mag() < 0.1) {
      wanderCenter = p5.Vector.fromAngle(random(TWO_PI));
    }
    wanderCenter.setMag(this.wanderDistance);
    wanderCenter.add(head.pos);
    
    // Point sur le cercle
    let wanderPoint = createVector(
      cos(this.wanderAngle) * this.wanderRadius,
      sin(this.wanderAngle) * this.wanderRadius
    );
    wanderPoint.add(wanderCenter);
    
    // Rester dans le monde (avec marge de sécurité)
    let margin = 150;
    let ww = worldW || width;
    let wh = worldH || height;
    wanderPoint.x = constrain(wanderPoint.x, margin, ww - margin);
    wanderPoint.y = constrain(wanderPoint.y, margin, wh - margin);
    
    // Éviter les bordures - force de répulsion
    let headPos = head.pos;
    if (headPos.x < margin * 2) wanderPoint.x += 100;
    if (headPos.x > ww - margin * 2) wanderPoint.x -= 100;
    if (headPos.y < margin * 2) wanderPoint.y += 100;
    if (headPos.y > wh - margin * 2) wanderPoint.y -= 100;
    
    return wanderPoint;
  }

  // Détecter les cibles dans le champ de perception
  perceive(playerSnake, foodTargets, worldW, worldH) {
    let headPos = this.getHeadPos();
    
    // Vérifier si le joueur est dans le champ de perception
    let playerHead = playerSnake.getHeadPos();
    let distToPlayer = dist(headPos.x, headPos.y, playerHead.x, playerHead.y);
    
    // Décider du comportement basé sur la taille relative
    let playerSize = playerSnake.segments.length;
    let mySize = this.segments.length;
    
    if (distToPlayer < this.perceptionRadius) {
      if (mySize > playerSize + 2 && random() < this.aggressiveness) {
        // Plus grand que le joueur - chasser
        this.state = "chase";
        this.currentTarget = playerHead.copy();
        return;
      } else if (mySize < playerSize - 2) {
        // Plus petit - fuir
        this.state = "flee";
        let fleeDir = p5.Vector.sub(headPos, playerHead);
        fleeDir.setMag(200);
        this.currentTarget = p5.Vector.add(headPos, fleeDir);
        // Contraindre dans le monde
        this.currentTarget.x = constrain(this.currentTarget.x, 100, (worldW || 3000) - 100);
        this.currentTarget.y = constrain(this.currentTarget.y, 100, (worldH || 3000) - 100);
        return;
      }
    }
    
    // Chercher de la nourriture
    let closestFood = null;
    let closestDist = this.perceptionRadius;
    
    for (let food of foodTargets) {
      let d = dist(headPos.x, headPos.y, food.pos.x, food.pos.y);
      if (d < closestDist) {
        closestDist = d;
        closestFood = food;
      }
    }
    
    if (closestFood) {
      this.state = "chase";
      this.currentTarget = closestFood.pos.copy();
    } else {
      this.state = "wander";
      this.currentTarget = this.wander(worldW, worldH);
    }
  }

  // Mise à jour avec comportement IA
  updateAI(playerSnake, foodTargets, worldW, worldH) {
    this.perceive(playerSnake, foodTargets, worldW, worldH);
    
    if (this.currentTarget) {
      this.followTarget(this.currentTarget);
    }
    
    this.update();
  }

  // Dessiner avec le champ de perception (si debug)
  show() {
    // Dessiner le champ de perception en mode debug
    if (Vehicle.debug) {
      push();
      noFill();
      stroke(255, 0, 0, 50);
      strokeWeight(1);
      circle(this.getHeadPos().x, this.getHeadPos().y, this.perceptionRadius * 2);
      pop();
    }
    
    super.show();
  }

  // Ajouter un segment (quand mange de la nourriture)
  addSegment() {
    let lastSegment = this.segments[this.segments.length - 1];
    let newSegment = new SnakeSegment(
      lastSegment.pos.x,
      lastSegment.pos.y,
      this.snakeColor,
      this.segmentSize - this.segments.length * 0.2
    );
    newSegment.maxSpeed = this.baseSpeed;
    newSegment.maxForce = this.agility;
    this.segments.push(newSegment);
    this.length++;
  }
}

// Classe GridVehicle - véhicule simple pour le mode grid (ex-Snake)
class GridVehicle extends Vehicle {
  constructor(x, y, target, index) {
    super(x, y);
    this.target = target;
    this.index = index;
    this.r = 12;
    this.hasArrived = false;
    this.arrivalThreshold = 5;
  }

  checkArrival() {
    let distance = p5.Vector.dist(this.pos, this.target.pos);
    if (distance < this.arrivalThreshold) {
      this.hasArrived = true;
    } else {
      this.hasArrived = false;
    }
    return this.hasArrived;
  }

  followTarget() {
    let steeringForce = this.arrive(this.target.pos);
    this.applyForce(steeringForce);
  }

  show() {
    push();
    stroke(0);
    strokeWeight(2);
    fill(255);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}
