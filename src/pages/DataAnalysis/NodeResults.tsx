import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Select, Statistic, Descriptions } from 'antd';
import * as echarts from 'echarts';
import './NodeResults.css'; // 你可以创建这个样式文件，参考已有的样式
import { getIPList } from '@/services/database';

const { Option } = Select;

// 模拟节点数据
const nodesData = {
  '1.1.1.1': [
    { ip: '1.1.1.1', domain: 'example1.com', location: 'US', probeTime: '2025-04-20', title: '节点 A' },
    { ip: '1.1.1.2', domain: 'example2.com', location: 'DE', probeTime: '2025-04-20', title: '节点 B' },
  ],
  '2.2.2.1': [
    { ip: '2.2.2.1', domain: 'example3.com', location: 'IN', probeTime: '2025-04-19', title: '节点 C' },
    { ip: '2.2.2.2', domain: 'example4.com', location: 'RU', probeTime: '2025-04-19', title: '节点 D' },
  ],
  '3.3.3.1': [
    { ip: '3.3.3.1', domain: 'example5.com', location: 'CN', probeTime: '2025-04-18', title: '节点 E' },
    { ip: '3.3.3.2', domain: 'example6.com', location: 'BR', probeTime: '2025-04-18', title: '节点 F' },
  ],
};

// 模拟neo4j图谱数据
const graphData = {
  '1.1.1.1': [
    { name: '节点 A', connections: ['节点 B'] },
    { name: '节点 B', connections: ['节点 A'] },
  ],
  '2.2.2.1': [
    { name: '节点 C', connections: ['节点 D'] },
    { name: '节点 D', connections: ['节点 C'] },
  ],
  '3.3.3.1': [
    { name: '节点 E', connections: ['节点 F'] },
    { name: '节点 F', connections: ['节点 E'] },
  ],
};

const NodeResults = () => {
  const [ipList, setIpList] = useState<{label: string, value: string}[]>([]);
  const [selectedIP, setSelectedIP] = useState<string>('');
  const [nodes, setNodes] = useState(nodesData[selectedIP] || []);
  const [graph, setGraph] = useState(graphData[selectedIP] || []);

  // 获取IP列表
  useEffect(() => {
    const fetchIPList = async () => {
      try {
        const response = await getIPList();
        if (response.success && response.data) {
          setIpList(response.data);
          if (response.data.length > 0) {
            setSelectedIP(response.data[0].value);
            setNodes(nodesData[response.data[0].value] || []);
            setGraph(graphData[response.data[0].value] || []);
          }
        }
      } catch (error) {
        console.error('获取IP列表失败:', error);
      }
    };
    fetchIPList();
  }, []);

  const handleIPChange = (value: string) => {
    setSelectedIP(value);
    setNodes(nodesData[value] || []);
    setGraph(graphData[value] || []);
  };

  const initGraphChart = () => {
    const container = document.getElementById('neo4jGraph');
    if (!container) return;

    const myChart = echarts.init(container);
    myChart.showLoading();

    const nodeColors = ['#FF6F61', '#6A5ACD', '#1ABC9C', '#F4D03F', '#3498DB'];
    const data = graph.map((node, index) => ({
      name: node.name,
      symbolSize: 40,
      itemStyle: {
        color: nodeColors[index % nodeColors.length],
        shadowBlur: 10,
        shadowColor: '#555',
      },
    }));

    const links = graph.flatMap((node) =>
      node.connections.map((conn) => ({
        source: node.name,
        target: conn,
        lineStyle: {
          color: nodeColors[graph.findIndex(n => n.name === node.name) % nodeColors.length],
        },
      }))
    );

    const option = {
      title: { text: '', left: 'center' },
      backgroundColor: '#070707',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
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
          zoom: 0.7,
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
            width: 2,
            curveness: 0.3,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
          data,
          links,
        },
      ],
    };

    myChart.hideLoading();
    myChart.setOption(option);
    myChart.resize();
    window.addEventListener('resize', () => myChart.resize());
  };

  useEffect(() => {
    initGraphChart();
  }, [selectedIP, graph]);

  return (
    <div>
      <Card title="节点分析结果">
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={12}>
            <Select 
              value={selectedIP} 
              style={{ width: '100%' }} 
              onChange={handleIPChange}
              placeholder="请选择IP地址"
            >
              {ipList.map((ip) => (
                <Option key={ip.value} value={ip.value}>
                  {ip.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Statistic
              title="当前IP"
              value={selectedIP || '未选择'}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={12}>
            <Card title="节点信息概览">
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {nodes.map((node) => (
                  <Descriptions
                    key={node.ip}
                    title={node.title}
                    bordered
                    size="small"
                    column={1}
                    style={{ marginBottom: 16 }}
                  >
                    <Descriptions.Item label="域名">{node.domain}</Descriptions.Item>
                    <Descriptions.Item label="IP 地址">{node.ip}</Descriptions.Item>
                    <Descriptions.Item label="地理位置">{node.location}</Descriptions.Item>
                    <Descriptions.Item label="探测时间">{node.probeTime}</Descriptions.Item>
                  </Descriptions>
                ))}
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="知识图谱">
              <div id="neo4jGraph" style={{ width: '100%', height: '400px' }}></div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default NodeResults;
