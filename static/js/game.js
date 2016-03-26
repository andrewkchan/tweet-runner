var SCRIPT_VERSION = "105";

var canvas;
var context;
var enemies = [];
var decorations = [];
var me;
var KeyBulletin;

var score = 0;

var acorn_image;
var retweet_image;

var UP = 38;
var CANVAS_WIDTH = 0;
var CANVAS_HEIGHT = 0;
var GRAVITY = 900;
var GROUNDSPEED = -150;
var JUMPSPEED = -550;


var lastTweetAuthor;
var lastTweetText;
var lastTweetFavorites = 0;
var lastTweetRetweets = 0;
var lastTweets = [];
var tweetTimeRemaining = 0;
var DEFAULT_TWEET_TIME = 1500; //MILLISECONDS before fade-out

var entities;
var numEntitiesToLoad = 0;
var numEntitiesLoaded = 0;
var gameRunning = false;

var lastTime;

 
 
$(document).ready(function() {
  main();
})
 
function KB() {
  this.pressed = {};
}
 
KB.prototype.isPressed = function(keyCode) {
  return this.pressed[keyCode];
}
 
KB.prototype.onKeyDown = function(event) {
  this.pressed[event.keyCode] = true;
}
 
KB.prototype.onKeyUp = function(event) {
  this.pressed[event.keyCode] = false;
}
 
//ANIMATION CLASS --------------------------------------------------
var animationFrames = function(list, list_image_names) {
  for (i = 0; i < list_image_names.length; i++) {
    list.push($(list_image_names[i]).get(0));
  }
  return list;
}
 
var Animation = function(duration, list_image_names) {
  this.duration = duration;
  this.currentTime = 0.0;
  this.list_frames = animationFrames([], list_image_names);
}
 
Animation.prototype.update = function(dt) {
  //console.log("Animation updated with dt:" + dt + " Animation time before update:" + this.currentTime);
  this.currentTime += dt;
  this.currentTime %= this.duration;
}
 
Animation.prototype.getCurrentFrame = function() {
  //console.log("Animation time:" + this.currentTime + " Animation frame:" + Math.floor(this.currentTime/this.duration * this.list_frames.length) + " num frames:" + this.list_frames.length);
  return this.list_frames[Math.floor(this.currentTime/this.duration * this.list_frames.length)];
}
 
//DECORATION CLASS----------------------------
var Decoration = function(img) {
  this.image = $(img).get(0);
  this.x = CANVAS_WIDTH;
  this.y = 320;
  this.isAlive = true;
  this.velocity = 0.0;
}
Decoration.prototype.update = function(dt) {
  if(this.x < -this.image.width || this.x > CANVAS_WIDTH * 2)
  {
    this.isAlive = false;
  }
  this.x += GROUNDSPEED * (dt/1000);
  this.x += this.velocity * (dt/1000);
}
// ENEMY CLASS ------------------------------------------------
var Enemy = function(img) {
  this.image = $(img).get(0);
  this.x = CANVAS_WIDTH;
  this.y = CANVAS_HEIGHT;
  this.width = this.image.width;
  this.height = this.image.height;
  this.velocity = 0;
  this.velocityY = 0;
  this.isAlive = true;
  this.isGravityAffected = false;
}
 
Enemy.prototype.keepOnGround = function() {
  //asserts that player is on screen
  if (this.y + this.height >= CANVAS_HEIGHT)
  {
    this.y = CANVAS_HEIGHT - this.height;
  }
}
 
Enemy.prototype.isOnGround = function() {
  return (this.height + this.y) == CANVAS_HEIGHT;
}
 
Enemy.prototype.update = function(dt) {
  if (this.x < -this.image.width) {
    this.isAlive = false;
  }
  this.keepOnGround();
  if (this.isOnGround()) {
    this.x += GROUNDSPEED * (dt/1000);
    this.x += this.velocity * (dt/1000);
  }
  else {
    if(this.isGravityAffected)
    {
      this.velocityY += GRAVITY * (dt/1000);
      this.y += this.velocityY * (dt/1000);
    }
  }
}

Enemy.prototype.clone = function() {
  var output = new Enemy(this.image);
  output.x = this.x;
  output.y = this.y;
  output.width = this.width;
  output.height = this.height;
  output.velocity = this.velocity;
  output.velocityY = this.velocityY;
  output.isGravityAffected = this.isGravityAffected;
  return output;
}
 
//ACORN CLASS -------------------------------------
// var Acorn = function() {
//   this.image = $("acorn").get(0);
// }
 
// PLAYER CLASS -----------------------------------
var Player = function() {
  this.aliveAnim = new Animation(500, [".s1", ".s2", ".s3", ".s4", ".s5", ".s6", ".s7"]);
  this.deadAnim = new Animation(1, [".s1"]);
  this.currentAnim = this.aliveAnim;
  this.image = this.aliveAnim.list_frames[0];
 
  this.isAlive = true;
  this.velocity = 0;
  this.lives = 4;
 
  this.jumpSpeed = JUMPSPEED;
  this.width = 60;//this.image.width;
  this.height = 35;//this.image.height;
  this.y = CANVAS_HEIGHT - this.height;

  this.invincibility_time = DEFAULT_TWEET_TIME;
}
 
