import {
  AimOutlined,
  CalendarOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Table } from 'antd';
import React from 'react';
import EChartComponent from '../../components/EChartComponent'; // 引入封装的组件
import './Statistics.css';

const Statistics: React.FC = () => {
  // 表格数据
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
    },
    {
      title: '搜索关键词',
      dataIndex: 'keyword',
      key: 'keyword',
    },
    {
      title: '用户数',
      dataIndex: 'users',
      key: 'users',
    },
    {
      title: '周涨幅',
      dataIndex: 'growth',
      key: 'growth',
    },
  ];

  const data = [
    {
      key: '1',
      rank: 1,
      keyword: '新款连衣裙',
      users: 2234,
      growth: '128% ↑',
    },
    {
      key: '2',
      rank: 2,
      keyword: '四件套',
      users: 2404,
      growth: '3% ↑',
    },
    {
      key: '3',
      rank: 3,
      keyword: '男士手包',
      users: 1231,
      growth: '58% ↑',
    },
    {
      key: '4',
      rank: 4,
      keyword: '耳机',
      users: 1021,
      growth: '58% ↓',
    },
    {
      key: '5',
      rank: 5,
      keyword: '短裤',
      users: 800,
      growth: '58% ↑',
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
                <Card title="最近更新时间" style={{ height: '100%' }}>
                  <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                    2025-04-17 14:30:00
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
              dataSource={data}
              pagination={{ pageSize: 5 }}
              style={{ marginTop: '20px' }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="销售额类别占比" style={{ height: '100%' }}>
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
                height="600px"
              />

              {/* 表格 */}
              <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '20%' }}>
                <Table
                  columns={[{ title: '类别', dataIndex: 'category', key: 'category' }]}
                  dataSource={[
                    { key: '1', category: '家用电器', amount: '¥4,544' },
                    { key: '2', category: '食用酒水', amount: '¥3,321' },
                    { key: '3', category: '个护健康', amount: '¥3,113' },
                    { key: '4', category: '服饰箱包', amount: '¥2,341' },
                    { key: '5', category: '母婴产品', amount: '¥1,231' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </div>
            </div>
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

        {/* 替换为 iframe 嵌入地图 */}
        <Col span={16}>
          <Card title="2D 世界地图" style={{ height: '100%' }}>
            <iframe
              src="http://127.0.0.1:5500/src/pages/DataCollection/map.html" // 使用相对路径指向同一目录下的地图文件
              style={{ width: '100%', height: '400px', border: 'none' }}
            ></iframe>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
