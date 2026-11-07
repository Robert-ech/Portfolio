import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const summaryStats = document.querySelector('#summary-stats');
const scatterSvg = document.querySelector('#commit-scatter');
const tooltip = document.querySelector('#scatter-tooltip');
const selectionSummary = document.querySelector('#selection-summary');
const languageBreakdown = document.querySelector('#language-breakdown');

const rawRows = await d3.csv('./loc.csv', (row) => ({
  file: row.file,
  line: Number(row.line),
  type: row.type || 'unknown',
  commit: row.commit,
  author: row.author,
  datetime: new Date(row.datetime),
  date: row.date,
  time: row.time,
  timezone: row.timezone,
  length: Number(row.length),
  depth: Number(row.depth),
}));

const commitData = d3.rollups(
  rawRows,
  (rows) => {
    const date = rows[0].datetime;
    const totalLines = d3.sum(rows, (row) => row.length);

    return {
      commit: rows[0].commit,
      author: rows[0].author,
      date,
      day: d3.timeFormat('%a')(date),
      hour: date.getHours(),
      totalLines,
      files: new Set(rows.map((row) => row.file)).size,
      types: [...new Set(rows.map((row) => row.type))],
    };
  },
  (row) => row.commit,
).map(([commit, details]) => ({ commit, ...details }));

const uniqueFiles = new Set(rawRows.map((row) => row.file)).size;
const uniqueTypes = new Set(rawRows.map((row) => row.type)).size;
const totalLines = d3.sum(rawRows, (row) => row.length);
const maxLinesPerCommit = d3.max(commitData, (d) => d.totalLines) ?? 0;
const firstCommit = d3.min(commitData, (d) => d.date);
const lastCommit = d3.max(commitData, (d) => d.date);
const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildSummaryCards() {
  if (!summaryStats) return;

  const cards = [
    { label: 'Commits tracked', value: commitData.length.toLocaleString() },
    { label: 'Files analyzed', value: uniqueFiles.toLocaleString() },
    { label: 'Languages detected', value: uniqueTypes.toLocaleString() },
    { label: 'Total lines', value: totalLines.toLocaleString() },
    { label: 'Max lines in a commit', value: maxLinesPerCommit.toLocaleString() },
    { label: 'Date range', value: firstCommit && lastCommit ? `${d3.timeFormat('%b %d, %Y')(firstCommit)} → ${d3.timeFormat('%b %d, %Y')(lastCommit)}` : 'N/A' },
  ];

  summaryStats.innerHTML = cards.map((card) => `
    <article class="stat-card">
      <p class="stat-label">${card.label}</p>
      <p class="stat-value">${card.value}</p>
    </article>
  `).join('');
}

