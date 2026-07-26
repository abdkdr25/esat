const fs = require('fs');
let js = fs.readFileSync('public/script.js', 'utf8');
const idx = js.indexOf('window.scrollCarousel = function (id, page)');
if (idx !== -1) {
    js = js.substring(0, idx);
    const correctEnding = window.scrollCarousel = function (id, page) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    const card = carousel.firstElementChild;
    if (!card) return;
    const cardWidth = card.offsetWidth + 30; // card width + gap
    carousel.scrollTo({
        left: page * cardWidth * 1.5,
        behavior: 'smooth'
    });
    const parent = carousel.parentElement;
    if (parent) {
        const dots = parent.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            if (index === page) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }
};

// About Us Auto & Manual Slider
let aboutSlideInterval;
let currentAboutSlide = 0;

window.changeAboutSlide = function(direction) {
    const slides = document.querySelectorAll('#about-slider .slide');
    if (slides.length === 0) return;
    
    slides[currentAboutSlide].classList.remove('active');
    currentAboutSlide = (currentAboutSlide + direction + slides.length) % slides.length;
    slides[currentAboutSlide].classList.add('active');
    
    // Reset interval when manually clicked
    clearInterval(aboutSlideInterval);
    startAboutSlider();
};

function startAboutSlider() {
    const slides = document.querySelectorAll('#about-slider .slide');
    if (slides.length > 0) {
        aboutSlideInterval = setInterval(() => {
            changeAboutSlide(1);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    startAboutSlider();
});
;
    fs.writeFileSync('public/script.js', js + correctEnding, 'utf8');
    console.log('Fixed script.js ending!');
} else {
    console.log('Could not find scrollCarousel!');
}
