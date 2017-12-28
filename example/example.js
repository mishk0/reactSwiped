import Swiped from '../src';

Swiped.init({
    elem: '.list1',
    right: 200,
    onOpen: function() {
        Swiped.destroy(this.id, true)
    },
    onClose: function() {
        console.log('close')
    }
});
