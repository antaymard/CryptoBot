import React, { Component } from 'react';

import './PumpDisplay.css';


class PumpDisplay extends Component {
  state = {
    // pumpDate : XXX,
  }

  componentDidMount() {
  }

  getWIPResults = () => {
    fetch('/api/getWIPResults')
      .then(res => res.json())
      .then(res => this.setState({ results : res }))
  }

  handleChangePumpDate = (e) => {
    this.setState({
      pumpDate : e.target.value
    })
  }
  handleChangeCurrencyToStudy = (e) => {
    this.setState({
      currencyToStudy : e.target.value
    })
  }

  render() {
    return (
      <div className="container">
        <div className='settingsCard'>
          <h5>Optimisation de l'algo Pump</h5>

          <div className="form-group">
            <input type="text" className="form-control" id='minVolumeInput'
              placeholder='Monnaie à étudier'
              value={this.state.currencyToStudy} onChange={this.handleChangeCurrencyToStudy}/>
          </div>

          <div className="form-group">
            <input type="text" className="form-control" id='minVolumeInput'
              placeholder='Date du pump'
              value={this.state.pumpDate} onChange={this.handleChangePumpDate}/>
          </div>

        </div>

      </div>
    )
  }
}

export default PumpDisplay;
