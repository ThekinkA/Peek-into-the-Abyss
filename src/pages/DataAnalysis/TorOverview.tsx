import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Button, Tooltip, Table, message } from 'antd';
import * as echarts from 'echarts';
import './TorOverview.css'; // 自定义样式文件
import { getNodeCategoryStats, getNodeCategoryDetails, getVulnerabilityStats, getVulnerabilityNodeDistribution } from '@/services/database';

// 颜色映射
const typeColorMap = {
  entry: '#FF6F61',  // 高脆弱性节点
  relay: '#F4D03F',  // 中脆弱性节点
  exit: '#B3E5D6',   // 低脆弱性节点
};

// 节点类型映射
const categoryMap = {
  entry: 'Guard',
  relay: 'Middle',
  exit: 'Exit'
};

// 节点类型映射
const categoryMap1 = {
  entry: '高风险',
  relay: '中风险',
  exit: '低风险'
};

// 在文件开头的常量定义部分添加
interface VulnerabilityDetail {
  vulnerability_CVE: string;
  description: string;
  severity: string;
  affected_versions: string;
  fix_version: string;
}

type VulnerabilityDetailsMap = {
  [key: string]: VulnerabilityDetail;
};

const mockVulnerabilityDetails: VulnerabilityDetailsMap = {
  'CVE-2024-38472': {
    vulnerability_CVE: 'CVE-2023-1234',
    description: 'Tor 网络中的流量分析漏洞，攻击者可能通过分析流量模式识别用户身份。该漏洞影响 Tor 0.4.7.x 版本，允许攻击者通过观察网络流量特征来推断用户行为模式。',
    severity: '高危',
    affected_versions: 'Tor 0.4.7.0 - 0.4.7.12',
    fix_version: 'Tor 0.4.7.13'
  },
  'CVE-2024-38477': {
    vulnerability_CVE: 'CVE-2023-2345',
    description: 'Tor 中继节点中的内存泄漏问题，可能导致节点性能下降和潜在的信息泄露。该漏洞主要影响长期运行的中继节点，可能导致内存使用量持续增长。',
    severity: '中危',
    affected_versions: 'Tor 0.4.6.x - 0.4.7.x',
    fix_version: 'Tor 0.4.7.14'
  },
  'CVE-2024-27316': {
    vulnerability_CVE: 'CVE-2023-3456',
    description: 'Tor 出口节点中的 DNS 解析漏洞，可能允许攻击者进行 DNS 污染攻击。该漏洞影响使用特定 DNS 解析配置的出口节点，可能导致用户被重定向到恶意网站。',
    severity: '高危',
    affected_versions: 'Tor 0.4.5.x - 0.4.7.x',
    fix_version: 'Tor 0.4.7.15'
  },
  'CVE-2021-34798': {
    vulnerability_CVE: 'CVE-2023-4567',
    description: 'Tor 入口节点中的带宽限制绕过漏洞，可能导致网络资源被滥用。该漏洞允许恶意用户绕过带宽限制，影响网络的整体性能和稳定性。',
    severity: '中危',
    affected_versions: 'Tor 0.4.6.x - 0.4.7.x',
    fix_version: 'Tor 0.4.7.16'
  },
  'CVE-2023-5678': {
    vulnerability_CVE: 'CVE-2023-5678',
    description: 'Tor 网络中的路径选择算法漏洞，可能导致用户流量被引导至不安全的路径。该漏洞影响 Tor 的路径选择机制，可能降低网络的匿名性保护。',
    severity: '高危',
    affected_versions: 'Tor 0.4.7.x',
    fix_version: 'Tor 0.4.7.17'
  }
};

