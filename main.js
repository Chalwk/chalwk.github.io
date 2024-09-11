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

// Trigger dark mode toggle on page load
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#darkModeToggle').click();
});

// Animated Background Color
const colors = ['#000000']; // black is #000000
let currentColor = 0;

setInterval(() => {
  document.body.style.backgroundColor = colors[currentColor];
  currentColor = (currentColor + 1) % colors.length;
}, 2000);