import React, { Component } from 'react';
import './TopMainBar.css';

import NotifPopup from './NotifPopup.js';


import Clock from 'react-live-clock';
import Draggable from 'react-draggable';

import CloseIcon from 'react-icons/lib/md/close.js';
import CancelIcon from 'react-icons/lib/md/cancel.js';
import LoadingIcon from 'react-icons/lib/md/autorenew';

class Calculator extends Component {
  state = {
    number1 : 0,
    number2 : 0,
    result : 0,
  }

  changeNumber1 = (e) => {
    this.setState({ number1 : e.target.value});
    var result = ((this.state.number2 - e.target.value)/e.target.value)*100;
    this.setState({result : result});
  }
  changeNumber2 = (e) => {
    this.setState({ number2 : e.target.value});
    var result = ((e.target.value - this.state.number1)/this.state.number1)*100;
    this.setState({result : result});
  }
  changeResult = (e) => {
    this.setState({ result : e.target.value});
    var number1 = (((e.target.value/100)+1)*this.state.number2);
    this.setState({number1 : number1});
  }


  render() {
    return (
      <Draggable handle=".orderDivHeader">
        <div className="popUpBtnDiv backDropped-dark" style={{right:"12px", top:'38px', width:'300px'}}>
          <div className='orderDivHeader'>
            <p>Calculatrice d'écarts</p>
            {this.props.children}
          </div>
          <div className='orderDivBody'>
            <div style={{display:'flex', flexDirection:'row', marginBottom : '5px'}}>
              <input className="form-control" style={{width:'50%', marginRight:'5px'}} value={this.state.number1} onChange={this.changeNumber1}/>
              <input className="form-control" style={{width:'50%'}} value={this.state.number2} onChange={this.changeNumber2}/>
            </div>
            <input className="form-control" value={this.state.result} onChange={this.changeResult}/>
          </div>
        </div>
      </Draggable>
    );
  }
}


class OrderDiv extends Component {
  state = {
    tab : 'openOrders',
    orderHistory : null,
    popup : {}
  }

