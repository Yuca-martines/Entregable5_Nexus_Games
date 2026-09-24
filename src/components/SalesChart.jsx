import { useState, useMemo } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
} from 'lucide-react';
import { formatCOP } from '../utils/formatCurrency';

export default function SalesChart({ sales = [] }) {
  const [chartType, setChartType] = useState('bar');
  const [timeGrouping, setTimeGrouping] = useState('day');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Agrupar ventas según el período seleccionado
  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const groups = {};

    sales.forEach((s) => {
      const d = new Date(s.fecha_hora);
      let key = '';

      if (timeGrouping === 'day') {
        key = d.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
        });
      } else {
        key = d.toLocaleDateString('es-CO', {
          month: 'short',
          year: '2-digit',
        });
      }

      if (!groups[key]) {
        groups[key] = {
          label: key,
          total: 0,
          count: 0,
          rawDate: d,
        };
      }

      groups[key].total += Number(s.total || 0);
      groups[key].count += 1;
    });

    return Object.values(groups).sort(
      (a, b) => a.rawDate - b.rawDate
    );
  }, [sales, timeGrouping]);

  const maxTotal = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map((d) => d.total), 1);
  }, [chartData]);

  // Formato compacto para el eje vertical
  const formatAxisValue = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }

    return `$${Math.round(value)}`;
  };

  // Estilos de los botones
  const buttonBaseStyle = {
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '34px',
    whiteSpace: 'nowrap',
    outline: 'none',
  };

  const activeChartButtonStyle = {
    ...buttonBaseStyle,
    background: '#D4AF37',
    color: '#0A0B0E',
    border: '1px solid #D4AF37',
    boxShadow: '0 0 12px rgba(212,175,55,0.30)',
  };

  const inactiveChartButtonStyle = {
    ...buttonBaseStyle,
    background: '#12151D',
    color: '#C8D0DD',
    border: '1px solid #2a303c',
    boxShadow: 'none',
  };

  const activeTimeButtonStyle = {
    ...buttonBaseStyle,
    background: '#1E2330',
    color: '#FFDF73',
    border: '1px solid rgba(212,175,55,0.40)',
    boxShadow: '0 0 10px rgba(212,175,55,0.15)',
  };

  const inactiveTimeButtonStyle = {
    ...buttonBaseStyle,
    background: '#12151D',
    color: '#C8D0DD',
    border: '1px solid #2a303c',
    boxShadow: 'none',
  };

  // Dimensiones del gráfico SVG
  const width = 760;
  const height = 260;
  const padding = {
    top: 20,
    right: 30,
    bottom: 40,
    left: 65,
  };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Puntos para el gráfico de líneas
  const linePoints = useMemo(() => {
    if (chartData.length === 0) return '';

    return chartData
      .map((d, i) => {
        const x =
          padding.left +
          (i / Math.max(chartData.length - 1, 1)) * innerWidth;

        const y =
          padding.top +
          innerHeight -
          (d.total / maxTotal) * innerHeight;

        return `${x},${y}`;
      })
      .join(' ');
  }, [chartData, innerWidth, innerHeight, maxTotal]);

  // Área bajo la curva
  const areaPoints = useMemo(() => {
    if (chartData.length === 0) return '';

    const firstX = padding.left;
    const lastX = padding.left + innerWidth;
    const bottomY = padding.top + innerHeight;

    return `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;
  }, [linePoints, innerWidth, innerHeight]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">

      {/* Encabezado y controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">

        {/* Título */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp size={20} />
          </div>

          <div>
            <h4 className="text-base font-bold text-white">
              Comportamiento y Tendencia de Ventas
            </h4>

            <p className="text-xs text-slate-400">
              Análisis dinámico de facturación por período
            </p>
          </div>
        </div>

        {/* Controles */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Selector de tipo de gráfico */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px',
              borderRadius: '12px',
              background: '#0d1016',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => setChartType('bar')}
              style={
                chartType === 'bar'
                  ? activeChartButtonStyle
                  : inactiveChartButtonStyle
              }
              onMouseEnter={(e) => {
                if (chartType !== 'bar') {
                  e.currentTarget.style.background = '#1a1f29';
                  e.currentTarget.style.color = '#FFDF73';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (chartType !== 'bar') {
                  e.currentTarget.style.background = '#12151D';
                  e.currentTarget.style.color = '#C8D0DD';
                  e.currentTarget.style.borderColor = '#2a303c';
                }
              }}
            >
              <BarChart3 size={14} />
              <span>Barras</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('line')}
              style={
                chartType === 'line'
                  ? activeChartButtonStyle
                  : inactiveChartButtonStyle
              }
              onMouseEnter={(e) => {
                if (chartType !== 'line') {
                  e.currentTarget.style.background = '#1a1f29';
                  e.currentTarget.style.color = '#FFDF73';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (chartType !== 'line') {
                  e.currentTarget.style.background = '#12151D';
                  e.currentTarget.style.color = '#C8D0DD';
                  e.currentTarget.style.borderColor = '#2a303c';
                }
              }}
            >
              <LineChartIcon size={14} />
              <span>Lineal</span>
            </button>
          </div>

          {/* Selector de período */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px',
              borderRadius: '12px',
              background: '#0d1016',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => setTimeGrouping('day')}
              style={
                timeGrouping === 'day'
                  ? activeTimeButtonStyle
                  : inactiveTimeButtonStyle
              }
              onMouseEnter={(e) => {
                if (timeGrouping !== 'day') {
                  e.currentTarget.style.background = '#1a1f29';
                  e.currentTarget.style.color = '#FFDF73';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeGrouping !== 'day') {
                  e.currentTarget.style.background = '#12151D';
                  e.currentTarget.style.color = '#C8D0DD';
                  e.currentTarget.style.borderColor = '#2a303c';
                }
              }}
            >
              Día
            </button>

            <button
              type="button"
              onClick={() => setTimeGrouping('month')}
              style={
                timeGrouping === 'month'
                  ? activeTimeButtonStyle
                  : inactiveTimeButtonStyle
              }
              onMouseEnter={(e) => {
                if (timeGrouping !== 'month') {
                  e.currentTarget.style.background = '#1a1f29';
                  e.currentTarget.style.color = '#FFDF73';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeGrouping !== 'month') {
                  e.currentTarget.style.background = '#12151D';
                  e.currentTarget.style.color = '#C8D0DD';
                  e.currentTarget.style.borderColor = '#2a303c';
                }
              }}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Área del gráfico SVG */}
      {chartData.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          No hay suficientes registros de venta para trazar el gráfico en este período.
        </div>
      ) : (
        <div className="relative overflow-x-auto">

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[600px] select-none"
          >
            <defs>
              <linearGradient
                id="chartGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#f59e0b"
                  stopOpacity="0.45"
                />
                <stop
                  offset="100%"
                  stopColor="#f59e0b"
                  stopOpacity="0.02"
                />
              </linearGradient>

              <linearGradient
                id="barGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* Líneas y valores del eje vertical */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y =
                padding.top +
                innerHeight * (1 - ratio);

              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeWidth="0.8"
                  />

                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[8px] font-medium"
                    fill="#C8D0DD"
                  >
                    {formatAxisValue(maxTotal * ratio)}
                  </text>
                </g>
              );
            })}

            {/* Gráfico de barras */}
            {chartType === 'bar' &&
              chartData.map((d, i) => {
                const barWidth = Math.min(
                  innerWidth / chartData.length - 8,
                  38
                );

                const x =
                  padding.left +
                  (i + 0.5) *
                    (innerWidth / chartData.length) -
                  barWidth / 2;

                const barHeight =
                  (d.total / maxTotal) * innerHeight;

                const y =
                  padding.top +
                  innerHeight -
                  barHeight;

                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 3)}
                      rx="6"
                      fill={
                        isHovered
                          ? '#fbbf24'
                          : 'url(#barGradient)'
                      }
                    />

                    <text
                      x={x + barWidth / 2}
                      y={height - padding.bottom + 18}
                      textAnchor="middle"
                      className="text-[8px] font-medium"
                      fill="#D4AF37"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}

            {/* Gráfico lineal */}
            {chartType === 'line' && (
              <>
                <polygon
                  points={areaPoints}
                  fill="url(#chartGradient)"
                />

                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chartData.map((d, i) => {
                  const x =
                    padding.left +
                    (i /
                      Math.max(
                        chartData.length - 1,
                        1
                      )) *
                      innerWidth;

                  const y =
                    padding.top +
                    innerHeight -
                    (d.total / maxTotal) *
                      innerHeight;

                  const isHovered =
                    hoveredIndex === i;

                  return (
                    <g
                      key={i}
                      onMouseEnter={() =>
                        setHoveredIndex(i)
                      }
                      onMouseLeave={() =>
                        setHoveredIndex(null)
                      }
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />

                      <text
                        x={x}
                        y={height - padding.bottom + 18}
                        textAnchor="middle"
                        className="text-[8px] font-medium"
                        fill="#D4AF37"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null &&
            chartData[hoveredIndex] && (
              <div className="absolute top-2 right-4 bg-slate-800/95 border border-amber-500/40 rounded-lg p-2.5 shadow-2xl backdrop-blur-sm pointer-events-none">
                <div className="text-[11px] text-amber-400 font-semibold mb-0.5">
                  Período: {chartData[hoveredIndex].label}
                </div>

                <div className="text-sm font-bold text-white font-mono">
                  {formatCOP(
                    chartData[hoveredIndex].total
                  )}
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  {chartData[hoveredIndex].count} venta(s) registrada(s)
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
