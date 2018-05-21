import React, { Component } from 'react';
import Card2 from './Card2.js';

// REACT TABLE
import ReactTable from "react-table";
import 'react-table/react-table.css';

// MATERIAL UI
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Badge from 'material-ui/Badge';

import './PumpDisplay.css';

// SOCKET
import openSocket from 'socket.io-client';
const  socket = openSocket('http://88.190.102.232:8080');

class PumpDisplay extends Component {
  state = {
    algoPumpResult : null,
    onlyPosCandles : true,
    timeMachineDateInput : '',
    timeMachineIsEnabled : false
  }

  componentDidMount() {
    this.getPumpAlgoResults();
    socket.on('algoPumpFeedback', feedback => {
      console.log('OMG')
      var r = this.state.algoPumpResult;
      r.metadata.numberOfErrors = feedback.numberOfErrors;
      r.metadata.numberOfSuccess = feedback.numberOfSuccess;
      this.setState({
        algoPumpResult : r
      })
    })
    this.getTimeMachineDate()
  }

  getTimeMachineDate = () => {
    fetch('/api/getDateOfPump')
      .then(res => res.json())
      .then(res => this.setState({ timeMachineDateInput : res.dateOfPump }))
  }

  getPumpAlgoResults = () => {
    fetch('/api/getAlgoPumpResult')
      .then(res => res.json())
      .then(res =>
        {
          this.setState({ algoPumpResult : res });
          console.log(this.state)
        })
    // socket.on('timer', algoPumpResult => this.setState( {algoPumpResult} ));
    // socket.emit('suscribeToAlgoPumpTicker', 1000);
  }

  handleChangeOnlyPosCandles = () => {
    this.setState({
      onlyPosCandles : !this.state.onlyPosCandles
    });
  }

  handleInputChange = (e) => {
    this.setState({
      timeMachineDateInput : e.target.value
    })
  }

  handleTimeMachineCheckChange = () => {
    this.setState({
      timeMachineIsEnabled : !this.state.timeMachineIsEnabled
    });
  }

  runAlgoPump = () => {
    fetch('/api/runAlgoPump/' + (this.state.timeMachineIsEnabled === true ? this.state.timeMachineDateInput : "false"))
    .then(res => res.json())
    .then(res =>
      {
        this.setState({ algoPumpResult : res });
        console.log(this.state)
      })
    .catch(err => console.log(err))
  }

