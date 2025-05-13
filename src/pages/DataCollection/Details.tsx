import React, { useRef, useState, useEffect } from 'react';
import { Card, Col, Row, Table, message } from 'antd';
import { useLocation } from 'umi';
import { getTorProfile, getPortInfo } from '@/services/database';
import {
  InfoCircleOutlined,
  UserOutlined,
  KeyOutlined,
  ClockCircleOutlined,
  ShareAltOutlined,
  LinkOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined,
  WifiOutlined,
  DatabaseOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import './Details.css';
import { Layout } from 'antd'
import StarryBackground from '@/components/Background'

const ipInfoCards = [
  {
    fullRow: true,
    icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    title: 'IP 地址 / 名称',
    value: '104.53.221.159 / 104-53-221-159.lightspeed.sntcca.sbcglobal.net',
  },
  { title: '类型', value: 'PTR', icon: <LinkOutlined style={{ color: '#eb2f96' }} /> },
  { title: '昵称', value: 'seele', icon: <UserOutlined style={{ color: '#13c2c2' }} /> },
  { title: '身份哈希密钥', value: 'AAoQ1DAR6kkoo19hBAX5K0QztNw', icon: <KeyOutlined style={{ color: '#faad14' }} /> },
  { title: '失效日期', value: '2038-01-01', icon: <ClockCircleOutlined style={{ color: '#52c41a' }} /> },
  { title: '失效时间', value: '00:00:00', icon: <ClockCircleOutlined style={{ color: '#fa541c' }} /> },
  { title: 'QR端口', value: '9001', icon: <ShareAltOutlined style={{ color: '#722ed1' }} /> },
  { title: 'Dir端口', value: '0', icon: <ShareAltOutlined style={{ color: '#1890ff' }} /> },
  {
    title: '微描述摘要散列',
    value: 'EDCVHS1lq2PuoeO5giz0EVO6iN7JNSdjsxI22hEfwj4',
    icon: <KeyOutlined style={{ color: '#f5222d' }} />,
  },
  {
    title: '特征标签',
    value: 'Fast HSDir Running Stable V2Dir Valid',
    icon: <TagsOutlined style={{ color: '#13c2c2' }} />,
  },
  { title: 'Tor 版本', value: 'Tor 0.4.8.14', icon: <ThunderboltOutlined style={{ color: '#722ed1' }} /> },
  {
    title: '协议版本',
    value:
      '1 Cons=1-2 Desc=1-2 DirCache=2 FlowCtrl=1-2 HSDir=2 HSIntro=4-5 HSRend=1-2 Link=1-5 LinkAuth=1,3 Microdesc=1-2 Padding=2 Relay=1-4',
    icon: <DeploymentUnitOutlined style={{ color: '#eb2f96' }} />,
  },
  { title: '带宽估计', value: '320', icon: <WifiOutlined style={{ color: '#52c41a' }} /> },
  { title: '状态', value: 'up', icon: <DatabaseOutlined style={{ color: '#faad14' }} /> },
  { title: '状态原因', value: 'echo-reply', icon: <InfoCircleOutlined style={{ color: '#f5222d' }} /> },
  {
    title: '操作系统',
    value:
      "'name': 'Tomato firmware (Linux 2.6.22)', 'accuracy': '100', 'line': '61639', 'osclass': [{'type': 'WAP', 'vendor': 'Linux', 'osfamily': 'Linux', 'osgen': '2.6.X', 'accuracy': '100', 'cpe': ['cpe:/o:linux:linux_kernel:2.6.22']",
    icon: <DesktopOutlined style={{ color: '#13c2c2' }} />,
  },
];

const columns = [
  { title: '端口号', dataIndex: 'port', key: 'port' },
  { title: '端口状态', dataIndex: 'state', key: 'state' },
  { title: '状态原因', dataIndex: 'reason', key: 'reason' },
  { title: '端口名称', dataIndex: 'name', key: 'name' },
  { title: '所属产品', dataIndex: 'product', key: 'product' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '额外信息', dataIndex: 'extra', key: 'extra' },
  { title: 'Conf', dataIndex: 'conf', key: 'conf' },
  { title: 'CPE', dataIndex: 'cpe', key: 'cpe' },
];

const Details: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const urlIp = query.get('ip');

  const [nodeDetails, setNodeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [portData, setPortData] = useState<any[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [overflowed, setOverflowed] = useState<boolean[]>([]);
  const [selectedIp, setSelectedIp] = useState<string | null>(urlIp);

  useEffect(() => {
    const fetchNodeDetails = async () => {
      setLoading(true);
      try {
        const response = await getTorProfile();
        if (response.success && response.data && response.data.length > 0) {
          // 如果URL中提供了IP，则使用该IP；否则使用第一个IP
          const ipToUse = urlIp || response.data[0].IP;
          setSelectedIp(ipToUse);

          const details = response.data.find((node: any) => node.IP === ipToUse);
          if (details) {
            setNodeDetails(details);
          } else if (response.data.length > 0) {
            // 如果找不到指定IP的节点但有数据，则显示第一个节点
            setNodeDetails(response.data[0]);
            setSelectedIp(response.data[0].IP);
          } else {
            message.error('未找到节点详情');
          }
        } else {
          message.error('获取节点数据失败');
        }
      } catch (error) {
        message.error('获取节点详情失败');
      }
      setLoading(false);
    };

    fetchNodeDetails();
  }, [urlIp]);

  useEffect(() => {
    const fetchPortInfo = async () => {
      if (!selectedIp) return;

      try {
        const response = await getPortInfo(selectedIp);
        if (response.success && response.data) {
          setPortData(response.data);
        }
      } catch (error) {
        message.error('获取端口信息失败');
      }
    };

    fetchPortInfo();
  }, [selectedIp]);

  useEffect(() => {
    const newOverflowed = ipInfoCards.map((_, i) => {
      const el = textRefs.current[i];
      return el ? el.scrollWidth > el.clientWidth : false;
    });
    setOverflowed(newOverflowed);
  }, [nodeDetails]);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (loading) {
    return (
      <div style={{ width: '80%', marginLeft: '5%' }}>
        <Card loading={true}>
          <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
        </Card>
      </div>
    );
  }

  if (!nodeDetails) {
    return (
      <div style={{ width: '80%', marginLeft: '5%' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>未找到节点详情</div>
        </Card>
      </div>
    );
  }

  // 将节点详情转换为卡片数据
  const detailsCards = [
    {
      fullRow: true,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      title: 'IP 地址 / 名称',
      value: `${nodeDetails.IP} / ${nodeDetails.name || '未知'}`,
    },
    { title: '类型', value: nodeDetails.type || '未知', icon: <LinkOutlined style={{ color: '#eb2f96' }} /> },
    { title: '昵称', value: nodeDetails.nikename || '未知', icon: <UserOutlined style={{ color: '#13c2c2' }} /> },
    { title: '身份哈希密钥', value: nodeDetails.des_hash || '未知', icon: <KeyOutlined style={{ color: '#faad14' }} /> },
    { title: '发布日期', value: nodeDetails.release_date || '未知', icon: <ClockCircleOutlined style={{ color: '#52c41a' }} /> },
    { title: '发布时间', value: nodeDetails.release_time || '未知', icon: <ClockCircleOutlined style={{ color: '#fa541c' }} /> },
    { title: 'OR端口', value: nodeDetails.ORPort || '未知', icon: <ShareAltOutlined style={{ color: '#722ed1' }} /> },
    { title: 'Dir端口', value: nodeDetails.DirPort || '未知', icon: <ShareAltOutlined style={{ color: '#1890ff' }} /> },
    { title: '微描述摘要散列', value: nodeDetails.microdesc || '未知', icon: <KeyOutlined style={{ color: '#f5222d' }} /> },
    { title: '特征标签', value: nodeDetails.fea_label || '未知', icon: <TagsOutlined style={{ color: '#13c2c2' }} /> },
    { title: 'Tor 版本', value: nodeDetails.Tor_ver || '未知', icon: <ThunderboltOutlined style={{ color: '#722ed1' }} /> },
    { title: '协议版本', value: nodeDetails.protocol_ver || '未知', icon: <DeploymentUnitOutlined style={{ color: '#eb2f96' }} /> },
    { title: '带宽估计', value: nodeDetails.width_rec || '未知', icon: <WifiOutlined style={{ color: '#52c41a' }} /> },
    { title: '状态', value: nodeDetails.status_state || '未知', icon: <DatabaseOutlined style={{ color: '#faad14' }} /> },
    { title: '状态原因', value: nodeDetails.status_reason || '未知', icon: <InfoCircleOutlined style={{ color: '#f5222d' }} /> },
    { title: '操作系统', value: nodeDetails.OS || '未知', icon: <DesktopOutlined style={{ color: '#13c2c2' }} /> },
  ];

  return (
    <>
      <div style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, minHeight: '100vh'}}>
        <StarryBackground/>
        <Layout style={{position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, zIndex: -1}}>
        </Layout>
      </div>
      <div style={{width: '80%', marginLeft: '5%'}}>
        <Row gutter={[30, 30]}>
          {detailsCards.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const canExpand = overflowed[index];

            return (
              <Col span={item.fullRow ? 24 : 8} key={index}>
                <Card
                  hoverable={canExpand}
                  onClick={() => canExpand && toggleExpand(index)}
                  style={{
                    borderRadius: '10px',
                    cursor: canExpand ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                  }}
                  bodyStyle={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div style={{fontSize: '30px', marginRight: '16px'}}>{item.icon}</div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: '16px', color: '#888'}}>{item.title}</div>
                    <div
                      ref={(el) => (textRefs.current[index] = el)}
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'all 0.3s ease',
                        maxHeight: isExpanded ? '500px' : '26px',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}

          <Col span={24}>
            <Card title={`端口信息 (IP: ${selectedIp || '未知'})`} bordered={false}>
              <Table dataSource={portData} columns={columns} pagination={false} bordered/>
            </Card>
          </Col>
        </Row>
      </div>
      </>
      );
      };

      export default Details;
