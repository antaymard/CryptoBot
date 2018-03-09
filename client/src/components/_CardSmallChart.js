import React, { Component } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid,
  Tooltip, YAxis, XAxis,ReferenceLine } from 'recharts';

import LoadingIcon from 'react-icons/lib/md/autorenew';


class CardSmallChart extends Component {
  state = {
  }

  componentDidMount() {
    this.drawChart();
  }

  drawChart = () => {
    this.setState({res:false});
    fetch('/api/getCandle/' + this.props.currency + '/' + this.props.selectedDateForCharts)
      .then(res => res.json())
      .then(res => {
        this.setState({
          res
        })
      })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.selectedDateForCharts !== this.props.selectedDateForCharts) {
      this.drawChart();
    }
  }

  changeSelectedDate = (option) => {
    this.setState({ selectedDateForCharts : option })
  }

  correctDate = (date) => {

  }

  render() {
    var _initialValue, _finalValue;
    if (!this.state.res) {
      return(
        <p className="loadingDiv" style={{height:'160px'}}>
          <LoadingIcon/>Loading Linechart...
        </p>
      )
    } else if (this.state.res) {
      if (this.state.res[0]) {
        _initialValue = this.state.res[0].C;
        _finalValue = this.state.res[this.state.res.length-1].C;
        // Corrige la date en ajoutant une heure
      } else if (!this.state.res[0]) {
        _initialValue = null;
        _finalValue = null;
      }

      return (
        <div className="">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart  data={this.state.res} syncId="anyId">
              <Line type="monotone" dataKey="C" dot={false} stroke="#2196F3" strokeWidth={2}/>
              <XAxis dataKey="T" hide={true}/>
              <YAxis domain={['dataMin', 'dataMax']} hide={true} />
              <ReferenceLine y={_initialValue} label="" stroke="red" strokeDasharray="3 3" />
              <ReferenceLine y={_finalValue} label="" stroke="green" strokeDasharray="3 3" label={(((_finalValue-_initialValue)/_initialValue)*100).toFixed(2)+'%'}/>
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip/>
            </LineChart>
          </ResponsiveContainer>

        </div>
      );
    }
  }
}

export default CardSmallChart;
