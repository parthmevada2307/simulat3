let angleSlider, velocitySlider;
let angleValue = 45;
let velocityValue = 50;
let explosionSound;
let selectedObject = "car";
let objectImages = {};
let g = 9.8;
let startX, startY;
let previousAngle, previousVelocity;
let trajectoryPoints = [];
let isMoving = false;
let stars = [];
const STAR_COUNT = 200;
let LAYER_LIMITS;
let crossedTroposphere = false;
let crossedStratosphere = false;
let crossedMesosphere = false;
let crossedThermosphere = false;
let crossedExosphere = false;
let explosionFrame = 0;
let explosionTimer = 0;
let explosionParticles = [];
let explosionDuration = 60; // frames
let launcherY, launcherTargetY;

let launcherVisible = false;
let launcherState = "hidden"; // "rising", "ready"
let showLaunchButton = false;
let vehicleOnLauncher = false;
let moonX, moonY;
let moonGravityRadius = 100;
let inMoonGravity = false;
let orbitAngle = 0;
let orbitRadius = 0;
let orbitCounter = 0;
let landingPhase = false;
let landingSpeed = 0.3;
let showStatusTable = false;
let tableButton;

let explosionImg;
let hasExploded = false;
let moonImg;

let objectLayerCrossings = {
  car: new Set(),
  plane: new Set(),
  rocket: new Set(),
  iss: new Set()
};

function preload() {
  moonImg = loadImage("moon1-removebg-preview (1)-1.png");
  objectImages["iss"] = loadImage("ISS-removebg-preview.png");
  explosionImg = loadImage("explosion.jpg");
  objectImages["car"] = loadImage("car-removebg-preview.png");
  objectImages["plane"] = loadImage("aeroplane-removebg-preview.png");
  objectImages["rocket"] = loadImage("rocket-removebg-preview.png");
  explosionSound = loadSound("explosion-42132.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight + 100);
  
  startX = 50;
  startY = height - 100;
  launcherY = height + 100;         // Start off-screen
  launcherTargetY = height - 80;
 LAYER_LIMITS = {
  ground: height,
  troposphere: height * (1 - 0.05),
  stratosphere: height * (1 - 0.35),
  mesosphere: height * (1 - 0.55),
  thermosphere: height * (1 - 0.70),
  exosphere: height * (1 - 0.85)
};
LAYER_LIMITS.space = height * (1 - 0.40);  // Match the new Space layer starting Y



  createButtons();
  createSliders();
  updateVelocitySlider();

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: random(width), y: random(0, startY - 200) });
  }

  initializeBall();
  previousAngle = angleValue;
  previousVelocity = velocityValue;
}

let objectButtons = [];

