import React, { Component } from 'react';
import CardSmallChart from './CardSmallChart.js';

import CandleChartIcon from 'react-icons/lib/md/equalizer';
import Draggable from 'react-draggable';

import './Card.css';

import CloseIcon from 'react-icons/lib/md/close.js'


class OrderDiv extends Component {
  renderOrderList = () => {
    return this.props.data.map(_data => (
      <tr>
        <td>{_data.TimeStamp.slice(8,10)}/{_data.TimeStamp.slice(5,7)}/{_data.TimeStamp.slice(2,4)}
        <br/>
        {_data.TimeStamp.slice(11,19)}
        </td>
        <td>{_data.OrderType.slice(6)}</td>
        <td>{_data.PricePerUnit}</td>
        <td>{_data.Quantity}</td>
        <td>{_data.QuantityRemaining}</td>
      </tr>
    ))
  }

  render() {
    console.log(this.props.data);
    if (this.props.data) {
      return(
        <Draggable handle=".orderDivHeader">
        <div className="popUpBtnDiv backDropped-dark" style={{right:"0px"}}>
          <div className='orderDivHeader'>
            <p>{this.props.data.length} Transaction(s) {this.props.data[0].Exchange}</p>
            <div>
            <CloseIcon/>
            </div>
          </div>
          <div className='orderDivBody'>
            <table className="table table-hover">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Cours Eff</th>
                <th>Qu échangée</th>
                <th>Qu restante</th>
              </tr>
                {this.renderOrderList()}
            </table>
          </div>
        </div>
        </Draggable>

      )
    } else {
      return null
    }
  }
}

class TradingDiv extends Component {
  state = {
    btcBalance : null,
    currBalance : null,
    currInfo : {},
    input : {
      price : "Processing...",
      amount: "Processing..."
    }
  }

  componentDidMount() {
    this.getPreTransactionInfo();
  }

  getPreTransactionInfo = () => {
    fetch('/api/getPreTransactionInfo/' + this.props.currency)
      .then(res => res.json())
      .then(res => {
        this.setState({
          btcBalance : res[0].result.Balance,
          currBalance : res[1].result.Balance,
          currInfo : res[2].result
        });
        this.prefillTradingForm();
      })
  }

  prefillTradingForm = () => {
    if (this.props.operation === 'BUY') {
      this.setState({ input : {
        price : this.state.currInfo.Ask*1.05,
        amount : this.state.btcBalance
      }})
    } else if (this.props.operation === 'SELL') {
      this.setState({ input : {
        price : this.state.currInfo.Bid*0.95,
        amount : this.state.currBalance
      }})
    }
  }

  handleChangePrice = (e) => {
    this.setState({input : { price : e.target.value}})
    console.log(this.state);
  }
  handleChangeAmount = (e) => {
    this.setState({input : { amount : e.target.value}})
    console.log(this.state);
  }

  render () {
    return (
      <Draggable handle=".orderDivHeader">
      <div className="popUpBtnDiv backDropped-dark" style={{left:"0px"}}>
        <div className='orderDivHeader'>
          <p>{this.props.operation === 'BUY' ? 'Acheter' : 'Vendre'} {this.props.currency}</p>
          <div>
          <CloseIcon/>
          </div>
        </div>
        <div className='orderDivBody'>
          <div style={{marginBottom : "10px", display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
            <p>Balance {this.props.currency} : {this.state.currBalance}</p>
            <p>Balance BTC : {this.state.btcBalance}</p>
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
        </div>
        <div style={{marginTop:'10px', display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
          <button className={'btn backDropped-light ' + (this.props.operation === "BUY" ? "buyBtn" : "sellBtn")} style={{width:"100%"}}>
            {this.props.operation === 'BUY' ? 'Acheter ' + this.props.currency : 'Vendre ' + this.props.currency }</button>
        </div>
      </div>
      </Draggable>
    )
  }
}

class Card extends Component {
  state = {
    orderHistory : null,
    showOrderDiv : false,
    showTradingDiv : false,
    lastBuyOrder : null,
    operation: null
  }

  componentDidMount() {
    this.getOrderHistory();
  }

  displayLastBuyOrder = () => {
    if (this.state.orderHistory) {
      var _lastBuyOrder = this.state.orderHistory.filter(_order => _order.OrderType === 'LIMIT_BUY');
      if (_lastBuyOrder[0]) {
        return (
        <p style={{color:"white", marginRight:'15px'}}>
        Dernier achat à {_lastBuyOrder[0].PricePerUnit} BTC ({(((this.props.data.Cours-_lastBuyOrder[0].PricePerUnit)/this.props.data.Cours)*100).toFixed(2)} %)</p>
      )} else {
        return (<p style={{marginRight:'15px'}}>No recent buy order</p>)
      }
    } else {
      return <p style={{marginRight:'15px'}}>Working...</p>
    }
  }

  getOrderHistory = () => {
    fetch('/api/getOrderHistory/' + this.props.data.Currency)
      .then(res => res.json())
      .then(res => {
        this.setState({orderHistory : res});
      })
  }

  handleClick = () => {
        this.setState({ showOrderDiv: !this.state.showOrderDiv });
  }

  handleClick2 = (e) => {
    this.setState({ showTradingDiv: !this.state.showTradingDiv, operation : e.target.name });
  }

  render() {
    return (
      <div className="cardBody">

      <div className='topCardSection'>
        <div className="cardSection">
          <p className="title">
            {this.props.data.Currency} {(this.props.data.Balance * this.props.data.Cours*100 / this.props.totalBTC).toFixed(2) + ' %'}
            <a target="_blank" style={{color:"#884d8"}}
               href={'https://bittrex.com/market/marketStandardChart?MarketName=BTC-'+ this.props.data.Currency}>
                  <CandleChartIcon/>
            </a>
          </p>
          <div className="balanceDiv">
            Balance : {this.props.data.Balance} {this.props.data.Currency}
          </div>
          <p>Equivalent BTC : {(this.props.data.Balance * this.props.data.Cours).toFixed(5)} BTC</p>
          <p style={{marginTop : "20px"}}>Cours : {this.props.data.Cours} BTC</p>
        </div>

        <div className="cardSection" style={{width:"50%"}}>
          < CardSmallChart currencyName={this.props.data.Currency}
            selectedDateForCharts={this.props.selectedDateForCharts}
            ref="card"/>
        </div>
      </div>

      <div className="botCardSection">
        <div style={{position : 'relative'}}>
          <button className='btn backDropped-light buyBtn' name="BUY" style={{marginRight:"10px"}} onClick={this.handleClick2}>
            Acheter</button>
          <button className='btn backDropped-light sellBtn' name="SELL" onClick={this.handleClick2}>
            Vendre</button>
            { this.state.showTradingDiv ? <TradingDiv operation={this.state.operation} currency={this.props.data.Currency}/> : null }
        </div>
        <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
          <div>
            {this.displayLastBuyOrder()}
          </div>
          <div style={{position : 'relative'}}>
            <button className='btn backDropped-light orderBtn' style={{borderRadius:"0px"}} onClick={this.handleClick}>
              Passed Orders</button>
            { this.state.showOrderDiv ? <OrderDiv data={this.state.orderHistory}/> : null }
          </div>
        </div>
      </div>

    </div>
    );
  }
}

export default Card;
