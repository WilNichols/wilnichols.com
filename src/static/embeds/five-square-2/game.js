var FlashHelper={movieIsLoaded:function(theMovie){if(typeof(theMovie)!="undefined"){return theMovie.PercentLoaded()==100;}
else{return false;}},getMovie:function(movieName){if(navigator.appName.indexOf("Microsoft")!=-1){return window[movieName];}
else{return document[movieName];}}};function niftyplayer(name){this.obj=FlashHelper.getMovie(name);if(!FlashHelper.movieIsLoaded(this.obj)){return;}}
this.play=function(){this.obj.TCallLabel('/','play');};this.stop=function(){this.obj.TCallLabel('/','stop');};this.pause=function(){this.obj.TCallLabel('/','pause');};this.playToggle=function(){this.obj.TCallLabel('/','playToggle');};this.reset=function(){this.obj.TCallLabel('/','reset');};this.load=function(url){this.obj.SetVariable('currentSong',url);this.obj.TCallLabel('/','load');};this.loadAndPlay=function(url){this.load(url);this.play();};
this.getState=function(){var ps=this.obj.GetVariable('playingState');var ls=this.obj.GetVariable('loadingState');if(ps == 'playing'){if(ls=='loaded'){return ps;}else{return ls;}}if(ps=='stopped'){if(ls=='empty'){return ls;}if(ls=='error'){return ls;}else{return ps;}}return ps;};