function createButtons() {
  for (let btn of objectButtons) btn.remove();
  objectButtons = [];

  let objectX = windowWidth - 160;
  let objectStartY = height * 0.3;
  let spacing = 60;

  const iconMap = {
    "🚗": "car",
    "✈️": "plane",
    "🚀": "rocket",
    "🛰️": "iss"
  };

  for (let [icon, obj] of Object.entries(iconMap)) {
    let btn = createButton('');
    btn.position(objectX, objectStartY);
    btn.size(140, 50);
    btn.style('background-color', '#ffffff');
    btn.style('color', '#000000');
    btn.style('font-size', '18px');
    btn.style('display', 'flex');
    btn.style('align-items', 'center');
    btn.style('justify-content', 'left');
    btn.style('gap', '10px');
    btn.style('padding-left', '10px');
    btn.style('font-weight', 'bold');
    btn.html(`<span style="font-size:30px;">${icon}</span><span style="font-size:14px;">${obj.toUpperCase()}</span>`);
    btn.attribute('data-object', obj);

    btn.mousePressed(() => {
      userStartAudio();
      selectedObject = obj;

      // Reset simulation state
      isMoving = false;
      inMoonGravity = false;
      orbitCounter = 0;
      landingPhase = false;
      fireParticles = [];
      trajectoryPoints = [];
      hasExploded = false;
      redBlink = true;
      greenBlink = false;
      vehicleOnLauncher = false;

      updateVelocitySlider();  // ✅ adjust slider limits
      initializeBall();
      ball.x = startX;
      ball.y = startY;

     if (selectedObject === "rocket" || selectedObject === "iss") {
  launcherY = height + 100;
  launcherVisible = true;
  launcherState = "rising";
  redBlink = true;
  greenBlink = false;
  vehicleOnLauncher = false;
  showLaunchButton = false;
  launchButton.hide();
  goButton.hide();
}
 else {
        launcherVisible = false;
        launcherState = "hidden";
        vehicleOnLauncher = false;
        launchButton.hide();
        goButton.show();
      }
    });

    objectButtons.push(btn);
    objectStartY += spacing;
  }

 let buttonSpacing = 50;
let buttonStartY = objectStartY + 20; // below last icon

resetButton = createButton("🔁");
resetButton.position(objectX, buttonStartY);
resetButton.size(60, 40);
resetButton.style('font-size', '18px');
resetButton.style('background-color', '#ffcccc');
resetButton.style('font-weight', 'bold');
resetButton.mousePressed(resetSimulation);

launchButton = createButton("Launch");
launchButton.position(90, height - 50);
launchButton.size(100, 40);
launchButton.style('font-size', '18px');
launchButton.style('background-color', '#ccffcc');
launchButton.hide();
launchButton.mousePressed(() => {
  if (!isMoving && greenBlink && vehicleOnLauncher) {
    let angle = radians(angleValue);
    ball.vx = velocityValue * cos(angle);
    ball.vy = -velocityValue * sin(angle);
    isMoving = true;
    vehicleOnLauncher = false;
    showLaunchButton = false;
    launchButton.hide();
  }
});

goButton = createButton("Go");
goButton.position(120, height - 50);
goButton.size(100, 40);
goButton.style('font-size', '18px');
goButton.style('background-color', '#ccf');
goButton.hide();
goButton.mousePressed(() => {
  if (!isMoving && (selectedObject === "car" || selectedObject === "plane")) {
    let angle = radians(angleValue);
    ball.vx = velocityValue * cos(angle);
    ball.vy = -velocityValue * sin(angle);
    isMoving = true;
    goButton.hide();
  }
});

}
function updateValues() {
  angleValue = angleSlider.value();
  velocityValue = velocitySlider.value();

  if ((selectedObject === "rocket" || selectedObject === "iss") && launcherState === "vehicleReady") {
    let angleChanged = angleValue !== 45;
    let velocityChanged = velocityValue !== 50;

    if (angleChanged && velocityChanged) {
      launcherState = "readyToLaunch";
      redBlink = false;
      greenBlink = true;
      showLaunchButton = true;
      launchButton.show();
    }
  }

  if (angleValue !== previousAngle || velocityValue !== previousVelocity) {
    initializeBall();
    previousAngle = angleValue;
    previousVelocity = velocityValue;
  }
}

function resetSimulation() {
  isMoving = false;
  inMoonGravity = false;
  orbitCounter = 0;
  landingPhase = false;
  fireParticles = [];
  trajectoryPoints = [];
  hasExploded = false;
  redBlink = true;
  greenBlink = false;
  vehicleOnLauncher = false;

  ball.x = startX;
  ball.y = startY;
  ball.vx = 0;
  ball.vy = 0;
  ball.ay = g;

  explosionParticles = [];

  angleValue = 45;
  velocityValue = 50;
  angleSlider.value(angleValue);
  velocitySlider.value(velocityValue);
  previousAngle = angleValue;
  previousVelocity = velocityValue;

  if (selectedObject === "rocket" || selectedObject === "iss") {
  launcherY = height + 100;
  launcherVisible = true;
  launcherState = "rising";
  redBlink = true;
  greenBlink = false;
  vehicleOnLauncher = false;
  showLaunchButton = false;
  launchButton.hide();
  goButton.hide();
}
else {
    launcherVisible = false;
    launcherState = "hidden";
    launchButton.hide();
    goButton.show();
  }

  objectLayerCrossings[selectedObject] = new Set();
}

function createIconButtonWithPosition(iconText, x, y, callback) {
  let btn = createButton(iconText);
  btn.position(x, y);
  btn.style("font-size", "24px");
  btn.style("width", "50px");
  btn.style("height", "50px");

  btn.mousePressed(() => {
    userStartAudio(); // Important to enable sound
    callback();        // Call the original logic
  });

  return btn;
}


