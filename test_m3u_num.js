const https = require('https');

https.get('https://iptv-org.github.io/iptv/index.m3u', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('616') || lines[i].includes('617') || lines[i].includes('618') || lines[i].includes('619')) {
                console.log(lines[i]);
                if (i + 1 < lines.length && !lines[i+1].startsWith('#')) {
                    console.log(lines[i+1]);
                }
            }
        }
    });
});
