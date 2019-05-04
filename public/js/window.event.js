/**
 * Detect window.onfocus and window.onblur
 */
const BindWindowFocusChange = function (window, App = EventBus) {
    window.onfocus = function (e) {
        App.$emit('tracker:start', e);
        App.$emit('inactivity:reset', e);
        App.$emit('inactivity:start', e);
        App.isInFocus = true;
    }
    
    window.onblur = function () {
        console.log('leave')
        App.$emit('tracker:stop');
        App.$emit("inactivity:stop");
        App.isInFocus = false;
    }
    
    window.onkeydown = window.onmousemove = 
    window.onwheel = window.onmousewheel = 
    window.onmousedown = window.onkeyup = function () {
        App.$emit('inactivity:reset');
    }
}

/**
 * Detect window visibility change
 */
const BindWindowVisibilityChange = function(window, document, App = EventBus) {
    var hidden = "hidden";

    // Standards:
    if (hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ("onfocusin" in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;

    function onchange(evt) {
        var v = "visible",
            h = "hidden",
            evtMap = {
                focus: v,
                focusin: v,
                pageshow: v,
                blur: h,
                focusout: h,
                pagehide: h
            };

        evt = evt || window.event;
        
        const listener = (state) => {
            if (state === v) {
                App.$emit('tracker:start');
                App.$emit('inactivity:reset');
                App.$emit('inactivity:start');
                App.isInFocus = true;
            }
            else {
                App.$emit('tracker:stop');
                App.$emit("inactivity:stop");
                App.isInFocus = false;
            }
            console.log(state);
        }

        if (evt.type in evtMap) {
            listener(evtMap[evt.type]);
            
        } else {
            listener(this[hidden] ? "hidden" : "visible");
        }
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if (document[hidden] !== undefined)
        onchange({
            type: document[hidden] ? "blur" : "focus"
        });
}

BindWindowFocusChange(window)
BindWindowVisibilityChange(window, document)