# FEND-Web-Optimization-Project
(4th project for Udacity's Front-End Nanodegree Program.)
 
The challenge was to optimize certain portions of an existing website for different metrics.

1. Optimize the index.html page to achieve a Page Speed Insights ranking of 90 or better on both mobile and desktop.
2. Optimize the slider widget on views/pizza.html to resize in < 5ms as indicated in the console.
3. Optimize the views/pizza.html to achieve 60FPS or better on the scroll event.

### Courses
* [Browser Rendering Optimization](https://www.udacity.com/course/browser-rendering-optimization--ud860)
* [Website Performance Optimization](https://www.udacity.com/course/website-performance-optimization--ud884)

### References
* [Chrome Dev Tools tips-and-tricks](https://developer.chrome.com/devtools/docs/tips-and-tricks)
* [Optimizing Performance](https://developers.google.com/web/fundamentals/performance/ "web performance")
* [Analyzing the Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/analyzing-crp.html "analyzing crp")
* [Optimizing the Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/optimizing-critical-rendering-path.html "optimize the crp!")
* [Avoiding Rendering Blocking CSS](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-blocking-css.html "render blocking css")
* [Optimizing JavaScript](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/adding-interactivity-with-javascript.html "javascript")
* [Measuring with Navigation Timing](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp.html "nav timing api")
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/eliminate-downloads.html">The fewer the downloads, the better</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/optimize-encoding-and-transfer.html">Reduce the size of text</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization.html">Optimize images</a>
* <a href="https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching.html">HTTP caching</a><br>
* [ngrok](https://ngrok.com/)
* [More on integrating ngrok, Grunt and PageSpeed.](http://www.jamescryer.com/2014/06/12/grunt-pagespeed-and-ngrok-locally-testing/)


### Part 1: Optimize index.html

* Resized the images (used responsive_images in Gruntfile.js)
* Optimized the css (added the media attribute to the print.css (<link href="./css/print.css" rel="stylesheet" media="print"> 
* Minified the CSS files (used prettyugly in Gruntfile.js)
* Minified JS sources (used uglify in Gruntfile.js)
* Add async attribute to JS script tags in index.html.

With the above optimizations, I got the scores of 93/100 for desktop and 87/100 for mobile in Page Speed Insights (report from running 'grunt ngrok').

* In addition, while using inlined stylesheet instead of css file, I got the scores of 96/100 for desktop and 95/100 for mobile in Page Speed Insights.


### Part 2: Optimize Slider Widget
* Used two arrays of some necessary values instead of some original time-consumed finding the size of pizzas.

```
    var sizeText = ["Small", "Medium", "Large"];
    var width = ["25%", "30%", "50%"];
```
	
* Replaced querySelector by getElementBy for performance boost accordingly to https://jsperf.com/getelementbyid-vs-queryselector/11.

```
    var pizzas = document.getElementsByClassName("randomPizzaContainer");
    document.getElementById("pizzaSize").innerHTML = sizeText[size - 1];
```

* Moved all unnecessary calculations out of the loop.

```		
	var resizePizzas = function (size) {
	    var sizeText = ["Small", "Medium", "Large"];
		var width = ["25%", "30%", "50%"];
		document.getElementById("pizzaSize").innerHTML = sizeText[size - 1];
		var pizzas = document.getElementsByClassName("randomPizzaContainer");
		var newWidth = width[size - 1];
		for (var i = 0, l = pizzas.length; i < l; i++) {
			pizzas[i].style.width = newWidth;
		}
	}
```

Here are the results of the above optimization:

```
    Time to resize pizzas: 0.2699999999895226ms
    Time to resize pizzas: 0.27500000002328306ms
    Time to resize pizzas: 0.534999999916181ms
    Time to resize pizzas: 0.42500000016298145ms
    Time to resize pizzas: 0.2899999999208376ms
    Time to resize pizzas: 0.23499999998603016ms
    Time to resize pizzas: 0.2500000001164153ms
```


### Part 3: The Dreaded Sliding Pizzas

* Used requestAnimationFrame to wrap updatePositions function.
    Because of this wrap, we won't call updatePositions function in this event as the original code.
    I added the calculation for different style.left for different pizzas:

```    
	document.addEventListener('DOMContentLoaded', function() {
	    ...       
        phase = phases[i % 5];
        elem.style.left = elem.basicLeft + 100 * phase + 'px';        	    
	})
```

* Replaced querySelector by getElementBy for performance boost accordingly to https://jsperf.com/getelementbyid-vs-queryselector/11.

* Calculated the number of moving pizzas (instead of the redundant original number 200) based on window.innerHeight.

    There are 8 columns. Each row has a height of 256px.
    Get the viewport height to determine the number of rows, then multiply it
    by the number of columns to determine how many pizzas needed to display.

* Put updatePositions function inside callUpdatePositions to use the closure movers. 

    The updatePositions function is called repeatedly so we avoid to do too many things inside of it. 
  
* Moved all the calculations out of the loop whenever we can:

    document.body.scrollTop triggers forced synchronous layouts, so it must be called only one time before entering the loop.
    Precalculated the 5 different values of phase.

* Used style.transform instead of style.left, accordingly to this article:
  https://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/

Here is the final code in updatePositions function:

```
    var phases = [];
    var top = document.body.scrollTop / 1250;
    for (var i = 0; i < 5; i += 1) {
        phases.push(Math.sin(top + i));
    }
    for (var i = 0; i < moversNumber; i += 1) {
        var phase = phases[i % 5];
        movers[i].style.transform = 'translateX(' + 100 * phase + 'px)';
    }
    requestAnimationFrame(updatePositions);
```

* Made few changes to .mover class in style.css.

  To create compositor layers for moving background pizzas:

``` 
    will-change: transform;
```  

  To boost performance in browsers which support hardware acceleration:

```
    backface-visibility: hidden;
```


### Bonus: Optimize pizza.html

* Generating a lot of random pizzas is not a high priority when loading the pizza.html, so we can let the Worker (another thread) do it.

    It improves the DOMContentLoaded of this page. 
    Time to generate pizzas DOM after receiving the random pizzas from Worker: 9.56ms. 