function createSliders() {
  angleSlider = createSlider(0, 90, 45);
  angleSlider.position(width - 100, startY + 20);
  angleSlider.style('width', '150px');
  angleSlider.input(updateValues);

  velocitySlider = createSlider(0, 200, 50);
  velocitySlider.position(100, 100);
  velocitySlider.style('width', '200px');
  velocitySlider.input(updateValues);
  angleSlider.style('width', '100px');     // Increase width
velocitySlider.style('width', '50px');  // Increase width

}

let ball;
function initializeBall() {
  ball = { x: startX, y: startY, vx: 0, vy: 0, ax: 0, ay: g };
  hasExploded = false;
  explosionFrame = 0;
  explosionTimer = 0;
  trajectoryPoints = [];
  isMoving = false;
  inMoonGravity = false;
  landingPhase = false;
  objectLayerCrossings[selectedObject] = new Set();
}


function updateValues() {
  angleValue = angleSlider.value();
  velocityValue = velocitySlider.value();
  if (angleValue !== previousAngle || velocityValue !== previousVelocity) {
    initializeBall();
    previousAngle = angleValue;
    previousVelocity = velocityValue;
  }
}

function updateVelocitySlider() {
  let maxVelocity;
  if (selectedObject === "car") maxVelocity = 50;
  else if (selectedObject === "plane") maxVelocity = 100;
  else if (selectedObject === "rocket" || selectedObject === "iss") maxVelocity = 200;

  velocitySlider.attribute("max", maxVelocity);
  if (velocityValue > maxVelocity) {
    velocityValue = maxVelocity;
    velocitySlider.value(maxVelocity);
  }
}
function createSliders() {
  angleSlider = createSlider(0, 90, 45);
  angleSlider.position(width - 220, startY + 20);
  angleSlider.style('width', '150px');
  angleSlider.input(updateValues);

  velocitySlider = createSlider(0, 50, 10);  // Use fixed range 0–50 m/s
  velocitySlider.position(width - 220, startY + 60);
  velocitySlider.style('width', '200px');
  velocitySlider.input(updateValues);
}

function draw() {
  background(0);

  // 🌍 Sky and Earth
  drawAtmosphericLayers();
  noStroke();
  fill(139, 69, 19);
  rect(0, height - 100, width, 100);
  drawStars();
  drawMoon();

  // 🚀 Launcher movement
  handleLauncherSequence();

  // 🛩️ Vehicle physics
  if (isMoving) {
  if (!hasExploded) {
    trajectoryPoints.push({ x: ball.x, y: ball.y });
  }

  if (selectedObject === "rocket" || selectedObject === "iss") {
    handleRocketAndISSPhysics();
  } else {
    handleCarPlanePhysics();
  }
}


  // ✏️ Visuals in order
  drawTrajectory();
  drawFire();
  drawSliderLabels();
drawCurrentSliderValue();


  updateAndDrawExplosion();  // 💥 Show explosion after crash
  drawLauncher();   // ➤ Draw pad/tower under vehicle
  drawObject();     // ➤ Vehicle drawn last, on top of launcher
}
function drawSliderLabels() {
  fill(0);
  textSize(12);
  noStroke();

  // Angle slider labels
  

  // Speed labels in km/h
  let minKmH = 0;
  let maxKmH = 180;
  if (selectedObject === "car") maxKmH = 180;
  else if (selectedObject === "plane") maxKmH = 900;
  else if (selectedObject === "rocket") maxKmH = 28800;
  else if (selectedObject === "iss") maxKmH = 27600;

  
}

function drawCurrentSliderValue() {
  fill(0);
  noStroke();
  textSize(14);
  textAlign(CENTER, CENTER);

  // Velocity (convert m/s to km/h)
  let kmh = Math.round(velocityValue * 3.6);
  let valX = velocitySlider.x + map(velocityValue, 0, 50, 0, velocitySlider.width);
  let valY = velocitySlider.y - 15;
  text(kmh + " km/h", valX, valY);

  // Angle (in degrees)
  let angleX = angleSlider.x + map(angleValue, 0, 90, 0, angleSlider.width);
  let angleY = angleSlider.y - 15;
  text(angleValue + "°", angleX, angleY);
}


