import React, { Component } from 'react';
import './App.css';

import TopMainBar from './components/TopMainBar.js';
import ClassicWallet2 from './components/ClassicWallet2.js';
import PumpDisplay from './components/PumpDisplay.js';
import WipDisplay from './components/WipDisplay.js';


class App extends Component {
  state = {
    displayed : "ClassicWallet2",
    // displayOrderDiv : false,
  }

  componentDidMount() {
  }

  handleClick = (e) => {
    //console.log(e.target.name);
    this.setState({displayed : e.target.name});
  }

  render() {
    var _displayed
    switch (this.state.displayed) {
      case "ClassicWallet2" :
        _displayed = <ClassicWallet2 />;
        break;
      case "PumpDisplay" :
        _displayed = <PumpDisplay/>;
        break
      case "WipDisplay" :
        _displayed = <WipDisplay/>;
        break
    }

    return (
      <div>
        <TopMainBar>
          <button className="btn labelBtn" name="ClassicWallet2" onClick={this.handleClick}>
            Classic Wallet
          </button>
          <button className="btn labelBtn" name="PumpDisplay" onClick={this.handleClick}>
            Pump Algorithm
          </button>
          <button className="btn labelBtn" name="WipDisplay" onClick={this.handleClick}>
            Test Display
          </button>
        </TopMainBar>
        <div className="mainDiv">
          {_displayed}
        </div>

      </div>
    );
  }
}

export default App;
