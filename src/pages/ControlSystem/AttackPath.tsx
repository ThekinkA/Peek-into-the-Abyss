import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Card, Tag, Modal, Row, Col, Input, message } from 'antd';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import { NeoVis } from 'neovis.js';
import './AttackPath.less';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import { values } from 'lodash';

const { Search } = Input;

const VulnerabilityInfo: React.FC = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detailData, setDetailData] = useState<{ cve: string; dkv: string } | null>(null);
    const [chartShow, setChartShow] = useState(false);
    const [targetIp, setTargetIp] = useState('101.100.141.137'); // 默认IP
    const [recentIps, setRecentIps] = useState([
        '192.168.1.5',
        '192.168.1.4',
        '192.168.1.3',
        '192.168.1.2',
        '192.168.1.1',
    ]);
    const [clearAll, setClearAll] = useState(true);
    const [echartsNode, setEchartsNode] = useState([]); // 节点数组
    const [nodesRelation, setNodesRelation] = useState([]); // 关系线数组
    const [category, setCategory] = useState([]); // echarts 图例数据数
    const [knowlegGraphshow, setKnowlegGraphshow] = useState(false); // 控制知识图谱显示
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
        if (vizRef.current && !graphInitialized) {
            var config = {
                containerId: vizRef.current.id, // 使用 ref 的 id
                neo4j: {
                    serverUrl: "bolt://localhost:7687",
                    serverUser: "neo4j",
                    serverPassword: "wck330328"
                },
                labels: {
                    "攻击路径": {
                        label: "name", // 显示节点的 `name` 属性
                        group: "community", // 节点颜色分组
                        size: 50, // 统一节点大小
                        font: { size: 14, color: "#000000" }, // 节点字体配置
                        title_properties: ["name", "description", "节点标识符"] // 在节点提示中显示 `name` 属性[^35^]
                    }
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
                        font: { size: 14, color: "#000000" } // 节点字体配置
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
                initialCypher: "MATCH (n)-[r]->(m) RETURN n,r,m" // 查询语句
            };

            vizInstance.current = new NeoVis(config);
            vizInstance.current.render();
            setTimeout(() => {
                console.log('Graph initialized and rendered');
                setGraphInitialized(true);
            }, 1000);  // 等 1 秒
            vizInstance.current.registerOnEvent("clickNode", (event) => {
                const node = event.node; // 获取被点击的节点
                console.log("Clicked node:", node); // 打印节点数据
                displayNodeProperties(node);
            });

        }
    }, [graphInitialized]);
    function displayNodeProperties(node) {
        // 打印完整的节点数据
        console.log("Node data:", node);

        // 检查 node.properties 是否存在
        if (!node.raw.properties || Object.keys(node.raw.properties).length === 0) {
            console.error("Node properties are undefined or empty:", node);
            alert("该节点没有属性信息！");
            return;
        }

        // 创建一个模态框或其他方式来显示节点属性
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.background = "white";
        modal.style.padding = "20px";
        modal.style.border = "1px solid black";
        modal.style.zIndex = "1000";

        const title = document.createElement("h3");
        title.textContent = `${node.raw.properties.name || "Unnamed Node"}`; // 提供默认值
        modal.appendChild(title);

        const propertiesList = document.createElement("ul");
        for (const key in node.raw.properties) {
            const listItem = document.createElement("li");
            listItem.textContent = `${key}: ${node.raw.properties[key]}`;
            propertiesList.appendChild(listItem);
        }
        modal.appendChild(propertiesList);

        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };
        modal.appendChild(closeButton);

        document.body.appendChild(modal);
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
            setCanJump(true);
        }, 300);
        setChartShow(true);
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

    const handleSearch = (value: string) => {
        if (value.trim() === '') {
            message.warning('请输入IP地址');
            return;
        }
        setTargetIp(value.trim());
    };

    const handlePointClick = (ip: string) => {
        setTargetIp(ip);
    };

    useEffect(() => {
        setTimeout(() => {
            setKnowlegGraphshow(true);
        }, 4000);
    }, [clearAll]);

    const handleRunVul = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/run-vul', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ targetIp }), // 将目标 IP 作为请求体发送
            });
            if (response.ok) {
                const result = await response.json();
                message.success(result.message || '脆弱性评估已触发');
                handleShow(); // 更新 show 状态，显示组件
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

    return (
        <div className="vulnerability-container">
            {/* 第一行：目标IP + 搜索功能 */}
            <Row align="middle" style={{ marginBottom: '20px' }}>
                <Col span={12}>
                    <div className="target-ip">
                        当前目标IP: <Tag color="red">{targetIp}</Tag>
                    </div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Search
                        placeholder="请输入IP地址"
                        enterButton="搜索"
                        size="middle"
                        onSearch={handleSearch}
                        style={{ maxWidth: '300px' }}
                    />
                </Col>
            </Row>

            {/* 第三行：Neo4j + 曲线 */}
            <Row gutter={24} style={{ marginBottom: '30px' }}>
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
                    <div className="curve-container" style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', background: 'linear-gradient(to top, #8B0000, #FF0000)', borderRadius: '12px', padding: '10px' }}>
                        {recentIps.map((ip, index) => (
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
                                }}
                                title={ip}
                            ></div>
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
                            style={{ width: '150px' }}
                        >
                            {loading ? '正在加载...' : '开始脆弱性评估'}
                        </Button>

                        {/* 新增展示评估结果按钮 */}
                        <Button
                            type="default"
                            onClick={handleShow} // 点击时直接显示组件
                            style={{ width: '150px' }}
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
                                <div className="data-list" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                    <div id="bar-chart" style={{ height: '400px', width: '100%' }}></div>
                </Col>
            </Row>

            {canJump && (
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Button
                        type="primary"
                        icon={<RightOutlined />}
                        onClick={() => {
                            navigate('/control-system/result-analysis', { state: { ip: targetIp } });
                            handleRunAttack(); // 跳转后运行 handleRunAttack 函数
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
    );
};

export default VulnerabilityInfo;