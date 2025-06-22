import React, { useState } from 'react';
import { Input, Card, Tag, Empty } from 'antd';
import * as echarts from 'echarts';
import './NodeResults.css';
import StarryBackground from '@/components/Background'

const { Search } = Input;

// 静态数据示例
const vulnerabilityData: Record<string, {
  overview: {
    ip: string;
    level: '高' | '中' | '低';
    score: number;
  };
  cveList: string[];
  dkvList: string[];
  cveCount: number;
  dkvCount: number;
}> = {
  '1.175.69.141': {
    overview: { ip: '1.175.69.141', level: '高', score: 8.7 },
    cveList: ['CVE-2023-0001', 'CVE-2023-0002', 'CVE-2023-0003'],
    dkvList: ['DKV-1001', 'DKV-1002'],
    cveCount: 3,
    dkvCount: 2,
  },
  '2.2.2.2': {
    overview: { ip: '2.2.2.2', level: '中', score: 6.2 },
    cveList: ['CVE-2022-1111', 'CVE-2022-2222'],
    dkvList: ['DKV-2001'],
    cveCount: 2,
    dkvCount: 1,
  },
  '3.3.3.3': {
    overview: { ip: '3.3.3.3', level: '低', score: 3.5 },
    cveList: ['CVE-2021-3333'],
    dkvList: ['DKV-3001', 'DKV-3002', 'DKV-3003'],
    cveCount: 1,
    dkvCount: 3,
  },
};

const getLevelColor = (level: '高' | '中' | '低') => {
  if (level === '高') return 'red';
  if (level === '中') return 'orange';
  return 'green';
};

const NodeResults = () => {
  const [searchIP, setSearchIP] = useState('');
  const [currentData, setCurrentData] = useState<typeof vulnerabilityData['1.175.69.141'] | null>(null);

  // 右侧Echarts渲染
  React.useEffect(() => {
    if (!currentData) return;
    const chartDom = document.getElementById('cve-dkv-bar');
    if (!chartDom) return;
    const myChart = echarts.init(chartDom);
    const option = {
      color: ['#ff7373', '#52c41a'],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['CVE数量', 'DKV数量'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [{ type: 'category', data: ['脆弱性数量'] }],
      yAxis: [{ type: 'value' }],
      series: [
        {
          name: 'CVE数量',
          type: 'bar',
          data: [currentData.cveCount],
          barWidth: 40,
        },
        {
          name: 'DKV数量',
          type: 'bar',
          data: [currentData.dkvCount],
          barWidth: 40,
        },
      ],
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
    return () => { myChart.dispose(); };
  }, [currentData]);

  const handleSearch = (value: string) => {
    setSearchIP(value);
    if (vulnerabilityData[value]) {
      setCurrentData(vulnerabilityData[value]);
    } else {
      setCurrentData(null);
    }
  };

  return (
    <>
      <div style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh', zIndex: 0}}>
        <StarryBackground/>
      </div>
      <div className="tor-overview-container dark-bg" style={{position:'relative', zIndex: 1}}>
        {/* 醒目主标题 */}
        <h1 className="main-title">IP脆弱性检索</h1>
        {/* 居中放大的搜索框 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '40px 0 32px 0' }}>
          <Search
            placeholder="请输入IP地址"
            enterButton="搜索"
            size="large"
            onSearch={handleSearch}
            style={{ width: 600, maxWidth: '90%', background: '#23272f', color: '#fff', border: 'none' }}
            className="dark-search"
          />
        </div>

        {/* 脆弱性报告卡片 */}
        <Card title="脆弱性报告" className="dark-card assessment-card" style={{ margin: '0 auto 8px auto', maxWidth: 1300, minWidth: 1200, padding: 0 }} headStyle={{background:'#23272f',color:'#fff', minHeight: 40, padding: '8px 16px'}} bodyStyle={{background:'#23272f',color:'#fff',padding:'10px 16px'}}> 
          {currentData ? (
            <>
              {/* 总览信息 */}
              <table className="dark-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontSize: 16, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#23272f' }}>
                    <th style={{ padding: '4px 0', borderBottom: '1px solid #444', color:'#fff' }}>IP</th>
                    <th style={{ padding: '4px 0', borderBottom: '1px solid #444', color:'#fff' }}>脆弱性等级</th>
                    <th style={{ padding: '4px 0', borderBottom: '1px solid #444', color:'#fff' }}>脆弱性评分</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0' }}><Tag color="#1677ff" className="dark-tag">{currentData.overview.ip}</Tag></td>
                    <td style={{ padding: '4px 0' }}>
                      <Tag className="dark-tag" style={{background:'none', border:'none', padding:0}}>
                        <span
                          className={
                            currentData.overview.level === '高'
                              ? 'level-high'
                              : currentData.overview.level === '中'
                              ? 'level-medium'
                              : 'level-low'
                          }
                        >
                          {currentData.overview.level}
                        </span>
                      </Tag>
                    </td>
                    <td style={{ padding: '4px 0' }}><Tag color="#722ed1" className="dark-tag">{currentData.overview.score}</Tag></td>
                  </tr>
                </tbody>
              </table>
              {/* 详细评估结果 */}
              <div className="vulnerability-content">
                <div className="data-group">
                  <h3>CVE 编号</h3>
                  <div className="data-list">
                    <div className="scroll-container">
                      {currentData.cveList.map((item) => (
                        <Card key={item} className="data-card" hoverable>
                          <Tag color="#108ee9">{item}</Tag>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="data-group">
                  <h3>DKV 编号</h3>
                  <div className="data-list">
                    <div className="scroll-container">
                      {currentData.dkvList.map((item) => (
                        <Card key={item} className="data-card" hoverable>
                          <Tag color="#87d068">{item}</Tag>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="data-group">
                  <h3>CVE/DKV 数量对比</h3>
                  <div id="cve-dkv-bar" style={{height:'180px',width:'100%'}}></div>
                </div>
              </div>
            </>
          ) : (
            <Empty description={searchIP ? '未找到该IP的脆弱性报告' : '请先搜索IP'} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{color:'#fff'}} />
          )}
        </Card>
      </div>
    </>
  );
};

export default NodeResults;

