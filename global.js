console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// NAVIGATION MENU

const BASE_PATH = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? '/'           // Local server
  : '/Portfolio/'; // GitHub Pages repo name

// Most links are sections of the home page; Projects is its own page
let pages = [
  { url: '#about', title: 'About' },
  { url: '#experience', title: 'Experience' },
  { url: 'projects/', title: 'Projects' },
  { url: '#skills', title: 'Skills' },
  { url: '#contact', title: 'Contact' },
  { url: 'https://github.com/Robert-ech', title: 'GitHub' },
  { url: '#resume', title: 'Resume', className: 'nav-resume' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

let home = document.createElement('a');
home.href = BASE_PATH;
home.className = 'nav-name';
home.textContent = 'Roberto Echeverria Sosa';
nav.append(home);

let list = document.createElement('ul');
list.className = 'nav-links';
nav.append(list);

for (let p of pages) {
  let url = !p.url.startsWith('http') ? BASE_PATH + p.url : p.url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  if (p.className) a.classList.add(p.className);

  // External links open in a new tab
  if (a.host !== location.host) {
    a.target = '_blank';
  }

  let li = document.createElement('li');
  li.append(a);
  list.append(li);
}

// Highlight the current link. The home page sections share one pathname,
// so the hash tells them apart as well as host and pathname.
function markCurrentLink() {
  // "/Portfolio/" and "/Portfolio/index.html" are the same page
  let pathname = location.pathname.replace(/index\.html$/, '');
  for (let a of $$('.nav-links a')) {
    a.classList.toggle(
      'current',
      a.host === location.host && a.pathname === pathname && a.hash === location.hash,
    );
  }
}

markCurrentLink();
window.addEventListener('hashchange', markCurrentLink);

// DARK MODE SWITCH

nav.insertAdjacentHTML(
  'beforeend',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

let select = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// Restore the saved choice so it survives a page refresh
if ('colorScheme' in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  setColorScheme(event.target.value);
  localStorage.colorScheme = event.target.value;
});

// DATA LOADING

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!(containerElement instanceof Element)) {
    console.error('renderProjects: containerElement is not a DOM element', containerElement);
    return;
  }

  // Only allow real heading tags, otherwise fall back to h2
  if (!/^h[1-6]$/.test(headingLevel)) {
    console.warn(`renderProjects: "${headingLevel}" is not a heading level, using h2`);
    headingLevel = 'h2';
  }

  containerElement.innerHTML = '';

  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.innerHTML = '<p class="projects-empty">No projects to show yet.</p>';
    return;
  }

  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title ?? 'Untitled project'}</${headingLevel}>
      ${project.image ? `<img src="${project.image}" alt="${project.title ?? ''}">` : ''}
      <p>${project.description ?? ''}</p>
      ${project.year ? `<p class="project-year">${project.year}</p>` : ''}
    `;
    containerElement.appendChild(article);
  }
}
