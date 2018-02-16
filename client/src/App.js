import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import TopMainBar from './components/TopMainBar.js';
import ClassicWallet2 from './components/ClassicWallet2.js';
import PumpDisplay from './components/PumpDisplay.js';


import WalletIcon from 'react-icons/lib/md/account-balance-wallet.js'


class App extends Component {
  state = {
    displayed : "ClassicWallet2",
    displayOrderDiv : false,
  }

  componentDidMount() {
  }

  handleClick = (e) => {
    console.log(e.target.name);
    this.setState({displayed : e.target.name});
  }

  render() {
    var _displayed
    // TODO A changer en switch bientot
    if (this.state.displayed === "ClassicWallet2") {
      _displayed = <ClassicWallet2 />;
    } else if (this.state.displayed === "PumpDisplay"){
      _displayed = <PumpDisplay/>;
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
        </TopMainBar>
        <div className="mainDiv">
          {_displayed}
        </div>

      </div>
    );
  }
}

export default App;
