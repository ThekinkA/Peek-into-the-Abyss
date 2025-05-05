import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Tag, Button } from 'antd';
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
  const [pdfFile, setPdfFile] = useState<string | null>(null); // 当前显示的 PDF 文件路径
  const [cardTitle, setCardTitle] = useState('概率最高的攻击路径'); // 动态标题

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

  const handleCardClick = (step: string) => {
    if (step === 'MulVAL 输出攻击图') {
      setPdfFile(`/data/${ip}_input_AttackGraph.pdf`); // 替换为 MulVAL 的 PDF 文件路径
      setCardTitle('MulVAL 输出攻击图');
    } else if (step === '输出包含概率的攻击图') {
      setPdfFile(`/data/result.dot.pdf`); // 替换为贝叶斯的 PDF 文件路径
      setCardTitle('包含概率的攻击图');
    } else if (step === '进入大模型提取分析') {
      setPdfFile(null); // 清空 PDF 文件
      setCardTitle('概率最高的攻击路径');
    }
  };

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
                onClick={() => handleCardClick(step)} // 点击时触发对应逻辑
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
          <Col span={24}>
            <Card title={cardTitle} style={{ height: '700px', width: '100%' }}> {/* 调整高度和宽度 */}
              {pdfFile ? (
                <iframe
                  src={pdfFile}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                ></iframe>
              ) : (
                <p>暂无内容</p>
              )}
            </Card>
          </Col>
          <Col span={24} style={{ marginTop: '20px' }}>
            <Card title="报告文本" style={{ height: '300px', width: '100%' }}> {/* 调整高度和宽度 */}
              <p>这里是报告文本的内容。</p>
            </Card>
          </Col>
        </Row>
      </CSSTransition>
    </div>
  );
};

export default ResultAnalysis;
