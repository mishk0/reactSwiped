import PropTypes from 'prop-types';
import Swiped from './swiped';
import React, { Component } from 'react';

class ReactSwiped extends Component {
    componentDidMount() {
        this.swiped = Swiped.init(Object.assign(this.props.options, { elem: this.node }));
    }

    componentWillUnmount() {
        this.swiped.destroy();
    }

    render() {
        return (
            <div ref={node => this.node = node} className="reactSwiped list1">
                { this.props.children }
            </div>
        );
    }
}

ReactSwiped.propTypes = {
    left: PropTypes.number,
    right: PropTypes.number
};

export default ReactSwiped;