function drawLauncher() {
  if (!launcherVisible) return;

  let towerHeight = 40;
  let padOffset = 30;

  // 🚀 Tower body
  fill(100);
  rect(startX - 15, launcherY, 30, towerHeight);

  // 🚀 Launch pad base
  fill(80);
  rect(startX - 25, launcherY + padOffset, 50, 8);

  // 🚨 Blinking status light
  if (frameCount % 30 < 15) {
    fill(redBlink ? "red" : greenBlink ? "lime" : "gray");
    ellipse(startX, launcherY + padOffset + 4, 10);
  }
}
function handleLauncherSequence() {
  if (launcherState === "rising") {
    launcherY -= 2;
    if (launcherY <= launcherTargetY) {
      launcherY = launcherTargetY;
      launcherState = "vehicleReady";

      // Vehicle now appears automatically
      initializeBall();
      ball.x = startX;
      ball.y = launcherY - 20;
      ball.vx = 0;
      ball.vy = 0;
      vehicleOnLauncher = true;
      redBlink = true;
      greenBlink = false;
      showLaunchButton = false;
      launchButton.hide();
    }
  }

  if (launcherState === "vehicleReady") {
    let angleChanged = angleValue !== 45;
    let velocityChanged = velocityValue !== 50;

    if (angleChanged && velocityChanged) {
      launcherState = "readyToLaunch";
      redBlink = false;
      greenBlink = true;
      showLaunchButton = true;
      launchButton.show();
    }
  }
}

function handleRocketAndISSPhysics() {
  if (angleValue === 0 && velocityValue > 0) {
    isMoving = false;
    return;
  }
  if (angleValue === 0 && velocityValue === 0) return;

  let distToMoon = dist(ball.x, ball.y, moonX, moonY);

  // 🚀 ROCKET LOGIC
  if (selectedObject === "rocket") {
    if (angleValue === 90) {
      // Launch straight upward
      ball.y += ball.vy * 0.1;
      ball.vy += ball.ay * 0.1;
      return;
    }

    if (distToMoon < moonGravityRadius && !inMoonGravity) {
      inMoonGravity = true;
      orbitRadius = distToMoon;
      orbitAngle = atan2(ball.y - moonY, ball.x - moonX);
      orbitCounter = 0;
      landingPhase = false;
    }

    if (inMoonGravity && !landingPhase) {
      orbitAngle += 0.03;
      orbitCounter += 0.03;
      if (orbitCounter > 3 * TWO_PI) orbitRadius -= 0.15;

      ball.x = moonX + orbitRadius * cos(orbitAngle);
      ball.y = moonY + orbitRadius * sin(orbitAngle);
      if (orbitRadius <= 60) landingPhase = true;
    } else if (landingPhase) {
      if (orbitRadius > 40) {
        orbitRadius -= landingSpeed;
        ball.x = moonX + orbitRadius * cos(orbitAngle);
        ball.y = moonY + orbitRadius * sin(orbitAngle);
      } else {
        inMoonGravity = false;
        isMoving = false;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = moonX + 40 * cos(orbitAngle);
        ball.y = moonY + 40 * sin(orbitAngle);
      }
    } else {
      ball.x += ball.vx * 0.1;
      ball.vy += ball.ay * 0.1;
      ball.y += ball.vy * 0.1;

      if (ball.y >= startY && !hasExploded) {
        createExplosion(ball.x, ball.y);
        hasExploded = true;
        explosionSound.play();
      }

     if (ball.y < LAYER_LIMITS.interstellar) {

        ball.vy = 0;
        ball.ay = 0;
      }
    }
  }

  // 🛰 ISS LOGIC
  if (selectedObject === "iss") {
    if (ball.y > LAYER_LIMITS.thermosphere) {
      // Keep going up
      ball.x += ball.vx * 0.1;
      ball.vy += ball.ay * 0.1;
      ball.y += ball.vy * 0.1;

      if (ball.y >= startY && !hasExploded) {
        createExplosion(ball.x, ball.y);
        hasExploded = true;
        explosionSound.play();
      }
    } else {
      // At thermosphere or above → horizontal orbit
      ball.vy = 0;
      ball.ay = 0;
      ball.y = LAYER_LIMITS.thermosphere; // lock height
      ball.vx = 5;
      ball.x += ball.vx;

      if (ball.x >= width) {
        isMoving = false;
        ball.x = width;
      }
    }
  }
}

