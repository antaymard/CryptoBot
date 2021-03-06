import React, { Component } from 'react';
import CardSmallChartBar from './CardSmallChartBar.js';

import CandleChartIcon from 'react-icons/lib/md/equalizer';
import CurrencyPageIcon from 'react-icons/lib/md/book';
import Draggable from 'react-draggable';

import './Card.css';

import CloseIcon from 'react-icons/lib/md/close.js';
import RefreshIcon from 'react-icons/lib/md/refresh';
import IndicatorIcon from 'react-icons/lib/md/brightness-1';


class OrderDiv extends Component {

  renderOrderList = () => {
    return this.props.data.map(_data => (
      <tr key={_data.OrderUuid} className={_data.OrderType.slice(6) == 'BUY' ? 'buyRow' : 'sellRow'}>
        <td>{_data.TimeStamp.slice(8,10)}/{_data.TimeStamp.slice(5,7)}/{_data.TimeStamp.slice(2,4)}
        <br/>
          {_data.TimeStamp.slice(11,19)}
        </td>
        <td>{_data.IsConditional ? "1" : "0"}</td>
        <td>{_data.OrderType.slice(6)}</td>
        <td><b>{_data.PricePerUnit}</b></td>
        <td>{_data.Quantity}</td>
        <td>{_data.QuantityRemaining}</td>
        <td>{_data.Commission}</td>
        <td>{Math.round((_data.PricePerUnit*(_data.Quantity-_data.QuantityRemaining))*100000000)/100000000}</td>
        <td>{Math.round((_data.PricePerUnit*(_data.Quantity-_data.QuantityRemaining)*0.9975)*100000000)/100000000}
        </td>
      </tr>
    ))
  }

  render() {
    console.log(this.props.data);
    if (this.props.data && this.props.data.length !== 0) {
      return(
        <Draggable handle=".orderDivHeader">
        <div className="popUpBtnDiv backDropped-dark" style={{right:"0px", bottom:'40px', width:'auto'}}>
          <div className='orderDivHeader'>
            <p>{this.props.data.length} Transaction(s) {this.props.data[0].Exchange}</p>
            <div>
              {this.props.children}
            </div>
          </div>
          <div className='orderDivBody'>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cond</th>
                  <th>Type</th>
                  <th>Cours Eff</th>
                  <th>Qu échangée</th>
                  <th>Qu restante</th>
                  <th>Fee (BTC)</th>
                  <th>Eq BTC (HT)</th>
                  <th>Eq BTC (TTC)</th>
                </tr>
              </thead>
              <tbody>
                {this.renderOrderList()}
              </tbody>
            </table>
          </div>
        </div>
        </Draggable>

      )
    } else {
      return (
        <Draggable handle=".orderDivHeader">
        <div className="popUpBtnDiv backDropped-dark" style={{right:"0px", bottom:'40px', width:'auto'}}>
          <div className='orderDivHeader'>
            <p>Aucun ordre passé récemment sur ce marché</p>
          </div>
        </div>
        </Draggable>
      )
    }
  }
}

class TradingDiv extends Component {
  state = {
    isLimitOrder : true,
    btcBalance : null,
    currBalance : null,
    currInfo : {},
    input : {
      price : 0,
      btcAmount: 0
    },
    btnInfo: this.props.operation + ' ' + this.props.currency,
    btnStatus : 0 // 0 = normal, 1 = disabled, 2 = error & disabled, 3 = success & disabled
  }

  componentDidMount() {
    this.getPreTransactionInfo();
  }

