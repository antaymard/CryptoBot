import React, { Component } from 'react';
import './NotifPopup.css';


import CloseIcon from 'react-icons/lib/md/close.js';


class NotifPopup extends Component {
  state = {
  }

  componentDidMount() {
    console.log('triggered !');
    this.startCountDown();
  }

  startCountDown = () => {
    console.log('Counting');
    setTimeout(() => {
      this.props.closePopup();
    }, 5000)
  }

  render() {
    return (
      <div className={'notifPopupMainDiv' + (this.props.messageType ? ' ' + this.props.messageType : null)}>
        <div className='notifPopupTitleDiv'>
          {this.props.messageTitle ? this.props.messageTitle : 'Notification'}
          <CloseIcon onClick={this.props.closePopup} style={{cursor:'pointer'}}/>
        </div>
        <div className='notifPopupCorpsDiv'>
          {this.props.messageContent}
        </div>
      </div>
    );
  }
}

export default NotifPopup;
