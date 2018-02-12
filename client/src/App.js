import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import TopMainBar from './components/TopMainBar.js';
import ClassicWallet2 from './components/ClassicWallet2.js';
import PumpDisplay from './components/PumpDisplay.js';


import WalletIcon from 'react-icons/lib/md/account-balance-wallet.js'


class App extends Component {
  state = {
    displayed : "ClassicWallet2"
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
      <div className="mainDiv">
        < TopMainBar >
          <button className="labelDiv" name="ClassicWallet2" onClick={this.handleClick}>
            <p className="labelIcon"><WalletIcon/></p>
            <p className="labelName">Wallet 2</p>
          </button>
          <button className="labelDiv" name="PumpDisplay" onClick={this.handleClick}>
            <p className="labelIcon"><WalletIcon/></p>
            <p className="labelName">Wallet 2</p>
          </button>
        </ TopMainBar >
        {_displayed}
      </div>
    );
  }
}

export default App;