function renderLanguageBreakdown(commitSubset) {
  if (!languageBreakdown) return;

  const selectedRows = rawRows.filter((row) => commitSubset.includes(row.commit));
  const counts = d3.rollups(
    selectedRows,
    (rows) => d3.sum(rows, (row) => row.length),
    (row) => row.type,
  ).sort((a, b) => b[1] - a[1]);

  if (!counts.length) {
    languageBreakdown.innerHTML = '<p class="empty-state">No commits selected.</p>';
    return;
  }

  const maxSize = d3.max(counts, (d) => d[1]) || 1;
  const colorScale = d3.scaleOrdinal().domain(counts.map((d) => d[0])).range(d3.schemeTableau10);

  languageBreakdown.innerHTML = counts.map(([type, value]) => {
    const widthPct = (value / maxSize) * 100;
    return `
      <div class="language-row">
        <div class="language-meta">
          <span class="language-swatch" style="background:${colorScale(type)}"></span>
          <span>${type}</span>
        </div>
        <strong>${value.toLocaleString()}</strong>
        <div class="language-bar">
          <span style="width:${widthPct}%; background:${colorScale(type)}"></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderSelectionSummary(selected) {
  if (!selectionSummary) return;

  if (!selected.length) {
    selectionSummary.innerHTML = '<p class="empty-state">No commits selected. Drag a box over the chart to inspect a subset.</p>';
    return;
  }

  const totalLines = d3.sum(selected, (d) => d.totalLines);
  const fileCount = new Set(selected.flatMap((d) => rawRows.filter((row) => row.commit === d.commit).map((row) => row.file))).size;
  const first = d3.min(selected, (d) => d.date); 
  const last = d3.max(selected, (d) => d.date);

  selectionSummary.innerHTML = `
    <div class="selection-kpi">
      <span class="selection-kpi-value">${selected.length.toLocaleString()}</span>
      <span class="selection-kpi-label">Selected commits</span>
    </div>
    <div class="selection-kpi">
      <span class="selection-kpi-value">${fileCount.toLocaleString()}</span>
      <span class="selection-kpi-label">Files touched</span>
    </div>
    <div class="selection-kpi">
      <span class="selection-kpi-value">${totalLines.toLocaleString()}</span>
      <span class="selection-kpi-label">Lines in selection</span>
    </div>
    <p class="selection-range">${first && last ? `${d3.timeFormat('%b %d, %Y')(first)} → ${d3.timeFormat('%b %d, %Y')(last)}` : 'No date range available'}</p>
  `;
}

function renderScatterplot(selectedCommitSet) {
  if (!scatterSvg) return;

  const width = 960;
  const height = 480;
  const margin = { top: 20, right: 30, bottom: 52, left: 68 };

  const selectedSet = new Set(selectedCommitSet);
  const x = d3.scaleTime()
    .domain(d3.extent(commitData, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3.scalePoint()
    .domain(allDays)
    .range([height - margin.bottom, margin.top]);

  const radiusScale = d3.scaleSqrt()
    .domain([0, maxLinesPerCommit || 1])
    .range([4, 16]);

  const colorScale = d3.scaleSequential()
    .domain([0, maxLinesPerCommit || 1])
    .interpolator(d3.interpolateRgbBasis(['#d73027', '#f46d43', '#a6d96a', '#1a9850']));

  const svg = d3.select(scatterSvg)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  svg.selectAll('*').remove();

  const chartGroup = svg.append('g');

  chartGroup.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
    .call((g) => g.select('.domain').attr('stroke', '#6d7078'))
    .call((g) => g.selectAll('text').attr('fill', '#6d7078').style('font-size', '12px'));

  chartGroup.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y))
    .call((g) => g.select('.domain').attr('stroke', '#6d7078'))
    .call((g) => g.selectAll('text').attr('fill', '#6d7078').style('font-size', '12px'));

  chartGroup.selectAll('.gridline')
    .data(allDays)
    .join('line')
    .attr('class', 'gridline')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', (day) => y(day))
    .attr('y2', (day) => y(day))
    .attr('stroke', 'rgba(128, 128, 128, 0.18)')
    .attr('stroke-dasharray', '4 4');

  const brush = d3.brush()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on('end', function (event) {
      if (!event.selection) {
        renderScatterplot(commitData.map((d) => d.commit));
        return;
      }

      const [[x0, y0], [x1, y1]] = event.selection;
      const nextSelection = commitData.filter((d) => {
        const px = x(d.date);
        const py = y(d.day);
        return px >= x0 && px <= x1 && py >= y0 && py <= y1;
      }).map((d) => d.commit);

      renderScatterplot(nextSelection);
    });

  chartGroup.append('g')
    .attr('class', 'brush')
    .call(brush);

  chartGroup.selectAll('circle')
    .data(commitData)
    .join('circle')
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(d.day))
    .attr('r', (d) => radiusScale(d.totalLines))
    .attr('fill', (d) => colorScale(d.totalLines))
    .attr('fill-opacity', (d) => selectedSet.has(d.commit) ? 0.88 : 0.35)
    .attr('stroke', (d) => (selectedSet.has(d.commit) ? '#f7f7f5' : 'rgba(255,255,255,0.4)'))
    .attr('stroke-width', (d) => (selectedSet.has(d.commit) ? 1.5 : 1))
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      tooltip.innerHTML = `
        <strong>${d.commit.slice(0, 7)}</strong><br>
        ${d.day} · ${d3.timeFormat('%b %d, %Y')(d.date)}<br>
        ${d3.format(',')(d.totalLines)} lines · ${d.files} files
      `;
      tooltip.style.opacity = '1';
      tooltip.style.left = `${event.offsetX + 14}px`;
      tooltip.style.top = `${event.offsetY - 10}px`;
    })
    .on('mousemove', function (event, d) {
      tooltip.innerHTML = `
        <strong>${d.commit.slice(0, 7)}</strong><br>
        ${d.day} · ${d3.timeFormat('%b %d, %Y')(d.date)}<br>
        ${d3.format(',')(d.totalLines)} lines · ${d.files} files
      `;
      tooltip.style.left = `${event.offsetX + 14}px`;
      tooltip.style.top = `${event.offsetY - 10}px`;
    })
    .on('mouseleave', function () {
      tooltip.style.opacity = '0';
    });

  const selectedCommits = commitData.filter((d) => selectedSet.has(d.commit));
  renderSelectionSummary(selectedCommits);
  renderLanguageBreakdown(selectedCommits.map((d) => d.commit));
}

buildSummaryCards();
renderScatterplot(commitData.map((d) => d.commit));
