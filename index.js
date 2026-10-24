import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// LATEST PROJECTS

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects?.slice(0, 3);
const projectsContainer = document.querySelector('.projects');

// h3, since the section heading above them is an h2
renderProjects(latestProjects, projectsContainer, 'h3');

// GITHUB STATS

const githubData = await fetchGitHubData('Robert-ech');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  if (githubData) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  } else {
    // GitHub allows 60 requests an hour without logging in, so this can fail
    profileStats.innerHTML = `<p class="stats-error">GitHub stats couldn't load right now. <a href="https://github.com/Robert-ech" target="_blank">View my profile</a> instead.</p>`;
  }
}
