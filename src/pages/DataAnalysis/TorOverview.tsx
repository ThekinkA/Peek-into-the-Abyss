import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Button, Tooltip, Table } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import './TorOverview.css'; // 自定义样式文件

// 模拟带国家信息的节点数据
const entryNodes = [
  { ip: '1.1.1.1', status: '在线', country: 'US', bandwidth: '10Mbps' },
  { ip: '1.1.1.2', status: '离线', country: 'CN', bandwidth: '0Mbps' },
  { ip: '1.1.1.3', status: '在线', country: 'DE', bandwidth: '15Mbps' },
  { ip: '1.1.1.4', status: '在线', country: 'US', bandwidth: '12Mbps' },
  { ip: '1.1.1.5', status: '离线', country: 'IN', bandwidth: '0Mbps' },
];

const relayNodes = [
  { ip: '2.2.2.1', status: '在线', country: 'DE', bandwidth: '20Mbps' },
  { ip: '2.2.2.2', status: '在线', country: 'JP', bandwidth: '15Mbps' },
  { ip: '2.2.2.3', status: '离线', country: 'RU', bandwidth: '0Mbps' },
  { ip: '2.2.2.4', status: '在线', country: 'FR', bandwidth: '18Mbps' },
  { ip: '2.2.2.5', status: '离线', country: 'CN', bandwidth: '0Mbps' },
];

const exitNodes = [
  { ip: '3.3.3.1', status: '在线', country: 'UK', bandwidth: '12Mbps' },
  { ip: '3.3.3.2', status: '离线', country: 'RU', bandwidth: '0Mbps' },
  { ip: '3.3.3.3', status: '在线', country: 'US', bandwidth: '25Mbps' },
  { ip: '3.3.3.4', status: '在线', country: 'IN', bandwidth: '10Mbps' },
  { ip: '3.3.3.5', status: '离线', country: 'BR', bandwidth: '0Mbps' },
];

// 颜色映射
const typeColorMap = {
  entry: '#FF5733',
  relay: '#3498DB',
  exit: '#2ECC71',
};

