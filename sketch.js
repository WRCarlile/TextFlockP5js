var flock;
var boids = [];
var textInput;
var colorRand;
var nameP;
var textChange = false;
var wordValue = [];

function setup() {
    createCanvas(500, 500);
    // Create Dom Elements -RC
    nameP = createP("Enter Text Here").addClass('text').position(750, 483);
    textInput = createInput('').addClass('text').position(600, 500);
    
    textInput.changed(updateText);
    createP("Text Flock").position(200, 740);
    createP("Based on Craig Reynold's and Daniel Shiffman's boids program to simulate the flocking of birds").position(200, 760);
    flock = new Flock();
}

function draw() {
    background(255);
    flock.run();

    //Resets the Array When there are Too Many Boids -RC

    if (wordValue.length > 20) {
        wordValue = [];
        boids = [];
    }
}
// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
    // An array for all the boids
    this.boids = []; // Initialize the array
}

Flock.prototype.run = function() {
    for (var i = 0; i < this.boids.length; i++) {
        this.boids[i].run(this.boids); // Passing the entire list of boids to each boid individually
    }
}

Flock.prototype.addBoid = function(b) {
    this.boids.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
    this.acceleration = createVector(2, 4);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.r = 3.0;
    this.maxspeed = 1; // Maximum speed
    this.maxforce = 0.01; // Maximum steering force
}

Boid.prototype.run = function(boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
}

Boid.prototype.applyForce = function(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids) {
    var sep = this.separate(boids); // Separation

    var ali = this.align(boids); // Alignment
    var coh = this.cohesion(boids); // Cohesion
    // Arbitrarily weight these forces
    sep.mult(mouseY);
    // ali.mult(mouseY);
    // coh.mult(mouseX);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    // this.applyForce(ali);
    // this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
    var desired = p5.Vector.sub(target, mouseY); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    var steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
}

Boid.prototype.render = function() {
    //Changed the Render to Text Input -RC
    if (textChange === true && wordValue.length < 20) {
        for (i = 0; i < wordValue.length; i++) {
            var theta = this.velocity.heading() + radians(90);
            translate(mouseX, mouseY);
            rotate(theta);
            text(wordValue[i], this.position.x, this.position.y);
        }
    }
}

//Clear the Input after Text is Entered -RC
function keyReleased() {
    if (keyCode == ENTER) {
        textInput.value("");
        nameP.value("");
    }
}

//New Boids Created from Text and Split into Characters -RC
function updateText() {
    flock.addBoid(new Boid(50, 50));
    textChange = true;
    textInput.html(textInput.value());
    nameP.html(textInput.value());
    var texts = selectAll('.text');
    for (var i = 0; i < texts.length; i++) {
        var word = texts[i].html();
        var chars = word.split("");
        for (var j = 0; j < chars.length; j++) {
            wordValue.push(chars[j]);
        }
    }
}


// Wraparound
Boid.prototype.borders = function() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
    var desiredseparation = 2.0;
    var steer = createVector(0, 0);
    var count = 0;
    // For every boid in the system, check if it's too close
    for (var i = 0; i < boids.length; i++) {
        var d = p5.Vector.dist(this.position, boids[i].position);
        // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ((d > 0) && (d < desiredseparation)) {
            // Calculate vector pointing away from neighbor
            var diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d); // Weight by distance
            steer.add(diff);
            count++; // Keep track of how many
        }
    }
    // Average -- divide by how many
    if (count > 0) {
        steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
    }
    return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
    var neighbordist = 10;
    var sum = createVector(0, 0);
    var count = 0;
    for (var i = 0; i < boids.length; i++) {
        var d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        var steer = p5.Vector.sub(sum, this.velocity);
        steer.limit(this.maxforce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
    var neighbordist = 10;
    var sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    var count = 0;
    for (var i = 0; i < boids.length; i++) {
        var d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].position); // Add location
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        return this.seek(sum); // Steer towards the location
    } else {
        return createVector(0, 0);
    }
}
