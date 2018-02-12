import React, { Component } from 'react';
import './ClassicWallet.css';

import Card from './Card.js';
import RefCurrCard from './RefCurrCard.js';
import ClassicPieChart from './ClassicPieChart.js'
import ClassicCard from './ClassicCard.js';

import CardSmallChart from './CardSmallChart.js';

import { ResponsiveContainer, LineChart, Line, CartesianGrid,
  Tooltip, YAxis, XAxis,ReferenceLine } from 'recharts';


const chartDateButton = ['3h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];

class ClassicWallet extends Component {
  state = {
    wallets : [],
    bitcoin : {},
    totalBTC : null,
    selectedDateForCharts : "1j",
    walletArchive : [],
    researchedCurrency : null
  };

  componentDidMount() {
    this.getFullWallet();
    this.getBitcoinInfo();
    this.getWalletArchive();
  }

  getFullWallet = () => {
    fetch('/api/getFullWallet')
      .then(res => res.json())
      .then(res => this.setState( { wallets : res.wallets,  totalBTC : res.totalBTC } ))
  }

  getBitcoinInfo = () => {
    fetch('/api/getBitcoinInfo')
      .then(res => res.json())
      .then(res => this.setState({bitcoin : res}))
  }

  calculatePourcentage = () => {
    for (var _i in this.state.wallets) {
      var _wallets = this.state.wallets;
      _wallets[_i].Pourcent = Math.round(((_wallets[_i].Balance*_wallets[_i].Cours)/this.state.totalBTC)*10000)/100;
    }
  }

  renderWalletCards = () => {
    return this.state.wallets.map(wallets => (
      < Card key={wallets.Currency} totalBTC={this.state.totalBTC} data={wallets} selectedDateForCharts={this.state.selectedDateForCharts}>
      </Card>
    ))
  }

  getWalletArchive = () => {
    fetch('/api/getWalletArchive')
      .then(res => res.json())
      .then(res => this.setState({ walletArchive : res}))
  }

  renderDateChartButtons = () => {
    return chartDateButton.map(option => (
      <button type="button" className="btn btn-secondary" value={option} onClick={this.handleClick}>
        {option}
      </button>
    ))
  }

  handleClick = (e) => {
    this.setState({selectedDateForCharts : e.target.value})
  }

  handleResearchBar = (e) => {
    console.log("changed" + e.target.value);
    fetch('/api/getResearchedCurrencyInfo/' + e.target.value)
      .then(res => res.json())
      .then(res => this.setState({researchedCurrency : res}))
  }

  renderResearchCard = () => {
    console.log('rendering');
    console.log(this.state.researchedCurrency);
    var _d = this.state.researchedCurrency;
    if (_d[0].result) {
      return (
        < Card key={_d[0].result.Currency} totalBTC={0} data={_d[0].result}
          selectedDateForCharts={this.state.selectedDateForCharts}>
        </Card>
      )
    }
  }

  render() {
    if (this.state.totalBTC == null) {
			return <div className="globalViewer container">Loading...</div>
		}
    else {
      this.calculatePourcentage();
      console.log(this.state);
      return (
      <div className="container">
        < ClassicCard className='fullWidth'>
          <div className="cardSection" style={{width:"70%"}}>
            <p>Cours actuel du BTC : {this.state.bitcoin.price_usd} $</p>
            <p>Eq BTC total : {(this.state.totalBTC).toFixed(6)} BTC</p>
            <p>Eq $ total : {(this.state.totalBTC*this.state.bitcoin.price_usd).toFixed(2)} $</p>

            <ResponsiveContainer width="100%" height={160}>
              <LineChart  data={this.state.walletArchive}>
                <Line type="monotone" dataKey="totalBTCEq" dot={false} stroke="#2196F3" strokeWidth={2}/>
                <XAxis dataKey="date" hide={true}/>
                <YAxis domain={['dataMin', 'dataMax']} hide={true} />
                <CartesianGrid strokeDasharray="3 3" />
                < Tooltip />
              </LineChart>
            </ ResponsiveContainer>

          </div>

          <div className="cardSection" style={{justifyContent:"center"}}>
            <ClassicPieChart data={this.state.wallets}>
              <p>Répartition du portefeuille</p>
            </ClassicPieChart>
          </div>
        </ ClassicCard >

        <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'baseline'}}>
          <div className="input-group mb-3" style={{width:"400px"}}>
            <input type="text" className="form-control" placeholder="Rechercher une crypto"
              aria-label="Recipient's username" aria-describedby="basic-addon2" onChange={this.handleResearchBar}/>
            <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button">Rechercher</button>
            </div>
          </div>
          <div className="btn-group" role="group">
            {this.renderDateChartButtons()}
          </div>
        </div>

        <div>
        < RefCurrCard key="BTCRef" data={{Currency : "BTC", Cours: this.state.bitcoin.price_usd}}
          selectedDateForCharts={this.state.selectedDateForCharts}/>
          {this.renderWalletCards()}
        </div>

      </div>
    );}
  }
}

export default ClassicWallet;
