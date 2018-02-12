import React, { Component } from 'react';
import './ClassicCard.css';


class ClassicCard extends Component {

  componentDidMount() {
  }


  render() {
    return (
      <div className="classicCardBody">
        {this.props.children}
      </div>
    );
  }
}

export default ClassicCard;
