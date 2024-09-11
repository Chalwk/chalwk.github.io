// Smooth Scrolling Effect
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
});
  });
});

// Dark Mode Toggle
const toggle = document.querySelector('#darkModeToggle');
const body = document.querySelector('body');

toggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
});

// Animated Background Color
const colors = ['#ff0000', '#00ff00', '#0000ff'];
let currentColor = 0;

setInterval(() => {
  document.body.style.backgroundColor = colors[currentColor];
  currentColor = (currentColor + 1) % colors.length;
}, 2000);