var msPointer = window.navigator.msPointerEnabled;

var touch = {
    start: msPointer ? 'MSPointerDown' : 'touchstart',
    move: msPointer ? 'MSPointerMove' : 'touchmove',
    end: msPointer ? 'MSPointerUp' : 'touchend'
};

var prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, '');
    var pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1];

    return '-' + pre + '-';
})();

var transitionEvent = (function() {
    var t,
        el = document.createElement("fakeelement");

    var transitions = {
        "transition"      : "transitionend",
        "OTransition"     : "oTransitionEnd",
        "MozTransition"   : "transitionend",
        "WebkitTransition": "webkitTransitionEnd"
    };

    for (t in transitions){
        if (el.style[t] !== undefined){
            return transitions[t];
        }
    }
})();

var cssProps = {
    'transition': prefix + 'transition',
    'transform': prefix + 'transform'
};

var fn = function() {};

class Swipe {
    constructor(o = {}) {
        o = Object.assign(this.defaultOptions, o);

        this.duration = o.duration;
        this.tolerance = o.tolerance;
        this.time = o.time;
        this.width = o.left || o.right;
        this.list = o.list;
        this.dir = o.dir;
        this.group = o.group;
        this.id = o.id;
        this.elem = typeof o.elem === 'string' ? document.querySelector(o.elem) : o.elem;

        this.onOpen = typeof o.onOpen === 'function' ? o.onOpen : fn;
        this.onClose = typeof o.onClose === 'function' ? o.onClose : fn;

        this.right = o.right;
        this.left = o.left;

        if (
            (o.right > 0 && o.tolerance > o.right) ||
            (o.left > 0 && o.tolerance > o.left)
        ) {
            console.warn('tolerance must be less then left and right');
        }

        this._bindEvents();
    };

    get defaultOptions() {
        return {
            duration: 200,
            tolerance: 50,
            time: 200,
            dir: 1,
            right: 0,
            left: 0
        };
    }

    _closeAll(groupNumber) {
        _elems.forEach(function(Swiped) {
            if (Swiped.group === groupNumber) {
                Swiped.close(true);
            }
        });
    };

    transitionEnd(node, cb) {
        var that = this;

        function trEnd() {
            cb.call(that);
            node.removeEventListener(transitionEvent, trEnd);
        }

        node.addEventListener(transitionEvent, trEnd);
    };

    /**
     * swipe.x - initial coordinate Х
     * swipe.y - initial coordinate Y
     * swipe.delta - distance
     * swipe.startSwipe - swipe is starting
     * swipe.startScroll - scroll is starting
     * swipe.startTime - necessary for the short swipe
     * swipe.touchId - ID of the first touch
     */

    touchStart(e) {
        var touch = e.changedTouches[0];

        if (e.touches.length !== 1) {
            return;
        }

        this.touchId = touch.identifier;
        this.x = touch.pageX;
        this.y = touch.pageY;
        this.startTime = new Date();

        this.resetValue();

        if (this.list) {
            Swiped._closeAll(this.group);
        } else {
            this.close(true);
        }
    };

    touchMove(e) {
        var touch = e.changedTouches[0];

        // touch of the other finger
        if (!this.isValidTouch(e)) {
            return;
        }

        this.delta = touch.pageX - this.x;

        this.dir = this.delta < 0 ? -1 : 1;
        this.width = this.delta < 0 ? this.right : this.left;

        this.defineUserAction(touch);

        if (this.startSwipe) {
            this.move();

            //prevent scroll
            e.preventDefault();
        }
    };

    touchEnd(e) {
        if (!this.isValidTouch(e, true) || !this.startSwipe) {
            return;
        }

        // if swipe is more then 150px or time is less then 150ms
        if (this.dir * this.delta > this.tolerance || new Date() - this.startTime < this.time) {
            this.open();
        } else {
            this.close();
        }

        e.stopPropagation();
        e.preventDefault();
    };

    /**
     * Animation of the opening
     */
    open(isForce) {
        this.animation(this.dir * this.width);
        this.swiped = true;

        if (!isForce) {
            this.transitionEnd(this.elem, this.onOpen);
        }

        this.resetValue();
    };

    /**
     * Animation of the closing
     */
    close(isForce) {
        this.animation(0);
        this.swiped = false;

        if (!isForce) {
            this.transitionEnd(this.elem, this.onClose);
        }

        this.resetValue();
    };

    toggle() {
        if (this.swiped) {
            this.close();
        } else {
            this.open();
        }
    };

    /**
     * reset to initial values
     */
    resetValue() {
        this.startSwipe = false;
        this.startScroll = false;
        this.delta = 0;
    };

     _bindEvents() {
        delegate(touch.move, 'touchMove');
        delegate(touch.end, 'touchEnd');
        delegate(touch.start, 'touchStart');
    };

    /**
     * detect of the user action: swipe or scroll
     */
    defineUserAction(touch) {
        var DELTA_X = 10;
        var DELTA_Y = 10;

        if (Math.abs(this.y - touch.pageY) > DELTA_Y && !this.startSwipe) {
            this.startScroll = true;
        } else if (Math.abs(this.delta) > DELTA_X && !this.startScroll) {
            this.startSwipe = true;
        }
    };

    /**
     * Which of the touch was a first, if it's a multitouch
     * touchId saved on touchstart
     * @param {object} e - event
     * @returns {boolean}
     */
    isValidTouch(e, isTouchEnd) {
        // take a targetTouches because need events on this node
        // targetTouches is empty in touchEnd, therefore take a changedTouches
        var touches = isTouchEnd ? 'changedTouches' : 'targetTouches';

        return e[touches][0].identifier === this.touchId;
    };

    move() {
        if ((this.dir > 0 && (this.delta < 0 || this.left === 0)) || (this.dir < 0 && (this.delta > 0 || this.right === 0))) {
            return false;
        }

        var deltaAbs = Math.abs(this.delta);

        if (deltaAbs > this.width) {
            // linear deceleration
            this.delta = this.dir * (this.width + (deltaAbs - this.width) / 8);
        }

        this.animation(this.delta, 0);
    };

    animation(x, duration) {
        duration = duration === undefined ? this.duration : duration;

        this.elem.style.cssText = cssProps.transition + ':' + cssProps.transform + ' ' + duration + 'ms; ' +
            cssProps.transform  + ':' + 'translate3d(' + x + 'px, 0px, 0px)';
    };

    destroy(isRemoveNode) {
        var id = this.id;

        Swiped._elems.forEach(function(elem, i) {
            if (elem.id === id) {
                Swiped._elems.splice(i, 1);
            }
        });

        if (isRemoveNode) {
            this.elem.parentNode.removeChild(this.elem);
        }
    };
}

export default new class Swiped {
    constructor() {
        this._elems = [];
        this.elemId = 0;
    }

    init(o) {
        o.id = this.elemId++;
        return this._elems.push(new Swipe(o));
    };
}
