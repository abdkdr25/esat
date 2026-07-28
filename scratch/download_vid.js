const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("public/video/teeth.mp4");
https.get("https://pacificdisability.org/wp-content/uploads/2021/04/teeth.mp4", function(response) {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("Download Completed");
  });
}).on("error", (err) => {
  console.log("Error: ", err.message);
});
