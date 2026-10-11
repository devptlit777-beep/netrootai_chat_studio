import React from 'react';

export default function SvgChart({ chartData, chartType = 'bar' }) {
  const rawCategories =
    Array.isArray(chartData?.categories) && chartData.categories.length > 0
      ? chartData.categories
      : ['Q1', 'Q2', 'Q3', 'Q4'];
  const categories = rawCategories.map((c) => String(c));

  // Normalize series
  let series = [];
  if (Array.isArray(chartData?.series) && chartData.series.length > 0) {
    series = chartData.series;
  } else if (Array.isArray(chartData?.values) && chartData.values.length > 0) {
    series = [{ name: 'Values', values: chartData.values }];
  } else {
    series = [{ name: 'Actual', values: [35, 65, 105, 160] }];
  }

  let allVals = [];
  series.forEach((s) => {
    (s.values || []).forEach((v) => {
      const num = parseFloat(v);
      if (!isNaN(num) && num > 0) allVals.push(num);
    });
  });
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : 100;
  const maxVal = rawMax > 0 ? rawMax * 1.15 : 100;
  const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24'];

  // 1. DONUT CHART
  if (chartType === 'donut') {
    const s0 = series[0] || { values: [40, 25, 20, 15] };
    const vals = (s0.values || [40, 25, 20, 15]).map((v) =>
      Math.max(0.01, parseFloat(v) || 10)
    );
    const total = vals.reduce((a, b) => a + b, 0) || 1;

    let currentAngle = 0;
    const cx = 140,
      cy = 110,
      r = 68;

    const slices = vals.map((val, i) => {
      const sliceAngle = (val / total) * 360;
      const color = colors[i % colors.length];
      const catName = categories[i] || `Item ${i + 1}`;
      const pct = Math.round((val / total) * 100);
      const displayVal = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));

      const startRad = (currentAngle - 90) * (Math.PI / 180);
      const endRad = (currentAngle + sliceAngle - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = sliceAngle > 180 ? 1 : 0;

      const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
      currentAngle += sliceAngle;

      return { d, color, catName, pct, displayVal };
    });

    return (
      <div className="flex items-center gap-4 w-full h-full p-2">
        <div className="relative shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 280 220" className="w-48 h-40">
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.d}
                fill={slice.color}
                opacity="0.9"
                stroke="#0f172a"
                strokeWidth="2"
                className="hover:opacity-100 transition cursor-pointer"
              >
                <title>{`${slice.catName}: ${slice.displayVal} (${slice.pct}%)`}</title>
              </path>
            ))}
            <circle cx={cx} cy={cy} r="38" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <text x={cx} y={cy - 3} fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
              TOTAL
            </text>
            <text x={cx} y={cy + 13} fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle">
              100%
            </text>
          </svg>
        </div>
        <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-1">
          {slices.map((slice, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"
            >
              <div className="flex items-center gap-2 truncate max-w-[130px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-300 truncate" title={slice.catName}>
                  {slice.catName}
                </span>
              </div>
              <span className="font-mono font-bold text-sky-400 shrink-0">{slice.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. LINE CHART
  if (chartType === 'line') {
    const w = 480,
      h = 200;
    const padL = 40,
      padR = 20,
      padT = 20,
      padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const stepX = categories.length > 1 ? plotW / (categories.length - 1) : plotW / 2;

    const gridPoints = [0, 0.5, 1.0].map((ratio) => {
      const y = padT + plotH * (1 - ratio);
      const yVal = maxVal * ratio;
      const valLabel = yVal >= 10 ? Math.round(yVal) : Math.round(yVal * 10) / 10;
      return { y, valLabel };
    });

    const seriesLines = series.map((s, sIdx) => {
      const color = colors[sIdx % colors.length];
      const vals = (s.values || []).map((v) => parseFloat(v) || 0);
      const pts = vals.map((val, idx) => {
        const x = padL + idx * stepX;
        const y = padT + plotH - (val / maxVal) * plotH;
        return { x, y, val };
      });

      if (pts.length === 0) return null;
      const d = pts
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      const dArea = `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${padT + plotH} L ${pts[0].x.toFixed(1)} ${padT + plotH} Z`;

      return { color, pts, d, dArea };
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {gridPoints.map((gp, i) => (
          <React.Fragment key={i}>
            <line
              x1={padL}
              y1={gp.y}
              x2={w - padR}
              y2={gp.y}
              stroke="#334155"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={gp.y + 4}
              fill="#64748b"
              fontSize="9"
              textAnchor="end"
              fontFamily="monospace"
            >
              {gp.valLabel}
            </text>
          </React.Fragment>
        ))}

        {seriesLines.map(
          (sl, sIdx) =>
            sl && (
              <React.Fragment key={sIdx}>
                <path d={sl.dArea} fill={sl.color} fillOpacity="0.12" />
                <path
                  d={sl.d}
                  fill="none"
                  stroke={sl.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {sl.pts.map((p, pIdx) => {
                  const displayVal = Number.isInteger(p.val) ? p.val : parseFloat(p.val.toFixed(2));
                  return (
                    <g key={pIdx}>
                      <circle
                        cx={p.x.toFixed(1)}
                        cy={p.y.toFixed(1)}
                        r="4"
                        fill={sl.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.x.toFixed(1)}
                        y={(p.y - 8).toFixed(1)}
                        fill={sl.color}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {displayVal}
                      </text>
                    </g>
                  );
                })}
              </React.Fragment>
            )
        )}

        {categories.map((cat, idx) => {
          const x = padL + idx * stepX;
          return (
            <text key={idx} x={x} y={h - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">
              {cat}
            </text>
          );
        })}
      </svg>
    );
  }

  // 3. BAR CHART (DEFAULT)
  const w = 480,
    h = 200;
  const padL = 40,
    padR = 20,
    padT = 25,
    padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const groupW = plotW / Math.max(1, categories.length);
  const barCount = Math.max(1, series.length);
  const barW = Math.min(28, Math.max(8, (groupW * 0.7) / barCount));

  const gridPoints = [0, 0.5, 1.0].map((ratio) => {
    const y = padT + plotH * (1 - ratio);
    const yVal = maxVal * ratio;
    const valLabel = yVal >= 10 ? Math.round(yVal) : Math.round(yVal * 10) / 10;
    return { y, valLabel };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* Multi-series legend if applicable */}
      {series.length > 1 &&
        series.map((s, idx) => {
          const color = colors[idx % colors.length];
          const sName = String(s.name || `Series ${idx + 1}`).slice(0, 14);
          const lx = w - padR - (series.length - idx) * 80;
          return (
            <g key={idx}>
              <circle cx={lx + 4} cy="10" r="3" fill={color} />
              <text x={lx + 10} y="13" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
                {sName}
              </text>
            </g>
          );
        })}

      {gridPoints.map((gp, i) => (
        <React.Fragment key={i}>
          <line
            x1={padL}
            y1={gp.y}
            x2={w - padR}
            y2={gp.y}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padL - 6}
            y={gp.y + 4}
            fill="#64748b"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {gp.valLabel}
          </text>
        </React.Fragment>
      ))}

      {categories.map((cat, catIdx) => {
        const groupCenterX = padL + catIdx * groupW + groupW / 2;
        const totalGroupBarW = barCount * barW + (barCount - 1) * 3;
        const groupStartX = groupCenterX - totalGroupBarW / 2;

        return (
          <g key={catIdx}>
            <text x={groupCenterX} y={h - 10} fill="#94a3b8" fontSize="9" textAnchor="middle">
              {String(cat).slice(0, 24)}
            </text>

            {series.map((s, sIdx) => {
              const color = colors[sIdx % colors.length];
              const rawVal = (s.values || [])[catIdx];
              const val = parseFloat(rawVal) || 0;
              const barH = Math.max(6, (val / maxVal) * plotH);
              const bx = groupStartX + sIdx * (barW + 3);
              const by = padT + plotH - barH;
              const displayVal = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));

              return (
                <g key={sIdx}>
                  <rect
                    x={bx.toFixed(1)}
                    y={by.toFixed(1)}
                    width={barW.toFixed(1)}
                    height={barH.toFixed(1)}
                    rx="3"
                    fill={color}
                    className="hover:brightness-125 transition cursor-pointer"
                  >
                    <title>{`${s.name}: ${displayVal}`}</title>
                  </rect>
                  <text
                    x={(bx + barW / 2).toFixed(1)}
                    y={(by - 5).toFixed(1)}
                    fill={color}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {displayVal}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
