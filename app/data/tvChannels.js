// Live TV channels (HLS / .m3u8 / DASH). The aynaott tokens expire — refresh the `url`
// when a stream stops working. Only HTTPS, H.264 streams are kept (HEVC plays
// audio-only in browsers; HTTP streams are blocked as mixed-content on the
// HTTPS deploy).

export const TV_CHANNELS = [
  {
    name: "D Sports",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/106/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "DAZN FIFA",
    logo: "https://i.postimg.cc/Kc3mP7Qt/cbimage.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/94/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "BEIN Sports 1",
    logo: "https://images.seeklogo.com/logo-png/48/1/bein-sports-1-logo-png_seeklogo-481583.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "Win Sports",
    logo: "https://images.seeklogo.com/logo-png/25/1/win-sports-logo-png_seeklogo-259337.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8",
    type: "hls",
    no_proxy: true
  },
  {
    name: "CAZE TV",
    logo: "https://images.seeklogo.com/logo-png/61/1/cazetv-logo-png_seeklogo-619708.png",
    group: "FIFA",
    url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8",
    type: "hls"
  },
  {
    name: "T Sports HD",
    logo: "https://images.seeklogo.com/logo-png/64/1/t-sports-logo-png_seeklogo-640172.png",
    group: "FIFA",
    url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8",
    type: "hls",
    no_proxy: true
  }
];
