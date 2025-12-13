import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

const RadarChartComponent = ({ data }) => {
  if (!data) return null;

  let chartData = [];

  if (Array.isArray(data)) {
    chartData = data.map(item => ({
      subject: item.axis,
      A: item.score,
      fullMark: 100
    }));
  } else {
    chartData = [
      { subject: '기술 역량', A: Math.round(data.skillFit * 100), fullMark: 100 },
      { subject: '관련 경험', A: Math.round(data.experienceFit * 100), fullMark: 100 },
      { subject: '학력/전공', A: Math.round(data.educationFit * 100), fullMark: 100 },
      { subject: '증빙/자격', A: Math.round(data.evidenceFit * 100), fullMark: 100 },
    ];
  }

  // 커스텀 Tick 렌더러로 텍스트 잘림 방지
  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }) => {
    // 중심으로부터의 방향 벡터 계산
    const dx = x - cx;
    const dy = y - cy;

    // 거리 조절 계수 (기존보다 더 멀리 배치)
    const offsetScale = 1.2;

    return (
      <text
        {...rest}
        x={cx + dx * offsetScale}
        y={cy + dy * offsetScale}
        dy={payload.value === '학력/전공' ? 10 : 0} // 하단 텍스트 위치 조정
        textAnchor="middle"
        fill="#666"
        fontSize={12}
        fontWeight="bold"
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="subject"
            tick={renderPolarAngleAxis}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="내 점수"
            dataKey="A"
            stroke="#1976d2"
            strokeWidth={2}
            fill="#1976d2"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;
