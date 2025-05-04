import React, { useState, useEffect } from 'react';
import { Button, Space, Card, Tag, Modal, Row, Col, Input, message } from 'antd';
import { CSSTransition } from 'react-transition-group';
import * as echarts from 'echarts';
import * as neo4j from 'neo4j-driver';
import './AttackPath.less';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';


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
    const [driver, setDriver] = useState<neo4j.Driver | null>(null);
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


    // 初始化 Neo4j 驱动
    useEffect(() => {
        const neo4jDriver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wck330328'));
        setDriver(neo4jDriver);
        return () => {
            neo4jDriver.close();
        };
    }, []);

    useEffect(() => {
        renderNeo4jGraph();
    }, [echartsNode, nodesRelation, category]);

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

    // 定义执行 Cypher 查询的函数
    // 定义执行 Cypher 查询的函数
    const executeCypher = async () => {
        if (!driver) return;
        const session = driver.session();
        const query = `MATCH (startNode:攻击路径 {节点标识符: '${targetIp}_8'})-[r]->(endNode) RETURN startNode, r, endNode`;

        try {
            const result = await session.run(query);
            const nodes: any[] = [];
            const links: any[] = [];
            const nodeMap = new Map();

            result.records.forEach(record => {
                const startNode = record.get('startNode');
                const endNode = record.get('endNode');
                const relation = record.get('r');

                const addNode = (node: any) => {
                    const id = node.identity.toInt();
                    if (!nodeMap.has(id)) {
                        const nodeData = {
                            id: id,
                            name: node.properties.name || node.properties.节点标识符 || `节点${id}`,
                            category: node.labels[0] || '未知',
                            symbolSize: 50,
                        };
                        nodeMap.set(id, nodeData);
                        nodes.push(nodeData);
                    }
                };

                addNode(startNode);
                addNode(endNode);

                links.push({
                    source: nodeMap.get(startNode.identity.toInt()).id,
                    target: nodeMap.get(endNode.identity.toInt()).id,
                    name: relation.type,
                });
            });

            setEchartsNode(nodes);
            setNodesRelation(links);
            setCategory([...new Set(nodes.map(n => n.category))]);
            session.close();
        } catch (error) {
            console.error('Cypher 执行失败', error);
            session.close();
        }
    };

    const renderNeo4jGraph = () => {
        const chartDom = document.getElementById('neo4j-graph') as HTMLElement;
        const myChart = echarts.init(chartDom);
        const option = {
            tooltip: {},
            legend: { data: category },
            series: [{
                type: 'graph',
                layout: 'force',
                data: echartsNode,
                links: nodesRelation,
                categories: category.map(name => ({ name })),
                roam: true,
                label: { show: true },
                edgeLabel: {
                    show: true,
                    formatter: x => x.data.name,
                },
                force: {
                    repulsion: 300,
                    edgeLength: 150,
                }
            }]
        };
        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
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

            {/* 第二行：执行查询按钮 */}
            <Row>
                <Col span={24} style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Button type="primary" onClick={executeCypher}>查询攻击路径节点</Button>
                </Col>
            </Row>

            {/* 第三行：Neo4j + 曲线 */}
            <Row gutter={24} style={{ marginBottom: '30px' }}>
                <Col span={20}>
                    <div id="neo4j-graph" style={{ height: '600px', background: '#0d1117', borderRadius: '12px', padding: '10px' }}></div>
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
