import React, { Component } from 'react';
import './ClassicWallet.css';

import Card2 from './Card2.js';
import RefCurrCard from './RefCurrCard.js';
import ClassicPieChart from './ClassicPieChart.js'
import ClassicCard from './ClassicCard.js';

import CardSmallChart from './CardSmallChart.js';

import { ResponsiveContainer, LineChart, Line, CartesianGrid,
  Tooltip, YAxis, XAxis,ReferenceLine } from 'recharts';

import LoadingIcon from 'react-icons/lib/md/autorenew';
import CloseIcon from 'react-icons/lib/md/close.js';
import LoupeIcon from 'react-icons/lib/md/search.js';
import RefreshIcon from 'react-icons/lib/md/refresh';





const chartDateButton = ['3h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];

class WalletLineChart extends Component {

  render() {
    var _initialValue, _finalValue;
    if (!this.props.walletArchive) {
      return(
        <p className="loadingDiv" style={{height:'160px'}}>
          <LoadingIcon/> Loading chart...
        </p>
      )
    } else if (this.props.walletArchive) {
      if (this.props.walletArchive[0]) {
        _initialValue = this.props.walletArchive[0].totalBTCEq;
        _finalValue = this.props.walletArchive[this.props.walletArchive.length-1].totalBTCEq;
      } else if (!this.props.walletArchive[0]) {
        _initialValue = null;
        _finalValue = null;
      }
    return (
      <ResponsiveContainer width="100%" height={160}>
        <LineChart  data={this.props.walletArchive}>
          <Line type="monotone" dataKey="totalBTCEq" dot={false} stroke="#2196F3" strokeWidth={2}/>
          <XAxis dataKey="date" hide={true}/>
          <YAxis domain={['dataMin', 'dataMax']} hide={true}/>
          <ReferenceLine y={_initialValue} label="" stroke="red" strokeDasharray="3 3" />
          <ReferenceLine y={_finalValue} label="" stroke="green" strokeDasharray="3 3" label={(((_finalValue-_initialValue)/_initialValue)*100).toFixed(2)+'%'}/>
          <CartesianGrid strokeDasharray="3 3" />
          < Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  }
  }
}

class ClassicWallet extends Component {
  state = {
    walletList : [], //["BTC", "LTC"...],
    selectedDateForCharts : '1j',
    bitcoinCours : null,
    walletArchive : [],
    walletEqBtc : [],
    pieChartCanBeRendered : false,
    researchedQuery : null,
    researchedResult : null,
  };

  componentDidMount() {
    this.getAllBalances();
    this.getBitcoinInfo();
    this.getWalletArchive();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.walletEqBtc !== this.state.walletEqBtc) {
      if (this.state.walletEqBtc.length === this.state.walletList.length) {
        this.setState({pieChartCanBeRendered : true})
      }
    }
    if (prevState.selectedDateForCharts !== this.state.selectedDateForCharts) {
      this.getWalletArchive();
    }
  }

  getBitcoinInfo = () => {
    fetch('/api/getBitcoinInfo')
      .then(res => res.json())
      .then(res => this.setState( { bitcoinCours : res } ))
  }

  getAllBalances = () => {
    fetch('/api/getAllBalances')
      .then(res => res.json())
      .then(res => {
        this.setState( { walletList : res } );
      })
  }

  // récupère des datas des cartes enfants
  getEqBtcFromCard = (_obj) => {
    this.setState(prevState => ({
      walletEqBtc : [...prevState.walletEqBtc, _obj]
    }))
  }

  calculateTotalPFValue = () => {
    var _totalBTCEq = 0;
    this.state.walletEqBtc.map(r => {
      _totalBTCEq += r.EqBtc;
    })
    return {totalBTCEq : _totalBTCEq.toFixed(5),
            $Eq : (_totalBTCEq*this.state.bitcoinCours).toFixed(2)};
  }

  // Render les cartes
  renderWalletCards = () => {
    return this.state.walletList.map(w => (
      < Card2 key={w.Currency}
              balance = {w.Balance}
              currency={w.Currency}
              selectedDateForCharts={this.state.selectedDateForCharts}
              sendEqBtcToParent={this.getEqBtcFromCard}>
      </Card2>
    ))
  }

  getWalletArchive = () => {
    this.setState({walletArchive : false})
    fetch('/api/getWalletArchive/' + this.state.selectedDateForCharts)
      .then(res => res.json())
      .then(res => {
        this.setState({ walletArchive : res});
        console.log(this.state.walletArchive);
      })
  }

  renderDateChartButtons = () => {
    return chartDateButton.map(option => (
      <button type="button"
       className={"btn btn-selectedDateForCharts " + (this.state.selectedDateForCharts == option ? 'isSelectedDate' : '')}
       value={option} onClick={this.handleClick}>
        {option}
      </button>
    ))
  }

  // Button de changement de date pour les charts
  handleClick = (e) => {
    this.setState({selectedDateForCharts : e.target.value})
  }

  //Fermer les résultats de Recherche
  handleClick2 = () => {
    this.setState({researchedResult : null})
  }

  // Recherche de Crypto
  handleResearchBar = (e) => {
    this.setState({ researchedQuery : e.target.value});
    console.log(this.state.researchedQuery);
  }
  handleSubmit = (event) => {
    console.log("pressed " + this.state.researchedQuery);
    fetch('/api/getResearchedCurrencyInfo/' + this.state.researchedQuery)
      .then(res => res.json())
      .then(res => {
        this.setState({researchedResult : res});
        console.log(this.state);
      })
    event.preventDefault();
  }

  handleRefreshAll = () => {
    console.log("Clicked");
    this.getAllBalances();
  }

  render() {
    if (this.state.walletList == null) {
			return <div className="globalViewer container">Loading Wallet...</div>
		}
    else {
      return (
        <div className='container'>

          <ClassicCard>
            <div className="cardSection" style={{width:"50%", marginBottom:"-20px"}}>
              <h4 style={{marginBottom:'-20px'}}>Répartition du portefeuille</h4>
              {this.state.pieChartCanBeRendered ?
                <ClassicPieChart data={this.state.walletEqBtc}/>
                : <p className="loadingDiv" style={{height:100+'%', marginRight:'20px', marginTop:'25px', marginBottom:'25px'}}>Loading</p>}
            </div>

            <div className="cardSection" style={{width:"50%"}}>
              <h4>Info sur le portefeuille</h4>
                Valeur totale en BTC : {this.state.pieChartCanBeRendered ? this.calculateTotalPFValue().totalBTCEq + ' BTC' : null}<br/>
                Valeur totale en $ : {this.state.pieChartCanBeRendered ? this.calculateTotalPFValue().$Eq + ' $' : null}<br/><br/>
              <h5>Historique de la valeur du portefeuille</h5>
                <WalletLineChart walletArchive={this.state.walletArchive}/>

            </div>
          </ClassicCard>

          <div className="botCardSection" style={{alignItems:'center'}}>

            <div>
              <form onSubmit={this.handleSubmit} style={{display:'flex', flexDirection:'row', alignItems:'center'}} >
                <input className="form-control" style={{width:'300px', borderRadius:'3px 0 0 3px', border:'solid 1px white'}}
                 placeholder="Rechercher une crypto" onChange={this.handleResearchBar}/>
                <button type="" className='btn btn-light' style={{borderRadius:'0 3px 3px 0'}}><LoupeIcon/></button>
               </form>
            </div>

            <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
              <button className='btn btn-selectedDateForCharts'
                name='refresh' style={{marginRight:'10px'}}
                onClick={this.handleRefreshAll}>
                <RefreshIcon/>
              </button>

              <div className="btn-group" role="group">
                {this.renderDateChartButtons()}
              </div>
            </div>

          </div>

          {this.state.researchedResult ?
            <div style={{marginBottom:'50px'}}>
              <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'baseline'}}>
                <h5 style={{marginTop:'15px'}}>Résultat</h5>
                <CloseIcon style={{cursor: 'pointer'}} onClick={this.handleClick2}/>
              </div>
              <Card2 key={this.state.researchedResult[0].result.Currency}
                     balance = {this.state.researchedResult[0].result.Balance}
                     currency={this.state.researchedResult[0].result.Currency}
                     selectedDateForCharts={this.state.selectedDateForCharts}
                     sendEqBtcToParent={null}>
              </Card2>
            </div>
          : null}

          {this.state.walletList.filter(r => (r.Currency === "BTC")).length > 0 ? null : <RefCurrCard currency='BTC' selectedDateForCharts={this.state.selectedDateForCharts}/>}

          {this.renderWalletCards()}

        </div>
      )
    }
  }
}

export default ClassicWallet;
