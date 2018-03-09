import React, { Component } from 'react';
import CardSmallChartBar from './CardSmallChartBar.js';

import './Card.css';


class RefCurrCard extends Component {
  state = {
    cours : null
  }

  componentDidMount() {
    fetch('/api/getCurrencyCours/' + this.props.currency)
      .then(res => res.json())
      .then(res => {
        if (res) {
          this.setState({ cours : res.Last});
        }
      })
  }

  render() {
    return (
      <div className="cardBody">

      <div className='topCardSection' style={{height:"170px"}}>
        <div className="cardSection">
          <p className="title">
            {this.props.currency}
          </p>
          <p className="">Cours : {this.state.cours} $</p>
        </div>

        <div className="cardSection" style={{width:"50%"}}>
          <CardSmallChartBar currency={this.props.currency}
            selectedDateForCharts={this.props.selectedDateForCharts}
            ref="card"
          />
        </div>
      </div>
    </div>
    );
  }
}

export default RefCurrCard;
