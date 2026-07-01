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
    name: "TIPIK FR FHD",
    logo: "https://upload.wikimedia.org/wikipedia/fr/b/bb/Logo_Tipik_2025.png",
    group: "TIPIK",
    url: "https://c9851ec-rbm-hilv-fsly.cdn.redbee.live/L26/6b640fa2/a765d074.isml/dash/.mpd",
    type: "dash",
    kid: "adca25b8779e4168a0cd710f59f61ccf",
    key: "be5383ed3cd8079f4ffe78ad067f476a",
    no_proxy: false
  },
  {
    name: "TSN SPORTS HD",
    logo: "https://www.bellmedia.ca/lede/wp-content/uploads/2024/09/18581592_10155403529061055_8240563011649656197_n.jpg",
    group: "TSN",
    url: "https://lb.xyzcloud3.xyz/tsn1/index.m3u8?",
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
  }
];
