import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const RadarChartComponent = ({ data }) => {
  if (!data) return null;

  const chartData = [
    { subject: '기술 역량', A: Math.round(data.skillFit * 100), fullMark: 100 },
    { subject: '관련 경험', A: Math.round(data.experienceFit * 100), fullMark: 100 },
    { subject: '학력/전공', A: Math.round(data.educationFit * 100), fullMark: 100 },
    { subject: '증빙/자격', A: Math.round(data.evidenceFit * 100), fullMark: 100 },
  ];

  // 커스텀 Tick 렌더러로 텍스트 잘림 방지
  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }) => {
    return (
      <text
        {...rest}
        x={x + (x - cx) / 10} // 중심에서 조금 더 멀리 배치
        y={y + (y - cy) / 10}
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
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
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
          <Tooltip
            formatter={(value) => [`${value}점`, '점수']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* 점수 상세 표 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        width: '100%',
        marginTop: '-10px',
        padding: '0 10px',
        fontSize: '0.85rem'
      }}>
        {chartData.map((item) => (
          <div key={item.subject} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <span style={{ color: '#555' }}>{item.subject}</span>
            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{item.A}점</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChartComponent;
