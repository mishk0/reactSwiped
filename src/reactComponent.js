import PropTypes from 'prop-types';
import Swiped from './swiped';
import React from 'react';

class ReactSwiped extends React.Component {
    componentDidMount() {
        this.swiped = Swiped.init(Object.assign(this.props.options, { elem: this.node }));
    }

    componentWillUnmount() {
        this.swiped.destroy();
    }

    render() {
        let component = this.props.component || 'div';
        let props = {
            ...this.props,
            ref: node => this.node = node
        };

        return React.createElement(component, props, this.props.children);
    }
}

ReactSwiped.propTypes = {
    left: PropTypes.any,
    right: PropTypes.any,
    className: PropTypes.string,
    component: PropTypes.string
};

export default ReactSwiped;