const TorNodeVisualization = () => {
  const [showDetails, setShowDetails] = useState({
    entry: false,
    relay: false,
    exit: false,
  });
  const [mapData, setMapData] = useState({}); // 定义地图数据
  const [activeType, setActiveType] = useState('all'); // 当前显示的节点类型
  const [pagination, setPagination] = useState({
    entry: { current: 1, pageSize: 3 },
    relay: { current: 1, pageSize: 3 },
    exit: { current: 1, pageSize: 3 },
  });

  // 初始化地图数据
  useEffect(() => {
    const generateMapData = (nodes: any[]) => {
      return nodes.reduce((acc, node) => {
        const country = node.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
    };

    const data = {
      entry: generateMapData(entryNodes),
      relay: generateMapData(relayNodes),
      exit: generateMapData(exitNodes),
      all: {
        ...generateMapData(entryNodes),
        ...generateMapData(relayNodes),
        ...generateMapData(exitNodes),
      },
    };

    setMapData(data); // 更新地图数据
    initChart(activeType);
  }, [activeType]);

  useEffect(() => {
    if (activeType) {
      initChart(activeType);
    }
  }, [activeType]);

  // 初始化 ECharts 图表
  const initChart = (activeType: string) => {
    const container = document.getElementById('worldMap');
    if (!container) return;

    // 设置容器的宽高
    container.style.width = '100%';
    container.style.height = '520px'; // 强制设置高度

    const myChart = echarts.init(container); // 初始化 ECharts 实例

    myChart.showLoading(); // 添加加载动画
    fetch('/geo/world.json') // 加载世界地图数据
      .then((response) => response.json())
      .then((worldJson) => {
        myChart.hideLoading();

        echarts.registerMap('world', worldJson); // 注册世界地图

        const data = [
          { name: 'China', value: 1409517397 },
          { name: 'India', value: 1339180127 },
          { name: 'United States', value: 324459463 },
          { name: 'Indonesia', value: 263991379 },
          { name: 'Brazil', value: 209288278 },
          { name: 'Pakistan', value: 197015955 },
          { name: 'Nigeria', value: 190886311 },
          { name: 'Bangladesh', value: 164669751 },
          { name: 'Russia', value: 143989754 },
          { name: 'Mexico', value: 129163276 },
        ];

        const option = {
          visualMap: {
            left: 'right',
            min: 0,
            max: 1500000000,
            inRange: {
              color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
            },
            text: ['High', 'Low'],
            calculable: true,
          },
          series: [
            {
              type: 'map',
              map: 'world',
              roam: true,
              data: data,
            },
          ],
        };

        myChart.setOption(option);
      })
      .catch((error) => {
        console.error('加载地图数据失败:', error);
      });
  };

  useEffect(() => {
    // === Family 图谱 ===
    const familyGraph = echarts.init(document.getElementById('familyGraph')!);
    const familyOption = {
      title: { text: '', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            return `节点：${params.data.name}`;
          } else if (params.dataType === 'edge') {
            return `连接：${params.data.source} → ${params.data.target}`;
          }
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          zoom: 0.7, // ✅ 初始缩放，避免超出容器
          center: null, // ✅ 自动居中
          force: {
            repulsion: 300,
            edgeLength: 150,
          },
          label: {
            show: true,
            color: '#fff',
            fontSize: 14,
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          lineStyle: {
            color: 'source',
            width: 2,
            curveness: 0.3,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
          data: [
            { name: '节点 A', symbolSize: 50, itemStyle: { color: '#FF6F61', shadowBlur: 10, shadowColor: '#555' } },
            { name: '节点 B', symbolSize: 40, itemStyle: { color: '#6A5ACD' } },
            { name: '节点 C', symbolSize: 40, itemStyle: { color: '#1ABC9C' } },
            { name: '节点 D', symbolSize: 30, itemStyle: { color: '#F4D03F' } },
          ],
          links: [
            { source: '节点 A', target: '节点 B', lineStyle: { color: '#FF6F61' } },
            { source: '节点 A', target: '节点 C', lineStyle: { color: '#FF6F61' } },
            { source: '节点 B', target: '节点 D', lineStyle: { color: '#6A5ACD' } },
          ],
        },
      ],
    };


    familyGraph.setOption(familyOption);
    familyGraph.resize();
    window.addEventListener('resize', () => familyGraph.resize());

    // === 横向柱状图 ===
    const vulnChart = echarts.init(document.getElementById('vulnChart')!);
    const vulnOption = {
      tooltip: { trigger: 'item' },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
      },
      yAxis: {
        type: 'category',
        data: ['配置错误', '旧版本', '开放目录', '加密问题', '未知风险'],
      },
      series: [
        {
          name: '漏洞数量',
          type: 'bar',
          data: [80, 60, 40, 20, 10],
          itemStyle: {
            color: '#FF6F61',
          },
        },
      ],
    };
    vulnChart.setOption(vulnOption);
    vulnChart.resize();
    window.addEventListener('resize', () => vulnChart.resize());
  }, []);


  // 切换节点类型
  const handleTypeChange = (type: React.SetStateAction<string>) => {
    setActiveType(type);
    setShowDetails({ entry: false, relay: false, exit: false });
  };

  // 切换分页
  const handlePaginationChange = (type: string, page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      [type]: { current: page, pageSize },
    }));
  };



  return (
    <div>
      {/* 节点类型卡片 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={8}>
          <NodeCard
            type="entry" // 确保值为 'entry' | 'relay' | 'exit'
            data={entryNodes}
            showDetails={showDetails.entry}
            pagination={pagination.entry}
            onToggle={() => setShowDetails((prev) => ({ ...prev, entry: !prev.entry }))}
            onPaginationChange={handlePaginationChange}
          />
        </Col>
        <Col span={8}>
          <NodeCard
            type="relay"
            data={relayNodes}
            showDetails={showDetails.relay}
            pagination={pagination.relay}  // 使用 relay 节点的分页状态
            onToggle={() => setShowDetails((prev) => ({ ...prev, relay: !prev.relay }))}
            onPaginationChange={handlePaginationChange} // 传递分页状态更新方法
          />
        </Col>
        <Col span={8}>
          <NodeCard
            type="exit"
            data={exitNodes}
            showDetails={showDetails.exit}
            pagination={pagination.exit}  // 使用 exit 节点的分页状态
            onToggle={() => setShowDetails((prev) => ({ ...prev, exit: !prev.exit }))}
            onPaginationChange={handlePaginationChange} // 传递分页状态更新方法
          />
        </Col>
      </Row>

      {/* 地图切换按钮 */}
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '370px' }}>
        <Button
          type={activeType === 'all' ? 'primary' : 'default'}
          onClick={() => handleTypeChange('all')}
        >
          全部节点
        </Button>
        <Button
          type={activeType === 'entry' ? 'primary' : 'default'}
          style={{ marginLeft: '10px', backgroundColor: typeColorMap.entry, color: 'white' }}
          onClick={() => handleTypeChange('entry')}
        >
          入口节点
        </Button>
        <Button
          type={activeType === 'relay' ? 'primary' : 'default'}
          style={{ marginLeft: '10px', backgroundColor: typeColorMap.relay, color: 'white' }}
          onClick={() => handleTypeChange('relay')}
        >
          中继节点
        </Button>
        <Button
          type={activeType === 'exit' ? 'primary' : 'default'}
          style={{ marginLeft: '10px', backgroundColor: typeColorMap.exit, color: 'white' }}
          onClick={() => handleTypeChange('exit')}
        >
          出口节点
        </Button>
      </div>

      <div id="worldMap"></div>
      {/* Family 知识图谱 + 含义介绍 */}
      <Row gutter={16} style={{ marginBottom: '20px', marginTop: '20px' }}>
        <Col span={16}>
          <Card
            title="Family 字段知识图谱"
            bodyStyle={{ padding: 0 }}
            style={{ height: '400px' }}
          >
            <div id="familyGraph" style={{ width: '100%', height: '400px' }}></div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Family 字段含义">
            <p  style={{height: '250px' }}>
              在 Tor 网络中，family 表示多个节点属于同一个运营实体或相互信任的关系。
              通常情况下，Tor 会避免将属于同一个 family 的节点同时用于构建同一路径，
              以防止信息泄露或被中间人攻击。该字段可用于构建更加安全、隐私保护更强的路由。
            </p>
          </Card>
        </Col>
      </Row>

      {/* 漏洞说明 + 数据图表 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={8}>
          <Card title="漏洞说明" style={{height: '300px' }}>
            <p>
              以下图表展示了 Tor 网络中节点常见的安全漏洞分布情况，包含配置错误、
              老旧软件、开放目录、加密问题等。及时修复这些漏洞可以提升整个网络的安全性。
            </p>
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title="漏洞数据统计"
            bodyStyle={{ padding: 0 }}
            style={{ height: '350px' }}
          >
            <div id="vulnChart" style={{ width: '100%', height: '350px', paddingBottom: '50px' }}></div>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

const NodeCard = ({
  type,
  data,
  showDetails,
  onToggle,
  pagination,
  onPaginationChange,
}: {
  type: 'entry' | 'relay' | 'exit';
  data: any[];
  showDetails: boolean;
  onToggle: () => void;
  pagination: { current: number; pageSize: number };
  onPaginationChange: (type: string, page: number, pageSize: number) => void;
}) => {
  const statusColor: { [key in '在线' | '离线' | '异常']: string } = {
    在线: 'green',
    离线: 'red',
    异常: 'yellow',
  };

  return (
    <div className={`card-container ${showDetails ? 'flipped' : ''}`}>
      {/* 卡片正面 */}
      <div className="card-face card-front">
        <Card
          title={type === 'entry' ? '入口节点' : type === 'relay' ? '中继节点' : '出口节点'}
          style={{
            backgroundColor: typeColorMap[type],
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Statistic title="节点总数" value={data.length} />
          <Statistic
            title="活跃占比"
            value={(data.filter((n) => n.status === '在线').length / data.length) * 100}
            suffix="%"
          />
          <Button
            type="primary"
            onClick={onToggle}
            style={{ width: '100%', marginTop: '15px' }}
          >
            {showDetails ? '隐藏详情' : '查看详情'}
          </Button>
        </Card>
      </div>

      {/* 卡片背面 */}
      <div className="card-face card-back">
        <Card
          title="详细信息"
          style={{
            backgroundColor: '#000', // 背景颜色改为黑色
            color: 'white', // 文字颜色改为白色
            borderRadius: '10px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table
            dataSource={data}
            columns={[
              {
                title: 'IP 地址',
                dataIndex: 'ip',
                key: 'ip',
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: '在线' | '离线' | '异常') => (
                  <Tooltip title={status}>
                    <span style={{ color: statusColor[status] }}>
                      {status === '在线' ? '✅' : status === '离线' ? '❌' : '⚠️'}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: '国家/地区',
                dataIndex: 'country',
                key: 'country',
              },
              {
                title: '带宽',
                dataIndex: 'bandwidth',
                key: 'bandwidth',
              },
            ]}
            pagination={{
              pageSize: pagination.pageSize,
              total: data.length,
              current: pagination.current,
              onChange: (page) => onPaginationChange(type, page, pagination.pageSize),
              showSizeChanger: false,
            }}
            size="small"
            rowKey="ip"
            style={{ color: 'white' }} // 表格文字颜色改为白色
          />
          <Button
            type="default"
            onClick={onToggle}
            style={{
              width: '100%',
              marginTop: '15px',
              backgroundColor: '#333', // 按钮背景颜色改为深灰色
              color: 'white', // 按钮文字颜色改为白色
            }}
          >
            返回
          </Button>
        </Card>
      </div>
    </div>

  );
};

export default TorNodeVisualization;
