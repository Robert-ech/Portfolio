console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// NAVIGATION MENU

const BASE_PATH = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? '/'           // Local server
  : '/Portfolio/'; // GitHub Pages repo name

// This is a one-page site, so most links are section anchors
let pages = [
  { url: '#about', title: 'About' },
  { url: '#experience', title: 'Experience' },
  { url: '#projects', title: 'Projects' },
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

// Highlight the current link. Every section shares one page, so the hash
// tells the links apart as well as host and pathname.
function markCurrentLink() {
  // "/Portfolio/" and "/Portfolio/index.html" are the same page
  let pathname = location.pathname.replace(/index\.html$/, '');
  for (let a of $$('nav a')) {
    a.classList.toggle(
      'current',
      a.host === location.host && a.pathname === pathname && a.hash !== '' && a.hash === location.hash,
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
