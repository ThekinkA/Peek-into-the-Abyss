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
const ATTACK_COLUMNS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Command and Control'
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
  const [attackHighlight, setAttackHighlight] = useState<number[]>([]);

  // ATT&CK矩阵数据（不变）
  const attackMatrix: string[][] = [
    [
      // Reconnaissance
      'Active Scanning (3)',
      // Resource Development
      'Acquire Access',
      // Initial Access
      'Content Injection',
      // Execution
      'Cloud Administration Command',
      // Persistence
      'Account Manipulation (7)',
      // Privilege Escalation
      'Abuse Elevation Control Mechanism (6)',
      // Defense Evasion
      'Abuse Elevation Control Mechanism (6)',
      // Credential Access
      'Adversary-in-the-Middle (4)',
      // Discovery
      'Account Discovery (4)',
      // Lateral Movement
      'Exploitation of Remote Services',
      // Collection
      'Adversary-in-the-Middle (4)',
      // Command and Control
      'Application Layer Protocol (5)'
    ],
    [
      'Gather Victim Host Information (4)',
      'Acquire Infrastructure (8)',
      'Drive-by Compromise',
      'Command and Scripting Interpreter (12)',
      'BITS Jobs',
      'Access Token Manipulation (5)',
      'Access Token Manipulation (5)',
      'Brute Force (4)',
      'Application Window Discovery',
      'Internal Spearphishing',
      'Archive Collected Data (3)',
      'Communication Through Removable Media'
    ],
    [
      'Gather Victim Identity Information (3)',
      'Compromise Accounts (3)',
      'Exploit Public-Facing Application',
      'Container Administration Command',
      'Boot or Logon Autostart Execution (14)',
      'Account Manipulation (7)',
      'BITS Jobs',
      'Credentials from Password Stores (6)',
      'Browser Information Discovery',
      'Lateral Tool Transfer',
      'Audio Capture',
      'Content Injection'
    ],
    [
      'Gather Victim Network Information (6)',
      'Compromise Infrastructure (8)',
      'External Remote Services',
      'Deploy Container',
      'Boot or Logon Initialization Scripts (5)',
      'Boot or Logon Autostart Execution (14)',
      'Build Image on Host',
      'Exploitation for Credential Access',
      'Cloud Infrastructure Discovery',
      'Remote Service Session Hijacking (2)',
      'Automated Collection',
      'Data Encoding (2)'
    ],
    [
      'Gather Victim Org Information (4)',
      'Develop Capabilities (4)',
      'Hardware Additions',
      'ESXi Administration Command',
      'Cloud Application Integration',
      'Boot or Logon Initialization Scripts (5)',
      'Debugger Evasion',
      'Forced Authentication',
      'Cloud Service Dashboard',
      'Remote Services (8)',
      'Browser Session Hijacking',
      'Data Obfuscation (3)'
    ],
    [
      'Phishing for Information (4)',
      'Establish Accounts (3)',
      'Phishing (4)',
      'Exploitation for Client Execution',
      'Compromise Host Software Binary',
      'Create or Modify System Process (5)',
      'Deobfuscate/Decode Files or Information',
      'Forge Web Credentials (2)',
      'Cloud Service Discovery',
      'Replication Through Removable Media',
      'Clipboard Data',
      'Dynamic Resolution (3)'
    ],
    [
      'Search Closed Sources (2)',
      'Obtain Capabilities (7)',
      'Replication Through Removable Media',
      'Input Injection',
      'Create Account (3)',
      'Domain or Tenant Policy Modification (2)',
      'Deploy Container',
      'Input Capture (4)',
      'Cloud Storage Object Discovery',
      'Software Deployment Tools',
      'Data from Cloud Storage',
      'Encrypted Channel (2)'
    ],
    [
      'Search Open Technical Databases (5)',
      'Stage Capabilities (6)',
      'Supply Chain Compromise (3)',
      'Inter-Process Communication (3)',
      'Event Triggered Execution (17)',
      'Escape to Host',
      'Direct Volume Access',
      'Modify Authentication Process (9)',
      'Container and Resource Discovery',
      'Taint Shared Content',
      'Data from Configuration Repository (2)',
      'Fallback Channels'
    ],
    [
      'Search Open Websites/Domains (3)',
      '',
      'Trusted Relationship',
      'Native API',
      'Exclusive Control',
      'Event Triggered Execution (17)',
      'Email Spoofing',
      'Multi-Factor Authentication Interception',
      'Debugger Evasion',
      'Use Alternate Authentication Material (4)',
      'Data from Information Repositories (5)',
      'Hide Infrastructure'
    ],
    [
      'Search Victim-Owned Websites',
      '',
      'Valid Accounts (4)',
      'Scheduled Task/Job (5)',
      'External Remote Services',
      'Exploitation for Privilege Escalation',
      'Execution Guardrails (2)',
      'Multi-Factor Authentication Request Generation',
      'Device Driver Discovery',
      '',
      'Data from Local System',
      'Ingress Tool Transfer'
    ],
    [
      '',
      '',
      'Wi-Fi Networks',
      'Serverless Execution',
      'Hijack Execution Flow (12)',
      'Hijack Execution Flow (12)',
      'Exploitation for Defense Evasion',
      'Network Sniffing',
      'Domain Trust Discovery',
      '',
      'Data from Network Shared Drive',
      'Multi-Stage Channels'
    ],
    [
      '',
      '',
      '',
      'Shared Modules',
      'Implant Internal Image',
      'Process Injection (12)',
      'File and Directory Permissions Modification (2)',
      'OS Credential Dumping (8)',
      'File and Directory Discovery',
      '',
      'Data from Removable Media',
      'Non-Application Layer Protocol'
    ],
    [
      '',
      '',
      '',
      'Software Deployment Tools',
      'Modify Authentication Process (9)',
      'Scheduled Task/Job (5)',
      'Hide Artifacts (14)',
      'Steal Application Access Token',
      'Group Policy Discovery',
      '',
      'Data Staged (2)',
      'Non-Standard Port'
    ],
    [
      '',
      '',
      '',
      'System Services (3)',
      'Modify Registry',
      'Valid Accounts (4)',
      'Hijack Execution Flow (12)',
      'Steal or Forge Authentication Certificates',
      'Log Enumeration',
      '',
      'Email Collection (3)',
      'Protocol Tunneling'
    ],
    [
      '',
      '',
      '',
      'User Execution (4)',
      'Office Application Startup (6)',
      '',
      'Impair Defenses (11)',
      'Steal or Forge Kerberos Tickets (5)',
      'Network Service Discovery',
      '',
      'Input Capture (4)',
      'Proxy (4)'
    ],
    [
      '',
      '',
      '',
      'Windows Management Instrumentation',
      'Power Settings',
      '',
      'Impersonation',
      'Steal Web Session Cookie',
      'Network Share Discovery',
      '',
      'Screen Capture',
      'Remote Access Tools (3)'
    ],
    [
      '',
      '',
      '',
      '',
      'Pre-OS Boot (5)',
      '',
      'Indicator Removal (10)',
      'Unsecured Credentials (8)',
      'Password Policy Discovery',
      '',
      'Video Capture',
      'Traffic Signaling (2)'
    ],
    [
      '',
      '',
      '',
      '',
      'Scheduled Task/Job (5)',
      '',
      'Indirect Command Execution',
      '',
      'Permission Groups Discovery (3)',
      '',
      '',
      'Web Service (3)'
    ],
    [
      '',
      '',
      '',
      '',
      'Server Software Component (6)',
      '',
      'Masquerading (11)',
      '',
      'Plist File Modification',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      'Software Extensions (2)',
      '',
      'Modify Authentication Process (9)',
      '',
      'Pre-OS Boot (5)',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      'Traffic Signaling (2)',
      '',
      'Modify Cloud Compute Infrastructure (5)',
      '',
      'Process Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      'Valid Accounts (4)',
      '',
      'Modify Cloud Resource Hierarchy',
      '',
      'Query Registry',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Modify Registry',
      '',
      'Remote System Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Modify System Image (2)',
      '',
      'Software Discovery (1)',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Network Boundary Bridging (1)',
      '',
      'System Information Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Obfuscated Files or Information (17)',
      '',
      'System Location Discovery (1)',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Plist File Modification',
      '',
      'System Network Configuration Discovery (2)',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Pre-OS Boot (5)',
      '',
      'System Network Connections Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Process Injection (12)',
      '',
      'System Owner/User Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Reflective Code Loading',
      '',
      'System Service Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Rogue Domain Controller',
      '',
      'System Time Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Rootkit',
      '',
      'Virtual Machine Discovery',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Subvert Trust Controls (6)',
      '',
      'Virtualization/Sandbox Evasion (3)',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'System Binary Proxy Execution (14)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'System Script Proxy Execution (2)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Template Injection',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Traffic Signaling (2)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Trusted Developer Utilities Proxy Execution (3)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Unused/Unsupported Cloud Regions',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Use Alternate Authentication Material (4)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Valid Accounts (4)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Virtualization/Sandbox Evasion (3)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'Weaken Encryption (2)',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      'XSL Script Processing',
      '',
      '',
      '',
      '',
      ''
    ],
  ];

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
              show: false,
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

  // 动态读取高亮配置
  useEffect(() => {
    fetch('/data/attck_output.txt')
      .then(res => res.text())
      .then(text => {
        // 匹配“攻击路径的attck表示为：1，1，3，3，1，5，6，4，12，1，1，1。”
        const match = text.match(/攻击路径的attck表示为：([\d，, ]+)/);
        if (match) {
          // 兼容中文逗号和英文逗号
          const arr = match[1].replace(/，/g, ',').split(',').map(s => parseInt(s.trim(), 10) - 1);
          setAttackHighlight(arr);
        }
      })
      .catch(() => setAttackHighlight([]));
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh' }}>
        <StarryBackground />
        <Layout style={{ position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, zIndex: -1 }}>
        </Layout>
      </div>
      <div className="result-analysis-container">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ fontWeight: 'bold', color: '#333' }}>攻击路径分析</h2>
          当前IP: <Tag color="red">{ip}</Tag>
        </div>

        <Row gutter={16} className="flow-container" style={{ marginBottom: '20px' }}>
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
                    style={{ fontSize: '20px', color: '#1890ff' }}
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
          <Row gutter={24} style={{ marginTop: '40px' }}>
            <Col span={24}>
              <Card
                title={
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
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
                    style={{ width: '100%', height: '600px', border: 'none' }}
                  ></iframe>
                ) : noResult ? (
                  <div style={{ textAlign: 'center', color: '#ff4d4f', fontSize: '18px' }}>
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
                  <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px' }}>
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
            <Col span={24} style={{ marginTop: '20px' }}>
              <Card
                title="ATT&CK矩阵"
                style={{
                  height: '600px',
                  width: '100%',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  background: '#181c24',
                }}
              >
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1800, color: '#fff', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {ATTACK_COLUMNS.map((col) => (
                          <th key={col} style={{
                            border: '1px solid #333', background: '#222', padding: 6, minWidth: 120, fontWeight: 700
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attackMatrix.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, colIdx) => {
                            // 动态高亮：如果attackHighlight[colIdx] === rowIdx，则高亮
                            const highlight = cell && attackHighlight[colIdx] === rowIdx;
                            return (
                              <td
                                key={colIdx}
                                style={{
                                  border: '1px solid #333',
                                  background: highlight ? '#f87171' : '#222',
                                  color: highlight ? '#fff' : '#c9d1d9',
                                  padding: '4px 8px',
                                  fontWeight: highlight ? 700 : 400,
                                  minWidth: 120,
                                  cursor: cell ? 'pointer' : 'default',
                                  opacity: cell ? 1 : 0.3,
                                }}
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </div>
    </>
  );
};

export default ResultAnalysis;
