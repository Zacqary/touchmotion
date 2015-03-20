# TouchMotion

Library of loosely coupled stuff for making touchy things happen when you put your fingers on computers.

Currently includes TouchMotionController jQuery plugin.

This plugin will track the touch motion along an element, and send information about
how far the touch has moved to one callback function per axis. These callback functions
can be used to move an array of jQuery-selected elements.

## Arguments
### elementX / elementY (jQuery Object)
A jQuery selection of the element(s) that will move with the user's touch.
TouchMotionController will set the element(s)'s transition-duration to 0 when
the user's finger is down, so that its motion can follow their finger 1:1.
When the user's finger is released, the transition-duration will be reset, allowing
the element to animate either back into its original position (if the user didn't
swipe very far) or to a new position (if the user moved their finger far enough)

### sensitivityX / sensitivityY (Number)
(Optional: default is 75) The minimum number of pixels required to count as a "swipe." 
Any movement below this threshold will tell the callback to return the movable element 
to its original position. You can pass in just `sensitivity` to give the same sensitivity
to both X and Y.

### callbackX / callbackY (Function)
A callback function which will receive the distance moved, and whether the movement is in
progress or whether it has ended. Structure your callback this way:

```
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
```

### clickHandler (Function)
A function to call if the user just taps on the listening element. This is necessary
because TouchMoveController will prevent the default event from bubbling up, so anything
bound to the element with onClick will not trigger properly. TouchMoveController will send
the clientX and clientY of the first touch to the clickHandler callback.

### priorityAxis (String)
If this is set to 'x' or 'y', then touch motion will be restricted to a single axis, and
this argument indicates which one is more important. If this is set to 'x', then the Y axis
will only be moved if it's been moved further than the X axis, AND the X axis hasn't been moved
beyond its sensitivity