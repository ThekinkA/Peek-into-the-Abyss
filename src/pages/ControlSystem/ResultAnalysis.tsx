import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { CSSTransition } from 'react-transition-group';
import './ResultAnalysis.less';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === steps.length) {
      const timer = setTimeout(() => {
        setShowBoxes(true);
      }, 500); // 稍微延迟更自然
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="result-analysis-container">
      <div style={{ marginBottom: '20px' }}>
        当前IP: <Tag color="red">{ip}</Tag>
      </div>

      <Row gutter={16} className="flow-container">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Col>
              <Card
                className={`flow-step ${index < currentStep ? 'visible' : ''}`}
              >
                {step}
              </Card>
            </Col>
            {index < steps.length - 1 && (
              <Col>
                <ArrowRightOutlined className={`flow-arrow ${index < currentStep - 1 ? 'visible' : ''}`} />
              </Col>
            )}
          </React.Fragment>
        ))}
      </Row>

      <CSSTransition in={showBoxes} timeout={500} classNames="fade" unmountOnExit>
        <Row gutter={24} style={{ marginTop: '40px' }}>
          <Col span={12}>
            <Card title="概率最高的攻击路径" style={{ height: '200px' }}></Card>
          </Col>
          <Col span={12}>
            <Card title="报告文本" style={{ height: '200px' }}></Card>
          </Col>
        </Row>
      </CSSTransition>
    </div>
  );
};

export default ResultAnalysis;