function toggleObjectButtons(enabled) {
  for (let btn of objectButtons) {
    btn.attribute("disabled", !enabled);
  }
}

function handleCarPlanePhysics() {
  if (angleValue === 0 && velocityValue === 0) return;  // ⛔ Don't move or explode

  // 🛻 Straight horizontal run
  if ((selectedObject === "car" || selectedObject === "plane") && angleValue === 0 && velocityValue > 0) {
    ball.vx = velocityValue;
    ball.vy = 0;
    ball.ay = 0;
    ball.x += ball.vx * 0.1;

    if (ball.x >= width) {
      isMoving = false;
    }
    return; // No explosion
  }

  // 🧭 Normal arc trajectory
  ball.x += ball.vx * 0.1;
  ball.vy += ball.ay * 0.1;
  ball.y += ball.vy * 0.1;

  // ✈ Plane stays level at cruising altitude
  if (selectedObject === "plane" && ball.y < height * 0.55) {
    ball.vy = 0;
    ball.ay = 0;
    ball.vx = 10;
  }

  // 💥 Crash only if falling
  if (ball.y >= startY && !hasExploded) {
    createExplosion(ball.x, ball.y);
    hasExploded = true;
    explosionSound.play();
  }
}


function drawObject() {
  if (hasExploded) return; // Hide vehicle after explosion

  let img = objectImages[selectedObject];
  imageMode(CENTER);
  let imgWidth = 60, imgHeight = 60;
  if (selectedObject === "rocket") {
    imgWidth = 40;
    imgHeight = 40;
  } else if (selectedObject === "iss") {
    imgWidth = 80;
    imgHeight = 40;
  }
  image(img, ball.x, ball.y, imgWidth, imgHeight);
}

function drawTrajectory() {
  noFill();
  stroke(150);
  beginShape();
  for (let point of trajectoryPoints) vertex(point.x, point.y);
  endShape();
}

function drawAxes() {
  

}

function drawStars() {
  fill(255);
  noStroke();
  for (let star of stars) ellipse(star.x, star.y, 2, 2);
}

function drawAtmosphericLayers() {
  let layerColors = [
    { name: "Ground", colorBottom: color(139, 69, 19), colorTop: color(139, 69, 19), heightRatio: 0.05 },
    { name: "Troposphere", colorBottom: color(180, 220, 255), colorTop: color(100, 180, 255), heightRatio: 0.30 },
    { name: "Stratosphere", colorBottom: color(100, 180, 255), colorTop: color(80, 130, 200), heightRatio: 0.20 },
    { name: "Mesosphere", colorBottom: color(80, 130, 200), colorTop: color(120, 100, 200), heightRatio: 0.15 },
    { name: "Thermosphere", colorBottom: color(120, 100, 200), colorTop: color(20, 40, 80), heightRatio: 0.15 },
    { name: "Exosphere", colorBottom: color(20, 40, 80), colorTop: color(0, 0, 0), heightRatio: 0.10 },
    { name: "Space", colorBottom: color(0, 0, 0), colorTop: color(0), heightRatio: 0.05 }
  ];

  let yStart = height;
  for (let layer of layerColors) {
    let layerHeight = height * layer.heightRatio;
    let gradient = drawingContext.createLinearGradient(0, yStart - layerHeight, 0, yStart);
    gradient.addColorStop(0, layer.colorTop.toString());
    gradient.addColorStop(1, layer.colorBottom.toString());
    drawingContext.fillStyle = gradient;
    noStroke();
    rect(0, yStart - layerHeight, width, layerHeight);
    fill(255);
    textSize(16);
    text(layer.name, 60, yStart - layerHeight + 20);
    yStart -= layerHeight;
  }
}

function drawMoon() {
  moonX = width / 1.3;
  moonY = height * 0.06;
  let moonSize = 150;
  imageMode(CENTER);
  image(moonImg, moonX, moonY, moonSize, moonSize);
}

