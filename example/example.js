import Swiped from '../src/swiped';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactSwiped from '../src/reactComponent';

Swiped.init({
    elem: '.list1',
    group: 'list',
    right: 200,
    left: 200,
    onOpen: function() {
        console.log('open1');
    },
    onClose: function() {
        console.log('close1');
    },
    onMove: function() {
        console.log('move1');
    }

});

Swiped.init({
    elem: '.list2',
    group: 'list',
    right: 200,
    left: 200,
    onOpen: function() {
        console.log('open2');
    },
    onClose: function() {
        console.log('close2');
    },
    onMove: function() {
        console.log('move2');
    }
});

const App = () => (
    <ReactSwiped options={{left: 200, right: 200}}>
        <div>very</div>
    </ReactSwiped>
);

ReactDOM.render(<App />, document.getElementById('root'));
