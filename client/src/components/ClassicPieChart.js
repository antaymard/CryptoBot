import React, { Component } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Label, Cell } from 'recharts';

const COLORS = ['#9FA8DA', '#80CBC4', '#FFCC80', '#90CAF9', '#C5E1A5', '#FFE082', '#BCAAA4', '#F48FB1', '#CE93D8', '#E6EE9C'];

class ClassicPieChart extends Component {
  state = {
    test: this.props.data
  }

  renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
 	  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x  = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy  + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text key={x*y} x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} 	dominantBaseline="central">
    	 {name}
      </text>
    );
  };

  render() {
    if (!this.props.data) {
      console.log("loading");
      return(
        <p className="loadingDiv" style={{height:100+'px'}}>Loading</p>
      )
    } else if (this.props.data) {

      return (
        <div className="">
        {this.props.children}
            <PieChart width={300} height={300}>
              <Pie
                data={this.props.data} dataKey="EqBtc" nameKey="Currency" fill="#8884d8"
                label={this.renderCustomizedLabel}
                labelLine={false}>
                {
          	       this.props.data.map((entry, index) => <Cell key={entry} fill={COLORS[index % COLORS.length]}/>)
                }
              </Pie>
              <Tooltip/>
            </PieChart>
        </div>
      );
    }
  }
}

export default ClassicPieChart;
