import React, { useState, useEffect } from 'react';
import { Button, Space, Card, Tag, Modal, Row,Col } from 'antd';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import './AttackPath.less';

const VulnerabilityInfo: React.FC = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false); // 添加加载状态
    const [detailData, setDetailData] = useState<{ cve: string; dkv: string } | null>(null);
    const [chartShow, setChartShow] = useState(false);

    // 模拟的数据
    const cveData1 = ['CVE-2004-0001', 'CVE-2009-2321', 'CVE-2016-1001', 'CVE-2020-565', 'CVE-2022-1234', 'CVE-2023-6789', 'CVE-2024-1234'];
    const dkvData1 = ['DKV-2222', 'DKV-9322', 'DKV-1325', 'DKV-6789', 'DKV-4567', 'DKV-8888', 'DKV-9999'];
    const cveData = ['CVE'];
    const dkvData = ['DKV'];

    const handleShow = () => {
        setLoading(true); // 开始加载
        setTimeout(() => {
            setShow(true);
            setLoading(false); // 加载完成
        }, 300); // 模拟加载时间
        setChartShow(true);
        setTimeout(() => {
            generateBarChart();
        }, 300); // 等待模态框动画完成
    };

    const handleHide = () => {
        setShow(false);
    };

    const handleDetail = (cve: string, dkv: string) => {
        setDetailData({ cve, dkv });
    };

    const handleCancel = () => {
        setDetailData(null);
    };

    const handleChartClose = () => {
        setChartShow(false);
    };

    // 生成柱状图
    const generateBarChart = () => {
        const chartDom = document.getElementById('bar-chart') as HTMLElement;
        const myChart = echarts.init(chartDom);
        
        // 准备数据
        const cveCounts= [10]; // 模拟的CVE数量
        const dkvCounts = [5]; // 模拟的DKV数量
        const option = {
          colors: ['#ff7373', '#52c41a'],
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: ['CVE数量', 'DKV数量'],
            textStyle: {
              color: '#FFFFFF' // 修改图例字体颜色为白色
            },
            color: ['#ff7373', '#52c41a'] // 修改图例颜色
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [{
            type: 'value'
          }],
          yAxis: [{
            type: 'category',
            data: cveData.map((cve, index) => `${cve} | ${dkvData[index]}`),
            axisTick: {
              show: false
            },
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          }],
          series: [{
              name: 'CVE数量',
              type: 'bar',
              stack: '总量',
              barWidth: 40,
              label: {
                show: true,
                position: 'insideRight'
              },
              emphasis: {
                focus: 'series'
              },
              data: cveCounts.map((value, index) => ({
                value,
                // itemStyle: {
                //   color: '#ff7373', // 红色代表CVE
                // }
              }))
            },
            {
              name: 'DKV数量',
              type: 'bar',
              stack: '总量',
              barWidth: 40,
              label: {
                show: true,
                position: 'insideLeft'
              },
              emphasis: {
                focus: 'series'
              },
              data: dkvCounts.map((value, index) => ({
                value,
                // itemStyle: {
                //   color: '#52c41a', // 绿色代表DKV
                // }
              }))
            }
          ]
        };

        option && myChart.setOption(option);
        
        // 窗口大小变化时重新调整图表
        window.addEventListener('resize', () => {
            myChart.resize();
        });
        
        return () => {
            window.removeEventListener('resize', () => {
                myChart.resize();
            });
            myChart.dispose();
        };
    };

    return (

        <div className="vulnerability-container">
          <Row>
            <Col>
            <Space>
                <Button 
                    type="primary" 
                    onClick={handleShow}
                    loading={loading} // 添加加载状态
                    style={{ width: '120px' }}
                >
                    {loading ? '正在加载...' : '开始脆弱性评估'}
                </Button>
                <CSSTransition in={show} timeout={300} classNames="fade" unmountOnExit>
                    <div className="vulnerability-content">
                        <div className="data-group">
                            <h3>CVE 编号</h3>
                            <div className="data-list">
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
                
            </Space>
            </Col>

            <Col span={11}>
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
                    <p>
                        <strong>CVE 编号：</strong>
                        {detailData.cve}
                    </p>
                    <p>
                        <strong>DKV 编号：</strong>
                        {detailData.dkv}
                    </p>
                    <p>
                        <strong>漏洞描述：</strong>
                        这是一个示例漏洞，具体描述内容可根据实际数据填充。
                    </p>
                </Modal>
            )}
        </div>
    );
};

export default VulnerabilityInfo;