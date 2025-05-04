import React, { useState, useEffect } from 'react';
import { Button, Space, Card, Tag, Modal, Row, Col, Input, message } from 'antd';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import neo4j from 'neo4j-driver'; // ✅ 引入 Neo4j 驱动
import './AttackPath.less';

const { Search } = Input;

const VulnerabilityInfo: React.FC = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<{ cve: string; dkv: string } | null>(null);
  const [chartShow, setChartShow] = useState(false);
  const [targetIp, setTargetIp] = useState('192.168.1.5'); // 默认IP
  const [recentIps, setRecentIps] = useState([
    '192.168.1.5',
    '192.168.1.4',
    '192.168.1.3',
    '192.168.1.2',
    '192.168.1.1',
  ]);

  const cveData1 = ['CVE-2004-0001', 'CVE-2009-2321', 'CVE-2016-1001', 'CVE-2020-565', 'CVE-2022-1234', 'CVE-2023-6789', 'CVE-2024-1234'];
  const dkvData1 = ['DKV-2222', 'DKV-9322', 'DKV-1325', 'DKV-6789', 'DKV-4567', 'DKV-8888', 'DKV-9999'];
  const cveData = ['CVE'];
  const dkvData = ['DKV'];

  useEffect(() => {
    renderNeo4jGraph();
  }, [targetIp]);

  const handleShow = () => {
    setLoading(true);
    setTimeout(() => {
      setShow(true);
      setLoading(false);
    }, 300);
    setChartShow(true);
    setTimeout(() => {
      generateBarChart();
    }, 300);
  };

  const handleDetail = (cve: string, dkv: string) => {
    setDetailData({ cve, dkv });
  };

  const handleCancel = () => {
    setDetailData(null);
  };

  const generateBarChart = () => {
    const chartDom = document.getElementById('bar-chart') as HTMLElement;
    const myChart = echarts.init(chartDom);
    const cveCounts = [10];
    const dkvCounts = [5];

    const option = {
      colors: ['#ff7373', '#52c41a'],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }},
      legend: {
        data: ['CVE数量', 'DKV数量'],
        textStyle: { color: '#FFFFFF' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [{ type: 'value' }],
      yAxis: [{
        type: 'category',
        data: cveData.map((cve, index) => `${cve} | ${dkvData[index]}`),
        axisLabel: { interval: 0, rotate: 30 },
      }],
      series: [
        {
          name: 'CVE数量',
          type: 'bar',
          stack: '总量',
          barWidth: 40,
          label: { show: true, position: 'insideRight' },
          emphasis: { focus: 'series' },
          data: cveCounts,
        },
        {
          name: 'DKV数量',
          type: 'bar',
          stack: '总量',
          barWidth: 40,
          label: { show: true, position: 'insideLeft' },
          emphasis: { focus: 'series' },
          data: dkvCounts,
        }
      ]
    };

    option && myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
    return () => {
      myChart.dispose();
    };
  };

  // ✅ 修改后的 renderNeo4jGraph 函数
  const renderNeo4jGraph = async () => {
    const chartDom = document.getElementById('neo4j-graph') as HTMLElement;
    const myChart = echarts.init(chartDom, 'dark');

    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'wck330328')
    );
    const session = driver.session();

    try {
      const result = await session.run(`
                MATCH (n:IP {address: '${targetIp}'})-[r]->(m)
                RETURN n, r, m
            `);

      const nodesMap = new Map();
      const links: any[] = [];

      result.records.forEach(record => {
        const n = record.get('n');
        const m = record.get('m');
        const r = record.get('r');

        const nId = n.identity.toString();
        const mId = m.identity.toString();

        if (!nodesMap.has(nId)) {
          nodesMap.set(nId, {
            id: nId,
            name: n.properties.address || `Node ${nId}`,
            symbolSize: 40
          });
        }

        if (!nodesMap.has(mId)) {
          nodesMap.set(mId, {
            id: mId,
            name: m.properties.address || `Node ${mId}`,
            symbolSize: 30
          });
        }

        links.push({
          source: nId,
          target: mId,
          label: {
            show: true,
            formatter: r.type
          }
        });
      });

      const option: echarts.EChartsOption = {
        tooltip: {},
        series: [{
          type: 'graph',
          layout: 'force',
          data: Array.from(nodesMap.values()),
          edges: links,
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}'
          },
          force: {
            repulsion: 100,
            edgeLength: 100
          }
        }]
      };

      myChart.setOption(option);
    } catch (error) {
      console.error('Neo4j 查询失败', error);
    } finally {
      await session.close();
      await driver.close();
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim() === '') {
      message.warning('请输入IP地址');
      return;
    }
    setTargetIp(value.trim());
  };

  const handlePointClick = (ip: string) => {
    setTargetIp(ip);
  };

  return (
    <div className="vulnerability-container">
      <Row align="middle" style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <div className="target-ip">
            当前目标IP: <Tag color="red">{targetIp}</Tag>
          </div>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Search
            placeholder="请输入IP地址"
            enterButton="搜索"
            size="middle"
            onSearch={handleSearch}
            style={{ maxWidth: '300px' }}
          />
        </Col>
      </Row>

      <Row gutter={24} style={{ marginBottom: '30px' }}>
        <Col span={20}>
          <div id="neo4j-graph" style={{ height: '600px', background: '#0d1117', borderRadius: '12px', padding: '10px' }}></div>
        </Col>
        <Col span={4}>
          <div className="curve-container" style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', background: 'linear-gradient(to top, #8B0000, #FF0000)', borderRadius: '12px', padding: '10px' }}>
            {recentIps.map((ip, index) => (
              <div
                key={ip}
                onClick={() => handlePointClick(ip)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #000',
                  cursor: 'pointer',
                  animation: 'pulse 1.5s infinite',
                }}
                title={ip}
              ></div>
            ))}
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Space>
            <Button
              type="primary"
              onClick={handleShow}
              loading={loading}
              style={{ width: '150px' }}
            >
              {loading ? '正在加载...' : '开始脆弱性评估'}
            </Button>
          </Space>
        </Col>
        <Col span={10}>
          <CSSTransition in={show} timeout={300} classNames="fade" unmountOnExit>
            <div className="vulnerability-content">
              <div className="data-group">
                <h3>CVE 编号</h3>
                <div className="data-list" style={{gridTemplateColumns: '1fr 1fr'}}>
                  <div className="scroll-container">
                    {cveData1.map((item, index) => (
                      <Card
                        key={item}
                        className="data-card"
                        hoverable
                        onClick={() => handleDetail(item, dkvData1[index])}
                      >
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
                    {dkvData1.map((item, index) => (
                      <Card
                        key={item}
                        className="data-card"
                        hoverable
                        onClick={() => handleDetail(cveData1[index], item)}
                      >
                        <Tag color="#87d068">{item}</Tag>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CSSTransition>
        </Col>
        <Col span={10}>
          <div id="bar-chart" style={{ height: '400px', width: '100%' }}></div>
        </Col>
      </Row>

      {detailData && (
        <Modal
          title="漏洞详细信息"
          visible={!!detailData}
          onCancel={handleCancel}
          footer={null}
        >
          <p><strong>CVE 编号：</strong>{detailData.cve}</p>
          <p><strong>DKV 编号：</strong>{detailData.dkv}</p>
          <p><strong>漏洞描述：</strong>这是一个示例漏洞，具体描述内容可根据实际数据填充。</p>
        </Modal>
      )}
    </div>
  );
};

export default VulnerabilityInfo;
