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
    type: "hls"
  },
  {
    name: "M6 Direct TV",
    logo: "https://i.imgur.com/7GVp3fW.png",
    group: "FIFA",
    url: "https://origin-m6web.live.6cloud.fr/out/v1/6play/6play-m6/cmaf_cenc00/dash-short-hd.mpd",
    type: "dash",
    kid: "433ffba670963e70857859a9dff4be04",
    key: "51ede3a821229fe81e71282c8eff80e3"
  },
  {
    name: "DAZN FIFA",
    logo: "https://i.postimg.cc/Kc3mP7Qt/cbimage.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/94/index.m3u8",
    type: "hls"
  },
  {
    name: "BEIN Sports 1",
    logo: "https://images.seeklogo.com/logo-png/48/1/bein-sports-1-logo-png_seeklogo-481583.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8",
    type: "hls"
  },
  {
    name: "FOX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fox_Broadcasting_Company_logo_%282019%29.svg/250px-Fox_Broadcasting_Company_logo_%282019%29.svg.png",
    group: "FIFA",
    url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/9crxia693u/out/v1/fc40f22f10374517a2784e1d97cb23f4/cenc.mpd",
    type: "dash",
    kid: "1f68713028d439ec03be07f56c1d6213",
    key: "20093db6455160fffed4c394def3193d"
  },

  {
    name: "Win Sports",
    logo: "https://images.seeklogo.com/logo-png/25/1/win-sports-logo-png_seeklogo-259337.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8",
    type: "hls"
  },
  {
    name: "CAZE TV",
    logo: "https://images.seeklogo.com/logo-png/61/1/cazetv-logo-png_seeklogo-619708.png",
    group: "FIFA",
    url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8",
    type: "hls"
  },
  {
    name: "Somoy TV",
    logo: "https://s3.aynaott.com/storage/ece71c1163a377fbe2d93f9d28c34f60",
    group: "FIFA",
    url: "https://live.thebosstv.com:30443/dwlive/Somoy-TV/chunks.m3u8",
    type: "hls"
  },
  {
    name: "TVP Sport",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_TVP_Sport.jpg/1280px-Logo_TVP_Sport.jpg",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/89/index.m3u8",
    type: "hls"
  },
  {
    name: "TSN 1",
    logo: "https://images.seeklogo.com/logo-png/31/1/tsn-1-logo-png_seeklogo-314693.png",
    group: "FIFA",
    url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/w0rehjjrwe/out/v1/69a2a7041395406b970598f61680e7cf/cenc.mpd",
    type: "dash",
    kid: "14eeabf30c14b7fbf3008c03099ce011",
    key: "17d2ac8dbc5429bd70af3433aa12158d"
  },
  {
    name: "Toffee",
    logo: "https://static.wikia.nocookie.net/etv-gspn-bangla/images/4/43/Toffee_logo.png",
    group: "FIFA",
    url: "https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-5/0/master_1700.m3u8?hdntl=Expires=1782030536~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AduQTZ9HGTA0mWw_1BM4vBOsaGJIHPpjfpgbzddewBVA3V2b-1hSAxZ_Tg4n64ar-_KUxuHxNiYClLxNWyvUreGqC18C",
    type: "hls",
    no_proxy: true
  },
  {
    name: "BEIN Sports 5",
    logo: "https://carboncredits.com/wp-content/uploads/2025/09/shutterstock_2306088965-e1757112807302.jpg",
    group: "FIFA",
    url: "http://starhub.pro/live/farhat-3379/67897-913379/744527.ts",
    type: "hls"
  }
];
