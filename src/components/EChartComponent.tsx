import ReactECharts from 'echarts-for-react';
import React from 'react';

interface EChartComponentProps {
  option: any; // ECharts 配置项
  height?: string; // 图表高度
  width?: string; // 图表宽度
}

const EChartComponent: React.FC<EChartComponentProps> = ({ option, height = '300px' }) => {
  return <ReactECharts option={option} style={{ height }} />;
};

export default EChartComponent;