function displaySliderLabels() {
  fill(255);
  noStroke();
  textSize(14);
  text("Angle: " + angleValue + "°", angleSlider.x, angleSlider.y + 5);
  text("Velocity: " + velocityValue + " m/s", velocitySlider.x, velocitySlider.y + 5);
}

function trackLayerCrossings() {
  for (let [layer, limit] of Object.entries(LAYER_LIMITS)) {
  if (ball.y <= limit) {
    objectLayerCrossings[selectedObject].add(layer);
  }
}

}

function drawLayerTable() {
  if (!showStatusTable) return;

  const tableX = width - 350;  // Beside icon buttons
  const tableY = height / 2 - 110;
  const rowHeight = 30;
  const col1X = tableX + 10;
  const col2X = tableX + 130;

  // Background box
  fill(0, 0, 50, 200);
  stroke(255);
  strokeWeight(1.5);
  rect(tableX, tableY, 180, rowHeight * 8 + 10, 10);  // instead of *7


  noStroke();
  fill(255);

  // Header: Vehicle Icon
  let icon = "❓";
  if (selectedObject === "car") icon = "🚗";
  else if (selectedObject === "plane") icon = "✈";
  else if (selectedObject === "rocket") icon = "🚀";
  else if (selectedObject === "iss") icon = "🛰";

  textSize(16);
  textAlign(LEFT, CENTER);
  text(`Vehicle: ${icon}`, col1X, tableY + rowHeight / 2);


  // Table Headings
  textSize(14);
  textStyle(BOLD);
  text("Layer", col1X, tableY + rowHeight * 1.5);
  text("Crossed", col2X - 13, tableY + rowHeight * 1.5);
  textStyle(NORMAL);

  const layerNames = ["troposphere", "stratosphere", "mesosphere", "thermosphere", "exosphere", "interstellar"];
const displayNames = ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere", "Exosphere", "Interstellar"];


  for (let i = 0; i < layerNames.length; i++) {
    const layer = layerNames[i];
    const label = displayNames[i];
    const crossed = objectLayerCrossings[selectedObject].has(layer);

    let y = tableY + rowHeight * (2.5 + i);
    fill(255);
    text(label, col1X, y);
    fill(crossed ? "lime" : "red");
    text(crossed ? "✓" : "✗", col2X, y);
  }
}
function createExplosion(x, y) {
  explosionParticles = [];
  for (let i = 0; i < 100; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 6);
    explosionParticles.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      alpha: 255,
      size: random(4, 8),
      color: [random(200, 255), random(50, 150), 0]
    });
  }
}

function updateAndDrawExplosion() {
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    let p = explosionParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 4;
    if (p.alpha <= 0) {
      explosionParticles.splice(i, 1);
      continue;
    }

    fill(p.color[0], p.color[1], p.color[2], p.alpha);
    noStroke();
    ellipse(p.x, p.y, p.size);
  }
}

let fireParticles = [];

function drawFire() {
  noStroke();
  for (let i = fireParticles.length - 1; i >= 0; i--) {
    let p = fireParticles[i];
    if (p.type === "rocket") fill(255, random(140, 180), 0, p.alpha); // soft yellow-orange
    else if (p.type === "ion") fill(100, 200, 255, p.alpha); // faint blue for ISS

    ellipse(p.x, p.y, p.r);
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 2;
    if (p.alpha <= 0) fireParticles.splice(i, 1);
  }

  // 🔥 ROCKET SMALL, THIN FLAME — only when NOT orbiting and NOT landing
  if (isMoving && selectedObject === "rocket" && !inMoonGravity && !landingPhase) {
    for (let i = 0; i < 2; i++) {
      fireParticles.push({
        x: ball.x + random(-1, 1),
        y: ball.y + 20,
        vx: random(-0.3, 0.3),
        vy: random(1.2, 2),
        alpha: 160,
        r: random(3, 5),
        type: "rocket"
      });
    }
  }

  // 🛰️ ISS - faint thruster spark
  if (isMoving && selectedObject === "iss") {
    if (frameCount % 3 === 0) {
      fireParticles.push({
        x: ball.x,
        y: ball.y + 15,
        vx: 0,
        vy: 0.5,
        alpha: 100,
        r: random(1.5, 2.5),
        type: "ion"
      });
    }
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  startY = height - 100;
}