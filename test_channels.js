const https = require('https');

https.get('https://iptv-org.github.io/api/channels.json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const channels = JSON.parse(data);
        const nowSports = channels.filter(c => c.name && c.name.toLowerCase().includes('now sports'));
        console.log("Found channels:");
        nowSports.forEach(c => console.log(c.id, c.name, c.logo));
        
        https.get('https://iptv-org.github.io/api/streams.json', (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => data2 += chunk);
            res2.on('end', () => {
                const streams = JSON.parse(data2);
                nowSports.forEach(channel => {
                    const channelStreams = streams.filter(s => s.channel === channel.id);
                    console.log(`Streams for ${channel.name}:`, channelStreams);
                });
            });
        });
    });
});
