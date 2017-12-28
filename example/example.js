import Swiped from '../src';

Swiped.init({
    elem: '.list1',
    group: 'list',
    right: 200,
    left: 200,
    onOpen: function() {
        console.log('open');
    },
    onClose: function() {
        console.log('close');
    },
    onMove: function() {
        console.log('move');
    }

});

Swiped.init({
    elem: '.list2',
    group: 'list',
    right: 200,
    left: 200,
    onOpen: function() {
        console.log('open');
    },
    onClose: function() {
        console.log('close');
    },
    onMove: function() {
        console.log('move');
    }
});
