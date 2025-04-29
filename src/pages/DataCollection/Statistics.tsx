import {
  AimOutlined,
  CalendarOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Table, message } from 'antd';
import * as echarts from 'echarts';
import React, { useEffect, useState } from 'react';
import EChartComponent from '../../components/EChartComponent'; // 引入封装的组件
import { getTorProfile, getLatestTime, getCClassAliveData, getDefaultCClassAliveData } from '@/services/database';
import './Statistics.css';

interface CClassAliveData {
  id: number;
  original_ip: string;
  alive_count: number;
  dead_count: number;
  host1: string;
  host2: string;
  host3: string;
  host4: string;
  host5: string;
}

const Statistics: React.FC = () => {
  const [torProfileData, setTorProfileData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestTime, setLatestTime] = useState<string>('');
  const [timeLoading, setTimeLoading] = useState(false);
  const [cClassAliveData, setCClassAliveData] = useState<CClassAliveData | null>(null);
  const [cClassAliveLoading, setCClassAliveLoading] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string>('');

  useEffect(() => {
    // 初始化 ECharts 实例
    const myChart = echarts.init(document.getElementById('worldMap') as HTMLElement);

    // 加载世界地图数据
    myChart.showLoading();
    fetch('/geo/world.json') // 指向 public/geo/world.json
      .then((response) => response.json())
      .then((worldJson) => {
        myChart.hideLoading();

        // 注册世界地图
        echarts.registerMap('world', worldJson);

        // 数据示例
        const data = [
          { name: 'China', value: 1409517397 },
          { name: 'India', value: 1339180127 },
          { name: 'United States', value: 324459463 },
          { name: 'Indonesia', value: 263991379 },
          { name: 'Brazil', value: 209288278 },
          { name: 'Pakistan', value: 197015955 },
          { name: 'Nigeria', value: 190886311 },
          { name: 'Bangladesh', value: 164669751 },
          { name: 'Russia', value: 143989754 },
          { name: 'Mexico', value: 129163276 },
        ];

        // 地图配置
        const mapOption = {
          visualMap: {
            left: 'right',
            min: 0,
            max: 1500000000,
            inRange: {
              color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
            },
            text: ['High', 'Low'],
            calculable: true,
          },
          series: [
            {
              type: 'map',
              map: 'world',
              roam: true,
              data: data,
            },
          ],
        };

        // 设置地图配置
        myChart.setOption(mapOption);
      })
      .catch((error) => {
        console.error('加载世界地图数据失败:', error);
      });

    const fetchTorProfile = async () => {
      setLoading(true);
      try {
        const response = await getTorProfile();
        if (response.success) {
          // 添加递增的ID
          const dataWithId = response.data.map((item, index) => ({
            ...item,
            id: index + 1,
          }));
          setTorProfileData(dataWithId);
        }
      } catch (error) {
        console.error('获取 Tor 节点数据失败:', error);
      }
      setLoading(false);
    };

    const fetchLatestTime = async () => {
      setTimeLoading(true);
      try {
        const response = await getLatestTime();
        if (response.success) {
          setLatestTime(response.data);
        }
      } catch (error) {
        console.error('获取最新时间失败:', error);
      }
      setTimeLoading(false);
    };

    const fetchDefaultCClassAliveData = async () => {
      setCClassAliveLoading(true);
      try {
        const response = await getDefaultCClassAliveData();
        if (response.success) {
          setCClassAliveData(response.data);
          setSelectedIp(response.data.original_ip);
        }
      } catch (error) {
        console.error('获取默认C段存活数据失败:', error);
      }
      setCClassAliveLoading(false);
    };

    fetchTorProfile();
    fetchLatestTime();
    fetchDefaultCClassAliveData();
  }, []);

  const handleTableRowClick = async (record: any) => {
    setCClassAliveLoading(true);
    try {
      const response = await getCClassAliveData(record.IP);
      if (response.success) {
        if (response.data) {
          setCClassAliveData(response.data);
          setSelectedIp(record.IP);
        } else {
          message.info('数据库中无相关数据');
        }
      }
    } catch (error) {
      message.error('链接数据库失败');
    }
    setCClassAliveLoading(false);
  };

  // 表格数据
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'IP',
      dataIndex: 'IP',
      key: 'IP',
    },
    {
      title: 'Tor版本',
      dataIndex: 'Tor_ver',
      key: 'Tor_ver',
    },
    {
      title: '特征标签',
      dataIndex: 'fea_label',
      key: 'fea_label',
    },
  ];

  return (
    <div>
      {/* 上半部分：已有内容 */}
      <Row gutter={16}>
        <Col span={6}>
          <div className="card">
            <div style={{ padding: '20px', position: 'relative' }}>
              <div className="subtitle">已检测天数</div>
              <div className="text">16</div>
              <CalendarOutlined
                style={{
                  fontSize: '40px',
                  color: '#1890ff',
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                }}
              />
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="card">
            <div style={{ padding: '20px', position: 'relative' }}>
              <div className="subtitle">已检测节点总数</div>
              <div className="text">6,560</div>
              <NodeIndexOutlined
                style={{
                  fontSize: '40px',
                  color: '#52c41a',
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                }}
              />
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="card">
            <div style={{ padding: '20px', position: 'relative' }}>
              <div className="subtitle">已检测C段IP总数</div>
              <div className="text">126,560</div>
              <GlobalOutlined
                style={{
                  fontSize: '40px',
                  color: '#faad14',
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                }}
              />
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="card">
            <div style={{ padding: '20px', position: 'relative' }}>
              <div className="subtitle">生成攻击路径总数</div>
              <div className="text">78</div>
              <AimOutlined
                style={{
                  fontSize: '40px',
                  color: '#f5222d',
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                }}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* 下半部分：折线图和表格 */}
      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Card title="数据统计" style={{ height: '100%' }}>
            <Row gutter={16} style={{ marginTop: '20px' }}>
              <Col span={8}>
                <Card title="第 XXX 次更新 Tor 官网数据" style={{ height: '100%' }}>
                  <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                    本次更新包含最新的 Tor 节点信息。
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="最近更新时间" style={{ height: '100%' }} loading={timeLoading}>
                  <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                    {latestTime || '暂无数据'}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="最新节点数据" style={{ height: '100%' }}>
                  <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                    共计 12,345 个节点。
                  </div>
                </Card>
              </Col>
            </Row>
            <Table
              columns={columns}
              dataSource={torProfileData}
              loading={loading}
              pagination={{ pageSize: 5 }}
              style={{ marginTop: '20px' }}
              onRow={(record) => ({
                onClick: () => handleTableRowClick(record),
              })}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title={selectedIp ? `${selectedIp} C段存活情况` : 'C段存活情况'} 
            style={{ height: '100%' }}
            loading={cClassAliveLoading}
          >
            {cClassAliveData ? (
              <div style={{ position: 'relative' }}>
                {/* 饼状图 */}
                <EChartComponent
                  option={{
                    tooltip: {
                      trigger: 'item',
                      formatter: '{a} <br/>{b}: {c} ({d}%)',
                    },
                    legend: {
                      orient: 'vertical',
                      left: 'right',
                      data: ['存活IP', '未存活IP'],
                    },
                    series: [
                      {
                        name: 'IP数量',
                        type: 'pie',
                        radius: ['40%', '70%'], // 设置内外半径，形成环形图
                        avoidLabelOverlap: false,
                        label: {
                          show: true,
                          position: 'center',
                          formatter: `IP总数\n${cClassAliveData.alive_count + cClassAliveData.dead_count}`, // 中心文本
                          fontSize: 18,
                          fontWeight: 'bold',
                        },
                        emphasis: {
                          label: {
                            show: true,
                            fontSize: '20',
                            fontWeight: 'bold',
                          },
                        },
                        labelLine: {
                          show: false,
                        },
                        data: [
                          { value: cClassAliveData.alive_count, name: '存活IP' },
                          { value: cClassAliveData.dead_count, name: '未存活IP' },
                        ],
                      },
                    ],
                  }}
                  height="400px"
                />

                {/* 表格 */}
                <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '30%' }}>
                  <Table
                    columns={[
                      { title: 'Host', dataIndex: 'host', key: 'host' },
                      { title: '值', dataIndex: 'value', key: 'value' }
                    ]}
                    dataSource={[
                      { key: '1', host: 'Host1', value: cClassAliveData.host1 },
                      { key: '2', host: 'Host2', value: cClassAliveData.host2 },
                      { key: '3', host: 'Host3', value: cClassAliveData.host3 },
                      { key: '4', host: 'Host4', value: cClassAliveData.host4 },
                      { key: '5', host: 'Host5', value: cClassAliveData.host5 },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        {/* 折线图 */}
        <Col span={18}>
          <Card title="活动实时交易情况" style={{ height: '100%' }}>
            <EChartComponent
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'cross',
                  },
                },
                legend: {
                  data: ['蓝色', '绿色'],
                },
                xAxis: {
                  type: 'category',
                  boundaryGap: false,
                  data: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
                },
                yAxis: {
                  type: 'value',
                },
                series: [
                  {
                    name: '蓝色',
                    type: 'line',
                    smooth: true,
                    data: [2000, 3000, 2500, 4000, 3500, 3000, 4000],
                    areaStyle: {
                      color: 'rgba(0, 112, 255, 0.2)', // 半透明填充
                    },
                    lineStyle: {
                      color: 'rgba(0, 112, 255, 1)', // 线条颜色
                    },
                  },
                  {
                    name: '绿色',
                    type: 'line',
                    smooth: true,
                    data: [3000, 2000, 3000, 2500, 2000, 3500, 3000],
                    areaStyle: {
                      color: 'rgba(0, 200, 83, 0.2)', // 半透明填充
                    },
                    lineStyle: {
                      color: 'rgba(0, 200, 83, 1)', // 线条颜色
                    },
                  },
                ],
              }}
              height="400px"
            />
          </Card>
        </Col>

        {/* 饼状图 */}
        <Col span={6}>
          <Card title="销售额类别占比" style={{ height: '100%' }}>
            <EChartComponent
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{a} <br/>{b}: {c} ({d}%)',
                },
                legend: {
                  orient: 'vertical',
                  left: 'right',
                  data: ['家用电器', '食用酒水', '个护健康', '服饰箱包', '母婴产品', '其他'],
                },
                series: [
                  {
                    name: '销售额',
                    type: 'pie',
                    radius: ['40%', '70%'], // 设置内外半径，形成环形图
                    avoidLabelOverlap: false,
                    label: {
                      show: true,
                      position: 'center',
                      formatter: '销售额\n¥ 123,224', // 中心文本
                      fontSize: 18,
                      fontWeight: 'bold',
                    },
                    emphasis: {
                      label: {
                        show: true,
                        fontSize: '20',
                        fontWeight: 'bold',
                      },
                    },
                    labelLine: {
                      show: false,
                    },
                    data: [
                      { value: 4544, name: '家用电器' },
                      { value: 3321, name: '食用酒水' },
                      { value: 3113, name: '个护健康' },
                      { value: 2341, name: '服饰箱包' },
                      { value: 1231, name: '母婴产品' },
                      { value: 1231, name: '其他' },
                    ],
                  },
                ],
              }}
              height="400px"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        {/* 柱状图 */}
        <Col span={8}>
          <Card title="柱状图示例" style={{ height: '100%' }}>
            <EChartComponent
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow',
                  },
                },
                xAxis: {
                  type: 'category',
                  data: ['类别1', '类别2', '类别3', '类别4', '类别5'],
                },
                yAxis: {
                  type: 'value',
                },
                series: [
                  {
                    name: '数据量',
                    type: 'bar',
                    data: [120, 200, 150, 80, 70],
                    itemStyle: {
                      color: '#1890ff',
                    },
                  },
                ],
              }}
              height="400px"
            />
          </Card>
        </Col>

        {/* 世界地图 */}
        <Col span={16}>
          <Card title="2D 世界地图" style={{ height: '100%' }}>
            <div id="worldMap" style={{ width: '100%', height: '400px' }}></div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        {/* 列表 */}
        <Col span={24}>
          <Card title="Tor 节点数据列表" style={{ height: '100%' }}>
            <Table
              columns={[
                { title: 'IP', dataIndex: 'IP', key: 'IP' },
                { title: '名称', dataIndex: 'name', key: 'name' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '昵称', dataIndex: 'nikename', key: 'nikename' },
                { title: '发布日期', dataIndex: 'release_date', key: 'release_date' },
                { title: '发布时间', dataIndex: 'release_time', key: 'release_time' },
                { title: 'OR端口', dataIndex: 'ORPort', key: 'ORPort' },
                { title: 'Dir端口', dataIndex: 'DirPort', key: 'DirPort' },
                { title: 'Tor版本', dataIndex: 'Tor_ver', key: 'Tor_ver' },
                { title: '状态', dataIndex: 'status_state', key: 'status_state' },
                { title: '操作系统', dataIndex: 'OS', key: 'OS' },
              ]}
              dataSource={torProfileData}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1500 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
