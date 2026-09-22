import React from 'react';
import { Box, Typography } from '@mui/material';
import { MAROON } from './InvestmentUtils';

interface MonthlyPoint {
    label: string; // e.g. "Apr"
    value: number;
}

interface ContributionsAreaChartProps {
    data: MonthlyPoint[];
    width?: number;
    height?: number;
}

const ContributionsAreaChart: React.FC<ContributionsAreaChartProps> = ({ data, width = 330, height = 80 }) => {
    if (data.length === 0) {
        return (
            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'center', py: 2 }}>
                No contribution history yet.
            </Typography>
        );
    }

    const padX = 10;
    const padTop = 8;
    const padBottom = 8;
    const plotW = width - padX * 2;
    const plotH = height - padTop - padBottom;

    const maxVal = Math.max(...data.map(d => d.value), 1); // avoid divide-by-zero when every value is 0
    const step = data.length > 1 ? plotW / (data.length - 1) : 0;

    const points = data.map((d, i) => {
        const x = padX + i * step;
        const y = padTop + plotH * (1 - d.value / maxVal);
        return { x, y };
    });

    const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} ${points[points.length - 1].x},${height - padBottom} ${points[0].x},${height - padBottom}`;
    const last = points[points.length - 1];

    return (
        <Box>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
                <polygon points={areaPath} fill={`${MAROON}14`} />
                <polyline points={linePath} fill="none" stroke={MAROON} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last.x} cy={last.y} r={3.5} fill={MAROON} />
            </svg>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: `${padX}px`, mt: 0.25 }}>
                {data.map((d, i) => (
                    <Typography key={i} sx={{ fontSize: '0.55rem', color: '#aaa' }}>{d.label}</Typography>
                ))}
            </Box>
        </Box>
    );
};

export default ContributionsAreaChart;