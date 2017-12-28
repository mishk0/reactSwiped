import Swiped from '../src';
debugger;
var a1 = Swiped.init({
    elem: '.list1 li',
    right: 200,
    onOpen: function() {
        this.destroy(true)
    },
    onClose: function() {
        console.log('close')
    }
});
document.querySelector('.foo span').addEventListener('touchstart', function(e) {
    a4.toggle();
    e.stopPropagation();
    e.preventDefault();
});
