/**
 * jQuery Draggable Touch v0.5
 * Jonatan Heyman | http://heyman.info 
 *
 * Make HTML elements draggable by using uses touch events.
 * The plugin also has a fallback that uses mouse events, 
 * in case the device doesn't support touch events.
 * 
 * Licenced under THE BEER-WARE LICENSE (Revision 42):
 * Jonatan Heyman (http://heyman.info) wrote this file. As long as you retain this 
 * notice you can do whatever you want with this stuff. If we meet some day, and 
 * you think this stuff is worth it, you can buy me a beer in return.
 *
 * 
 * ********************************************************************************************************
 * Modificado por Sebastian del Valle (sebcl) para que se utilice la GPU en lugar de la CPU,
 * al dibujar los objetos con Translate3d en vez de Left y Right, según sugiere Paul Irish
 * 
 * @{link http://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft}
 * @version 2014.05.04
 * ********************************************************************************************************
 *
 * 
 */

;(function($){
    $.fn.draggableTouch = function(action) {
        // check if the device has touch support, and if not, fallback to use mouse
        // draggableMouse which uses mouse events
        if (!("ontouchstart" in document.documentElement)) {
            return this.draggableMouse(action);
        }
        
        // check if we shall make it not draggable
        if (action == "disable") {
            this.unbind("touchstart");
            this.unbind("touchmove");
            this.unbind("touchend");
            this.unbind("touchcancel");
            return this;
        }
        
        this.each(function() {
            var element = $(this);
            var offset = null;

            // guardar posicion original —seb
            if (!element.data('posOriginal')) element.data('posOriginal', [element.position().left, element.position().top])
            // console.log('guardando pos original de '+element[0].id)
            
            var end = function(e) {
                e.preventDefault();
                var orig = e.originalEvent;
                
                element.trigger("dragend", {
                    top: orig.changedTouches[0].pageY - offset.y,
                    left: orig.changedTouches[0].pageX - offset.x
                });
            };
            
            element.bind("touchstart", function(e) {
                var orig = e.originalEvent;
                var pos = $(this).position();
                offset = {
                    x: orig.changedTouches[0].pageX - pos.left,
                    y: orig.changedTouches[0].pageY - pos.top
                };
                element.trigger("dragstart", pos);
            });
            element.bind("touchmove", function(e) {
                e.preventDefault();
                var orig = e.originalEvent;
                
                // do now allow two touch points to drag the same element
                if (orig.targetTouches.length > 1)
                    return;
                
                //MODO 1 = Position (CPU), Modo 2 = Translate (GPU)
                modo=2;
                if(modo==1) {
                    $(this).css({
                        '-webkit-translate': '',
                        '-moz-translate': '',
                        'translate': '',
                        top: orig.changedTouches[0].pageY - offset.y,
                        left: orig.changedTouches[0].pageX - offset.x
                    });
                } else {
                    ele = $(this)
                    posicionFinal = [orig.changedTouches[0].pageX - offset.x, orig.changedTouches[0].pageY - offset.y]
                    // if (posicionFinal[1]<0) posicionFinal[1]=0
                    posicionOriginal = element.data('posOriginal')
                    trans = 'translate3d('+(orig.changedTouches[0].pageX - offset.x)+'px, '+(orig.changedTouches[0].pageY - offset.y)+'px, 0)'
                    ele.css({
                        '-webkit-transform': trans,
                        '-moz-transform': trans,
                        'transform': trans,
                    });
                    ele.trigger("dragmove", {left:orig.changedTouches[0].pageX - offset.x, top:orig.changedTouches[0].pageY - offset.y});

                }

            });
            element.bind("touchend", end);
            element.bind("touchcancel", end);
        });
        return this;
    };
    
    /**
     * Draggable fallback for when touch is not available
     */
    $.fn.draggableMouse = function (action) {
        // check if we shall make it not draggable
        if (action == "disable") {
            this.unbind("mousedown");
            this.unbind("mouseup");
            return this;
        }
        
        this.each(function() {
            var element = $(this);
            var offset = null;
            
            // guardar posicion original —seb
            if (!element.data('posOriginal')) element.data('posOriginal', [element.position().left, element.position().top])
            // console.log('guardando pos original de '+element[0].id)

            var move = function(e) {
                posicionFinal = [e.pageX - offset.x, e.pageY - offset.y]
                //esto evitaba q se movieran fuera del margen de la ventana, pero ahora q hay paneo se quita
                // if (posicionFinal[1]<0) posicionFinal[1]=0
                // if (posicionFinal[0]<0) posicionFinal[0]=0

                //aplicar escala de zoom
                escala = Grafork.zoom;
                posicionFinal[0] = posicionFinal[0]/escala;
                posicionFinal[1] = posicionFinal[1]/escala;

                // console.log('moviendo a',posicionFinal)
                posicionOriginal = element.data('posOriginal')
                trans = 'translate3d('+posicionFinal[0]+'px, '+posicionFinal[1]+'px, 0)'
                element.css({
                    '-webkit-transform': trans,
                    '-moz-transform': trans,
                    'transform': trans,
                });
                element.trigger("dragmove", {left:e.pageX - offset.x, top:e.pageY - offset.y}); //usar nombres de jQuery
            };
            var up = function(e) {
                element.unbind("mouseup", up);
                $(document).unbind("mousemove", move);
                element.trigger("dragend", {
                    top: e.pageY - offset.y,
                    left: e.pageX - offset.x
                });
            };
            element.bind("mousedown", function(e) {
                if(e.button==2) return
                var pos = element.position();
                offset = {
                    //ambos tenian un +10 para compensar, pero desde implementación de bootstrap ya no hace falta
                    x: e.pageX - pos.left, //arreglin pq quedaba lejos de donde realmente empecé a arrastrar
                    y: e.pageY - pos.top //idem
                };
                $(document).bind("mousemove", move);
                element.bind("mouseup", up);
                element.trigger("dragstart", pos);
            });
        });
        return this;
    };
})(jQuery);
