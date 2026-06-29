// Live TV channels (HLS / .m3u8 / DASH). The aynaott tokens expire — refresh the `url`
// when a stream stops working. Only HTTPS, H.264 streams are kept (HEVC plays
// audio-only in browsers; HTTP streams are blocked as mixed-content on the
// HTTPS deploy).

export const TV_CHANNELS = [
  {
    name: "BEIN Sports 1",
    logo: "https://images.seeklogo.com/logo-png/48/1/bein-sports-1-logo-png_seeklogo-481583.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "QAZ SPORTS FHD",
    logo: "https://cdn.livesoccertv.com/images/channels/thumbnails/kazsport-kazakhstan.jpg",
    group: "QAZ",
    url: "https://fo03-bkm.beetv.kz/bpk-tv/000003038/tve/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "TSN SPORTS FHD",
    logo: "https://www.bellmedia.ca/lede/wp-content/uploads/2024/09/18581592_10155403529061055_8240563011649656197_n.jpg",
    group: "TSN",
    url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/w0rehjjrwe/out/v1/69a2a7041395406b970598f61680e7cf/cenc.mpd",
    type: "dash",
    kid: "14eeabf30c14b7fbf3008c03099ce011",
    key: "17d2ac8dbc5429bd70af3433aa12158d",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    no_proxy: false
  },
  {
    name: "FOX ONE HD",
    logo: "https://images.seeklogo.com/logo-png/28/1/fox-sports-logo-png_seeklogo-284763.png",
    group: "FOX",
    url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/zpfs5hlgya/out/v1/84b1d591a23640178a8e8aa43c6e59a7/cenc.mpd",
    type: "dash",
    kid: "0cc2f872759c96de70237e6fa6de03d0",
    key: "a879b1d38ed002d4018bce96f9219b8d",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    no_proxy: false
  },
  {
    name: "FOX ONE - AQ",
    logo: "https://images.seeklogo.com/logo-png/28/1/fox-sports-logo-png_seeklogo-284763.png",
    group: "FOX",
    url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/enc/ajfoeddkbz/out/v1/b78800b9b2304879b15843f455836829/cenc.mpd",
    type: "dash",
    kid: "f6564ec2aee819046328a0e153be574d",
    key: "ff46a8a1031eb27ef22576a077c98ab7",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    no_proxy: false
  },
  {
    name: "D Sports FHD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png",
    group: "D",
    url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/z5oyxzsxdk/out/v1/7695a0f64a0e424b973d5b09a2a3eb91/cenc.mpd",
    type: "dash",
    kid: "f836853d8eac19446ed9535f5fc568b1",
    key: "b3bc5ef00602b29abac7e482d3d9fbf3",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    no_proxy: false
  }
];
