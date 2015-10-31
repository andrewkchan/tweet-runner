var canvas;
var context;
var enemies = [];
var decorations = [];
var bullets = [];
var trojans = [];
var me;
var KeyBulletin;

var acorn_image;
var retweet_image;

var UP = 38;
var CANVAS_WIDTH = 0;
var CANVAS_HEIGHT = 0;
var GRAVITY = 400;
var GROUNDSPEED = -30;


var lastTweetAuthor;
var lastTweetText;
var lastTweetFavorites = 0;
var lastTweetRetweets = 0;
var lastTweets = [];
var tweetTimeRemaining = 0;
var DEFAULT_TWEET_TIME = 2000; //MILLISECONDS before fade-out
 
 
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
  this.currentTime += dt;
  this.currentTime %= this.duration;
}
 
Animation.prototype.getCurrentFrame = function() {
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
  if(this.x < -10)
  {
    this.isAlive = false;
  }
  this.x += GROUNDSPEED * (dt/200);
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
  this.isAlive = true;
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
  if (this.x < -10) {
    this.isAlive = false;
  }
  this.keepOnGround();
  if (this.isOnGround()) {
    this.x += GROUNDSPEED * (dt/200);
    this.x += this.velocity * (dt/1000);
  }
}
//TROJAN CLASS-----------------------------------------
var Trojan = function() {
  this.image = $(".trojan").get(0);
  this.x = CANVAS_WIDTH;
  this.y = CANVAS_HEIGHT;
  this.width = this.image.width;
  this.height = this.image.height;
  this.velocity = 0;
  this.isAlive = true;
}
 
Trojan.prototype.keepOnGround = function() {
  //asserts that player is on screen
  if (this.y + this.height >= CANVAS_HEIGHT)
  {
    this.y = CANVAS_HEIGHT - this.height;
  }
}
 
Trojan.prototype.isOnGround = function() {
  return (this.height + this.y) == CANVAS_HEIGHT;
}
 
Trojan.prototype.update = function(dt) {
  if (this.x < -10) {
    this.isAlive = false;
  }
  this.keepOnGround();
  if (this.isOnGround()) {
    this.x += GROUNDSPEED * (dt/200);
  }
  if(this.isAlive)
  {
    if(Math.random() < 0.005)
    {
      this.fire();
    }
  }
}
Trojan.prototype.fire = function() {
  bullets.push(new Bullet(this.x, this.y + 10));
}
//BULLET CLASS -------------------------------
var Bullet = function(x,y) {
  this.image = $(".bullet").get(0);
  this.x = x;
  this.y = y;
  this.width = this.image.width;
  this.height = this.image.height;
  this.velocityX = -300;
  this.isAlive = true;
}
 