Player.prototype.keepOnGround = function() {
  //asserts that player is on screen
  if (this.y + this.height >= CANVAS_HEIGHT)
  {
    this.y = CANVAS_HEIGHT - this.height;
  }
}
 
Player.prototype.isOnGround = function() {
  return (this.height + this.y) == CANVAS_HEIGHT;
}
 
Player.prototype.isHittingEnemies = function(enemy) {
    // var left_x = 30;
    // var right_x = 30 + this.width;
    // return ((this.y > CANVAS_HEIGHT - enemy.height) && ((enemy.x < right_x) || (enemy.x > left_x)));
    return !((enemy.x > 30 + this.width || 30 > enemy.x + enemy.width || enemy.y > this.y + this.height || this.y > enemy.y + enemy.height));
}

Player.prototype.die = function() {
  if (this.lives == 0) {
    this.isAlive = false;
    GROUNDSPEED = 0.0;
  }
  else {
    this.lives -= 1
    this.y = 0;
    this.invincibility_time = DEFAULT_TWEET_TIME;
  }
}
 
Player.prototype.update = function(dt) {
  if (!this.isAlive) {
    this.currentAnim = this.deadAnim;
  }
  if (!this.isOnGround()) {
    this.velocity += GRAVITY * (dt/1000);
  }
 
  this.image = this.currentAnim.getCurrentFrame();
  this.currentAnim.update(dt);
  this.y += this.velocity * (dt/1000);
  this.keepOnGround();
  
  if(this.invincibility_time <= 0.0)
  {
    for (i = 0; i < enemies.length; i++) {
      if (this.isHittingEnemies(enemies[i])) {
        this.die();
      }
    }
  }
  else
  {
    this.invincibility_time -= dt;
  }
}

function resetCanvasDimensions()
{
  CANVAS_WIDTH = 0.9 * $(window).width();
  CANVAS_HEIGHT = 0.9 * $(window).height();
  console.log("window width:" + CANVAS_WIDTH);
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}
 
//MAIN BODY----------------------
function main() {
  console.log("main loaded");
  //var socket = io.connect("http://" + document.domain + ":" + location.port + "/test");
  var socket = io.connect();
  console.log("starting websocket connection");

  //send an explicit package to the server upon connection
  socket.on("connect",
    function(){
      console.log("Connection to WebSocket server being established");
      socket.emit("version_verification", {version: SCRIPT_VERSION});
    }
  );

  
  
  //receive entity list
  socket.on("transmit_entities",
    function(msg){
      getEntities(msg);
      socket.emit("entities_received");
    }
  );
  
  socket.on('new_tweet', 
    function(msg){
      //console.log("new tweet from WebSocket server received!");
      processTweet(msg);
    }
  );


  canvas = $(".animationCanvas").get(0);
  context = canvas.getContext("2d");

  resetCanvasDimensions();
  //CANVAS_HEIGHT = 400;
  //CANVAS_WIDTH = 800;

 
  me = new Player();
  KeyBulletin = new KB();
 
  acorn_image = $(".acorn").get(0);
  retweet_image = $(".retweet").get(0);

  window.addEventListener('keyup', function(event) {KeyBulletin.onKeyUp(event);}, false);
  window.addEventListener('keydown', function(event) {KeyBulletin.onKeyDown(event);}, false);

  setInterval(loop, 25);

}


function loop()
{
  var currentTime = Date.now();
  var elapsedTime = currentTime - lastTime;
  lastTime = currentTime;
  //console.log("loop running");
  if(gameRunning)
  {
    runGame(elapsedTime);
  }
  else
  {
    //draw loading screen
    if(elapsedTime === elapsedTime) //check if elapsedTime != NaN (something that is NaN is not equal to itself)
    {
      me.update(elapsedTime);
    }

    //draw canvas background
    context.fillStyle = "#1ABC9C";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.drawImage(me.image, CANVAS_WIDTH/2 - me.width/2, CANVAS_HEIGHT/2 - me.height/2);
    context.fillStyle = "#FFFFFF";
    context.font = "10pt 'Open Sans'";
    context.fillText("LOADING...", CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT/2 + me.height);
  }
}

function startGame()
{
  for(var keyword in entities)
  {
    if(entities.hasOwnProperty(keyword))
    {
      //reset enemies' dimensions to match with the images, which have finished loading
      entities[keyword].proto.height = entities[keyword].proto.image.height;
      entities[keyword].proto.width = entities[keyword].proto.image.width;
    }
  }
  console.log("game start");
  gameRunning = true;
}

