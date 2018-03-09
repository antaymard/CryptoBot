import React, { Component } from 'react';

import './PumpDisplay.css';


class PumpDisplay extends Component {
  state = {
    results : [],
    thresholdFilter : 0,
    minVolume : 0,
    onlyPosCandles : true,
    maxOldVolumes : 10000,
    minOldVolumes : 0
  }

  componentDidMount() {
    this.getPumpAlgoResults();
  }

  getPumpAlgoResults = () => {
    fetch('/api/getPumpAlgoResults')
      .then(res => res.json())
      .then(res => this.setState({ results : res }))
  }

  renderResults = () => {
    console.log("launched " + this.state.results.length)

    // Select quand le dernier volume est au dessus de X fois la moyenne des anciens
    var _e = this.state.results.filter(e => e.lastVolume > e.meanVolume*this.state.thresholdFilter);

    // Select quand le volume moyen est inf au max indiqué
    _e = _e.filter(e => e.meanVolume < this.state.maxOldVolumes);
    // Select quand les mean volumes sont sup à un min
    _e = _e.filter(e => e.meanVolume > this.state.minOldVolumes);


    // Select quand le dernier volume est supérieur à un min indiqué
    _e = _e.filter(e => e.lastVolume > this.state.minVolume);

    if (this.state.onlyPosCandles) {
      _e = _e.filter(e => e.candlesToConsider.length > 4);
      //_e = _e.filter(f => f.candlesToConsider[candlesToConsider.length-1].O < e.candlesToConsider[candlesToConsider.length-1].C)
      console.log(_e);
    }
    return _e.map(_f => (
      <tr key={_f.updateDate}>
        <td>{_f.market}</td>
        <td>{_f.meanVolume}</td>
        <td>{_f.lastVolume}</td>
      </tr>
    ))
  }

  // Handling form
  handleChangeThreshold = (e) => {
    this.setState({
      thresholdFilter : Number(e.target.value)
    })
  }
  handleChangeMinVolume = (e) => {
    this.setState({
      minVolume : Number(e.target.value)
    })
  }
  handleChangeOnlyPosCandles = () => {
    console.log("clicked");
    this.setState({
      onlyPosCandles : !this.state.onlyPosCandles
    })
  }
  handleChangeMaxOldVolume = (e) => {
    this.setState({
      maxOldVolumes : Number(e.target.value)
    })
  }
  handleChangeMinOldVolume = (e) => {
    this.setState({
      minOldVolumes : Number(e.target.value)
    })
  }

  render() {
    if (this.state.results.length > 0) {
      return (
        <div className="container">
          <div className='settingsCard'>
            <h5>Paramètres de selection</h5>

            <div className='settingsCardSection'>

              <div className='settingsCardSubsection'>
                <div className="form-group">
                  <label htmlFor="thresholdInput">Seuil de positivité</label>
                  <input type="Number" className="form-control" id='thresholdInput'
                    placeholder='Threshold Value Coefficient'
                    value={this.state.thresholdFilter} onChange={this.handleChangeThreshold}/>
                </div>

                <div className="form-group">
                  <label htmlFor="minVolumeInput">Dernier volume minimum</label>
                  <input type="Number" className="form-control" id='minVolumeInput'
                    placeholder='Threshold Value Coefficient'
                    value={this.state.minVolume} onChange={this.handleChangeMinVolume}/>
                </div>
              </div>

              <div className='settingsCardSubsection'>

                <div className="form-group">
                  <label htmlFor="maxVolumesInput">Mean Volume maximum</label>
                  <input type="Number" className="form-control" id='maxVolumesInput'
                    placeholder='Threshold Value Coefficient'
                    value={this.state.maxOldVolumes} onChange={this.handleChangeMaxOldVolume}/>
                </div>

                <div className="form-group">
                  <label htmlFor="minVolumesInput">Mean Volume minimum</label>
                  <input type="Number" className="form-control" id='minVolumesInput'
                    placeholder='Threshold Value Coefficient'
                    value={this.state.minOldVolumes} onChange={this.handleChangeMinOldVolume}/>
                </div>

                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="exampleCheck1"/>
                  <label className="form-check-label" htmlFor="exampleCheck1"
                    onChange={this.handleChangeOnlyPosCandles} checked={this.state.onlyPosCandles}>
                    Seulement les candles montantes
                  </label>
                </div>
              </div>

            </div>
          </div>

          <p>XX marchés sont positifs</p>
          <table className='table'>
            <thead>
              <tr>
                <th>Market</th>
                <th>Mean Volume</th>
                <th>Last Volume</th>
              </tr>
            </thead>
            <tbody>
              {this.renderResults()}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className='container'>
          <p>Working...</p>
        </div>
      )
    }
  }
}

export default PumpDisplay;
