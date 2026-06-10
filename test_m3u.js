const https = require('https');

https.get('https://iptv-org.github.io/iptv/index.m3u', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('viutv')) {
                console.log(lines[i]);
                if (i + 1 < lines.length) {
                    console.log(lines[i+1]);
                }
            }
        }
    });
});
