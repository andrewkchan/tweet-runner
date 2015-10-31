var canvas;
var con;
var sprite;
var CANV_H = 200;
var CANV_W = 400;
var KEY_RIGHT = 39;
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_SPACE = 32;

var GROUNDSPEED = -30.0;
var GRAVITY = 98.0;

var infoDiv;
var boolHardcoreMode = false;
var asteroidProbability = 0.0;

var enemies = [];
var player;
var KeyBulletin;

var lastTweetText;
var lastTweets = [];
var tweetTimeRemaining = 0;
var DEFAULT_TWEET_TIME = 2000; //MILLISECONDS before fade-out

$(document).ready(function() {
    loadCanvas();
})

/*
function Asteroid(givenRadius){
    this.radius = givenRadius;
    this.image = $(".inspector");
    this.x = Math.random()*100;
    this.y = Math.random()*100;
    this.angularVelocity = Math.random()*0.10;
    this.angle = 0.0;
    this.velocity = (Math.random()+0.5)*0.5;
    this.horizontalVector = 0.0;
    this.verticalVector = 0.0;
}
function createAsteroid(randFloat){
    if (randFloat < 0.01) {
        asteroids.push(new Asteroid((Math.random()+0.3)*15));
    }
    
}
*/
function KB(){
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
KB.prototype.touchStart = function() {
    this.pressed[999] = true;
}
KB.prototype.touchEnd = function() {
    this.pressed[999] = false;
}

function EnemyInspector(){
    this.image = $(".enemyInspector").get(0);
    this.width = this.image.width;
    this.height = this.image.height;
    this.x = 400.0; //top left corner
    this.y = 200.0; //top left corner
    this.velocityY = 0.0;

    this.isAlive = true;
}
EnemyInspector.prototype.isOnGround = function(){
    return (this.y + this.height) == CANV_H;
}
EnemyInspector.prototype.enforceZ = function(){
    if (this.y + this.height >= CANV_H){
        this.y = CANV_H - this.height;
    }
}
EnemyInspector.prototype.update = function(dt){
    if(this.x < 0)
    {
        this.isAlive = false;
    }
    this.enforceZ();
    if (this.isOnGround())
    {
        this.x += GROUNDSPEED * (dt/1000.0);
    }
    else
    {
        this.velocityY += GRAVITY * (dt/1000.0);
        this.y += this.velocityY * (dt/1000.0);
    }
}
function sprites_from_list(sprites, list_of_image_strings){
    for(i = 0; i < list_of_image_strings.length; i++){
        sprites.push($(list_of_image_strings[i]).get(0));
    }
    return sprites;
}
function Animation(duration, list_of_image_strings){
    this.duration = duration; //duration of the animation in MILLISECONDS
    this.sprites = sprites_from_list([], list_of_image_strings);
    this.currentTime = 0.0; //total time spent in animation so far (MILLISECONDS)
}
Animation.prototype.update = function(dt){
    this.currentTime += dt;
    this.currentTime %= this.duration;
}
Animation.prototype.getCurrentFrame = function(){
    return this.sprites[Math.floor(this.currentTime/this.duration * this.sprites.length)];
}

function Player(){
    this.animLeft = new Animation(250, [".pc_walk1", ".pc_walk2", ".pc_walk3"]);
    this.animRight = new Animation(250, [".pc_walk1r", ".pc_walk2r", ".pc_walk3r"]);
    this.animStandRight = new Animation(1, [".pc_stand1r"]);
    this.animStandLeft = new Animation(1, [".pc_stand1"]);
    this.animDead = new Animation(1, [".pc_dead1"]);
    this.currentAnim = this.animStand;
    this.image = this.animLeft.sprites[0];
    this.width = this.image.width;
    this.height = this.image.height;
    this.x = 0.0;
    this.y = 0.0;
    this.velocityX = 0.0;
    this.velocityY = 0.0;
    this.jumpSpeed = -140.0;
    this.runSpeed = 45.0;
    this.isAlive = true;
    this.facingRight = true;
}
Player.prototype.isCollidingWith = function(enemy){
    return !((enemy.x > this.x + this.width) || (enemy.x + enemy.width < this.x) ||
            (enemy.y > this.y + this.height) || (this.y + this.height < enemy.y));
}
Player.prototype.isOnGround = function(){
    return (this.y + this.height) == CANV_H;
}
Player.prototype.enforceZ = function(){
    if (this.y + 37 >= CANV_H){
        this.y = CANV_H - 37; //37 should be this.height, but temporary fix for unknown problem
    }
}
Player.prototype.update = function(dt){
    if(!this.isOnGround())
    {
        this.velocityY += GRAVITY * (dt/1000.0);
        if(this.facingRight)
        {
            this.currentAnim = this.animStandRight;
        }
        else
        {
            this.currentAnim = this.animStandLeft;
        }
    }
    else
    {
        //alert("on ground!");
        this.x += GROUNDSPEED * (dt/1000.0);
        if(this.velocityX != 0.0)
        {
            if(this.facingRight)
            {
                this.currentAnim = this.animRight;
            }
            else
            {
                this.currentAnim = this.animLeft;
            }
        }
    }
    if(!this.isAlive)
    {
        this.currentAnim = this.animDead;
    }
    this.image = this.currentAnim.getCurrentFrame();
    this.currentAnim.update(25);
    this.x += this.velocityX * (dt/1000.0);
    this.y += this.velocityY * (dt/1000.0);
    this.enforceZ();
    for(i=0; i < enemies.length; i++)
    {
        if(this.isCollidingWith(enemies[i]))
        {
            this.isAlive = false;
        }
    }
    this.velocityX = 0.0;
}

function loadCanvas(){
    
    infoDiv = $(".infoDiv");
    
    
    canvas = $(".animationCanvas").get(0);
    con = canvas.getContext("2d");
    
    player = new Player();
    KeyBulletin = new KB();

    window.addEventListener('keyup', function(event) {KeyBulletin.onKeyUp(event);}, false);
    window.addEventListener('keydown', function(event) {KeyBulletin.onKeyDown(event);}, false);
    //window.addEventListener("touchstart", function(event) {KeyBulletin.touchStart();}, false);
    //window.addEventListener("touchend", function(event) {KeyBulletin.touchEnd();}, false);

    setInterval(loop,25);
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
        console.log(lastTweets[lastTweets.length - 1].text);
    }
}
function loop(){
    //-------------------READ+DISPLAY TWEETS------------------
    //$.getJSON("/query-tweet-stream", readFeed);
    
    $.ajax({
            type: "GET",
            url: "../request/",
            //contentType: "application/json; charset=utf-8",
            //data: { "echoValue": "echoText" },
            success: readFeed
        }); 
    //------------------------------------------------
    console.log("fucking bullshit");
    //reset horizontal player velocity
    player.velocityX = 0.0; 
    //get keyboard input
    if (player.isAlive)
    {
        if(KeyBulletin.isPressed(KEY_UP))
        {
            if (player.isOnGround())
            {
                player.velocityY = player.jumpSpeed;
            } 
        }
        if(KeyBulletin.isPressed(KEY_DOWN))
        {
            //do nothing
        }
        if(KeyBulletin.isPressed(KEY_RIGHT))
        {
            player.velocityX = player.runSpeed;
            player.facingRight = true;
        }
        if(KeyBulletin.isPressed(KEY_LEFT))
        {
            player.velocityX = -1.0*player.runSpeed;
            player.facingRight = false;
        }
        if(KeyBulletin.isPressed(KEY_SPACE))
        {
            boolHardcoreMode = !boolHardcoreMode;
        }
    }

    if(Math.random() < 0.005){
        enemies.push(new EnemyInspector());
    }

    for(i = 0; i < enemies.length; i++)
    {
        enemies[i].update(25);
    }
    for(i = 0; i < enemies.length; i++)
    {
        if(!enemies[i].isAlive)
        {
            enemies.splice(i, 1);
        }
    }
    player.update(25); //player should update after everything else
    //infoDiv.text(player.currentAnim.sprites);

    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>RENDER GRAPHICS<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    //
    con.fillStyle = "#000000";
    con.fillRect(0,0,CANV_W,CANV_H);
    //display tweets
    con.fillStyle = "#FFFFFF";

    //console.log(lastTweets.length + "       " + tweetTimeRemaining);
    if(lastTweets.length > 0 && tweetTimeRemaining <= 0)
    {
        lastTweetText = lastTweets.splice(0, 1)[0].text;
        if(lastTweetText.length > 80)
        {
            lastTweetText = lastTweetText.slice(0, 70) + "\n" + lastTweetText.slice(70, lastTweetText.length);
        }
        tweetTimeRemaining = DEFAULT_TWEET_TIME;
        //console.log("saifniufubbijaknfafb++++++++++++++++++++++++++++++++++++++++++++++++");
        //console.log(lastTweetText);
    }
    if(tweetTimeRemaining > 0 && lastTweetText != null)
    {
        tweetTimeRemaining -= 25;
        con.fillText(lastTweetText, 100, 100);
    }
    

    
    
    //>>>>>>>>RENDER ENEMIES<<<<<
    for (i=0;i<enemies.length;i++) {
        con.drawImage(enemies[i].image,
                      enemies[i].x,
                      enemies[i].y);
    }
    con.drawImage(player.image,
                      player.x, 
                      player.y);
    
    
}