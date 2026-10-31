import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.search-bar');
const projectTitle = document.querySelector('.projects-title');
const chartLegend = document.querySelector('.chart-legend');
const chartSvg = document.querySelector('#projects-pie-plot');

let query = '';
let selectedYear = null;

function updateProjectHeading(items) {
  if (!projectTitle || !Array.isArray(items)) return;

  const count = items.length;
  const label = count === 1 ? 'Project' : 'Projects';
  projectTitle.textContent = `${count} ${label}`;
}

function getVisibleProjects() {
  const normalizedQuery = query.trim().toLowerCase();
  let visibleProjects = projects;

  if (!Array.isArray(visibleProjects)) {
    return [];
  }

  if (normalizedQuery) {
    visibleProjects = visibleProjects.filter((project) => {
      const projectText = Object.values(project).join(' ').toLowerCase();
      return projectText.includes(normalizedQuery);
    });
  }

  if (selectedYear !== null) {
    visibleProjects = visibleProjects.filter(
      (project) => String(project.year) === String(selectedYear),
    );
  }

  return visibleProjects;
}

function renderPieChart(projectsForChart) {
  if (!chartSvg || !chartLegend) return;

  chartSvg.innerHTML = '';
  chartLegend.innerHTML = '';

  const yearlyCounts = d3.rollups(
    projectsForChart,
    (group) => group.length,
    (project) => String(project.year),
  ).map(([year, count]) => ({ year, count }));

  if (!yearlyCounts.length) {
    chartLegend.innerHTML = '<p class="chart-empty">No projects match this search.</p>';
    return;
  }

  const width = 220;
  const height = 220;
  const radius = 78;
  const colors = d3.scaleOrdinal()
    .domain(yearlyCounts.map((entry) => entry.year))
    .range(['#7c9cff', '#ffb26b', '#6fcf97', '#f299c3', '#8ecae6', '#ff8a80']);

  const pie = d3.pie().sort(null).value((count) => count.count);
  const pieData = pie(yearlyCounts);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const hoverArc = d3.arc().innerRadius(0).outerRadius(radius + 8);

  d3.select(chartSvg)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const chartGroup = d3.select(chartSvg).append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  chartGroup.selectAll('path')
    .data(pieData)
    .join('path')
    .attr('d', (slice) => arc(slice))
    .attr('fill', (slice) => colors(slice.data.year))
    .attr('stroke', '#f7f7f5')
    .attr('stroke-width', 2)
    .attr('class', (slice) => String(slice.data.year) === String(selectedYear) ? 'selected' : '')
    .on('click', (_, slice) => {
      const yearValue = String(slice.data.year);
      selectedYear = selectedYear === yearValue ? null : yearValue;
      renderDashboard();
    })
    .on('mouseenter', function (_, slice) {
      d3.select(this)
        .transition()
        .duration(180)
        .attr('d', (node) => hoverArc(node));
    })
    .on('mouseleave', function (_, slice) {
      d3.select(this)
        .transition()
        .duration(180)
        .attr('d', (node) => arc(node));
    });

  yearlyCounts.forEach((entry) => {
    const legendItem = document.createElement('button');
    legendItem.type = 'button';
    legendItem.className = 'chart-legend-item';
    if (selectedYear !== null && String(entry.year) === String(selectedYear)) {
      legendItem.classList.add('selected');
    }

    legendItem.innerHTML = `
      <span class="legend-swatch" style="background:${colors(entry.year)}"></span>
      <span>${entry.year}</span>
      <span class="legend-count">(${entry.count})</span>
    `;

    legendItem.addEventListener('click', () => {
      const yearValue = String(entry.year);
      selectedYear = selectedYear === yearValue ? null : yearValue;
      renderDashboard();
    });

    chartLegend.appendChild(legendItem);
  });
}

function renderDashboard() {
  const visibleProjects = getVisibleProjects();
  updateProjectHeading(visibleProjects);
  renderProjects(visibleProjects, projectsContainer, 'h2');
  renderPieChart(visibleProjects);
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    renderDashboard();
  });
}

renderDashboard();