var movesMade = 0;
var selectedCard = '';
var screenOrigin;
var cardIsSelected = false;
var animationInProgress = false;
var button1Held = false;
var button2Held = false;
var button3Held = false;
var button4Held = false;
var button5Held = false;
var button6Held = false;
var mouseLeft = false;
var heldCard = '';
var sameSuitShowing = false;
var gameWasWon = false;
var cardSpots = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4', 'D5', 'E1', 'E2', 'E3', 'E4', 'E5'];
var cardRows = "ABCDE";
var usedCards = [];
var movesToUndo = [];
var distanceBetweenXOrigins;
var distanceBetweenYOrigins;
function fadeOutSplash() {
	$("#splash").fadeOut('slow');
}
function fadeOutSplashWithDelay(delay) {
	setTimeout(fadeOutSplash, delay);
}
function cardIsEmpty(card) {
	if ((suitForCard(card) === "J") && (valueForCard(card) === 3)) { return true; }
	else { return false; }
}
function cardIsHighlighted(card) {
	var highlightDisplay = $('#'+ card + '.spot .highlight').css('display');
	if (highlightDisplay === 'block') { return true; }
	else { return false; }
}
function playSound(soundName) {
	if (document.getElementById(soundName).play) { document.getElementById(soundName).play(); }
	else if (document.getElementById(soundName + 'FlashEmbed') !== null) {
		var embed = document.getElementById(soundName + 'FlashEmbed');
		niftyplayer(embed).play();
	}
}
function loseGame() {
	movesToUndo = [];
	playSound('loser');
	$('.spot').fadeOut('slow', function(){ 
		$('#play').fadeIn('slow'); 
		//$("#play").click(newGame);
		for (var spot = 0; spot <= 24; spot++) {
			card = cardSpots[spot];
			clearOutCard(card);
		}
	});
}
function suitForCard(card) {
	var posYString = $("#" + card).css("background-position-y");
	var suitNumber = (((posYString.substring(1, posYString.length - 2)/70) + 1));
	var suit;
	switch (suitNumber) {
		case 1:
			suit = "H";
			break;
		case 2:
			suit = "D";
			break;
		case 3:
			suit = "S";
			break;
		case 4:
			suit = "C";
			break;
		case 5:
			suit = "J";
			break;
	}
	return suit;
}
function valueForCard(card) {
	var posXString = $("#" + card).css("background-position-x");
	return (((posXString.substring(1, posXString.length - 2)/51) + 1));
}
function setCardToType(card, suit, value) {
	var xOffset = (value - 1) * 51;
	var yOffset;
	if 		(suit === "H") { yOffset =	 0; }
	else if (suit === "D") { yOffset = 	70; }
	else if (suit === "S") { yOffset = 140; }
	else if (suit === "C") { yOffset = 210; }
	else if (suit === "J") { yOffset = 280; }
	else {
		xOffset = 102;
		yOffset = 280;
	}
	$("#" + card).css("background-position", "-" + xOffset + "px -" + yOffset + "px");
}
function hideHighlight(card) {
	$("#"+ card + ".spot .highlight").hide();
}
function hideOverlay(card) {
	$("#"+ card + ".spot").css('opacity', '1');
}
function clearOutCard(card) {
	setCardToType(card, null, null);
	document.getElementById(card).style.cursor = 'default';
	hideOverlay(card);
	hideHighlight(card);
}
function setOffCelebratoryCards(card) {
	document.getElementById(cardSpots[card]).style.cursor = 'default';
	if (card === 0) { setCardToType("A1", "S", "1"); } //document.getElementById("A1").style.backgroundImage = 'url(img/win/1S.png)'; }
	else if (card === 1) { setCardToType("A2", "H", "13"); } //document.getElementById("A2").style.backgroundImage = 'url(img/win/13H.png)'; }
	else if (card === 2) { setCardToType("A3", "C", "12"); } //document.getElementById("A3").style.backgroundImage = 'url(img/win/12C.png)'; }
	else if (card === 3) { setCardToType("A4", "D", "11"); } //document.getElementById("A4").style.backgroundImage = 'url(img/win/11D.png)'; }
	else if (card === 4) { setCardToType("A5", "S", "13"); } //document.getElementById("A5").style.backgroundImage = 'url(img/win/13S.png)'; }
	else if (card === 5) { setCardToType("B5", "H", "12"); } //document.getElementById("B5").style.backgroundImage = 'url(img/win/12H.png)'; }
	else if (card === 6) { setCardToType("C5", "C", "11"); } //document.getElementById("C5").style.backgroundImage = 'url(img/win/11C.png)'; }
	else if (card === 7) { setCardToType("D5", "D", "1"); } //document.getElementById("D5").style.backgroundImage = 'url(img/win/1D.png)'; }
	else if (card === 8) { setCardToType("E5", "S", "12"); } //document.getElementById("E5").style.backgroundImage = 'url(img/win/12S.png)'; }
	else if (card === 9) { setCardToType("E4", "H", "11"); } //document.getElementById("E4").style.backgroundImage = 'url(img/win/11H.png)'; }
	else if (card === 10) { setCardToType("E3", "C", "1"); } //document.getElementById("E3").style.backgroundImage = 'url(img/win/1C.png)'; }
	else if (card === 11) { setCardToType("E2", "D", "13"); } //document.getElementById("E2").style.backgroundImage = 'url(img/win/13D.png)'; }
	else if (card === 12) { setCardToType("E1", "S", "11"); } //document.getElementById("E1").style.backgroundImage = 'url(img/win/11S.png)'; }
	else if (card === 13) { setCardToType("D1", "H", "1"); } //document.getElementById("D1").style.backgroundImage = 'url(img/win/1H.png)'; }
	else if (card === 14) { setCardToType("C1", "C", "13"); } //document.getElementById("C1").style.backgroundImage = 'url(img/win/13C.png)'; }
	else if (card === 15) { setCardToType("B1", "D", "12"); } //document.getElementById("B1").style.backgroundImage = 'url(img/win/12D.png)'; }
	card++;
	if (card < 16) { setTimeout("setOffCelebratoryCards(" + card + ")", 62.5); }
	else { animationInProgress = false; }
}
function fadeInWinText() {
	$("#win").fadeIn('slow');
	gameWasWon = true;
}
function removeWinText() {
	if (gameWasWon == true) {
		document.getElementById("win").style.display = 'none';
		gameWasWon = false;
	}
}
function winGame() {
	animationInProgress = true;
	movesToUndo = [];
	playSound('winner');
	fadeInWinText();
	for (var spot = 0; spot <= 24; spot++) {
		var card = cardSpots[spot];
		clearOutCard(card);
	}
	setOffCelebratoryCards(0);
}
function checkForRemainingMoves() {
	if (movesMade < 24) {
		var remainingMovesExsist = false;
		var cardSpot;
		var cardSuit;
		var cardValue;
		var testSpot;
		var testCardSuit;
		var testCardValue;
		var otherCardsInSameRowOrColumn = [];
		for (var spot = 0; spot <= 24; spot++) {
			cardSpot = cardSpots[spot];
			if (!cardIsEmpty(cardSpot)) {
				cardSuit = suitForCard(cardSpot);
				cardValue = valueForCard(cardSpot);
				otherCardsInSameRowOrColumn = [];
				for (var testSpotNum = 0; testSpotNum <= 24; testSpotNum++) {
					testSpot = cardSpots[testSpotNum];
					if ((testSpot.charAt(0) == cardSpot.charAt(0) || testSpot.charAt(1) == cardSpot.charAt(1)) && testSpot != cardSpot) { otherCardsInSameRowOrColumn.push(testSpot); }
				}		
				for (var gridSpotNum = 0; gridSpotNum < otherCardsInSameRowOrColumn.length; gridSpotNum++) {
					var gridSpot = otherCardsInSameRowOrColumn[gridSpotNum];
					if (!cardIsEmpty(gridSpot)) {
						testCardSuit = suitForCard(gridSpot);
						testCardValue = valueForCard(gridSpot);
						if (testCardSuit == cardSuit || (testCardValue == cardValue && testCardSuit != "J") || (cardSuit != "J" && testCardSuit == "J")) {
							remainingMovesExsist = true;
							break;
						}
					}
				}
			}
			if (remainingMovesExsist) { break; }
		}
		if (!remainingMovesExsist) { loseGame(); }
		else if (remainingMovesExsist) { playSound('goodMove'); }
	}
	else if (movesMade == 24) { winGame(); }
}
function stopPulsing(cardId) { 
	$('#'+ cardId + '.spot').removeClass('pulsing'); 
}
function moveCard(card, newSpot) {
	movesMade++;
	stopPulsing(card);
	movesToUndo.push(undoStringFromCards(card, newSpot));
	var yMultiplier = cardRows.indexOf(newSpot.charAt(0)) - cardRows.indexOf(card.charAt(0));
	var xMultiplier = parseInt(newSpot.charAt(1)) - parseInt(card.charAt(1));
	var oldTop = $("#" + card).css("top");
	var oldLeft = $("#" + card).css("left");
	var oldZIndex = $("#" + card).css("z-index");
	$("#" + card).css("z-index", 1000);
	animationInProgress = true;
	$("#" + card).animate({"top": (distanceBetweenYOrigins * yMultiplier), "left": (distanceBetweenXOrigins * xMultiplier)}, 200, 'swing', function() {
		setCardToType(newSpot, suitForCard(card), valueForCard(card));
		clearOutCard(card);
		$("#" + card).css("top", oldTop);
		$("#" + card).css("left", oldLeft);
		$("#" + card).css("z-index", oldZIndex);
		animationInProgress = false;
		checkForRemainingMoves();
	});
	checkUndoButton();
}
function undoStringFromCards(movingCard, destinationCard) {
	return movingCard + "," + destinationCard + "," + suitForCard(destinationCard) + ","  + valueForCard(destinationCard);
}
function possibleMovesForCard(card) {
	var otherCardsInSameRowOrColumn = [];
	for (var testSpotNum = 0; testSpotNum <= 24; testSpotNum++) {
		var testSpot = cardSpots[testSpotNum];
		if ((testSpot.charAt(0) == card.charAt(0) || testSpot.charAt(1) == card.charAt(1)) && testSpot != card) { otherCardsInSameRowOrColumn.push(testSpot); }
	}
	var cardSuit;
	var cardValue;
	var selectedCardSuit = suitForCard(card);
	var selectedCardValue = valueForCard(card);
	var possibleMoves = [];
	var gridSpot;
	for (var gridSpotNum = 0; gridSpotNum < otherCardsInSameRowOrColumn.length; gridSpotNum++) {
		gridSpot = otherCardsInSameRowOrColumn[gridSpotNum];
		cardSuit = suitForCard(gridSpot);
		cardValue = valueForCard(gridSpot);
		if ((selectedCardSuit === cardSuit || selectedCardValue == cardValue || cardSuit === "J") && selectedCardSuit != "J" && cardIsEmpty(gridSpot) != true) { possibleMoves.push(gridSpot); }
	}
	return possibleMoves;
}
function showHighlight(card) { $('#'+ card + '.spot .highlight').css('display', 'block'); }
function selectOrDeselectCard(card, shouldPlaySound) {
	if (card != '') {
		playSound('select');
		var possibleMoves = possibleMovesForCard(card);
		for (var spot = 0; spot < possibleMoves.length; spot++) {
			showHighlight(possibleMoves[spot]);
		}
	}
	else {
		if (shouldPlaySound) { playSound('deselect'); }
		for (var theSpot = 0; theSpot <= 24; theSpot++) {
			hideHighlight(cardSpots[theSpot]);
		}
	}
}
function showOverlay(card) { 
	$('#'+ card + '.spot').css('opacity', '0.25'); 
}
function startPulsing(cardId) { 
	$('#'+ cardId + '.spot').addClass('pulsing');  
}
function handleClick(card) {
	if (!animationInProgress) {
		if (cardIsSelected !== true) {
			if (!cardIsEmpty(card.id)) {
				var cardSuit = suitForCard(card.id);
				if (cardSuit !== "J") {
					//showOverlay(card.id);
					startPulsing(card.id);
					selectedCard = card.id;
					selectOrDeselectCard(selectedCard, true);
					cardIsSelected = true;
				}
				else { playSound('wrongMove'); }
			}
		}
		else {
			if (card.id != selectedCard) {
				if (cardIsHighlighted(card.id) === true) {
					stopPulsing(selectedCard);
					hideOverlay(selectedCard);
					moveCard(selectedCard, card.id);
					selectedCard = '';
					selectOrDeselectCard(selectedCard, false);
					cardIsSelected = false;
				}
				else {
					if (!cardIsEmpty(card.id)) { playSound('wrongMove'); }
				}
			}
			else {
				stopPulsing(card.id);
				hideOverlay(card.id);
				selectedCard = '';
				selectOrDeselectCard(selectedCard, true);
				cardIsSelected = false;
			}
		}
	}
}
function showSameSuitCards(card) {
	if (!animationInProgress) {
		if (!cardIsEmpty(heldCard)) {
			sameSuitShowing = true;
			heldSuit = suitForCard(heldCard);
			if (heldSuit != "J") {
				heldValue = valueForCard(heldCard);
				for (var spot = 0; spot <= 24; spot++) {
					cardSpot = cardSpots[spot];
					if (!cardIsEmpty(cardSpot)) {
						cardSuit = suitForCard(cardSpot);
						if (cardSuit != heldSuit) {
							showOverlay(cardSpot);
						}
					}
				}
				$("#boardBackground").css("opacity", "0.4");
			}
		}
	}
}
function hideSameSuitCards() {
	sameSuitShowing = false;
	for (var spot = 0; spot <= 24; spot++) {
		hideOverlay(cardSpots[spot]);
	}
	$("#boardBackground").css("opacity", "1");
}
function rand(minVal, maxVal, floatVal) {
	var randVal = minVal + (Math.random() * (maxVal - minVal));
	return typeof floatVal == 'undefined' ? Math.round(randVal) : randVal.toFixed(floatVal);
}
function randomCard() {
	//console.log("randydandy");
	var cardNum = rand(1, 32);
	var cardValueNum;
	var cardSuitNum;
	var cardSuit;
	var card;
	if (cardNum <= 30) {
		cardValueNum = rand(1, 10);
		cardSuitNum = rand(1, 3);
		if (cardSuitNum == 1) { cardSuit = "S"; }
		else if (cardSuitNum == 2) { cardSuit = "D"; }
		else if (cardSuitNum == 3) { cardSuit = "H"; }
		card = cardValueNum + cardSuit;
	}
	else if (cardNum == 31) { card = "1J"; }
	else if (cardNum == 32) { card = "2J"; }
	return card;
}
function setUpCard(card) {
		var value = randomCard();
		if (usedCards.indexOf(value) == -1) {
			//console.log("Hey! I'm here! 'Eeeeey! *Jazz Hands*");
			document.getElementById(card).style.display = 'block';
			document.getElementById(card).style.cursor = 'pointer';
			setCardToType(card, value.substring(value.length - 1), value.substr(value, (value.length - 1)));
			usedCards.push(value);
		}
		else { setUpCard(card); }
}
function dealCards(card) {
	setUpCard(cardSpots[card]);
	card++;
	if (card < 25) { setTimeout("dealCards(" + card + ")", 40); }
	else { animationInProgress = false; }
}
function loadDemo() {
	animationInProgress = true;
	movesMade = 0;
	usedCards = [];
	movesToUndo = [];
	playSound('newGame');				
	var playGame = document.getElementById("play");
	playGame.style.display = "none";
	enableButton(newGameButton);
	dealCards(0);
}
function newGame() {
		animationInProgress = true;
		cardIsSelected = false;
		movesMade = 0;
		usedCards = [];
		movesToUndo = [];
		playSound('newGame');
		removeWinText();
		var card;
		for (var spot = 0; spot <= 24; spot++) {
			card = cardSpots[spot];
			clearOutCard(card);
		}
		dealCards(0);
}
function checkUndoButton() {
	if (movesToUndo.length < 1) {	
		disableButton(undoButton);
	} else if (movesToUndo.length > 0) {
		enableButton(undoButton);
	}
}
function undoMove() {
	if (movesToUndo.length > 0) {
		movesMade--;
		if (cardIsSelected) { 
			stopPulsing(selectedCard);
			hideOverlay(selectedCard);
			selectedCard = '';
			selectOrDeselectCard(selectedCard, false);
			cardIsSelected = false;
		 }
		var lastMove = movesToUndo.pop();
		var vacatedSpot = vacatedSpotFromUndoString(lastMove);
		var coveredSpot = coveredSpotFromUndoString(lastMove);
		var yMultiplier = cardRows.indexOf(vacatedSpot.charAt(0)) - cardRows.indexOf(coveredSpot.charAt(0));
		var xMultiplier = parseInt(vacatedSpot.charAt(1)) - parseInt(coveredSpot.charAt(1));
		var oldTop = $("#" + vacatedSpot).css("top");
		var oldLeft = $("#" + vacatedSpot).css("left");
		var oldZIndex = $("#" + vacatedSpot).css("z-index");
		animationInProgress = true;
		$("#" + vacatedSpot).css("z-index", 1000);
		$("#" + vacatedSpot).css("top", (distanceBetweenYOrigins * (-1 * yMultiplier)));
		$("#" + vacatedSpot).css("left", (distanceBetweenXOrigins * (-1 * xMultiplier)));
		setCardToType(vacatedSpot, suitForCard(coveredSpot), valueForCard(coveredSpot));
		setCardToType(coveredSpot, coveredCardSuitFromUndoString(lastMove), coveredCardValueFromUndoString(lastMove));
		document.getElementById(vacatedSpot).style.display = 'block';
		document.getElementById(vacatedSpot).style.cursor = 'pointer';
		$("#" + vacatedSpot).animate({"top": "+=" + (distanceBetweenYOrigins * yMultiplier), "left": "+=" + (distanceBetweenXOrigins * xMultiplier)}, 200, 'swing', function() {
			$("#" + vacatedSpot).css("z-index", oldZIndex);
			animationInProgress = false;
		});
		checkUndoButton();
		playSound('undo');
	}
}
function vacatedSpotFromUndoString(undoString) {
	return undoString.split(",")[0];
}
function coveredSpotFromUndoString(undoString) {
	return undoString.split(",")[1];
}
function coveredCardSuitFromUndoString(undoString) {
	return undoString.split(",")[2];
}
function coveredCardValueFromUndoString(undoString) {
	return undoString.split(",")[3];
}
function highlightButton(button, shouldHighlight) {
	switch (shouldHighlight) {
		case true:
			button.style.backgroundPositionY = '0px';
			break;
		case false:
			button.style.backgroundPositionY = '-44px';
			break;
	}
}
function disableButton(button) {
	//console.log('disabling button: ' + button.id);
	$('#' + button.id).addClass('disabledButton');
}
function enableButton(button) {
	//console.log('enabling button: ' + button.id);
	$('#' + button.id).removeClass('disabledButton');
}
function handleNavBarClick(button) {
	
	if (animationInProgress === false) {
		if (button.id == "howToPlayDoneButton") {
			hideHowToPlay();
		}
		if (button.id == "infoDoneButton") {
			hideInfo();
			console.log('hideInfo');
		}
	}
}
function handleToolbarClick(button) {
	if (animationInProgress === false) {
		if (button.id == "newGameButton") {
			if (document.getElementById("play").style.display != 'none') { loadDemo(); }
			else { newGame(); }
		}
		if (button.id == "undoButton") {
			if (document.getElementById("play").style.display == 'none') { undoMove(); }
		}
		if (button.id == "howToPlayButton") {
			$('#game').addClass('howToPlay');
		}
	}
}
function hideHowToPlay() {
	$('#game').removeClass('howToPlay');
}
$(document).ready(function() {
	distanceBetweenXOrigins = parseInt($(".spot").css("width")) + parseInt($(".spot").css("margin-left"));
	distanceBetweenYOrigins = parseInt($(".spot").css("height")) + parseInt($(".spot").css("margin-top"));
	$(".spot").mousedown(function(){ 
		if (cardIsSelected != true) { 
			heldCard = this.id; 
			setTimeout(showSameSuitCards, 200); 
		} 
	});
	$(".spot").mouseup(function(){ 
		if (cardIsSelected != true) { 
			heldCard = ''; 
			if (sameSuitShowing == true) { 
				hideSameSuitCards(); 
			} else { 
				handleClick(this); 
			} 
		} else { 
			handleClick(this); 
		} 
	});

	$(".spot").append('<div class=\"overlay\"></div><div class=\"highlight\"></div>');
	$("#newGameButton").mouseup(function(){ newGame(); });
	$("#undoButton").mouseup(function(){ undoMove(); });
	$("#howToPlayButton").mouseup(function(){ $('#game').addClass('howToPlay'); });
	$("#game").mouseleave(function() { if (!cardIsSelected) { hideSameSuitCards(); } });
	$("#play").click(loadDemo);
	$("audio").attr({ 'height':'0', 'width':'0', 'enablejavascript':'true' });
	$("div#howToPlayDoneButton").mouseup(function(){ hideHowToPlay(); });
	scaleGame();
	$(window).resize(function(){
		scaleGame();	
	});
	

	var sound;
	for (var element = 0; element <= 24; element++) {
		sound = $("audio").eq(element);
		var oggPath = "sounds/" + sound.attr('id') + ".ogg";
		var mp3Path = "sounds/" + sound.attr('id') + ".mp3";
		sound.attr('class', 'audio');
		sound.append('<source src=\"' + oggPath + '\" type=\"audio/ogg\" />\n<source src=\"' + mp3Path + '\" type=\"audio/mpeg\" />\n<!--[if gt IE 6]>\n<object classid=\"clsid:6BF52A52-394A-11D3-B153-00C04F79FAA6\"><!\n[endif]--><!--[if !IE]><!-->\n<object type=\"audio/mpeg\" data=\"' + mp3Path + '\">\n<!--<![endif]-->\n<param name=\"url\" value=\"' + mp3Path + '\" />\n<param name=\"autostart\" value=\"false\" />\n<param name=\"uiMode\" value=\"none\" />\n<object classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" codebase=\"http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0\" id=\"' + sound.attr('id') + 'Flash' + '>\n<param name=movie value=\"flash/niftyplayer.swf?file=../' + mp3Path + '&as=1\">\n<param name=quality value=high>\n<embed src=\"flash/niftyplayer.swf?file=../' + mp3Path + '&as=1\" quality=high id=\"' + sound.attr('id') + 'FlashEmbed' + '\" type=\"application/x-shockwave-flash\" pluginspage=\"http://www.macromedia.com/go/getflashplayer\">\n</embed>\n</object>\n</object><!--[if gt IE 6]>\n<!--></object><!--<![endif]-->');
	}
	fadeOutSplashWithDelay(1000);
	checkUndoButton();
	disableButton(newGameButton);
});
if (!Array.indexOf) {
	Array.prototype.indexOf = function(obj) {
		for (var i=0; i<this.length; i++) { if (this[i] == obj) { return i; } }
		return -1;
	};
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function startTime() {
  var date = new Date();
	var dateString = date.toLocaleTimeString();
	var h = date.getHours();
	var m = date.getMinutes();
	var ampm = h >= 12 ? 'pm' : 'am';
	h12 = h % 12;
	h12 = h12 ? h12 : 12; // the hour '0' should be '12'
	m = checkTime(m);
	var time12H = h12 + ':' + m + ' ' + ampm;
	var time24H = h + ':' + m;
	
	if (dateString.match(/am|pm/i) || date.toString().match(/am|pm/i) ) {
	//12 hour clock
		$('.currentTime').html(time12H) ;
	} else {
		//24 hour clock
		$('.currentTime').html(time24H);
		}
  t = setTimeout(function() {
    startTime()
  }, 500);
}
startTime();

// SCALEME
function scaleGame() {
	div = $('.container')
	var currentWidth = div.outerWidth();
	var currentHeight = div.outerHeight();

	var availableWidth = window.innerWidth;
	var availableHeight = window.innerHeight;
	
	var scaleX = availableWidth / currentWidth;
	var scaleY = availableHeight / currentHeight;
	
	var scale = Math.min(scaleX, scaleY);
	//console.log(scale)

	var transformString = "scale(min(2, " + scale + "))";
	div.css('transform', transformString);
}