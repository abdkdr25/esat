const fs = require('fs');
const imageBuf = fs.readFileSync('public/video/logo-yeni.png');
const base64 = imageBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="circle">
      <circle cx="50" cy="50" r="50" />
    </clipPath>
  </defs>
  <image width="100" height="100" preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${base64}" clip-path="url(#circle)"/>
</svg>`;
fs.writeFileSync('public/video/favicon-round.svg', svg);