// 将 NodeCard 组件定义移到这里
const NodeCard = ({
  type,
  data,
  showDetails,
  onToggle,
  pagination,
  onPaginationChange,
  totalCount,
  activeRatio, // 新增属性
}: {
  type: 'entry' | 'relay' | 'exit';
  data: any[];
  showDetails: boolean;
  onToggle: () => void;
  pagination: { current: number; pageSize: number };
  onPaginationChange: (type: string, page: number, pageSize: number) => void;
  totalCount: number;
  activeRatio: number; // 新增属性
}) => {
  const statusColor: { [key: string]: string } = {
    'up': 'green',
    'down': 'red',
    'unknown': 'yellow',
  };

  return (
    <div className={`card-container ${showDetails ? 'flipped' : ''}`}>
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
          <Statistic title="节点总数" value={totalCount} />
          <Statistic
            title="活跃占比"
            value={activeRatio} // 使用传递的活跃占比
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

      <div className="card-face card-back">
        <Card
          title="详细信息"
          style={{
            backgroundColor: '#000',
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table
            dataSource={data}
            columns={[
              {
                title: 'IP 地址',
                dataIndex: 'IP',
                key: 'IP',
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                  <Tooltip title={status}>
                    <span style={{ color: statusColor[status] || 'yellow' }}>
                      {status === 'up' ? '✅' : status === 'down' ? '❌' : '⚠️'}
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
            rowKey="IP"
            style={{ color: 'white' }}
          />
          <Button
            type="default"
            onClick={onToggle}
            style={{
              width: '100%',
              marginTop: '15px',
              backgroundColor: '#333',
              color: 'white',
            }}
          >
            返回
          </Button>
        </Card>
      </div>
    </div>
  );
};

// 主组件 
const TorNodeVisualization = () => {
  const [showDetails, setShowDetails] = useState({
    entry: false,
    relay: false,
    exit: false,
  });
  const [pagination, setPagination] = useState({
    entry: { current: 1, pageSize: 10 },
    relay: { current: 1, pageSize: 10 },
    exit: { current: 1, pageSize: 10 },
  });
  const [nodeStats, setNodeStats] = useState({
    entry: 0,
    relay: 0,
    exit: 0
  });
  const [nodeDetails, setNodeDetails] = useState<{
    entry: { status: string }[];
    relay: { status: string }[];
    exit: { status: string }[];
  }>({
    entry: [],
    relay: [],
    exit: [],
  });
  const [vulnerabilityStats, setVulnerabilityStats] = useState<{ vulnerability_CVE: string, count: number }[]>([]);
  const [selectedVulnerabilityDetails, setSelectedVulnerabilityDetails] = useState<VulnerabilityDetail | null>(null);
  const [activeRatios, setActiveRatios] = useState({
    entry: 0,
    relay: 0,
    exit: 0,
  });
  const [selectedNodeType, setSelectedNodeType] = useState<'entry' | 'relay' | 'exit'>('entry');
  const [geoData, setGeoData] = useState<{name: string; value: number}[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // 获取节点分类统计
  useEffect(() => {
    const fetchNodeStats = async () => {
      try {
        const response = await getNodeCategoryStats();
        if (response.success && response.data) {
          const stats = {
            entry: 0,
            relay: 0,
            exit: 0,
          };
          response.data.forEach(item => {
            if (item.category === 'Guard') stats.entry = item.count;
            if (item.category === 'Middle') stats.relay = item.count;
            if (item.category === 'Exit') stats.exit = item.count;
          });
          setNodeStats(stats);
        }
      } catch (error) {
        console.error('获取节点统计失败:', error);
      }
    };
    fetchNodeStats();
  }, []); // 移除 nodeDetails 依赖

  // 获取节点详细信息
  const fetchNodeDetails = async (type: 'entry' | 'relay' | 'exit') => {
    try {
      const response = await getNodeCategoryDetails(categoryMap[type]);
      if (response.success && response.data) {
        setNodeDetails(prev => {
          const newDetails = {
            ...prev,
            [type]: response.data
          };
          
          // 修复活跃占比计算：使用实际获取到的节点数量作为分母
          const newActiveRatios = {
            entry: (newDetails.entry.filter((n) => n.status === 'up').length / newDetails.entry.length) * 100,
            relay: (newDetails.relay.filter((n) => n.status === 'up').length / newDetails.relay.length) * 100,
            exit: (newDetails.exit.filter((n) => n.status === 'up').length / newDetails.exit.length) * 100,
          };
          setActiveRatios(newActiveRatios);
          
          return newDetails;
        });
      }
    } catch (error) {
      console.error('获取节点详情失败:', error);
    }
  };

  // 当显示详情时获取数据
  useEffect(() => {
    // 初始加载时就获取所有类型的节点数据
    fetchNodeDetails('entry');
    fetchNodeDetails('relay');
    fetchNodeDetails('exit');
  }, []); // 只在组件挂载时执行一次

  useEffect(() => {
    // 获取漏洞统计数据
    const fetchVulnerabilityStats = async () => {
      try {
        const response = await getVulnerabilityStats();
        if (response.success && response.data) {
          setVulnerabilityStats(response.data);
        }
      } catch (error) {
        console.error('获取漏洞统计失败:', error);
      }
    };
    fetchVulnerabilityStats();
  }, []);

  // 修改漏洞详情点击处理函数
  const handleVulnerabilityClick = (params: { name: string }) => {
    if (params.name) {
      const vulnerabilityDetail = mockVulnerabilityDetails[params.name];
      if (vulnerabilityDetail) {
        setSelectedVulnerabilityDetails(vulnerabilityDetail);
      } else {
        message.warning('未找到该漏洞的详细信息');
      }
    }
  };

  // 修改图表初始化部分
  useEffect(() => {
    const vulnChart = echarts.init(document.getElementById('vulnChart')!);

    const vulnOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次',
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
        name: '出现次数',
      },
      yAxis: {
        type: 'category',
        data: vulnerabilityStats.map(item => item.vulnerability_CVE),
      },
      series: [
        {
          name: '漏洞数量',
          type: 'bar',
          data: vulnerabilityStats.map(item => item.count),
          itemStyle: {
            color: '#FF6F61',
          },
        },
      ],
    };

    vulnChart.setOption(vulnOption);
    vulnChart.resize();

    // 修改事件处理函数的类型
    vulnChart.on('click', (params: { name: string }) => {
      handleVulnerabilityClick(params);
    });

    window.addEventListener('resize', () => vulnChart.resize());

    return () => {
      vulnChart.off('click');
      vulnChart.dispose();
    };
  }, [vulnerabilityStats]);

  // 修改 Family 图谱的 tooltip formatter
  useEffect(() => {
    const familyGraph = echarts.init(document.getElementById('familyGraph')!);
    const familyOption = {
      title: { text: 'Family 知识图谱', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `节点：${params.data.name}`;
          } else if (params.dataType === 'edge') {
            return `连接：${params.data.source} → ${params.data.target}`;
          }
          return '';
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          zoom: 0.7, // 初始缩放
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
            { name: 'family:1', symbolSize: 50, itemStyle: { color: '#FF6F61' } },
            { name: '185.40.4.29', symbolSize: 30, itemStyle: { color: '#6A5ACD' } },
            { name: '185.229.90.81', symbolSize: 30, itemStyle: { color: '#1ABC9C' } },
            { name: 'family:2', symbolSize: 50, itemStyle: { color: '#F4D03F' } },
            { name: '57.128.180.74', symbolSize: 30, itemStyle: { color: '#3498DB' } },
            { name: '216.181.20.181', symbolSize: 30, itemStyle: { color: '#E74C3C' } },
          ],
          links: [
            { source: 'family:1', target: '185.40.4.29', lineStyle: { color: '#FF6F61' } },
            { source: 'family:1', target: '185.229.90.81', lineStyle: { color: '#FF6F61' } },
            { source: 'family:2', target: '57.128.180.74', lineStyle: { color: '#F4D03F' } },
            { source: 'family:2', target: '216.181.20.181', lineStyle: { color: '#F4D03F' } },
          ],
        },
      ],
    };

    familyGraph.setOption(familyOption);
    familyGraph.resize();
    window.addEventListener('resize', () => familyGraph.resize());

    return () => {
      familyGraph.dispose();
    };
  }, []);

  // 切换分页
  const handlePaginationChange = (type: string, page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      [type]: { current: page, pageSize },
    }));
  };

  // 修改获取地理分布数据的函数
  const fetchGeoData = async (type: 'entry' | 'relay' | 'exit') => {
    setMapLoading(true);
    try {
      const response = await getVulnerabilityNodeDistribution(categoryMap1[type]);
      if (response.success && response.data) {
        // 转换为地图所需的数据格式
        const geoData = response.data.map(item => ({
          name: item.country,
          value: item.count
        }));
        setGeoData(geoData);
      }
    } catch (error) {
      console.error('获取地理分布数据失败:', error);
    }
    setMapLoading(false);
  };

  // 监听节点类型变化
  useEffect(() => {
    fetchGeoData(selectedNodeType);
  }, [selectedNodeType]);

  // 初始化地图
  useEffect(() => {
    const worldMap = echarts.init(document.getElementById('nodeWorldMap')!);
    
    const fetchMapData = async () => {
      try {
        const worldJson = await fetch('/geo/world.json').then(res => res.json());
        echarts.registerMap('world', worldJson);
        
        // 更新地图配置
        const updateMapOption = () => {
          const colorMap = {
            entry: ['#fff5f5', '#ffe0e0', '#ffc9c9', '#ffb3b3', '#ff9d9d', '#FF6F61'],  // 高风险
            relay: ['#fff9e6', '#fff2cc', '#ffecb3', '#ffe599', '#ffdf80', '#F4D03F'],  // 中风险
            exit: ['#f0f9f6', '#e1f3ed', '#d2ede4', '#c3e7db', '#b4e1d2', '#B3E5D6']   // 低风险
          };

          const maxValue = Math.max(...geoData.map(item => item.value), 1);
          
          const mapOption = {
            title: {
              text: `${categoryMap1[selectedNodeType]}节点全球分布`,
              left: 'center',
              top: '5%',
              textStyle: {
                color: '#333'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: (params: any) => {
                return `${params.name}<br/>节点数量：${params.value || 0}`;
              }
            },
            visualMap: {
              left: 'right',
              min: 0,
              max: maxValue,
              inRange: {
                color: colorMap[selectedNodeType]
              },
              text: ['高', '低'],
              calculable: true
            },
            series: [
              {
                name: '节点分布',
                type: 'map',
                map: 'world',
                roam: true,
                emphasis: {
                  label: {
                    show: true
                  }
                },
                data: geoData
              }
            ]
          };
          
          worldMap.setOption(mapOption);
        };

        updateMapOption();
        window.addEventListener('resize', () => worldMap.resize());
      } catch (error) {
        console.error('加载地图数据失败:', error);
      }
    };

    fetchMapData();

    return () => {
      worldMap.dispose();
    };
  }, [selectedNodeType, geoData]);

  return (
    <div>
      {/* 节点类型卡片 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={8}>
          <NodeCard
            type="entry"
            data={nodeDetails.entry}
            showDetails={showDetails.entry}
            pagination={pagination.entry}
            onToggle={() => setShowDetails((prev) => ({ ...prev, entry: !prev.entry }))}
            onPaginationChange={handlePaginationChange}
            totalCount={nodeStats.entry}
            activeRatio={activeRatios.entry} // 新增属性
          />
        </Col>
        <Col span={8}>
          <NodeCard
            type="relay"
            data={nodeDetails.relay}
            showDetails={showDetails.relay}
            pagination={pagination.relay}
            onToggle={() => setShowDetails((prev) => ({ ...prev, relay: !prev.relay }))}
            onPaginationChange={handlePaginationChange}
            totalCount={nodeStats.relay}
            activeRatio={activeRatios.relay} // 新增属性
          />
        </Col>
        <Col span={8}>
          <NodeCard
            type="exit"
            data={nodeDetails.exit}
            showDetails={showDetails.exit}
            pagination={pagination.exit}
            onToggle={() => setShowDetails((prev) => ({ ...prev, exit: !prev.exit }))}
            onPaginationChange={handlePaginationChange}
            totalCount={nodeStats.exit}
            activeRatio={activeRatios.exit} // 新增属性
          />
        </Col>
      </Row>

      {/* Family 知识图谱 + 含义介绍 */}
      <Row gutter={16} style={{ marginBottom: '20px', marginTop: '20px' }}>
        <Col span={16}>
          <Card
            title="Family 字段知识图谱"
            bodyStyle={{ padding: 0 }}
            style={{ height: '400px' }}
          >
            <div id="familyGraph" className="family-graph"></div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Family 字段含义">
            <p className="vuln-description">
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
          <Card title="漏洞说明" style={{ height: '350px' }}>
            {selectedVulnerabilityDetails ? (
              <div>
                <p>
                  <strong>漏洞编号：</strong>
                  {selectedVulnerabilityDetails.vulnerability_CVE}
                </p>
                <p>
                  <strong>严重程度：</strong>
                  {selectedVulnerabilityDetails.severity}
                </p>
                <p>
                  <strong>漏洞描述：</strong>
                  {selectedVulnerabilityDetails.description}
                </p>
              </div>
            ) : (
              <p>点击柱状图中的漏洞以查看详细信息。</p>
            )}
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title="漏洞数据统计"
            bodyStyle={{ padding: 0 }}
            style={{ height: '350px' }}
          >
            <div id="vulnChart" className="vuln-chart"></div>
          </Card>
        </Col>
      </Row>

      {/* 修改世界地图卡片标题 */}
      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card 
            title="节点脆弱性全球分布图" 
            style={{ height: '100%' }}
            loading={mapLoading}
            extra={
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  type={selectedNodeType === 'entry' ? 'primary' : 'default'}
                  style={{ 
                    backgroundColor: selectedNodeType === 'entry' ? '#FF6F61' : undefined,
                    borderColor: '#FF6F61',
                    color: selectedNodeType === 'entry' ? '#fff' : '#FF6F61',
                    fontWeight: selectedNodeType === 'entry' ? 'bold' : 'normal',
                    boxShadow: selectedNodeType === 'entry' ? '0 2px 0 rgba(255, 111, 97, 0.1)' : 'none',
                  }}
                  onClick={() => setSelectedNodeType('entry')}
                >
                  高脆弱性节点
                </Button>
                <Button 
                  type={selectedNodeType === 'relay' ? 'primary' : 'default'}
                  style={{ 
                    backgroundColor: selectedNodeType === 'relay' ? '#F4D03F' : undefined,
                    borderColor: '#F4D03F',
                    color: selectedNodeType === 'relay' ? '#fff' : '#F4D03F',
                    fontWeight: selectedNodeType === 'relay' ? 'bold' : 'normal',
                    boxShadow: selectedNodeType === 'relay' ? '0 2px 0 rgba(244, 208, 63, 0.1)' : 'none',
                  }}
                  onClick={() => setSelectedNodeType('relay')}
                >
                  中脆弱性节点
                </Button>
                <Button 
                  type={selectedNodeType === 'exit' ? 'primary' : 'default'}
                  style={{ 
                    backgroundColor: selectedNodeType === 'exit' ? '#B3E5D6' : undefined,
                    borderColor: '#B3E5D6',
                    color: selectedNodeType === 'exit' ? '#fff' : '#B3E5D6',
                    fontWeight: selectedNodeType === 'exit' ? 'bold' : 'normal',
                    boxShadow: selectedNodeType === 'exit' ? '0 2px 0 rgba(179, 229, 214, 0.1)' : 'none',
                  }}
                  onClick={() => setSelectedNodeType('exit')}
                >
                  低脆弱性节点
                </Button>
              </div>
            }
          >
            <div id="nodeWorldMap" style={{ width: '100%', height: '500px' }}></div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TorNodeVisualization;
