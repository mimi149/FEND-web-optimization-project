/*
 Welcome to the 60fps project! Your goal is to make Cam's Pizzeria website run
 jank-free at 60 frames per second.

 There are two major issues in this code that lead to sub-60fps performance. Can
 you spot and fix both?

 Built into the code, you'll find a few instances of the User Timing API
 (window.performance), which will be console.log()ing frame rate data into the
 browser console. To learn more about User Timing API, check out:
 http://www.html5rocks.com/en/tutorials/webperformance/usertiming/

 Creator:
 Cameron Pittman, Udacity Course Developer
 cameron *at* udacity *dot* com
 */

// Mimi add this to let the webworker do some non-urgent job:
var worker = new Worker('js/worker.min.js');
var pizzaNumber = 100;
// Call worker to randomly generate pizzas.
worker.postMessage({'pizzaNumber': pizzaNumber});

var moversNumber = (function () {
	var cols = 8, height = 256;
	var viewportHeight = window.innerHeight;
	// Get the viewport height to determine the number of rows necessary to display then multiply it
	// by the number of columns to determine how many pizzas are needed to display.
	var rowsNeeded = Math.floor(viewportHeight / height) + 1; // Add 1 to insure that the first row is always drawn.
	return cols * rowsNeeded;
})();

worker.onmessage = function (e) {
	// This function returns a DOM element for each pizza.
	// Mimi's comment: this use DOM element so we cannot let the webworker do it although it's not urgent.
	var pizzas = e.data;
	var pizzaElementGenerator = function (i) {
		var pizzaContainer,           // contains pizza title, image and list of ingredients
			pizzaImageContainer,        // contains the pizza image
			pizzaImage,                 // the pizza image itself
			pizzaDescriptionContainer,  // contains the pizza title and list of ingredients
			pizzaName,                  // the pizza name itself
			ul;                         // the list of ingredients

		pizzaContainer = document.createElement("div");
		pizzaImageContainer = document.createElement("div");
		pizzaImage = document.createElement("img");
		pizzaDescriptionContainer = document.createElement("div");

		pizzaContainer.classList.add("randomPizzaContainer");
		pizzaContainer.style.width = "33.33%";
		pizzaContainer.style.height = "325px";
		pizzaContainer.id = "pizza" + i; // gives each pizza element a unique id
		pizzaImageContainer.style.width = "35%";

		pizzaImage.src = "images/pizza_s.png";
		pizzaImage.classList.add("img-responsive");
		pizzaImageContainer.appendChild(pizzaImage);
		pizzaContainer.appendChild(pizzaImageContainer);

		pizzaDescriptionContainer.style.width = "65%";

		pizzaName = document.createElement("h4");
		pizzaName.innerHTML = pizzas[i].name;
		pizzaDescriptionContainer.appendChild(pizzaName);

		ul = document.createElement("ul");
		ul.innerHTML = pizzas[i].pizza;
		pizzaDescriptionContainer.appendChild(ul);
		pizzaContainer.appendChild(pizzaDescriptionContainer);

		return pizzaContainer;
	};

	window.performance.mark("mark_start_generating"); // collect timing data

	// Mimi replaces querySelector by getElementById method for performance boost according to
	// https://jsperf.com/getelementbyid-vs-queryselector/11
	var pizzasDiv = document.getElementById("randomPizzas");

	for (var i = 2; i < pizzaNumber; i++) {
		pizzasDiv.appendChild(pizzaElementGenerator(i));
	}

	// User Timing API again. These measurements tell you how long it took to generate the initial pizzas
	window.performance.mark("mark_end_generating");
	window.performance.measure("measure_pizza_generation", "mark_start_generating", "mark_end_generating");
	var timeToGenerate = window.performance.getEntriesByName("measure_pizza_generation");
	console.log("Time to generate pizzas on load: " + timeToGenerate[0].duration + "ms");
};

// resizePizzas is called when the slider in the "Our Pizzas" section of the website moves.
var resizePizzas = function (size) {

	window.performance.mark("mark_start_resize");   // User Timing API function

	// Mimi comes up with the two arrays of necessary values for better speed.
	var sizeText = ["Small", "Medium", "Large"];
	var width = ["25%", "30%", "50%"];

	// Changes the value for the size of the pizza above the slider
	document.getElementById("pizzaSize").innerHTML = sizeText[size - 1];

	// Mimi replaces querySelector by getElement method for better speed.
	var pizzas = document.getElementsByClassName("randomPizzaContainer");

	var newWidth = width[size - 1];

	// Iterates through pizza elements on the page and changes their widths
	for (var i = 0, l = pizzas.length; i < l; i++) {
		pizzas[i].style.width = newWidth;
	}

	// User Timing API is awesome
	window.performance.mark("mark_end_resize");
	window.performance.measure("measure_pizza_resize", "mark_start_resize", "mark_end_resize");
	var timeToResize = window.performance.getEntriesByName("measure_pizza_resize");
	console.log("Time to resize pizzas: " + timeToResize[timeToResize.length - 1].duration + "ms");
};

