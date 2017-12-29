let msPointer = window.navigator.msPointerEnabled;

let touch = {
    start: msPointer ? 'MSPointerDown' : 'touchstart',
    move: msPointer ? 'MSPointerMove' : 'touchmove',
    end: msPointer ? 'MSPointerUp' : 'touchend'
};

let prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, '');
    var pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1];

    return '-' + pre + '-';
})();

let transitionEvent = (function() {
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

let cssProps = {
    'transition': prefix + 'transition',
    'transform': prefix + 'transform'
};

let defaultOptions = {
    duration: 200,
    tolerance: 50,
    time: 200,
    dir: 1,
    right: 0,
    left: 0
};

let fn = function() {};

let swiped = new class Swiped {
    constructor() {
        this.items = [];
        this.id = 0;
    }

    init(o) {
        o.id = this.id++;
        let swipe = new Swipe(o);

        this.items.push(swipe);

        return swipe;
    };

    destroy(id, isRemoveNode) {
        this.items.forEach((item, i) => {
            if (item.id === id) {
                if (isRemoveNode) {
                    item.elem.parentNode.removeChild(item.elem);
                }
                this.items.splice(i, 1);
            }
        });
    };

    _closeAll(groupNumber) {
        this.items.forEach(item => {
            if (item.group === groupNumber) {
                item.close(true);
            }
        });
    };
};

class Swipe {
    constructor(o = {}) {
        o = Object.assign(defaultOptions, o);

        this.duration = o.duration;
        this.tolerance = o.tolerance;
        this.time = o.time;
        this.width = o.left || o.right;
        this.dir = o.dir;
        this.group = o.group;
        this.id = o.id;
        this.elem = typeof o.elem === 'string' ? document.querySelector(o.elem) : o.elem;

        this.onOpen = typeof o.onOpen === 'function' ? o.onOpen : fn;
        this.onClose = typeof o.onClose === 'function' ? o.onClose : fn;
        this.onMove = typeof o.onMove === 'function' ? o.onMove : fn;

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

    destroy(isRemoveNode) {
        swiped.destroy(this.id, isRemoveNode);
    }

    transitionEnd(node, cb) {
        function trEnd() {
            cb();
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

        if (this.group) {
            swiped._closeAll(this.group);
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
            this.transitionEnd(this.elem, () => this.onOpen());
        }

        this.resetValue();
    };

    /**
     * Animation of the closing
     */
    close(isForce) {
        console.log(1);
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
         this.elem.addEventListener(touch.move, (e) => this.touchMove(e));
         this.elem.addEventListener(touch.end, (e) => this.touchEnd(e));
         this.elem.addEventListener(touch.start, (e) => this.touchStart(e));
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
        this.onMove(this.delta);
    };

    animation(x, duration) {
        duration = duration === undefined ? this.duration : duration;

        this.elem.style.cssText = cssProps.transition + ':' + cssProps.transform + ' ' + duration + 'ms; ' +
            cssProps.transform  + ':' + 'translate3d(' + x + 'px, 0px, 0px)';
    };
}

export default swiped;