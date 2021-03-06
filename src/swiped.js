const msPointer = window.navigator.msPointerEnabled;

const touch = {
    start: msPointer ? 'MSPointerDown' : 'touchstart',
    move: msPointer ? 'MSPointerMove' : 'touchmove',
    end: msPointer ? 'MSPointerUp' : 'touchend'
};

const prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, '');
    var pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1];

    return '-' + pre + '-';
})();

const transitionEvent = (function() {
    let t;
    const el = document.createElement('el');

    const transitions = {
        transition: 'transitionend',
        OTransition: 'oTransitionEnd',
        MozTransition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd'
    };

    for (t in transitions) {
        if (el.style[t] !== undefined) {
            return transitions[t];
        }
    }
})();

const cssProps = {
    'transition': prefix + 'transition',
    'transform': prefix + 'transform'
};

const defaultOptions = {
    duration: 200,
    tolerance: 50,
    time: 200,
    dir: 1,
    right: 0,
    left: 0,
    resistance: true
};

const swiped = new class Swiped {
    constructor() {
        this.items = [];
        this.id = 0;
    }

    init(o) {
        o.id = this.id++;
        const swipe = new Swipe(o);

        this.items.push(swipe);

        return swipe;
    }

    hasSwipedItems() {
        return this.items.some(item => item.swiped);
    }

    destroy(id, isRemoveNode) {
        this.items.forEach((item, i) => {
            if (item.id === id) {
                if (isRemoveNode) {
                    item.elem.parentNode.removeChild(item.elem);
                }
                this.items.splice(i, 1);
            }
        });
    }

    closeAll(groupName) {
        this.items.forEach(item => {
            if (groupName && item.group === groupName || !groupName) {
                item.close(true);
            }
        });
    }

    enable(id) {
        this.items.forEach(item => {
            if (id && item.id === id || !id) {
                item.enable();
            }
        });
    }

    disable(id) {
        this.items.forEach(item => {
            if (id && item.id === id || !id) {
                item.disable();
            }
        });
    }
}();

class Swipe {
    constructor(o = {}) {
        o = Object.assign(defaultOptions, o);

        this.duration = o.duration;
        this.toleranceLeft = o.left && o.left.tolerance || o.tolerance;
        this.toleranceRight = o.right && o.right.tolerance || o.tolerance;
        this.resistanceLeft = typeof o.left === 'object' ? o.left.resistance : o.resistance;
        this.resistanceRight = typeof o.right === 'object' ? o.right.resistance : o.resistance;
        this.time = o.time;
        this.width = o.left || o.right;
        this.dir = o.dir;
        this.group = o.group;
        this.id = o.id;
        this.elem = typeof o.elem === 'string' ? document.querySelector(o.elem) : o.elem;

        this.onOpen = o.onOpen;
        this.onClose = o.onClose;
        this.onMove = o.onMove;
        this.stopPropagation = o.stopPropagation;
        this.onAnimationOpenEnds = o.onAnimationOpenEnds;
        this.onAnimationCloseEnds = o.onAnimationCloseEnds;

        this.right = typeof o.right === 'number' ? o.right : o.right.distance;
        this.left = typeof o.left === 'number' ? o.left : o.left.distance;
        this.disabled = false;

        if (
            (this.right > 0 && this.toleranceRight > this.right) ||
            (this.left > 0 && this.toleranceLeft > this.left)
        ) {
            console.warn('tolerance must be less then left and right');
        }

        this.bindEvents();
    }

    destroy(isRemoveNode) {
        swiped.destroy(this.id, isRemoveNode);
    }

    disable() {
        this.disabled = true;
    }

    enable() {
        this.disabled = false;
    }

    transitionEnd(node, cb) {
        const trEnd = () => {
            if (cb) {
                cb();
            }

            node.removeEventListener(transitionEvent, trEnd);
        };

        node.addEventListener(transitionEvent, trEnd);
    }

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

        if (e.touches.length !== 1 || this.disabled) {
            return;
        }