// Iterator for number of times the pizzas in the background have scrolled.
// Used by updatePositions() to decide when to log the average time per frame
var frame = 0;

// Logs the average amount of time per 10 frames needed to move the sliding background pizzas on scroll.
function logAverageFrame(times) {   // times is the array of User Timing measurements from updatePositions()
	var numberOfEntries = times.length;
	var sum = 0;
	for (var i = numberOfEntries - 1; i > numberOfEntries - 11; i--) {
		sum = sum + times[i].duration;
	}
	console.log("Average scripting time to generate last 10 frames: " + sum / 10 + "ms");
}

// The following code for sliding background pizzas was pulled from Ilya's demo found at:
// https://www.igvita.com/slides/2012/devtools-tips-and-tricks/jank-demo.html

// Moves the sliding background pizzas based on scroll position
// runs callUpdatePositions on scroll

function callUpdatePositions() {
	// Mimi's comment: Avoid to get the movers too many times in the updatePositions by using the closure:
	var movers = document.getElementsByClassName('mover');

	function updatePositions() {
		ticking = false;
    // var currentScrollY = latestKnownScrollY;
		// frame++;
		// window.performance.mark("mark_start_frame");

		// Mimi's comment: We should pre-calculate phase values before enter into the for loop below:
		// Mimi's comment: The original updatePositions function changes the style.left of the pizzas based on the
		// document.body.scrollTop.

		// Mimi's comment: we move all the calculations out of the loop whenever we can:
		var top = document.body.scrollTop / 1250;

		// Assume that we want 5 different phases:
		var i, phases = [];
		for (i = 0; i < 5; i += 1) {
			phases.push(Math.sin(top + i));
		}

		for (i = 0; i < moversNumber; i += 1) {
			var phase = phases[i % 5];
			// Mimi's comment: we change to update style.transform instead of style.left, accordingly to this article:
			// https://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/
			// Replace this	movers[i].style.left = movers[i].basicLeft + 100 * phase + 'px' with translate:

			movers[i].style.transform = 'translateX(' + 100 * phase + 'px)';
		}
		// User Timing API to the rescue again. Seriously, it's worth learning.
		// Super easy to create custom metrics.
		// window.performance.mark("mark_end_frame");
		// window.performance.measure("measure_frame_duration", "mark_start_frame", "mark_end_frame");
		// if (frame % 10 === 0) {
		// 	var timesToUpdatePosition = window.performance.getEntriesByName("measure_frame_duration");
		// 	logAverageFrame(timesToUpdatePosition);
		// }
		// requestAnimationFrame(updatePositions);
	}
	end = new Date();
	updatePositions();

	console.log('Calling updatePositions: ' + (end.getTime() - start.getTime()) + ' msec');
	start = end;
}

var end, start;
start = new Date();
// Our animation callback only listen for scroll events
// window.addEventListener('scroll', callUpdatePositions, false);

// window.addEventListener('scroll', function () {
//    requestAnimationFrame(callUpdatePositions);
// });

//var last_known_scroll_position = 0;
var ticking = false;

window.addEventListener('scroll', function(e) {
  //last_known_scroll_position = window.scrollY; I don't use this.
  if (!ticking) {
    window.requestAnimationFrame(function() {
      callUpdatePositions();
    });
  }
  ticking = true;
});

// Generates the sliding pizzas when the page loads.
document.addEventListener('DOMContentLoaded', function () {
	// Mimi replaces querySelector by getElement method for better speed.
	var movingPizzas1 = document.getElementById("movingPizzas1");

	// Assume that we want 5 different phases:
	var phases = [];
	for (var i = 0; i < 5; i += 1) {
		phases.push(Math.sin(i));
	}

	var cols = 8, height = 256;
	var elem, phase;
	for (var i = 0; i < moversNumber; i++) {
		elem = document.createElement('img');
		elem.className = 'mover';
		elem.src = "images/pizza_s.png";
		elem.style.height = "100px";
		elem.style.width = "73.333px";
		elem.basicLeft = (i % cols) * height;
		elem.style.top = (Math.floor(i / cols) * height) + 'px';

		// Mimi's comment: Calculate different style.left for different pizzas.
		phase = phases[i % 5];
		elem.style.left = elem.basicLeft + 100 * phase + 'px';
		movingPizzas1.appendChild(elem);
	}
	// Mimi's comment:
	// The updatePositions function starts the animation by changing the style.left of the pizzas
	// based on the document.body.scrollTop.
	// At the first time when the page loaded, document.body.scrollTop equal 0 and doesn't change,
	// so we do not need to call updatePositions.

	// updatePositions(); -> Mimi comments this original line.
	// Instead, we need to calculate different style.left for different pizzas in the for loop above.
});
