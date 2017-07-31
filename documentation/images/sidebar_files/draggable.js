/**
  * An ultra simple draggable class
 */
jQuery.Draggable = function(ele, options) {
	var $ = jQuery;
	var dragging = false;
	ele = this.ele = $(ele);
	if (ele[0]._draggable) {
		ele[0]._draggable.destroy();
	}
	ele[0]._draggable = this;
	
	var o = this.options = $.extend({
		handle: '',
		cursor: 'move',
		onDrag: function () {return true;},
		beforeDrag: function() {},
		afterDrag: function() {}
	}, options || {});
	o.handle = o.handle ? $(o.handle, ele) : ele;
	o.handle.css({cursor: o.cursor});

	var mx, my;
	function onMouseDown(e) {
		dragging = false;
		
		$(document).bind('mousemove', onMouseMove).bind('mouseup', onMouseUp);
		mx = e.pageX;
		my = e.pageY;
		return false;
	}
	function onMouseMove (e) {
		if (!dragging) o.beforeDrag(e);
		
		//awesome screenshot
		if (e.undraggable) return;
		
		dragging = true;
		var l = parseInt(ele.css('left')), t = parseInt(ele.css('top'));
		
		//deltax and deltay
		var ox = e.pageX - mx, oy = e.pageY - my;
		ele.css({
			left: l + ox,
			top: t + oy
		});
		
		o.onDrag(l, t, ox, oy);
		/*if (o.onDrag(ele, {ox: ox, oy: oy})) {
			ele.css({
				left: l + ox,
				top: t + oy
			});
			
			//awesome screenshot
			sx = l + ox;
			sy = t + oy;
			placeCropSize();
			updateHelper();
			
		}*/
		mx = e.pageX;
		my = e.pageY;
		return false;
	}
	function onMouseUp (e) {
		$(document).unbind('mousemove', onMouseMove).unbind('mouseup', onMouseUp);
		if (dragging) {
			o.afterDrag(e);
			return false;
		} else {
			return true;
		}
	}
	
	this.destroy = function () {
		o.handle.unbind('mousedown', onMouseDown);
	};
	o.handle.bind('mousedown', onMouseDown);
};