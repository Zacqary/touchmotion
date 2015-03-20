/* 	TouchMotionController jQuery plugin
	v 1.0.0
	2015 Zacqary Adam Xeper
	This isn't copyrighted or whatever idgaf

This plugin will track the touch motion along an element, and send information about
how far the touch has moved to one callback function per axis. These callback functions
can be used to move an array of jQuery-selected elements.

Arguments:
	elementX / elementY (jQuery Object)
		A jQuery selection of the element(s) that will move with the user's touch.
		TouchMotionController will set the element(s)'s transition-duration to 0 when
		the user's finger is down, so that its motion can follow their finger 1:1.
		When the user's finger is released, the transition-duration will be reset, allowing
		the element to animate either back into its original position (if the user didn't
		swipe very far) or to a new position (if the user moved their finger far enough)

	sensitivityX / sensitivityY (Number)
		(Optional: default is 75) The minimum number of pixels required to count as a "swipe." 
		Any movement below this threshold will tell the callback to return the movable element 
		to its original position. You can pass in just `sensitivity` to give the same sensitivity
		to both X and Y.

	callbackX / callbackY (Function)
		A callback function which will receive the distance moved, and whether the movement is in
		progress or whether it has ended. Structure your callback this way:

		function(delta){
			// What to do regardless of whether this is a touchmove or touchend
			return {
				move: function(){
					// What to do on touchmove
				},
				end: function(){
					// What to do on touchend
				}
			}
		}
	
	clickHandler (Function)
		A function to call if the user just taps on the listening element. This is necessary
		because TouchMoveController will prevent the default event from bubbling up, so anything
		bound to the element with onClick will not trigger properly. TouchMoveController will send
		the clientX and clientY of the first touch to the clickHandler callback.

	priorityAxis (String)
		If this is set to 'x' or 'y', then touch motion will be restricted to a single axis, and
		this argument indicates which one is more important. If this is set to 'x', then the Y axis
		will only be moved if it's been moved further than the X axis, AND the X axis hasn't been moved
		beyond its sensitivity

*/
(function($){

	$.fn.touchMotionController = function(args){
		// Settings for tracking a touch moving along the x-axis
		var touchX = {
			element: args.elementX,
			callback: args.callbackX,
			sensitivity: args.sensitivityX || args.sensitivity || 75
		};
		touchX.element.key = "elementX";
		// Settings for tracking a touch moving along the y-axis
		var touchY = {
			element: args.elementY,
			callback: args.callbackY,
			sensitivity: args.sensitivityY || args.sensitivity || 75
		};
		touchY.element.key = "elementY";
		var priorityAxis = args.priorityAxis || 'none';
		var clickHandler = args.clickHandler;

		var listenerElement = this;
		// Stores elementX and elementY's transition-duration values
		// so that they can be reset after release
		var elementTransitions = {};

		// myTouch tracks the current sequence of touch events
		var myTouch = {};
		// TouchEvent handler
		function handler(e){
			var event = e.originalEvent;
			// If priorityAxis is set, rank the two touchAxis objects in priority order
			var priority = {};
	  		var secondary = {};
			if (priorityAxis !== 'none'){
	  			if (priorityAxis === 'x'){
	  				priority = touchX;
	  				secondary = touchY;
	  			} else if (priorityAxis === 'y'){
	  				priority = touchX;
	  				secondary = touchY;
	  			}
			}

			if (event.type === 'touchstart'){
				// Clear myTouch and record the starting point of the touch
				myTouch = {};
	    		myTouch.start = {
	    			clientX: event.changedTouches[0].clientX,
	    			clientY: event.changedTouches[0].clientY
	    		};
			} else if (event.type === 'touchmove' && typeof myTouch.start !== 'undefined') {
				// Get the current touch position and calculate its distance from the start
				myTouch.current = {
	    			clientX: event.changedTouches[0].clientX,
	    			clientY: event.changedTouches[0].clientY
	    		};
	    		touchX.delta = (myTouch.current.clientX - myTouch.start.clientX);
	      		touchY.delta = (myTouch.current.clientY - myTouch.start.clientY);

	      		if (priorityAxis !== 'none'){
	      			captureElementTransition(priority.element);
	      			// If the secondary axis has moved further than the priority, and
	      			// the priority axis is below its swipe sensitivity threshold
	      			if (Math.abs(priority.delta) < Math.abs(secondary.delta) && 
	      				Math.abs(priority.delta) < priority.sensitivity){
	      				// Move only the secondary element
	      				captureElementTransition(secondary.element);
	      				secondary.callback(secondary.delta).move();
	      			} else {
	      				// Move only the priority element
	      				priority.callback(priority.delta).move();
	      				// Animate the secondary element back to its original position
	      				if (elementTransitions[secondary.element.key]){
		      				releaseElementTransition(secondary.element);
		      				secondary.callback(0).end();
		      			}
	      			}
	      		} else {
	      			// Move both elements
	      			if (touchX.element){
	      				captureElementTransition(touchX.element);
	      				touchX.callback(touchX.delta).move();
	      			}
	      			if (touchY.element){
	      				captureElementTransition(touchY.element);
	      				touchY.callback(touchY.delta).move();
	      			}
	      		}
			} else if (event.type === 'touchend' || event.type === 'touchcancel'){
				releaseElementTransition(touchX.element);
				releaseElementTransition(touchY.element);
				// If there was finger movement (i.e. not a tap)
				if (myTouch.current){
					if (priorityAxis !== 'none'){
						if (Math.abs(priority.delta) >= priority.sensitivity){
							// Trigger the priority element's touchend callback,
							// and tell the secondary element that it hasn't moved
							priority.callback(priority.delta).end();
							secondary.delta = 0;
						} else {
							// Trigger the priority element's touchEnd as if it hasn't moved
							priority.callback(0).end();
						}
						if (Math.abs(secondary.delta) >= secondary.sensitivity){
							secondary.callback(secondary.delta).end();
						} else {
							secondary.callback(0).end();
						}
					} else {
						// Trigger each touchend callback if the element has moved beyond its sensitivity
						// Otherwise, trigger them as if the element hasn't moved
						if (touchX.callback && Math.abs(touchX.delta) >= touchX.sensitivity){
							touchX.callback(touchX.delta).end();
						} else {
							touchX.callback(0);
						}
						if (touchY.callback && Math.abs(touchY.delta) >= touchY.sensitivity){
							touchY.callback(touchY.delta).end();
						} else {
							touchY.callback(0);
						}
					}
				} else {
					// If there was no finger movement, trigger the clickHandler
					clickHandler(myTouch.start);
				}
				myTouch = {};
			}
			// Prevent the touchEvent from bubbling 
			return false;
		}

		function bindElement(element){
			element.on('touchstart', handler);
			element.on('touchmove', handler);
			element.on('touchend', handler);
			element.on('touchcancel', handler);
		}

		function captureElementTransition(element){
			// If this element hasn't already been stored, store the first element's
			// transition duration and then set them all to 0
			if (!elementTransitions[element.key]){
				var style = window.getComputedStyle(element[0]);
				elementTransitions[element.key] = style.getPropertyValue('transition-duration');
				element.css('transition-duration','0');
			}
		}
		function releaseElementTransition(element){
			if (elementTransitions[element.key]){
				element.css('transition-duration', elementTransitions[element.key]);
				elementTransitions[element.key] = null;
			}
		}

		bindElement(listenerElement);
		return this;
	};
}(jQuery));