function getEntities(data)
{
  entities = data;
  for(var keyword in entities)
  {
    if(entities.hasOwnProperty(keyword))
    {
      numEntitiesToLoad++;
      entities[keyword].image = new Image();
      console.log("Downloading image:" + entities[keyword].imageURL);
      entities[keyword].image.onload = function()
      {
        numEntitiesLoaded++;
        console.log("Finished downloading image:" + this.src);
        console.log("Number of downloads finished:" + numEntitiesLoaded + " out of " + numEntitiesToLoad);
        if(numEntitiesLoaded == numEntitiesToLoad)
        {
          startGame();
        }
      }
      entities[keyword].image.src = "../images/" + entities[keyword].imageURL;
      entities[keyword].proto = new Enemy(entities[keyword].image);
      entities[keyword].proto.velocity = parseFloat(entities[keyword].velocity);
      entities[keyword].proto.y = CANVAS_HEIGHT - parseFloat(entities[keyword].startingHeight);
      entities[keyword].isGravityAffected = (entities[keyword].gravity == 'yes' ? true : false);
    }
  }
}

function processTweet(data)
{
  lastTweetText = data.text;
  lastTweetAuthor = data.name;
  lastTweetFavorites = data.favorites;
  lastTweetRetweets = data.retweets;

  if(lastTweetText.length > 80)
  {
      lastTweetText = lastTweetText.slice(0, 70) + "\n" + lastTweetText.slice(70, lastTweetText.length);
  }
  tweetTimeRemaining = DEFAULT_TWEET_TIME;

  if(me.isAlive)
  {
    if (data.keyword == "acorn")
    {
      me.lives += 1;
    }
    else
    {
      enemies.push(entities[data.keyword].proto.clone());
      enemies[enemies.length - 1].x = CANVAS_WIDTH; //spawn at end of screen
    }
  }
}
 
function runGame(dt) {
  //console.log(context);
  //get user input, update objects, display all graphics
  if (me.isAlive) {
    if (KeyBulletin.isPressed(UP)) {
      if (me.isOnGround()) {
        me.velocity = me.jumpSpeed;
      }
    }
  }
 
  if (Math.random() < 0.008) {
    decorations.push(new Decoration(".background_tree"));
  }
  else if (Math.random() < 0.006) {
    decorations.push(new Decoration(".cloud"));
    decorations[decorations.length - 1].velocity = 40.0;
    decorations[decorations.length - 1].y -= 60.0 - 40.0 * (Math.random());
  }
  for(i = 0; i < decorations.length; i++) {
    decorations[i].update(dt);
  }
  for (i = 0; i < decorations.length; i++) {
    if (!(decorations[i].isAlive)) {
      decorations.splice(i, 1);
    }
  }
  for (i = 0; i < enemies.length; i++) {
    enemies[i].update(dt);
    }
  for (i = 0; i < enemies.length; i++) {
    if (!(enemies[i].isAlive)) {
      enemies.splice(i, 1);
    }
  }
  me.update(dt);

  if(me.isAlive)
  {
    score += 1;
  }
 
 
  //draw canvas background
  context.fillStyle = "#1ABC9C";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = "#FFFFFF";
  //display last tweet
  if(tweetTimeRemaining > 0 && lastTweetText != null && lastTweetAuthor != null)
  {
    var dispAlpha = (tweetTimeRemaining/DEFAULT_TWEET_TIME);
    context.globalAlpha = dispAlpha;
    tweetTimeRemaining -= dt;

    context.font = "bold 11pt 'Open Sans'";
    context.fillText(lastTweetAuthor, 100, 80);
    context.font = "10pt 'Open Sans'";
    context.fillText(lastTweetText, 100, 100);
    
    context.drawImage(retweet_image, 100, 120);
    context.fillText(lastTweetRetweets, 125, 130);
    context.globalAlpha = 1.0;
  }

  context.fillRect(0, 340, CANVAS_WIDTH, 1);
  
  for (i = 0; i < decorations.length; i++) {
    context.drawImage(decorations[i].image, decorations[i].x, decorations[i].y);
  }
  //display acorns
  for (i = 0; i < me.lives; i++) {
    context.drawImage(acorn_image, (i * 35), 10);
  }
  //display player
  if(me.invincibility_time > 0.0)
  {
    context.globalAlpha = Math.random();
    context.drawImage(me.image, 30, me.y);
    context.globalAlpha = 1.0;
  }
  else
  {
    context.drawImage(me.image, 30, me.y);
    //console.log("me:" + me.y);
  }
  
  //display enemies
  for (i = 0; i < enemies.length; i++) {
    context.drawImage(enemies[i].image, enemies[i].x, enemies[i].y);
  }
  
  //display score at top-right corner
  context.fillText(score, CANVAS_WIDTH - 100, 50);

  if(!me.isAlive)
  {
    context.font = "bold 30pt 'Open Sans'";
    context.fillText("u ded", 10, 60);
  }
}