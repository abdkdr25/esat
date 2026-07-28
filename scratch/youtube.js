const https = require('https');
https.get('https://www.youtube.com/results?search_query=dental+implant+3d+animation', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        console.log(match ? match[1] : 'No match');
    });
});
