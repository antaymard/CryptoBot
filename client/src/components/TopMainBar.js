import React, { Component } from 'react';
import './TopMainBar.css';

class TopMainBar extends Component {

  componentDidMount() {
  }

  render() {
    return (
      <div className="leftMainBar">
        {this.props.children}
      </div>
    );
  }
}

export default TopMainBar;
