import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const RadarChartComponent = ({ data }) => {
  // 데이터가 없거나 비어있으면 렌더링하지 않음
  if (!data) return null;

  // RoleFitResponse.Breakdown 데이터를 차트 형식으로 변환
  const chartData = [
    { subject: '기술 역량', A: data.skillFit * 100, fullMark: 100 },
    { subject: '관련 경험', A: data.experienceFit * 100, fullMark: 100 },
    { subject: '학력/전공', A: data.educationFit * 100, fullMark: 100 },
    { subject: '증빙/자격', A: data.evidenceFit * 100, fullMark: 100 },
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="내 점수"
            dataKey="A"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;
