import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Card, Tag, Modal, Row, Col, Input, message } from 'antd';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import { NeoVis } from 'neovis.js';
import './AttackPath.less';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import { getCClassAliveData, getDefaultCClassAliveData, CClassAliveData } from '@/services/database';
import { Layout } from 'antd'
import StarryBackground from '@/components/Background'

const { Search } = Input;

const VulnerabilityInfo: React.FC = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assessmentStep, setAssessmentStep] = useState<'initial' | 'assessed' | 'shown'>('initial');
    const [detailData, setDetailData] = useState<{ cve: string; dkv: string } | null>(null);
    const [targetIp, setTargetIp] = useState('1.175.69.141'); // 默认IP
    const [cClassData, setCClassData] = useState<CClassAliveData | null>(null);
    const [recentIps, setRecentIps] = useState<string[]>([]);
    const [canJump, setCanJump] = useState(false);
    const navigate = useNavigate();

    // 模拟的数据
    const cveData1 = ['CVE-2004-0001', 'CVE-2009-2321', 'CVE-2016-1001', 'CVE-2020-565', 'CVE-2022-1234', 'CVE-2023-6789', 'CVE-2024-1234'];
    const dkvData1 = ['DKV-2222', 'DKV-9322', 'DKV-1325', 'DKV-6789', 'DKV-4567', 'DKV-8888', 'DKV-9999'];
    const cveData = ['CVE'];
    const dkvData = ['DKV'];
    const [graphInitialized, setGraphInitialized] = useState(false);
    const vizRef = useRef<HTMLDivElement>(null);
    const vizInstance = useRef<NeoVis | null>(null);

    useEffect(() => {
        if (vizRef.current) {
            // 清理之前的实例
            if (vizInstance.current) {
                vizInstance.current.clearNetwork();
            }

            const config = {
                containerId: vizRef.current.id, // 使用 ref 的 id
                neo4j: {
                    serverUrl: "bolt://localhost:7687",
                    serverUser: "neo4j",
                    serverPassword: "wck330328"
                },
                labels: {
                    "IP": {
                        label: "ip", // 显示节点的 `name` 属性
                        group: "community", // 节点颜色分组
                        size: 50, // 统一节点大小
                        font: { size: 14, color: "#000000" }, // 节点字体配置
                        title_properties: ["ip", "ipid", "节点标识符"]
                    },
                //     "带宽估计值": {
                // label: "带宽估计值", // 显示节点的 `带宽估计值` 属性
                // group: "community",
                // size: 50,
                // font: { size: 14, color: "#000000" },
                // title_properties: ["带宽估计值", "带宽估计值id", "节点标识符"]
                // },
                // "DirPort端口": {
                //     label: "DirPort端口", // 显示节点的 `DirPort端口` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["DirPort端口", "DirPort端口id", "节点标识符"]
                // },
                // "ORPort端口": {
                //     label: "ORPort端口", // 显示节点的 `ORPort端口` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["ORPort端口", "ORPort端口id", "节点标识符"]
                // },
                // "TCP端口": {
                //     label: "TCP端口", // 显示节点的 `TCP端口` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["TCP端口", "TCP端口id", "节点标识符"]
                // },
                // "CPE": {
                //     label: "CPE", // 显示节点的 `CPE` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["CPE", "CPEid", "节点标识符"]
                // },
                // "产品": {
                //     label: "产品", // 显示节点的 `产品` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["产品", "产品id", "节点标识符"]
                // },
                // "端口服务": {
                //     label: "端口服务", // 显示节点的 `端口服务` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["端口服务", "端口服务id", "节点标识符"]
                // },
                // "版本": {
                //     label: "版本", // 显示节点的 `版本` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["版本", "版本id", "节点标识符"]
                // },
                // "端口状态": {
                //     label: "端口状态", // 显示节点的 `端口状态` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["端口状态", "端口状态id", "节点标识符"]
                // },
                // "状态原因": {
                //     label: "状态原因", // 显示节点的 `状态原因` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["状态原因", "状态原因id", "节点标识符"]
                // },
                // "置信度": {
                //     label: "置信度", // 显示节点的 `置信度` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["置信度", "置信度id", "节点标识符"]
                // },
                // "额外信息": {
                //     label: "额外信息", // 显示节点的 `额外信息` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["额外信息", "额外信息id", "节点标识符"]
                // },
                // "Tor版本": {
                //     label: "Tor版本", // 显示节点的 `Tor版本` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["Tor版本", "Tor版本id", "节点标识符"]
                // },
                // "主机名": {
                //     label: "主机名", // 显示节点的 `主机名` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["主机名", "主机名id", "节点标识符"]
                // },
                // "主机状态": {
                //     label: "主机状态", // 显示节点的 `主机状态` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["主机状态", "主机状态id", "节点标识符"]
                // },
                // "主机状态原因": {
                //     label: "主机状态原因", // 显示节点的 `主机状态原因` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["主机状态原因", "主机状态原因id", "节点标识符"]
                // },
                // "主机类型": {
                //     label: "主机类型", // 显示节点的 `主机类型` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["主机类型", "主机类型id", "节点标识符"]
                // },
                // "协议版本": {
                //     label: "协议版本", // 显示节点的 `协议版本` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["协议版本", "协议版本id", "节点标识符"]
                // },
                // "微描述摘要散列": {
                //     label: "微描述摘要散列", // 显示节点的 `微描述摘要散列` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["微描述摘要散列", "微描述摘要散列id", "节点标识符"]
                // },
                // "特征标签": {
                //     label: "特征标签", // 显示节点的 `特征标签` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["特征标签", "特征标签id", "节点标识符"]
                // },
                // "昵称": {
                //     label: "昵称", // 显示节点的 `昵称` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["昵称", "昵称id", "节点标识符"]
                // },
                // "身份哈希值密钥": {
                //     label: "身份哈希值密钥", // 显示节点的 `身份哈希值密钥` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["身份哈希值密钥", "身份哈希值密钥id", "节点标识符"]
                // },
                // "操作系统名称及版本": {
                //     label: "操作系统名称及版本", // 显示节点的 `操作系统名称及版本` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["操作系统名称及版本", "操作系统名称及版本id", "节点标识符"]
                // },
                // "OScpe标识符": {
                //     label: "OScpe标识符", // 显示节点的 `OScpe标识符` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["OScpe标识符", "OScpe标识符id", "节点标识符"]
                // },
                // "设备类型": {
                //     label: "设备类型", // 显示节点的 `设备类型` 属性
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["设备类型", "设备类型id", "节点标识符"]
                // },
                // "漏洞": {
                //     group: "community",
                //     size: 50,
                //     font: { size: 14, color: "#000000" },
                //     title_properties: ["漏洞", "漏洞id", "节点标识符"]
                // }
                },
                relationships: {
                    "攻击路径": {
                        value: 'weight', // 假设关系有 `weight` 属性
                        caption: true, // 显示关系的默认标签（类型）
                        label: "顺序" // 显示关系的 `顺序` 属性（如果有）
                    }
                },
                visConfig: {
                    nodes: {
                        shape: 'circle', // 设置节点形状为圆形
                        size: 100, // 统一节点大小
                        font: { size: 14, color: "#000000" ,align: "bottom" } // 节点字体配置
                    },
                    edges: {
                        arrows: {
                            to: {
                                enabled: true, // 显示箭头
                                type: "arrow" // 箭头类型
                            }
                        },
                        width: 1, // 关系线的粗细
                        font: { size: 12, color: "#606266" } // 关系线字体配置
                    },
                    physics: {
                        barnesHut: {
                            gravitationalConstant: -200,  // 减小引力
                            centralGravity: 0.01,          // 减小中心引力
                            springLength: 150,             // 增加弹簧长度
                            springConstant: 0.02           // 调整弹簧常数
                        }
                    }
                },
                initialCypher: `MATCH (n)-[r]->(m) WHERE n.节点标识符 = '${targetIp}' RETURN n, r, m` // 动态查询语句
            };


            vizInstance.current = new NeoVis(config);
            vizInstance.current.render();

            vizInstance.current.registerOnEvent("clickNode", (event) => {
                const node = event.node; // 获取被点击的节点
                console.log("Clicked node:", node); // 打印节点数据
                displayNodeProperties(node);
            });
        }
    }, [targetIp]); // 监听 targetIp 的变化

    function displayNodeProperties(node) {
        // 打印完整的节点数据
        console.log("Node data:", node);

        // 检查 node.properties 是否存在
        if (!node.raw.properties || Object.keys(node.raw.properties).length === 0) {
            console.error("Node properties are undefined or empty:", node);
            alert("该节点没有属性信息！");
            return;
        }

        // 使用 Ant Design 的 Modal 显示节点属性
        Modal.info({
            title: (
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    {node.raw.labels || "Unnamed Node"} {/* 提供默认值 */}
                </span>
            ),
            content: (
                <ul style={{ color: '#4caf50' }}> {/* 设置字体颜色为绿色 */}
                    {Object.entries(node.raw.properties).map(([key, value]) => (
                        <li key={key} style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#ff5722' }}>{key}:</strong> {/* 键的颜色为橙色 */}
                            <span style={{ color: '#2196f3' }}> {value}</span> {/* 值的颜色为蓝色 */}
                        </li>
                    ))}
                </ul>
            ),
            okText: "关闭",
        });
    }

    useEffect(() => {
        console.log("vizRef:", vizRef.current);
        console.log("DOM element:", document.getElementById("viz"));
    }, []);

    const handleShow = () => {
        setLoading(true);
        setTimeout(() => {
            setShow(true);
            setLoading(false);
            setAssessmentStep('shown');
        }, 300);
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
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
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

    const handleSearch = async (value: string) => {
        if (value.trim() === '') {
            message.warning('请输入IP地址');
            return;
        }
        setTargetIp(value.trim());
        await fetchCClassData(value.trim());
    };

    const handlePointClick = (ip: string) => {
        setTargetIp(ip);
    };

    useEffect(() => {
        setTimeout(() => {
            setCanJump(true);
        }, 4000);
    }, []);

    const handleRunVul = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/run-vul', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ targetIp }),
            });
            if (response.ok) {
                const result = await response.json();
                message.success(result.message || '脆弱性评估已触发');
                setAssessmentStep('assessed');
            } else {
                const error = await response.json();
                message.error(error.error || '触发脆弱性评估失败');
            }
        } catch (error) {
            message.error('请求失败');
            console.error('请求失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunAttack = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/run-attack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ targetIp }), // 将目标 IP 作为请求体发送
            });
            if (response.ok) {
                const result = await response.json();
                message.success(result.message || '攻击路径推理已完成');
            } else {
                const error = await response.json();
                message.error(error.error || '攻击路径推理失败');
            }
        } catch (error) {
            message.error('请求失败');
            console.error('请求失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 获取 C 段 IP 数据
    const fetchCClassData = async (ip: string) => {
        try {
            const response = await getCClassAliveData(ip);
            if (response.success && response.data) {
                setCClassData(response.data);
                // 更新右侧显示的 IP 列表
                const ips = [
                    response.data.host1,
                    response.data.host2,
                    response.data.host3,
                    response.data.host4,
                    response.data.host5
                ].filter(ip => ip); // 过滤掉空值
                setRecentIps(ips);
            } else {
                message.warning('未找到该 IP 的 C 段数据');
                setRecentIps([]);
            }
        } catch (error) {
            message.error('获取 C 段数据失败');
            console.error('获取 C 段数据失败:', error);
            setRecentIps([]);
        }
    };

    // 组件加载时获取默认数据
    useEffect(() => {
        const fetchDefaultData = async () => {
            try {
                const response = await getDefaultCClassAliveData();
                if (response.success && response.data) {
                    setCClassData(response.data);
                    setTargetIp(response.data.original_ip);
                    const ips = [
                        response.data.host1,
                        response.data.host2,
                        response.data.host3,
                        response.data.host4,
                        response.data.host5
                    ].filter(ip => ip);
                    setRecentIps(ips);
                }
            } catch (error) {
                console.error('获取默认 C 段数据失败:', error);
            }
        };
        fetchDefaultData();
    }, []);

    return (
      <>
        <div style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh'}}>
          <StarryBackground/>
          <Layout style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, zIndex: -1}}>
          </Layout>
        </div>
        <div className="vulnerability-container">
          {/* 第一行：目标IP + 搜索功能 */}
          <Row align="middle" style={{marginBottom: '20px'}}>
            <Col span={12}>
              <div className="target-ip">
                当前目标IP: <Tag color="red">{targetIp}</Tag>
              </div>
            </Col>
            <Col span={12} style={{textAlign: 'right'}}>
              <Search
                placeholder="请输入IP地址"
                enterButton="搜索"
                size="middle"
                onSearch={handleSearch}
                style={{maxWidth: '300px'}}
              />
            </Col>
          </Row>

          {/* 第三行：Neo4j + 曲线 */}
          <Row gutter={24} style={{marginBottom: '30px'}}>
            <Col span={20}>
              <div
                id="viz"
                ref={vizRef}
                style={{
                  height: '600px',
                  background: '#0d1117',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              ></div>
            </Col>
            <Col span={4}>
              <div className="curve-container" style={{
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-around',
                background: 'linear-gradient(to top, #8B0000, #FF0000)',
                borderRadius: '12px',
                padding: '10px'
              }}>
                {recentIps.map((ip) => (
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
                      position: 'relative'
                    }}
                    title={`C段IP: ${ip}`}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      color: '#fff',
                      textShadow: '0 0 2px #000'
                    }}>
                      {ip}
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          {/* 第四行：漏洞信息展示 */}
          <Row>
            <Col>
              <Space>
                {/* 开始脆弱性评估按钮 */}
                <Button
                  type="primary"
                  onClick={handleRunVul}
                  loading={loading}
                  style={{width: '150px'}}
                >
                  {loading ? '正在加载...' : '开始脆弱性评估'}
                </Button>

                {/* 新增展示评估结果按钮 */}
                <Button
                  type="default"
                  onClick={handleShow} // 点击时直接显示组件
                  style={{width: '150px'}}
                >
                  展示评估结果
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 显示评估结果的组件 */}
          <Row>
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
            <Col span={14}>
              <div id="bar-chart" style={{height: '400px', width: '100%'}}></div>
            </Col>
          </Row>

          {(assessmentStep === 'assessed' || assessmentStep === 'shown') && (
            <div style={{marginTop: '40px', textAlign: 'center'}}>
              <Button
                type="primary"
                icon={<RightOutlined/>}
                onClick={() => {
                  navigate('/control-system/result-analysis', {state: {ip: targetIp}});
                  handleRunAttack();
                }}
              >
                可进行攻击路径推理
              </Button>
            </div>
          )}

          {/* 漏洞详细信息弹窗 */}
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
        </>
        );
        };

        export default VulnerabilityInfo;
