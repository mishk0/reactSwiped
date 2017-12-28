import Swiped from '../src';

Swiped.init({
    elem: '.list1',
    right: 200,
    onOpen: function() {
        this.destroy(true)
    },
    onClose: function() {
        console.log('close')
    }
});
