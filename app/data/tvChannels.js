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
  }
];


