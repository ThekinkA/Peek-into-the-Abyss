import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import './ResultAnalysis.less';
import { Layout } from 'antd'
import StarryBackground from '@/components/Background'

const steps = [
  '输入文件传入到 MulVAL',
  'MulVAL 输出攻击图',
  '输入到贝叶斯攻击图',
  '输出包含概率的攻击图',
  '进入大模型提取分析',
];

const ResultAnalysis: React.FC = () => {
  const { state } = useLocation();
  const ip = state?.ip || '未知IP';
  const [currentStep, setCurrentStep] = useState(0);
  const [showBoxes, setShowBoxes] = useState(false);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState('概率最高的攻击路径');
  const [graphData, setGraphData] = useState<{ nodes: any[]; relationships: any[] } | null>(null);
  const [queryIndex, setQueryIndex] = useState(1); // 当前查询索引，初始值为 1
  const [noResult, setNoResult] = useState(false); // 是否显示“未查询到结果”的提示

  const checkStepStatus = async (step: string) => {
    try {
      const response = await fetch('http://localhost:5000/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('检查步骤状态失败:', error);
      return false;
    }
  };

  useEffect(() => {
    const proceedToNextStep = async () => {
      if (currentStep === 0) {
        setCurrentStep(1); // 显示第一个步骤
      } else if (currentStep === 1) {
        const isMulVALComplete = await checkStepStatus('MulVAL');
        const isBayesianComplete = await checkStepStatus('Bayesian');
        if (isMulVALComplete) {
          setCurrentStep(2); // 显示第二个步骤
        } else if (isBayesianComplete) {
          setCurrentStep(3); // 跳过 MulVAL，直接显示第三个步骤
        }
      } else if (currentStep === 2) {
        setCurrentStep(3); // 显示第三个步骤
      } else if (currentStep === 3) {
        const isBayesianComplete = await checkStepStatus('Bayesian');
        if (isBayesianComplete) setCurrentStep(4); // 显示第四个步骤
      } else if (currentStep === 4) {
        setCurrentStep(5); // 显示第五个步骤
        setShowBoxes(true);
      }
    };

    // 定时刷新逻辑
    const interval = setInterval(() => {
      proceedToNextStep();
    }, 2000); // 每 2 秒检查一次状态

    return () => clearInterval(interval); // 清除定时器
  }, [currentStep]);

  const handleCardClick = async (step: string) => {
    if (step === 'MulVAL 输出攻击图') {
      setPdfFile(`/data/${ip}_input_AttackGraph.pdf`); // 替换为 MulVAL 的 PDF 文件路径
      setCardTitle('MulVAL 输出攻击图');
      setNoResult(false); // 隐藏“未查询到结果”的提示
      setGraphData(null); // 清空图表数据
    } else if (step === '输出包含概率的攻击图') {
      setPdfFile(`/data/result.dot.pdf`); // 替换为贝叶斯的 PDF 文件路径
      setCardTitle('包含概率的攻击图');
      setNoResult(false); // 隐藏“未查询到结果”的提示
      setGraphData(null); // 清空图表数据
    } else if (step === '进入大模型提取分析') {
      setPdfFile(null); // 清空 PDF 文件
      setCardTitle('概率最高的攻击路径');
      await fetchGraphData(); // 获取 Neo4j 数据
      renderGraph(); // 渲染图
    }
  };

  // 获取图数据
  const fetchGraphData = async () => {
    try {
      const response = await fetch('http://localhost:5000/get-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetIp: ip, queryIndex }), // 动态传递 queryIndex
      });
      const data = await response.json();

      console.log('Fetched graph data:', data); // 打印数据

      if (!data.nodes.length && !data.relationships.length) {
        setNoResult(true); // 如果查询结果为空，显示提示
        setGraphData({ nodes: [], relationships: [] }); // 设置为空数组，而不是 null
      } else {
        setNoResult(false); // 隐藏提示
        setGraphData(data);
      }
    } catch (error) {
      console.error('获取图数据失败:', error);
      setNoResult(true);
      setGraphData({ nodes: [], relationships: [] }); // 设置为空数组，避免后续渲染问题
    }
  };

  // 渲染图
  const renderGraph = () => {
    const chartDom = document.getElementById('graph-container');
    if (!chartDom || !graphData) return;

    const myChart = echarts.init(chartDom);

    const option = {
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `节点: ${params.data.name}`;
          } else if (params.dataType === 'edge') {
            return `关系: ${params.data.type}`;
          }
          return '';
        },
      },
      animationDurationUpdate: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: graphData.nodes.map((node) => ({
            id: node.id.toString(),
            name: node.name,
            symbolSize: 50,
            itemStyle: { color: '#108ee9' },
          })),
          links: graphData.relationships.map((rel) => ({
            source: rel.source.toString(),
            target: rel.target.toString(),
            type: rel.type,
            label: {
              show: true,
              formatter: rel.type,
              fontSize: 14, // 设置字体大小
              fontWeight: 'bold', // 设置字体粗细
              color: '#fff', // 设置字体颜色
            },
          })),
          label: {
            show: true,
            position: 'inside', // 节点标签位置
            fontSize: 12, // 设置节点字体大小
            fontWeight: 'bold', // 设置节点字体粗细
            color: '#fff', // 设置节点字体颜色
          },
          roam: true,
          force: {
            repulsion: 1000,
            edgeLength: [50, 200],
          },
        },
      ],
    };

    myChart.setOption(option);
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (currentStep === 5) { // 第五步为“进入大模型提取分析”
      fetchGraphData(); // 获取 Neo4j 数据
    }
  }, [currentStep]);

  useEffect(() => {
    if (graphData) {
      const chartDom = document.getElementById('graph-container');
      if (chartDom) {
        renderGraph(); // 渲染图
      } else {
        console.error('Graph container not found');
      }
    }
  }, [graphData]);

  useEffect(() => {
    fetchGraphData();
  }, [queryIndex]);

  return (
    <>
      <div style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh'}}>
        <StarryBackground/>
        <Layout style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, zIndex: -1}}>
        </Layout>
      </div>
      <div className="result-analysis-container">
        <div style={{marginBottom: '20px', textAlign: 'center'}}>
          <h2 style={{fontWeight: 'bold', color: '#333'}}>攻击路径分析</h2>
          当前IP: <Tag color="red">{ip}</Tag>
        </div>

        <Row gutter={16} className="flow-container" style={{marginBottom: '20px'}}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <Col>
                <Card
                  className={`flow-step ${index < currentStep ? 'visible' : ''}`}
                  onClick={() => handleCardClick(step)}
                  style={{
                    textAlign: 'center',
                    backgroundColor: index === currentStep ? '#f0f5ff' : 'rgba(204, 0, 0, 1)',
                    border: index === currentStep ? '2px solid rgb(0, 0, 0)' : '1px solid rgb(0, 0, 0)',
                    transition: 'all 0.3s',
                  }}
                >
                  {step}
                </Card>
              </Col>
              {index < steps.length - 1 && (
                <Col>
                  <ArrowRightOutlined
                    className={`flow-arrow ${index < currentStep - 1 ? 'visible' : ''}`}
                    style={{fontSize: '20px', color: '#1890ff'}}
                  />
                </Col>
              )}
            </React.Fragment>
          ))}
        </Row>

        <CSSTransition
          in={showBoxes}
          timeout={500}
          classNames="fade"
          unmountOnExit
          onEntered={() => {
            if (graphData) {
              renderGraph(); // 动画完成后渲染图
            }
          }}
        >
          <Row gutter={24} style={{marginTop: '40px'}}>
            <Col span={24}>
              <Card
                title={
                  <span style={{fontSize: '20px', fontWeight: 'bold', color: 'white'}}>
                  {cardTitle}
                </span>
                }
                style={{
                  height: '700px',
                  width: '100%',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  position: 'relative',
                }}
              >
                {pdfFile ? (
                  <iframe
                    src={pdfFile}
                    title="PDF Viewer"
                    style={{width: '100%', height: '600px', border: 'none'}}
                  ></iframe>
                ) : noResult ? (
                  <div style={{textAlign: 'center', color: '#ff4d4f', fontSize: '18px'}}>
                    未查询到结果
                  </div>
                ) : (
                  <div
                    id="graph-container"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      backgroundColor: '#000',
                    }}
                  ></div>
                )}

                {/* 左右箭头按钮 */}
                {!pdfFile && (
                  <div style={{position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px'}}>
                    <button
                      style={{
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: queryIndex === 1 ? 'not-allowed' : 'pointer',
                      }}
                      disabled={queryIndex === 1}
                      onClick={() => {
                        setQueryIndex((prev) => Math.max(1, prev - 1));
                      }}
                    >
                      &lt;
                    </button>
                    <button
                      style={{
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setQueryIndex((prev) => prev + 1);
                      }}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </Card>
            </Col>
            <Col span={24} style={{marginTop: '20px'}}>
              <Card
                title="报告文本"
                style={{
                  height: '300px',
                  width: '100%',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                }}
              >
                <p style={{color: '#555'}}>这里是报告文本的内容。</p>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </div>
      </>
      );
      };

      export default ResultAnalysis;
