import { getNodeDistribution, getLatestIPs, getIpCounts } from '@/services/database';
import { Card, Col, Popover, Row, Button } from 'antd'; // 添加 Button 组件的引入
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useRequest } from 'umi';
import './style.less';
// import axios from 'axios'; // 确保安装 axios: npm install axios
import { io } from 'socket.io-client';
import { Layout } from 'antd'
import StarryBackground from '@/components/Background'

const SituationAwareness: React.FC = () => {
  const globeRef = useRef<any>();
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const [latestLog, setLatestLog] = useState<string>(''); // 保存最新日志

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
  const [columnData, setColumnData] = useState<{ month: string, count: number }[]>([]);

  const [scanProgress, setScanProgress] = useState(40); // 初始进度为40%
  const [processedProgress, setProcessedProgress] = useState(29); // 初始进度为29%

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
  const [displayedIPs, setDisplayedIPs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);


  useEffect(() => {
    if (latestIPsData && latestIPsData.length > 0) {
      setIpList(latestIPsData);
      setDisplayedIPs(latestIPsData.slice(0, 4)); // 初始化显示前4个
      setCurrentIndex(4 % latestIPsData.length);
    }
  }, [latestIPsData]);

  useEffect(() => {
    // 设置一个定时器，缓慢增加进度
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev < 100) {
          return Math.min(prev + 1, 100); // 每次增加0.1%，最大为100%
        }
        return prev;
      });
    }, 10000); // 每100ms更新一次

    const processedInterval = setInterval(() => {
      setProcessedProgress(prev => {
        if (prev < 100) {
          return Math.min(prev + 1, 100); // 每次增加0.1%，最大为100%
        }
        return prev;
      });
    }, 10000); // 每100ms更新一次

    return () => {
      clearInterval(scanInterval);
      clearInterval(processedInterval); // 组件卸载时清理定时器
    };
  }, []);


  const newsData = [
    {
      title: '个人隐私泄露危机：谁在暗网“直播”你的人生',
      date: '2025-4-29',
      content: '个人信息面临“开盒“风险，”开盒“即利用非法手段公开曝光他人隐私数据与信息。近期，《中国经济周刊》记者潜入多个“开盒”telegram群组，探寻普通人与恶的距离究竟有多近。',
    },
    {
      title: '加密货币平台OKX数据遭到泄露',
      date: '2025-01-11',
      content: '2025.1.11某暗网数据交易平台有人宣称正在售卖一份加密货币平台OKX数据。卖家称此份数据共100万条，包含的数据字段有：姓名、手机号、运营商、金额、注册账号、网站编码等，此份数据的价格为150美元。',
    },
    {
      title: '3191名美国国会工作人员的数据在暗网中泄露',
      date: '2024-09-29',
      content: '互联网安全公司 Proton 和 Constella Intelligence 的最新研究显示，约有 3,191 名国会工作人员的个人信息在暗网上被泄露。泄露的数据包括密码、IP 地址和社交媒体信息。几乎五分之一的国会工作人员的个人信息在暗网上被泄露。近 300 名工作人员的数据在 10 多起不同的事件中遭到泄露。',
    },
    {
      title: '暗网Nemesis Market创始人被起诉，涉嫌加密货币洗钱等犯罪',
      date: '2025-04-22',
      content: '据美国司法部公告，伊朗国民 Behrouz Parsarad 因运营暗网市场 Nemesis Market 被美国联邦大陪审团起诉，涉嫌分销管制药品和洗钱。平台通过混币服务为非法交易提供加密货币洗钱服务，且仅支持加密货币支付。2024 年 3 月，美国执法部门联合德国和立陶宛当局查封了 Nemesis Market。2025 年 3 月，美国财政部海外资产控制办公室对 Parsarad 实施制裁。',
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

  useEffect(() => {
    const socket = io('http://localhost:5000'); // 连接到后端 WebSocket
    socket.on('log', (data: { message: string }) => {
      setLatestLog(data.message); // 更新最新日志
    });

    return () => {
      socket.disconnect(); // 组件卸载时断开连接
    };
  }, []);

  useEffect(() => {
    if (ipList.length < 5) return;

    const interval = setInterval(() => {
      setDisplayedIPs(prev => {
        const nextIP = ipList[currentIndex];
        const newDisplay = [nextIP, ...prev.slice(0, 3)];
        return newDisplay;
      });
      setCurrentIndex(prev => (prev + 1) % ipList.length);
    }, 3000); // 每3秒插入一个新的

    return () => clearInterval(interval);
  }, [ipList, currentIndex]);


  const handleManualUpdate = async () => {
    try {
      const response = await fetch('http://localhost:5000/run-script', { method: 'POST' });
      if (response.ok) {
        console.log('脚本运行已触发');
      } else {
        console.error('触发脚本运行失败');
      }
    } catch (error) {
      console.error('请求失败:', error);
    }
  };

  return (
    <>
      {/* 添加顶部说明和按钮 */}
      <div
        style={{
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          background: '#1c1c1c',
          color: '#fff',
          borderBottom: '1px solid #333',
          width: '89%',
          maxWidth: '1740px', // 设置最大宽度
          marginLeft: '20px',
          paddingLeft: '20px',
        }}
      >
        <div style={{fontSize: '16px', fontWeight: 'bold'}}>
          本项目自动追踪最新Tor官网信息，预计每两小时自动更新数据
        </div>
        <div style={{fontSize: '14px', color: '#FFD700', textAlign: 'center'}}>
          {latestLog || '暂无日志信息'}
        </div>
        <Button type="primary" onClick={handleManualUpdate}>
          手动更新
        </Button>
      </div>

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

      <div style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh', zIndex: 0}}>
        <StarryBackground/>
        <Layout style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, zIndex: -2}}>
        </Layout>
      </div>

      <div style={{padding: '20px'}}>
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
                  bodyStyle={{padding: '10px', background: '#070707'}}
                >
                  <ReactECharts option={columnChartOption}/>
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
                        <div style={{maxWidth: '300px'}}>
                          <h4>{news.title}</h4>
                          <p>{news.content}</p>
                        </div>
                      }
                      title="新闻详情"
                      trigger="click"
                      open={openPopoverIndex === index}
                      onOpenChange={(visible) => setOpenPopoverIndex(visible ? index : null)}
                      overlayStyle={{zIndex: 999}}
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
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>{news.title}</span>
                          <span style={{color: '#aaa'}}>{news.date}</span>
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
      <div style={{padding: '20px'}}>
        <Row gutter={[50, 50]}>
          <Col span={14}>
            <Card title="实时任务展示" bodyStyle={{background: '#1c1c1c', color: '#fff'}}>
              {[
                {label: '已获取 Tor 节点', percent: 100},
                {label: 'Tor 节点扫描进度', percent: scanProgress}, // 使用状态值
                {label: '已处理 Tor 节点', percent: processedProgress}, // 使用状态值
              ].map((item, index) => (
                <div key={index} style={{marginBottom: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                    <div style={{marginRight: 10, color: '#FCDA8C'}}>{item.label}</div>
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
                    <div style={{color: '#aaa'}}>{item.percent}%</div>
                    <div style={{background: '#333', borderRadius: 4, overflow: 'hidden'}}>
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
              bodyStyle={{background: '#070707', color: '#fff', height: '270px'}}
              loading={latestIPsLoading}
            >
              <TransitionGroup style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {displayedIPs.map((ip) => (
                  <CSSTransition key={ip} timeout={500} classNames="fade-item">
                    <div className="ip-item" style={{
                      background: '#1c1c1c',
                      color: '#FCDA8C',
                      padding: '10px',
                      borderRadius: '4px',
                    }}>
                      新增 IP: {ip}
                    </div>
                  </CSSTransition>
                ))}
              </TransitionGroup>
            </Card>
          </Col>
        </Row>
      </div>
      <div style={{padding: '20px', maxWidth: '91.5%'}}>
        <Card title="节点脆弱性情况" bodyStyle={{background: '#1c1c1c', color: '#fff'}}>
          <Row gutter={[16, 16]}>
            {/* 高脆弱性标签 */}
            <Col span={8}>
              <div
                style={{
                  background: '#FFB3A7', // 调整为淡红色
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    background: '#FF6F61', // 深红色
                    color: '#fff',
                    padding: '12px 20px', // 调整大小
                    borderRadius: '8px', // 调整圆角
                    fontWeight: 'bold',
                    marginRight: '10px', // 与左半边稍微贴合
                  }}
                >
                  高脆弱性节点
                </div>
                <span style={{fontSize: '14px', color: '#fff'}}>70-100</span>
              </div>
            </Col>

            {/* 中脆弱性标签 */}
            <Col span={8}>
              <div
                style={{
                  background: '#FFE599', // 调整为淡黄色
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    background: '#F4D03F', // 深黄色
                    color: '#fff',
                    padding: '12px 20px', // 调整大小
                    borderRadius: '8px', // 调整圆角
                    fontWeight: 'bold',
                    marginRight: '10px', // 与左半边稍微贴合
                  }}
                >
                  中脆弱性节点
                </div>
                <span style={{fontSize: '14px', color: '#fff'}}>40-70</span>
              </div>
            </Col>

            {/* 低脆弱性标签 */}
            <Col span={8}>
              <div
                style={{
                  background: '#B3E5D6', // 调整为淡绿色
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    background: '#1ABC9C', // 深绿色
                    color: '#fff',
                    padding: '12px 20px', // 调整大小
                    borderRadius: '8px', // 调整圆角
                    fontWeight: 'bold',
                    marginRight: '10px', // 与左半边稍微贴合
                  }}
                >
                  低脆弱性节点
                </div>
                <span style={{fontSize: '14px', color: '#fff'}}>0-40</span>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{marginTop: '20px'}}>
            {/* 脆弱性占比饼状图 */}
            <Col span={12}>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                  },
                  legend: {
                    bottom: 0,
                    textStyle: {color: '#fff'},
                  },
                  series: [
                    {
                      name: '脆弱性占比',
                      type: 'pie',
                      radius: '50%',
                      data: [
                        {value: 40, name: '高脆弱性', itemStyle: {color: '#FF6F61'}}, // 深红色
                        {value: 35, name: '中脆弱性', itemStyle: {color: '#F4D03F'}}, // 深黄色
                        {value: 25, name: '低脆弱性', itemStyle: {color: '#1ABC9C'}}, // 深绿色
                      ],
                      itemStyle: {
                        borderRadius: 8,
                        borderColor: '#1c1c1c',
                        borderWidth: 2,
                      },
                      label: {
                        color: '#fff',
                      },
                    },
                  ],
                }}
                style={{height: '300px'}}
              />
            </Col>

            {/* 周期性热力矩阵 */}
            <Col span={12}>
              <ReactECharts
                option={{
                  tooltip: {
                    position: 'top',
                    formatter: (params: any) => `日期: ${params.name}<br/>数量: ${params.value[2]}`,
                  },
                  grid: {
                    height: '60%',
                    top: '10%',
                  },
                  xAxis: {
                    type: 'category',
                    data: ['高', '中', '低'],
                    splitArea: {show: true},
                    axisLabel: {color: '#fff'},
                  },
                  yAxis: {
                    type: 'category',
                    data: ['Day 6', 'Day 5', 'Day 4', 'Day 3', 'Day 2', 'Day 1'],
                    splitArea: {show: true},
                    axisLabel: {color: '#fff'},
                  },
                  visualMap: {
                    min: 0,
                    max: 50,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '5%',
                    textStyle: {color: '#fff'},
                  },
                  series: [
                    {
                      name: '脆弱性数量',
                      type: 'heatmap',
                      data: [
                        [0, 0, 10],
                        [0, 1, 19],
                        [0, 2, 8],
                        [1, 0, 15],
                        [1, 1, 25],
                        [1, 2, 20],
                        [2, 0, 5],
                        [2, 1, 10],
                        [2, 2, 30],
                      ],
                      label: {
                        show: true,
                        color: '#fff',
                      },
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowColor: 'rgba(0, 0, 0, 0.5)',
                        },
                      },
                    },
                  ],
                }}
                style={{height: '300px'}}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
};

export default SituationAwareness;
