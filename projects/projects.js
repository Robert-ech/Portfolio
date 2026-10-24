import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// The count comes from the data, so it updates when projects.json changes
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && Array.isArray(projects)) {
  projectsTitle.textContent = `${projects.length} Projects`;
}