  render() {
    if (this.state.algoPumpResult == null) {
      return <CircularProgress />
    } else {
      var data = this.state.algoPumpResult.results.filter(a => a.calculatedData);
      if (this.state.onlyPosCandles) {
        data = data.filter(a => a.calculatedData.lastFiveMinCandleIsPositive === true);
      }
      const columns = [{
        Header : 'Market',
        accessor : 'market'
      }, {
        id : 'lastOnMeanRatio',
        Header : 'Ratio',
        accessor : d => d.calculatedData.lastOnMeanRatio,
        Cell: row => (
          <span>
            <span style={{
              color: row.value > 1 ? '#57d500' : '#ff2e00',
              transition: 'all .3s ease'
            }}>
              &#x25cf;
            </span> {
              Math.round(row.value*100)/100
            }
          </span>
        )
      }, {
        id : 'lastFiveMinCandleIsPositive',
        Header : 'Positif',
        accessor : d => d.calculatedData.lastFiveMinCandleIsPositive,
        Cell: row => (
          <span>
            <span style={{
              color: row.value === true ? '#57d500' : '#ff2e00',
              transition: 'all .3s ease'
            }}>
              &#x25cf;
            </span> {
              row.value === true ? 'Oui' : 'Non'
            }
          </span>
        )
      }, {
        id : 'meanVolume',
        Header : 'Volume Moyen',
        accessor : d => d.calculatedData.meanVolume,
        Cell: props => Math.round(props.value*100)/100
      }, {
        id : 'lastVolume',
        Header : 'Dernier Volume',
        accessor : d => d.rawData.lastFiveMinCandleVolume,
        Cell: props => Math.round(props.value*100)/100
      }, {
        id : 'lastCandleTime',
        Header : 'Time',
        accessor : d => d.rawData.fiveMinCandles[d.rawData.fiveMinCandles.length-1].T.slice(11,-3),
      }, {
        id : 'normVarianceVolume',
        Header : 'Normalized STD',
        accessor : d => d.calculatedData.normVarianceVolume,
        Cell: props => Math.round(props.value*100)/100
      }, {
        id : 'nbOfDiscoutinuousFiveMin',
        Header : 'Discontinu',
        accessor : d => d.calculatedData.nbOfDiscoutinuousFiveMin,
        Cell: props => Math.round(props.value*100)/100
      }];

      return (
        <div className="container">
          <div className='settingsCard' style={{marginBottom : '12px'}}>
            <h5>AlgoPump</h5>
            <div style={{display: 'flex', flexDirection:'row', justifyContent : 'space-between'}}>
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="exampleCheck1"
                onChange={this.handleChangeOnlyPosCandles} checked={this.state.onlyPosCandles}/>
                <label className="form-check-label" htmlFor="exampleCheck1">
                  Seulement les candles montantes
                </label>
              </div>
              <p>
                Dernière analyse à :
                <Badge
                  badgeContent={this.state.algoPumpResult.metadata.iterations}
                  primary={true} >
                  {this.state.algoPumpResult.metadata.dateOfLastLaunch.slice(11,-8)}
                </Badge>
              </p>
            </div>

            <div style={{display: 'flex', flexDirection:'row', justifyContent : 'space-between', marginTop : '20px', alignItems: 'center'}}>
              <div style={{display: 'flex', flexDirection:'row', justifyContent : 'space-between', alignItems: 'center'}}>
                <TextField
                  id="timeMachineDateInput"
                  value={this.state.timeMachineDateInput}
                  onChange={this.handleInputChange}
                />
                <div className="form-check" style={{ marginLeft : '10px'}}>
                  <input type="checkbox" className="form-check-input" id="exampleCheck1"
                    onChange={this.handleTimeMachineCheckChange} checked={this.state.timeMachineIsEnabled}/>
                    <label className="form-check-label" htmlFor="exampleCheck1">
                      TimeMachine
                    </label>
                  </div>
                </div>
                <div>
                  <FlatButton label="run Algo" primary={true} onClick={this.runAlgoPump}/>
                  <FlatButton label="refresh data" primary={true} onClick={this.getPumpAlgoResults}/>
                </div>
              </div>

              <div style={{
                backgroundColor : "#F5F5F5",
                height : '5px',
                width : '100%',
                display: 'flex'
              }}>
                <div style={{
                  backgroundColor: '#A5D6A7',
                  height: '100%',
                  transition: 'all .3s ease',
                  width : Math.round(this.state.algoPumpResult.metadata.numberOfSuccess*100/this.state.algoPumpResult.metadata.numberOfMarkets) + '%'
                }}></div>
                <div style={{
                  backgroundColor: '#EF9A9A',
                  height: '100%',
                  float : 'right',
                  transition: 'all .3s ease',
                  width : Math.round(this.state.algoPumpResult.metadata.numberOfErrors*100/this.state.algoPumpResult.metadata.numberOfMarkets) + '%'
                }}></div>
              </div>

            </div>

          <ReactTable
            data = {data}
            columns = {columns}
            defaultPageSize={10}
            className="-striped -highlight"
            filterable
            defaultSorted={[
              {
                id: "lastOnMeanRatio",
                desc: true
              }
            ]}
            SubComponent={row => {
              return (
                <div >
                  <Card2
                    key={row.row.market.slice(4)}
                    balance = {null}
                    currency={row.row.market.slice(4)}
                    selectedDateForCharts="2h"
                    sendEqBtcToParent={null}>
                  </Card2>
                </div>
              );
            }}
          />
        </div>
      )
    }
  }
}

export default PumpDisplay;
