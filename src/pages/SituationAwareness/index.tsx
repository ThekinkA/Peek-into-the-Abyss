import { getNodeDistribution, getLatestIPs, getIpCounts } from '@/services/database';
import { Card, Col, Popover, Row } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useRequest } from 'umi';
import './style.less';

const SituationAwareness: React.FC = () => {
  const globeRef = useRef<any>();
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  interface NodeData {
    lat: number;
    lng: number;
    size: number;
    city: string;
    country: string;
  }

  const { data, loading } = useRequest(getNodeDistribution);
  const [nodesData, setNodesData] = useState<NodeData[]>([]);

  useEffect(() => {
    if (data) {
      const processedData = data.map((item) => ({
        lat: item.latitude,
        lng: item.longitude,
        size: item.ipCount,
        city: item.city,
        country: item.country,
      }));
      setNodesData(processedData);
    }
  }, [data]);

  const { data: ipCountsData } = useRequest(getIpCounts);
  const [columnData, setColumnData] = useState<{month: string, count: number}[]>([]);

  // 修改日期处理部分
  useEffect(() => {
    if (ipCountsData) {
      const processedData = ipCountsData.map(item => ({
        month: new Date(item.valid_after_time).toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
        }).replace(/\//g, '月').replace(',', '日') + '时',
        count: item.ip_num
      }));
      setColumnData(processedData.reverse());
    }
  }, [ipCountsData]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 30, lng: 110, altitude: 2.5 });
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    }
  }, []);

  const { data: latestIPsData, loading: latestIPsLoading } = useRequest(getLatestIPs);
  const [ipList, setIpList] = useState<string[]>([]);

  useEffect(() => {
    if (latestIPsData) {
      setIpList(latestIPsData);
    }
  }, [latestIPsData]);

  const newsData = [
    {
      title: '科学界惊呼生物学被改写',
      date: '2077-13-31',
    },
    {
      title: '新型加密技术崛起，挑战全球安全',
      date: '2035-04-99',
    },
    {
      title: '数据泄露案件频发，黑客攻击加剧',
      date: '2025-04-15',
    },
    {
      title: '数据泄露案件频发，黑客攻击加剧',
      date: '2025-04-15',
    },
  ];

  // 修改图表配置部分
  const columnChartOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(20,20,20, 1)',
      textStyle: { color: '#ffffff' },
      formatter: (params: any) => {
        return `
          <div style="color: #FCDA8C; font-weight: bold; margin-bottom: 6px;">${params.name}</div>
          <div>数量: <span style="color:#FCDA8C">${params.value}</span></div>
        `;
      },
    },
    xAxis: {
      type: 'category',
      data: columnData.map((d) => d.month),
      axisLabel: {
        color: '#FFD5D5',
        interval: 0,  // 显示所有标签
        rotate: 30    // 旋转标签以防重叠
      },
      axisLine: {
        lineStyle: { color: '#FFD5D5' },
      },
    },
    yAxis: {
      type: 'value',
      min: 8500,      // 设置y轴最小值
      interval: 100,  // 设置刻度间隔
      axisLabel: {
        color: '#FFD5D5',
      },
      axisLine: {
        lineStyle: { color: '#FFD5D5' },
      },
      splitLine: {    // 添加网格线
        show: true,
        lineStyle: {
          color: 'rgba(255,255,255,0.1)',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        data: columnData.map((d) => d.count),
        type: 'bar',
        itemStyle: { color: '#DA2A2A' },
        barWidth: 40,
      },
    ],
    grid: {          // 调整图表边距
      left: '10%',
      right: '5%',
      bottom: '15%'  // 为旋转的x轴标签留出空间
    }
  };

  return (
    <>
      {openPopoverIndex !== null && (
        <div
          onClick={() => setOpenPopoverIndex(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
        />
      )}

      <div style={{ padding: '20px' }}>
        <Row gutter={[50, 50]}>
          <Col span={14}>
            <Card
              title="全球暗网节点分布"
              loading={loading}
              bodyStyle={{
                padding: 0,
                background: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '650px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
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
                  pointAltitude={() => 0.2}
                  pointColor={(d) => {
                    const data = d as NodeData;
                    const minSize = Math.min(...nodesData.map(n => n.size));
                    const maxSize = Math.max(...nodesData.map(n => n.size));
                    const t = (data.size - minSize) / (maxSize - minSize || 1); // 避免除以0

                    const r = 255;
                    const g = Math.round(255 * (1 - t));
                    const b = 0;

                    return `rgba(${r},${g},${b},0.7)`;
                  }}
                  pointRadius={0.2}
                  pointsMerge={false}
                  pointsTransitionDuration={1000}
                  atmosphereColor="rgba(255,100,100,0.3)"
                  atmosphereAltitude={0.1}
                  showGraticules={true}
                  pointLabel={(d) => {
                    const data = d as NodeData;
                    return `
                      <div style="background-color: rgba(255,255,255,0.95); color: #000; padding: 8px; border-radius: 4px; font-family: Arial; font-size: 12px;">
                        <strong>城市: ${data.city}</strong><br/>
                        <strong>国家: ${data.country}</strong><br/>
                        <strong>IP数量: ${data.size}</strong><br/>
                        <strong>经度: ${data.lng.toFixed(2)}</strong><br/>
                        <strong>纬度: ${data.lat.toFixed(2)}</strong>
                      </div>
                    `;
                  }}
                  width={950}
                  height={650}
                />
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Row gutter={[0, 50]}>
              <Col span={24}>
                <Card
                  title="最新的 6 个 Tor 节点数量变化"
                  bodyStyle={{ padding: '10px', background: '#070707' }}
                >
                  <ReactECharts option={columnChartOption} />
                </Card>
              </Col>

              <Col span={24}>
                <Card
                  title="最新新闻"
                  bodyStyle={{
                    padding: '10px',
                    background: '#070707',
                    color: '#fff',
                    height: '40%',
                  }}
                >
                  {newsData.map((news, index) => (
                    <Popover
                      key={index}
                      content={
                        <div style={{ maxWidth: '300px' }}>
                          <h4>{news.title}</h4>
                          <p>这是该新闻的详细内容，可以从后端获取或手动补充摘要。</p>
                        </div>
                      }
                      title="新闻详情"
                      trigger="click"
                      open={openPopoverIndex === index}
                      onOpenChange={(visible) => setOpenPopoverIndex(visible ? index : null)}
                      overlayStyle={{ zIndex: 999 }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPopoverIndex(index);
                        }}
                        style={{
                          cursor: 'pointer',
                          padding: '10px',
                          background: '#1c1c1c',
                          color: '#FCDA8C',
                          marginBottom: '10px',
                          borderRadius: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{news.title}</span>
                          <span style={{ color: '#aaa' }}>{news.date}</span>
                        </div>
                      </div>
                    </Popover>
                  ))}
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
      <div style={{ padding: '20px' }}>
        <Row gutter={[50, 50]}>
          <Col span={14}>
            <Card title="实时任务展示" bodyStyle={{ background: '#1c1c1c', color: '#fff' }}>
              {[
                { label: '已获取 Tor 节点', percent: 30.5 },
                { label: 'Tor 节点扫描进度', percent: 80 },
                { label: '已处理 Tor 节点', percent: 29 },
              ].map((item, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ marginRight: 10, color: '#FCDA8C' }}>{item.label}</div>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        border: '2px solid #FCDA8C',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginLeft: 'auto',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ color: '#aaa' }}>{item.percent}%</div>
                    <div style={{ background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percent}%`,
                          height: 8,
                          background: '#DA2A2A',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title="新增已检测 IP 展示"
              bodyStyle={{ background: '#070707', color: '#fff', height: '270px' }}
              loading={latestIPsLoading}
            >
              <TransitionGroup style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ipList.map((ip) => (
                  <CSSTransition key={ip} timeout={500} classNames="fade-item">
                    <div
                      className="ip-item"
                      style={{
                        background: '#1c1c1c',
                        color: '#FCDA8C',
                        padding: '10px',
                        borderRadius: '4px',
                      }}
                    >
                      新增 IP: {ip}
                    </div>
                  </CSSTransition>
                ))}
              </TransitionGroup>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SituationAwareness;
