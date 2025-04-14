import { Column, Line } from '@ant-design/plots';
import { Card, Col, Row } from 'antd';
import React, { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

const SituationAwareness: React.FC = () => {
  const globeRef = useRef<any>();

  // 模拟暗网节点数据
  interface NodeData {
    lat: number;
    lng: number;
    size: number;
    city: string;
  }

  const nodesData: NodeData[] = [
    { lat: 37.7749, lng: -122.4194, size: 50, city: 'San Francisco' },
    { lat: 40.7128, lng: -74.006, size: 80, city: 'New York' },
    { lat: 51.5074, lng: -0.1278, size: 60, city: 'London' },
    { lat: 35.6895, lng: 139.6917, size: 100, city: 'Tokyo' },
    { lat: 48.8566, lng: 2.3522, size: 70, city: 'Paris' },
  ];

  // 折线图数据：最新的 6 个 Tor 节点数量变化
  const lineData = [
    { time: '2023-11', value: 120 },
    { time: '2023-12', value: 150 },
    { time: '2024-01', value: 180 },
    { time: '2024-02', value: 200 },
    { time: '2024-03', value: 170 },
    { time: '2024-04', value: 190 },
  ];

  // 柱状图数据：近 6 个月的暗网犯罪事件数量统计
  const columnData = [
    { month: '2023-11', count: 30 },
    { month: '2023-12', count: 45 },
    { month: '2024-01', count: 50 },
    { month: '2024-02', count: 40 },
    { month: '2024-03', count: 60 },
    { month: '2024-04', count: 55 },
  ];

  // 折线图配置
  const lineConfig = {
    data: lineData,
    xField: 'time',
    yField: 'value',
    smooth: true,
    point: {
      size: 5,
      shape: 'circle',
    },
    color: '#1979C9',
    xAxis: {
      title: {
        text: '时间',
      },
    },
    yAxis: {
      title: {
        text: '节点数量',
      },
    },
    height: 200, // 设置图表高度
  };

  // 柱状图配置
  const columnConfig = {
    data: columnData,
    xField: 'month',
    yField: 'count',
    color: '#FF4D4F',
    xAxis: {
      title: {
        text: '月份',
      },
    },
    yAxis: {
      title: {
        text: '事件数量',
      },
    },
    height: 200, // 设置图表高度
  };

  useEffect(() => {
    if (globeRef.current) {
      // 设置初始视角
      globeRef.current.pointOfView({ lat: 30, lng: 110, altitude: 2.5 });

      // 添加自动旋转
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>暗网节点态势感知系统</h1>
      <p style={{ textAlign: 'center', fontSize: '16px', color: '#666', marginBottom: '40px' }}>
        本系统通过可视化技术展示全球范围内的暗网节点分布情况，并提供最新的 Tor
        节点数量变化和暗网犯罪事件统计数据。
      </p>
      <Row gutter={[16, 16]}>
        {/* 3D 地球 */}
        <Col span={24}>
          <Card
            title="全球暗网节点分布"
            bodyStyle={{
              padding: '0', // 移除内边距
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#000',
            }}
          >
            <div
              style={{
                width: '100%', // 确保宽度占满
                height: '500px',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex', // 使用 flex 布局
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                pointsData={nodesData}
                pointAltitude={(d: NodeData) => d.size / 50}
                pointColor={() => '#FF4444'}
                pointRadius={0.5}
                pointsMerge={true}
                pointsTransitionDuration={1000}
                atmosphereColor="rgba(255,100,100,0.3)"
                atmosphereAltitude={0.1}
                showGraticules={true}
                pointLabel={(d: NodeData) => `
                  <div style="
                    background-color: rgba(0,0,0,0.8);
                    color: white;
                    padding: 8px;
                    border-radius: 4px;
                    font-family: Arial;
                    font-size: 12px;
                  ">
                    <strong>${d.city}</strong><br/>
                    节点数量: ${d.size}
                  </div>
                `}
                width={800} // 设置固定宽度
                height={500} // 设置固定高度
              />
            </div>
          </Card>
        </Col>

        {/* 折线图 */}
        <Col span={12}>
          <Card title="最新的 6 个 Tor 节点数量变化" bodyStyle={{ padding: '10px' }}>
            <Line {...lineConfig} />
          </Card>
        </Col>

        {/* 柱状图 */}
        <Col span={12}>
          <Card title="近 6 个月暗网犯罪事件数量统计" bodyStyle={{ padding: '10px' }}>
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SituationAwareness;
