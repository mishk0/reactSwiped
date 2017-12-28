import Swiped from '../src';
import React from 'react';
import ReactDOM from 'react-dom';

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

const App = () => (
    <div className="App">
        <span>React Swipe</span>
    </div>
);

ReactDOM.render(<App />, document.getElementById('root'));