        this.touchId = touch.identifier;
        this.x = touch.pageX;
        this.y = touch.pageY;
        this.startTime = new Date();

        this.resetValue();

        this.hadSwipedItems = swiped.hasSwipedItems();

        if (this.group) {
            swiped.closeAll(this.group);
        } else {
            this.close(true);
        }
    }

    touchMove(e) {
        var touch = e.changedTouches[0];

        // touch of the other finger
        if (!this.isValidTouch(e) || this.disabled) {
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
    }

    touchEnd(e) {
        if (this.disabled) {
            return;
        }

        if (!this.isValidTouch(e, true) || !this.startSwipe) {
            if (this.hadSwipedItems && this.stopPropagation) {
                e.stopPropagation();
            }

            return;
        }

        const tolerance = this.dir < 0 ? this.toleranceRight : this.toleranceLeft;

        // if swipe is more then 150px or time is less then 150ms
        if (this.dir * this.delta > tolerance || new Date() - this.startTime < this.time) {
            this.open();
        } else {
            this.close();
        }

        e.stopPropagation();
        e.preventDefault();
    }

    onClick(e) {
        if (this.hadSwipedItems && this.stopPropagation) {
            e.stopPropagation();
        }
    }

    /**
     * Animation of the opening
     */
    open(isForce) {
        this.swiped = true;
        let onOpenRes;

        if (this.onOpen) {
            onOpenRes = this.onOpen(this.delta);
        }

        if (onOpenRes !== false) {
            this.animation(this.dir * this.width);
        }

        if (!isForce) {
            this.transitionEnd(this.elem, this.onAnimationOpenEnds);
        }

        this.resetValue();
    }

    /**
     * Animation of the closing
     */
    close(isForce) {
        this.swiped = false;
        this.animation(0);

        if (this.onClose) {
            this.onClose(this.delta);
        }

        if (!isForce) {
            this.transitionEnd(this.elem, this.onAnimationCloseEnds);
        }

        this.resetValue();
    }

    toggle() {
        if (this.swiped) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * reset to initial values
     */
    resetValue() {
        this.startSwipe = false;
        this.startScroll = false;
        this.delta = 0;
    }

    bindEvents() {
        this.elem.addEventListener(touch.move, (e) => this.touchMove(e));
        this.elem.addEventListener(touch.end, (e) => this.touchEnd(e));
        this.elem.addEventListener(touch.start, (e) => this.touchStart(e));
        this.elem.addEventListener('click', (e) => this.onClick(e));
    }

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
    }

    /**
     * Which of the touch was a first, if it's a multitouch
     * touchId saved on touchstart
     * @param {object} e - event
     * @param {boolean} isTouchEnd
     * @returns {boolean}
     */
    isValidTouch(e, isTouchEnd) {
        // take a targetTouches because need events on this node
        // targetTouches is empty in touchEnd, therefore take a changedTouches
        var touches = isTouchEnd ? 'changedTouches' : 'targetTouches';

        return e[touches][0].identifier === this.touchId;
    }

    move() {
        if ((this.dir > 0 && (this.delta < 0 || this.left === 0)) || (this.dir < 0 && (this.delta > 0 || this.right === 0))) {
            return false;
        }

        if (this.dir > 0 && this.resistanceLeft || this.dir < 0 && this.resistanceRight) {
            this.calcResistanceData();
        }

        this.animation(this.delta, 0);

        if (this.onMove) {
            this.onMove(this.delta);
        }
    }

    calcResistanceData() {
        var deltaAbs = Math.abs(this.delta);

        if (deltaAbs > this.width) {
            // linear deceleration
            this.delta = this.dir * (this.width + (deltaAbs - this.width) / 8);
        }
    }

    animation(x, duration) {
        duration = duration === undefined ? this.duration : duration;

        this.elem.style.cssText = cssProps.transition + ':' + cssProps.transform + ' ' + duration + 'ms; ' +
            cssProps.transform + ':' + 'translate3d(' + x + 'px, 0px, 0px)';
    }
}

export default swiped;