  getPreTransactionInfo = () => {
    fetch('/api/getPreTransactionInfo/' + this.props.currency)
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.setState({
          btcBalance : res[0].result.Available,
          currBalance : res[1].result.Available,
          currInfo : res[2].result
        });
        this.prefillTradingForm();
      })
  }

  prefillTradingForm = () => {
    if (this.props.operation === 'BUY') {
      this.setState({
        input : {
          price : Math.round(this.state.currInfo.Ask*1.0002*100000000)/100000000,
          amount :this.state.btcBalance
        }
      })
    } else if (this.props.operation === 'SELL') {
      this.setState({ input : {
        price : Math.round(this.state.currInfo.Bid*0.9998*100000000)/100000000,
        amount : this.state.currBalance
      }})
    }
  }

  handleClickTrade = () => {
    console.log(this.props.operation);
    console.log(this.state.input);
    this.setState({ btnInfo : "Passing Order..."});
    this.setState({ btnStatus : 1 });
    if ( !isNaN(this.state.input.price) && !isNaN(this.state.input.amount)) {
      fetch("/api/trade",
        {
          headers: {
            // PUT JWToken here !!
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
            method: "POST",
            body: JSON.stringify({
              operation: this.props.operation,
              currency : this.props.currency,
              price : Number(this.state.input.price),
              amount: Number(this.state.input.amount),
              isLimitOrder : this.state.isLimitOrder
            })
        })
        .then(res =>  res.json())
        .then(res => {
          this.setState({ btnInfo : res.message });
          console.log(res.message);
          if (res.message == 'Success !') {
            this.setState({ btnStatus : 3 });
          }
        })
        .catch(res => {
          this.setState({ btnInfo : res.json() });
          this.setState({ btnStatus : 2 });
          console.log(res.json());
        })

    } else {
      alert('Please enter valid number values');
    }
  }

  handleChangePrice = (e) => {
    var _prev = this.state.input.amount;
    this.setState({
      input : {
        price : (e.target.value),
        amount : _prev
      }
    })
  }
  handleChangeAmount = (e) => {
    var _prev = this.state.input.price;
    this.setState({
      input : {
        amount : (e.target.value),
        price : _prev
      }
    })
  }
  handleCheckboxChange = () => {
    console.log('checked !');
    this.setState({isLimitOrder : !this.state.isLimitOrder})
  }

  render () {
    if (this.props.currency !== 'BTC') {
      return (
        <Draggable handle=".orderDivHeader">
        <div className="popUpBtnDiv backDropped-dark" style={{bottom:'40px', left:"0px"}}>
          <div className='orderDivHeader'>
            <p>{this.state.btnInfo}</p>
            <div>
              {this.props.children}
            </div>
          </div>
          <div className='orderDivBody'>
            <div style={{marginBottom : "10px", display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
              <p>Disponible {this.props.currency} : {this.state.currBalance}</p>
              <p>Disponible BTC : {this.state.btcBalance}</p>
            </div>
            <div style={{marginBottom : "10px", display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
              <p>Bid : {this.state.currInfo.Bid}</p>
              <p>Ask : {this.state.currInfo.Ask}</p>
              <p>Last : {this.state.currInfo.Last}</p>
            </div>
            <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
              <div className="input-group mb-3" style={{marginRight:"10px"}}>
                <div className="input-group-prepend">
                  <span className="input-group-text">Amount</span>
                </div>


                <input type="text" className="form-control" aria-label="Amount"
                  value={this.state.input.amount} onChange={this.handleChangeAmount}/>


                <div className="input-group-append">
                  <span className="input-group-text">{this.props.operation === 'BUY' ? 'BTC' : this.props.currency}</span>
                </div>
              </div>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">Price</span>
                </div>
                <input type="text" className="form-control" aria-label="Price"
                  value={this.state.input.price} onChange={this.handleChangePrice}/>
                <div className="input-group-append">
                  <span className="input-group-text">BTC</span>
                </div>
              </div>
            </div>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" onChange={this.handleCheckboxChange} checked={this.state.isLimitOrder}/>
              <label className="form-check-label">Limit Order</label>
            </div>
          </div>
          <div style={{marginTop:'10px', display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
            <button className={'btn backDropped-light ' + (this.props.operation === "BUY" ? "buyBtn " : "sellBtn ")
              + (this.state.btnStatus == 2 ? 'btnError ' : null) + (this.state.btnStatus == 3 ? 'btnSuccess ' : null)}
             style={{width:"100%"}} onClick={this.handleClickTrade} disabled={this.state.btnStatus == 1 ? true : false}>
              {this.state.btnInfo}
            </button>
          </div>
        </div>
        </Draggable>
      )
    } else return null;
  }
}

class Card extends Component {
  state = {
    sendToParentIsOver : false,
    autoRefresh : true,
    reRender : true,
    cours : null,
    balance : this.props.balance,
    eqBtc : null,
    orderHistory : null,
    showOrderDiv : false,
    showTradingDiv : false,
    lastBuyOrder : null,
    operation: null,
    marketCurrencyLong : '',
    logoUrl : ''
  }

  componentDidMount() {
    this.getCurrencyCours();
    this.getOrderHistory();
    this.getLogoAndFullName();
  }

  // Gestion du reRender en cliquant sur le btn => cf refreshCard()
  componentDidUpdate(prevProps, prevState) {
    if (prevState.reRender !== this.state.reRender) {
      this.getCurrencyCours();
      this.getOrderHistory();
    }
  }

  // Send EqBTC to the parent
  sendEqBtcToParent = () => {
    if (this.props.sendEqBtcToParent) {
      var _curr = this.props.currency;
      var _eq = this.state.eqBtc;
      this.props.sendEqBtcToParent({Currency : _curr, EqBtc : _eq});
      this.setState({sendToParentIsOver : true})
    }
  }

  getLogoAndFullName = () => {
    fetch('/getLogoAndFullName/' + this.props.currency)
      .then(res => res.json())
      .then(res => {
        this.setState({
          marketCurrencyLong : res.marketCurrencyLong,
          logoUrl : res.logoUrl
        })
      })
  }

  getCurrencyCours = () => {
    fetch('/api/getCurrencyCours/' + this.props.currency)
      .then(res => res.json())
      .then(res => {
        if (res) {
          this.setState({cours : res.Last});
          var _eqBtc = this.props.balance*res.Last;
          if (this.props.currency === 'BTC') {
            this.setState({eqBtc : this.state.balance})
          } else {
            this.setState({eqBtc : _eqBtc});
          }
        }
        if (!this.state.sendToParentIsOver) {
          this.sendEqBtcToParent();
        }
      })
  }

  getOrderHistory = () => {
    if (this.props.currency !== 'BTC') {
      fetch('/api/getOrderHistory/' + this.props.currency)
        .then(res => res.json())
        .then(res => {
          if (res) {
            this.setState({orderHistory : res});
          } else {
            this.setState({orderHistory : null});
          }
        })
    }
  }

  displayLastBuyOrder = () => {
    if (this.state.orderHistory && this.state.cours) {
      var _lastBuyOrder = this.state.orderHistory.filter(_order => _order.OrderType === 'LIMIT_BUY');
      if (_lastBuyOrder[0]) {
        var _delta = (((this.state.cours-_lastBuyOrder[0].PricePerUnit)/_lastBuyOrder[0].PricePerUnit)*100).toFixed(2);
        return (
          <p style={{color:"white", marginRight:'15px'}}>
            Dernier achat à {_lastBuyOrder[0].PricePerUnit} BTC ({_delta} %)
            <span className={'indicator ' + (Number(_delta) >= 0 ? 'hasGained' : 'hasLost')}> <IndicatorIcon/></span>
          </p>
      )} else {
        return (<p style={{marginRight:'15px'}}>No recent buy order</p>)
      }
    } else {
      return <p style={{marginRight:'15px'}}>Working...</p>
    }
  }

  handleClick = () => {
    this.setState({ showOrderDiv: !this.state.showOrderDiv });
  }
  handleClick2 = (e) => {
    this.setState({ showTradingDiv: !this.state.showTradingDiv, operation : e.target.name });
  }

  refreshCard = () => {
    this.setState({ reRender : !this.state.reRender});
  }

  switchAutoRefresh = () => {
    if (!this.state.autoRefresh) {
      setInterval(this.refreshCard, 30000);
      this.setState({ autoRefresh : true});
    } else if (this.state.autoRefresh) {
      clearInterval(this.timer);
      this.setState({ autoRefresh : false});
    }
  }

  render() {
    //console.log(this.state);
    return (
    <div className="cardBody">

      <div className='topCardSection'>
        <div className="cardSection">
          <p className='title'>
            <img  className='currencyLogo' src ={this.state.logoUrl} />
            {this.state.marketCurrencyLong} ({this.props.currency})
            <a target="_blank" style={{color:"#884d8"}}
               href={'https://bittrex.com/Market/Index?MarketName=BTC-'+ this.props.currency}>
                  <CurrencyPageIcon/>
            </a>
            <a target="_blank" style={{color:"#884d8"}}
               href={'https://bittrex.com/market/marketStandardChart?MarketName=BTC-'+ this.props.currency}>
                  <CandleChartIcon/>
            </a>
          </p>
          <div className="cardSection">
            Balance : {this.props.balance + ' ' + this.props.currency} <br/>
            Eq BTC : {Math.round(this.state.eqBtc*100000000)/100000000} BTC
            <br/>
            <br/>
            <b>Cours : {this.state.cours ? this.state.cours + (this.props.currency === 'BTC' ? ' $' : ' BTC'): 'Getting Cours...'}</b>
            <br/>
          </div>
        </div>

        <div className="cardSection" style={{width:"50%"}}>
          <CardSmallChartBar
                currency={this.props.currency}
                selectedDateForCharts={this.props.selectedDateForCharts}
                ref={"card" + this.props.currency}
          />
        </div>
      </div>


      <div className="botCardSection">

        <div style={{position : 'relative'}}>
          <button className={'btn classicBotBtn refreshBtn ' + (this.state.autoRefresh ? 'autoRefreshBtnActive' : null)}
            name='refresh' style={{marginRight:'10px'}}
            onClick={this.refreshCard} onDoubleClick={this.switchAutoRefresh}>
            <RefreshIcon/>
          </button>
          <button className='btn classicBotBtn buyBtn' name="BUY" style={{marginRight:"10px"}} onClick={this.handleClick2}>
            Acheter
          </button>
          <button className='btn classicBotBtn sellBtn' name="SELL" onClick={this.handleClick2}>
            Vendre
          </button>

          { this.state.showTradingDiv ? <TradingDiv operation={this.state.operation} currency={this.props.currency}>
            <CloseIcon onClick={this.handleClick2}/>
          </TradingDiv>
          : null }
        </div>

        <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
          <div>
            {this.displayLastBuyOrder()}
          </div>
          <div style={{position : 'relative'}}>
            <button className='btn classicBotBtn orderBtn' onClick={this.handleClick}>
              Passed Orders</button>
            { this.state.showOrderDiv ? <OrderDiv data={this.state.orderHistory}>
              <CloseIcon onClick={this.handleClick}/>
            </OrderDiv>
            : null }
          </div>
        </div>

      </div>

    </div>
    );
  }
}

export default Card;
