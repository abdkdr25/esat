const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/galeri.html');
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('.ba-grid {');
const endIndex = content.indexOf('<h4 data-i18n="footer-quick">Hızlı Bağlantılar</h4>');

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `.ba-grid {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 40px;
                            margin: 20px auto 80px;
                            max-width: 1000px;
                        }
                        @media (min-width: 768px) { .ba-grid { grid-template-columns: 1fr 1fr; } }
                        .ba-slider {
                            position: relative; width: 100%; aspect-ratio: auto;
                            overflow: hidden; border-radius: 20px;
                            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                            background-color: #f8fafc;
                        }
                        .ba-after { position: relative; width: 100%; }
                        .ba-before {
                            position: absolute; top: 0; left: 0;
                            width: 100%; height: 100%;
                            clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
                            z-index: 2;
                        }
                        .ba-slider img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
                        .ba-range { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; z-index: 10; }
                        .ba-handle {
                            position: absolute; top: 0; left: 50%;
                            width: 3px; height: 100%;
                            background: rgba(255,255,255,0.9);
                            pointer-events: none; transform: translateX(-50%); z-index: 5;
                            box-shadow: 0 0 15px rgba(0,0,0,0.2);
                        }
                        .ba-handle::after {
                            content: ''; position: absolute; top: 50%; left: 50%;
                            transform: translate(-50%,-50%);
                            width: 44px; height: 44px;
                            background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
                            border: 2px solid white; border-radius: 50%;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>'), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>');
                            background-position: left 4px center, right 4px center;
                            background-repeat: no-repeat; background-size: 16px;
                        }
                        .ba-label {
                            position: absolute; top: 20px; padding: 8px 16px;
                            background: rgba(0,0,0,0.4); backdrop-filter: blur(6px);
                            color: white; border-radius: 30px; font-size: 0.8rem;
                            font-weight: 600; letter-spacing: 0.5px; z-index: 4;
                            pointer-events: none; text-transform: uppercase;
                            border: 1px solid rgba(255,255,255,0.2);
                        }
                        .ba-label.before { left: 20px; }
                        .ba-label.after { right: 20px; }
                    </style>

                    <div class="ba-grid" id="gallery-container">
                        <div style="text-align:center; padding: 40px; color: var(--text-muted); grid-column: 1/-1;">
                            <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i><br><br>Yükleniyor...
                        </div>
                    </div>

                    <script>
                        function updateSlider(element) {
                            const slider = element.parentElement;
                            const beforeImg = slider.querySelector('.ba-before');
                            const handle = slider.querySelector('.ba-handle');
                            const val = element.value;
                            beforeImg.style.clipPath = \`polygon(0 0, \${val}% 0, \${val}% 100%, 0 100%)\`;
                            handle.style.left = \`\${val}%\`;
                        }

                        async function loadGallery() {
                            const container = document.getElementById('gallery-container');
                            if (!container) return;
                            try {
                                const res = await fetch('/api/gallery');
                                const result = await res.json();
                                
                                if (!result.success || result.data.length === 0) {
                                    container.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-image" style="font-size: 32px; margin-bottom: 15px; display:block;"></i>Henüz galeri fotoğrafı yüklenmedi.</div>';
                                    return;
                                }
                                
                                container.innerHTML = '';
                                result.data.forEach(item => {
                                    const sliderDiv = document.createElement('div');
                                    sliderDiv.className = 'ba-slider';
                                    sliderDiv.innerHTML = \`
                                        <div class="ba-after"><img src="\${item.yeni_foto}" alt="Yeni Hali"></div>
                                        <div class="ba-before"><img src="\${item.eski_foto}" alt="Eski Hali"></div>
                                        <div class="ba-label before">Eski Hali</div>
                                        <div class="ba-label after">Yeni Hali</div>
                                        <input type="range" min="0" max="100" value="50" class="ba-range" oninput="updateSlider(this)">
                                        <div class="ba-handle"></div>
                                    \`;
                                    container.appendChild(sliderDiv);
                                });
                            } catch (error) {
                                container.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding: 40px; color: red;">Galeri yüklenirken bir hata oluştu.</div>';
                            }
                        }
                        
                        document.addEventListener('DOMContentLoaded', loadGallery);
                    </script>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer" id="contact">
        <div class="container footer-content">
            <div class="footer-col">
                <h3>Esat Kılınç Diş Kliniği.</h3>
                <p style="opacity: 0.7; color: #cbd5e1;">Modern diş hekimliğinin güvenilir adresi.</p>
                <div class="footer-social">
                    <a href="https://www.instagram.com/dt.esatkilinc/" target="_blank" class="social-icon"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="social-icon"><i class="fa-brands fa-linkedin-in"></i></a>
                </div>
            </div>
            <div class="footer-col">
                `;
    
    const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Fixed galeri.html');
} else {
    console.log('Could not find indices!');
}
