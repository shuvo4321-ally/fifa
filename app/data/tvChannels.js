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
    name: "FOX SPORTS 4K",
    logo: "https://images.seeklogo.com/logo-png/28/1/fox-sports-logo-png_seeklogo-284763.png",
    group: "FOX",
    url: "https://otte.cache.aiv-cdn.net/lhr-nitro/live/clients/dash/enc/m5hvr8vyu9/out/v1/31d30c91fc65458789b84209d3fa22e4/cenc.mpd",
    type: "dash",
    kid: "1f68713028d439ec03be07f56c1d6213",
    key: "20093db6455160fffed4c394def3193d",
    no_proxy: false
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
    name: "WC TV FHD",
    logo: "https://i.pinimg.com/1200x/af/10/79/af10795cab0afa9fee94b52d4837db73.jpg",
    group: "WC",
    url: "https://qp-pldt-live-bpk-ucd-prod.akamaized.net/bpk-tv/fifa_ppv1/default/index.mpd",
    type: "dash",
    kid: "2c338a117d434ce4bbe3569231af90f1",
    key: "a9633d901ee8a3f4f58ac314b5c5f4fb",
    no_proxy: false
  },
  {
    name: "TELEMUNDO HD",
    logo: "https://duckduckgo.com/i/2e3815a5b7ddd3c9.png",
    group: "TELEMUNDO",
    url: "https://instreams.pro/US/NFLHD3/tracks-v1a1/mono.m3u8?",
    type: "hls",
    no_proxy: false,
    referer: "https://instream.click/",
    origin: "https://instream.click"
  },
  {
    name: "ARABIC LIVE FHD",
    logo: "",
    group: "ARABIC",
    url: "https://cdn2.xyzstreams.st/bein4kinternal/index.m3u8?",
    type: "hls",
    no_proxy: false,
    referer: "https://xyzstreams.st/"
  },
  {
    name: "HD SERVER ENG",
    logo: "",
    group: "HD",
    url: "https://edgestreams.pro/hls/24SDAZFcsqnj24.m3u8?",
    type: "hls",
    no_proxy: false,
    referer: "https://streamscenter.online/",
    origin: "https://streamscenter.online"
  },
  {
    name: "Bein Sports 2 Arabic",
    logo: "https://play-lh.googleusercontent.com/jBDZq3aBmCXuvtuJHEasqsdYPRxMBGzYmEha4dMlgoIk19Zlh6BGQC08Zt6Ifrmzhg",
    group: "beIN",
    url: "https://1nyaler.streamhostingcdn.top/stream/21/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "HD SERVER AR",
    logo: "",
    group: "HD",
    url: "https://mainstreams.pro/hls/eJmauBDCIf.m3u8?",
    type: "hls",
    no_proxy: false,
    referer: "https://streamscenter.online/",
    origin: "https://streamscenter.online"
  }
];


