import React, { Component } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid,
  Tooltip, YAxis, XAxis,ReferenceLine , Label} from 'recharts';

import LoadingIcon from 'react-icons/lib/md/autorenew';


class CardSmallChartBar extends Component {
  state = {
    res : false
  }

  componentDidMount() {
    this.drawChart();
  }

  drawChart = () => {
    this.setState({res : false});
    fetch('/api/getCandle/' + this.props.currency + '/' + this.props.selectedDateForCharts)
      .then(res => res.json())
      .then(res => {
        // Ajouter l'array de core candles
        for (var i in res) {
          if (res[i].O < res[i].C) {
            res[i].Kup = [res[i].O , res[i].C];
            res[i].Kdown = [null, null];

            res[i].ErrBarUp = [res[i].L, res[i].H];
            res[i].ErrBarDown = [null, null]; // nulle
          } else {
            res[i].Kdown = [res[i].O , res[i].C];
            res[i].Kup = [null, null];

            res[i].ErrBarUp = [null, null]; // nulle
            res[i].ErrBarDown = [res[i].L, res[i].H];
          }
        }
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

  render() {
    //console.log(this.state);
    var _initialValue, _finalValue;
    if (!this.state.res) {
      return(
        <p className="loadingDiv" style={{height:'160px'}}>
          <LoadingIcon/> Loading Candles...
        </p>
      )
    } else if (this.state.res) {
      if (this.state.res[0]) {
        _initialValue = this.state.res[0].O;
        _finalValue = this.state.res[this.state.res.length-1].C;
        // Corrige la date en ajoutant une heure
      } else if (!this.state.res[0]) {
        _initialValue = null;
        _finalValue = null;
      }

      return (
        <div className="">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={this.state.res} syncId="anyId" barCategoryGap='0' barGap='-100%' >
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey='Kup' unit=' BTC' stroke="#4CAF50" fillOpacity={0}>
              </Bar>
              <Bar dataKey='Kdown' unit=' BTC' fill="#F44336">
              </Bar>
              <ReferenceLine y={_initialValue} label="" stroke="red" strokeDasharray="3 3" />
              <ReferenceLine y={_finalValue} label="" stroke="green" strokeDasharray="3 3">
                <Label content={() => (((_finalValue-_initialValue)/_initialValue)*100).toFixed(2)+'%'}/>
              </ReferenceLine>
              <XAxis dataKey="T" hide={true}/>
              <YAxis domain={['dataMin', 'dataMax']} hide={true} />
            </BarChart>
          </ResponsiveContainer>

        </div>
      );
    }
  }
}

export default CardSmallChartBar;