  componentDidMount() {
    this.getOpenOrders();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.tab !== this.state.tab) {
      if (this.state.tab === 'openOrders') {
        console.log('still calling open');
        this.getOpenOrders();
      } else if (this.state.tab === 'closeOrders') {
        console.log('tab state changed to closeOrders');
        this.getCloseOrders();
      }
    }
  }

  // POPUP Management
  closePopup = () => {
    console.log('LOLILOL');
    this.setState({ showPopup : false });
    console.log(this.state);
  }

  // Render OPEN ORDERS table
  getOpenOrders = () => {
    fetch('/api/getOpenOrders')
      .then(res => res.json())
      .then(res => {
        if (res) {
          this.setState({ orderHistory : res})
        } else {
          this.setState({ orderHistory : null})
        }
      })
  }
  renderOpenOrderListHeader = () => {
    return (
      <tr>
        <th>Marché</th>
        <th>Opened</th>
        <th>Type</th>
        <th>Prix proposé</th>
        <th>Quantité vendue</th>
        <th>Closed</th>
        <th>Prix eff</th>
        <th>Price?</th>
        <th>Commission payée</th>
        <th>Annuler</th>
      </tr>
    )
  }
  renderOpenOrderList = () => {
    return this.state.orderHistory.map(d => (
      <tr key={d.OrderUuid}>

        <td>{d.Exchange}</td>

        <td>
          {d.Opened.slice(8,10)}/{d.Opened.slice(5,7)}/{d.Opened.slice(2,4)}
          <br/>
          {d.Opened.slice(11,19)}
        </td>

        <td>
          {d.OrderType.slice(6)}
          <br/>
          {d.Condition}
        </td>

        <td><b>{d.Limit}</b></td>

        <td>{d.Quantity - d.QuantityRemaining} / {d.Quantity}</td>

        {d.Closed !== null ?
          <td>
            {d.Closed.slice(8,10)}/{d.Closed.slice(5,7)}/{d.Closed.slice(2,4)}
            <br/>
            {d.Closed.slice(11,19)}
          </td>
          : <td>En cours</td>
        }

        {d.PricePerUnit !== null ?
          <td>
            {d.PricePerUnit}
          </td>
          : <td>En cours</td>
        }

        <td>{d.Price}</td>

        <td>{d.CommissionPaid}</td>

        <td>
          <button className='btn orderCancelBtn' onClick={() => this.cancelOrder(d.OrderUuid)}>
            <CancelIcon/>
          </button>
        </td>
      </tr>
    ))
  }

  getCloseOrders = () => {
    this.setState({ orderHistory : null});
    fetch('/api/getOrderHistory/_all')
      .then(res => res.json())
      .then(res => {
        console.log(res);
        if (res) {
          this.setState({ orderHistory : res})
        } else {
          this.setState({ orderHistory : null})
        }
      })
  }
  renderCloseOrderListHeader = () => {
    return (
      <tr>
        <th>Marché</th>
        <th>Opened</th>
        <th>Type</th>
        <th>Prix proposé</th>
        <th>Quantité vendue</th>
        <th>Closed</th>
        <th>Prix eff</th>
        <th>Prix total</th>
        <th>Commission</th>
      </tr>
    )
  }
  renderCloseOrderList = () => {
    if (this.state.orderHistory[0].TimeStamp) {
      return this.state.orderHistory.map(d => (
        <tr key={d.OrderUuid}>

          <td>{d.Exchange}</td>

          <td>
            {d.TimeStamp.slice(8,10)}/{d.TimeStamp.slice(5,7)}/{d.TimeStamp.slice(2,4)}
            <br/>
            {d.TimeStamp.slice(11,19)}
          </td>

          <td>
            {d.OrderType.slice(6)}
            <br/>
            {d.Condition}
          </td>

          <td>{d.Limit}</td>

          <td>{d.Quantity}</td>

          <td>
            {d.Closed.slice(8,10)}/{d.Closed.slice(5,7)}/{d.Closed.slice(2,4)}
            <br/>
            {d.Closed.slice(11,19)}
          </td>

          <td>
            {d.PricePerUnit}
          </td>

          <td>{d.Price}</td>

          <td>{d.Commission}</td>

        </tr>
      ))
    }
  }



  cancelOrder = (id) => {
    console.log(id);
    fetch('/api/cancelOpenOrder/' + id)
      .then(res => res.json())
      .then(res => {
        console.log(res);
        this.setState({
          popup : {
            messageTitle : 'Order Cancel',
            messageType : 'success',
            messageContent : res.message
          },
          showPopup : true
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          popup : {
            messageTitle : 'Error canceling order',
            messageType : 'success',
            messageContent : err
          },
          showPopup : true
        });
      })
  }

  handleChange = (e) => {
    this.setState({ tab : e.target.name});
    this.setState({ orderHistory : null});
  }

  renderSwithBtn = () => {
    return (
      <div className="btn-group">
        <button className={"btn btn-secondary " + (this.state.tab === "openOrders" ? 'isSelectedOrderBtn' : '')}
          type="button" name="openOrders" onClick={this.handleChange}>
          Opened
        </button>
        <button className={"btn btn-secondary " + (this.state.tab === "closeOrders" ? 'isSelectedOrderBtn' : '')}
          type="button" name="closeOrders" onClick={this.handleChange}>
          Closed
        </button>
      </div>
    )
  }


  render() {
    if (!this.state.orderHistory) {
      return(
        <Draggable handle=".orderDivHeader">
          <div className="popUpBtnDiv backDropped-dark" style={{right:"12px", top:'38px', width:'1000px'}}>
            <div className='orderDivHeader'>
              <div></div>
              {this.renderSwithBtn()}
            </div>
            <div className='orderDivBody'>
              <p className="loadingDiv" style={{height:'100px', width:'100%', color:'black'}}>
                <LoadingIcon/> Loading...
              </p>
            </div>
          </div>
        </Draggable>
      )
    } else if (this.state.orderHistory.length == 0) {
      return(
        <Draggable handle=".orderDivHeader">
          <div className="popUpBtnDiv backDropped-dark" style={{right:"12px", top:'38px', width:'1000px'}}>
            <div className='orderDivHeader'>
              <p>Pas d'ordres ouverts</p>
              {this.renderSwithBtn()}
            </div>
            <div className='orderDivBody'>
              <p>Pas d'ordres ouverts</p>
            </div>
          </div>
        </Draggable>
      )
    } else {
      console.log(this.state);
      return(
        <div>
          {this.state.showPopup ?
            <NotifPopup
              closePopup={this.closePopup}
              messageTitle= {this.state.popup.messageTitle}
              messageType= {this.state.popup.messageType}
              messageContent = {this.state.popup.messageContent}>
            </NotifPopup>
            : null}
          <Draggable handle=".orderDivHeader">
            <div className="popUpBtnDiv backDropped-dark" style={{right:"12px", top:'38px', width:'auto'}}>
              <div className='orderDivHeader'>
                <p>{this.state.orderHistory.length} ordre(s) {this.state.tab == 'openOrders' ? 'ouvert(s)' : 'fermé(s)'} </p>
                {this.renderSwithBtn()}
              </div>
              <div className='orderDivBody'>

                <table className="table table-hover">
                  <thead>
                    {this.state.tab === 'openOrders' ? this.renderOpenOrderListHeader() : this.renderCloseOrderListHeader()}
                  </thead>
                  <tbody>
                    {this.state.tab === 'openOrders' ? this.renderOpenOrderList() : this.renderCloseOrderList()}
                  </tbody>
                </table>

              </div>
            </div>
          </Draggable>

        </div>
      )
    }
  }
}


class TopMainBar extends Component {
  state = {
    showOrderDiv : false,
    showCalculator : false,
  }

  componentDidMount() {
  }

  handleMyOrderClick = () => { // Ouvre et ferme tableau
    this.setState({ showOrderDiv : !this.state.showOrderDiv})
  }
  handleCalculatorClick = () => { // Ouvre et ferme Calculette
    this.setState({ showCalculator : !this.state.showCalculator})
  }

  render() {
    return (
      <div className="topMainBar">
        <div className='btnDiv'>
          {this.props.children}
        </div>
        <div style={{color : "white", display:'flex', flexDirection:'row', alignItems:'center'}}>
          <div style={{position:"relative"}}>
            <button className="btn labelBtn" name="MyOrders" onClick={this.handleCalculatorClick}>
              % calculator
            </button>
            {this.state.showCalculator ?
              <Calculator>
                <CloseIcon onClick={this.handleCalculatorClick}/>
              </Calculator> : null}
          </div>
          <div style={{position:"relative"}}>
            <button className="btn labelBtn" name="MyOrders" onClick={this.handleMyOrderClick}>
              My Orders
            </button>
            {this.state.showOrderDiv ?
              <OrderDiv>
                <CloseIcon onClick={this.handleMyOrderClick}/>
              </OrderDiv> : null}
          </div>
          <Clock format={'HH:mm'} ticking={true} timezone={'Africa/Bamako'} />
        </div>
      </div>
    );
  }
}

export default TopMainBar;