Bullet.prototype.update = function(dt) {
  if (this.x < -10) {
    this.isAlive = false;
  }
  this.x += GROUNDSPEED * (dt/200);
  this.x += this.velocityX * (dt/800);
  
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
 
  this.jumpSpeed = -300;
  this.width = 60;//this.image.width;
  this.height = 35;//this.image.height;
  this.y = CANVAS_HEIGHT - this.height;
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
 
Player.prototype.update = function(dt) {
  if (!this.isAlive) {
    this.currentAnim = this.deadAnim;
  }
  if (!this.isOnGround()) {
    this.velocity += GRAVITY * (dt/1000);
  }
 
  this.image = this.currentAnim.getCurrentFrame();
  this.currentAnim.update(25);
  this.y += this.velocity * (dt/1000);
  this.keepOnGround();
 
  for (i = 0; i < enemies.length; i++) {
    if (this.isHittingEnemies(enemies[i])) {
      if (this.lives == 0) {
        this.isAlive = false;
        GROUNDSPEED = 0.0;
      }
      else {
        this.lives -= 1
        this.y = 0;
      }
    }
  }
  for (i = 0; i < trojans.length; i++) {
    if (this.isHittingEnemies(trojans[i])) {
      if (this.lives == 0) {
        this.isAlive = false;
        GROUNDSPEED = 0.0;
      }
      else {
        this.lives -= 1
        this.y = 0;
      }
    }
  }
  for (i = 0; i < bullets.length; i++) {
    if (this.isHittingEnemies(bullets[i])) {
      if (this.lives == 0) {
        this.isAlive = false;
        GROUNDSPEED = 0.0;
      }
      else {
        this.lives -= 1
        this.y = 0;
      }
    }
  }
}
 
//MAIN BODY----------------------
function main() {
  canvas = $(".animationCanvas").get(0);
  context = canvas.getContext("2d");

  CANVAS_WIDTH = 800;//canvas.width;
  CANVAS_HEIGHT = 400;//canvas.height;
 
  me = new Player();
  KeyBulletin = new KB();
 
  acorn_image = $(".acorn").get(0);
  retweet_image = $(".retweet").get(0);

  window.addEventListener('keyup', function(event) {KeyBulletin.onKeyUp(event);}, false);
  window.addEventListener('keydown', function(event) {KeyBulletin.onKeyDown(event);}, false);
  setInterval(loop, 25);
 
}

function readFeed(data, textStatus, jqXHR)
{
    //alert("success!");
    //data is a JSON formatted string with the format {"tweets":[list of tweets]}
    //each tweet has elements "name", "user", "url", "text", "retweets", "favorites"
    var usableData = JSON.parse(data);
    var tweets = usableData.tweets;
    for(i = 0; i < tweets.length; i++)
    {
        lastTweets.push(tweets[i]);
        console.log(lastTweets[lastTweets.length - 1].name);
    }
}
 
 
function loop() {
  //get user input, update objects, display all graphics
  if (me.isAlive) {
    if (KeyBulletin.isPressed(UP)) {
      if (me.isOnGround()) {
        me.velocity = me.jumpSpeed;
      }
    }
  }

  //-------------------READ TWEETS, update enemies------------------
    //$.getJSON("/query-tweet-stream", readFeed);
    
    $.ajax({
            type: "GET",
            url: "../request/",
            //contentType: "application/json; charset=utf-8",
            //data: { "echoValue": "echoText" },
            success: readFeed
        }); 

  if(lastTweets.length > 0 && tweetTimeRemaining <= 0)
  {
    var last = lastTweets.splice(0, 1)[0];
    lastTweetText = last.text;
    lastTweetAuthor = last.name;
    lastTweetFavorites = last.favorites;
    lastTweetRetweets = last.retweets;
    if(lastTweetText.length > 80)
    {
        lastTweetText = lastTweetText.slice(0, 70) + "\n" + lastTweetText.slice(70, lastTweetText.length);
    }
    tweetTimeRemaining = DEFAULT_TWEET_TIME;

    if(lastTweetText.indexOf("stanford") > -1 || lastTweetText.indexOf("Stanford") > -1)
    {
      enemies.push(new Enemy(".enemy1"));
    }
    else if(lastTweetText.indexOf("lawnmower") > -1 || lastTweetText.indexOf("Lawnmower") > -1)
    {
      enemies.push(new Enemy(".lawnmower"));
      enemies[enemies.length - 1].velocity = -100;
    }
    else if (lastTweetText.indexOf("midterm") > -1)
    {
      enemies.push(new Enemy(".failure"));
    }
    else if (lastTweetText.indexOf("fox news") > -1)
    {
      enemies.push(new Enemy(".foxnews"));
    }
    else if (lastTweetText.indexOf("usc") > -1 || lastTweetText.indexOf("USC") > -1)
    {
      trojans.push(new Trojan());
    }
    else if (lastTweetText.indexOf("acorn") > -1 || lastTweetText.indexOf("Acorn") > -1)
    {
      me.lives += 1;
    }
  }
    //------------------------------------------------
 
  if (Math.random() < 0.008) {
    decorations.push(new Decoration(".background_tree"));
  }
  else if (Math.random() < 0.006) {
    decorations.push(new Decoration(".cloud"));
    decorations[decorations.length - 1].velocity = 40.0;
    decorations[decorations.length - 1].y -= 60.0 - 40.0 * (Math.random());
  }
  for(i = 0; i < decorations.length; i++) {
    decorations[i].update(25);
  }
  for (i = 0; i < decorations.length; i++) {
    if (!(decorations[0].isAlive)) {
      decorations.splice(i, 1);
    }
  }
  for (i = 0; i < enemies.length; i++) {
    enemies[i].update(25);
    }
  for (i = 0; i < enemies.length; i++) {
    if (!(enemies[0].isAlive)) {
      enemies.splice(i, 1);
    }
  }
  for (i = 0; i < trojans.length; i++) {
    trojans[i].update(25);
    }
  for (i = 0; i < trojans.length; i++) {
    if (!(trojans[0].isAlive)) {
      trojans.splice(i, 1);
    }
  }
  for (i = 0; i < bullets.length; i++) {
    bullets[i].update(25);
    }
  for (i = 0; i < bullets.length; i++) {
    if (!(bullets[0].isAlive)) {
      bullets.splice(i, 1);
    }
  }
  me.update(25);
 
 
  //draw canvas background
  context.fillStyle = "#000000";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = "#FFFFFF";
  //display last tweet
  if(tweetTimeRemaining > 0 && lastTweetText != null && lastTweetAuthor != null)
  {
    var dispAlpha = (tweetTimeRemaining/DEFAULT_TWEET_TIME);
    context.globalAlpha = dispAlpha;
    //console.log("aaaaaaaaaaaaaaaaaaaaaaaa");
    
    //context.fillStyle = "rgba(255, 255, 255, " + (tweetTimeRemaining/DEFAULT_TWEET_TIME) + ")";
    tweetTimeRemaining -= 25;

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
  context.drawImage(me.image, 30, me.y);
  //display enemies
  for (i = 0; i < enemies.length; i++) {
    context.drawImage(enemies[i].image, enemies[i].x, enemies[i].y);
  }
  for (i = 0; i < trojans.length; i++) {
    context.drawImage(trojans[i].image, trojans[i].x, trojans[i].y);
  }
  for (i = 0; i < bullets.length; i++) {
    context.drawImage(bullets[i].image, bullets[i].x, bullets[i].y);
  }
  
  

}