const https = require('https');

https.get('https://iptv-org.github.io/api/channels.json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const channels = JSON.parse(data);
        const viu = channels.filter(c => c.id && c.id.toLowerCase().includes('viutv'));
        console.log("Found channels:");
        viu.forEach(c => console.log(c.id, c.name, c.logo));
        
        https.get('https://iptv-org.github.io/api/streams.json', (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => data2 += chunk);
            res2.on('end', () => {
                const streams = JSON.parse(data2);
                viu.forEach(channel => {
                    const channelStreams = streams.filter(s => s.channel === channel.id);
                    console.log(`Streams for ${channel.name}:`, channelStreams);
                });
            });
        });
    });
});
