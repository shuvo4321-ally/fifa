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
    name: "Telemundo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Telemundo_logo_2018.svg/960px-Telemundo_logo_2018.svg.png",
    group: "FIFA",
    url: "https://live-oneapp-prd-news.akamaized.net/Content/CMAF_OL2-CTR-4s-v2/Live/channel(kvea)/master.mpd",
    type: "dash",
    kid: "ce7ab3022e753307997f58afe001bac4",
    key: "72d631a66e635c60829a0fe7705516c1"
  },
  {
    name: "TUDN",
    logo: "https://i.imgur.com/oT5CAvd.png",
    group: "FIFA",
    url: "https://otte.live.fly.ww.aiv-cdn.net/gru-nitro/live/clients/dash/enc/8u9cregwlt/out/v1/687f6b2a559943549be271504a948ffd/cenc.mpd",
    type: "dash",
    kid: "1710ac2bbfcd3032d0f6533850968f47",
    key: "d2548dacc8efcd1cd0af0373060c82dc"
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
    name: "DAZN 1",
    logo: "https://i.postimg.cc/Kc3mP7Qt/cbimage.png",
    group: "FIFA",
    url: "http://znty.dyndns.org:5010/hls/eleven1.m3u8",
    type: "hls"
  },

  {
    name: "LOL",
    logo: "https://i.ibb.co.com/S7tZS6cg/Bein-Sports-1-Direct.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8",
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
    name: "FOX English",
    logo: "https://cdn.broadbandtvnews.com/wp-content/uploads/2025/05/13115423/Fox-One-Logo.jpg",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/26/index.m3u8",
    type: "hls"
  },

  {
    name: "Win Sports",
    logo: "https://images.seeklogo.com/logo-png/25/1/win-sports-logo-png_seeklogo-259337.png",
    group: "FIFA",
    url: "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8",
    type: "hls"
  },

  {
    name: "FIFA CTV - English (1080p)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/CTV_logo_2018.svg/3840px-CTV_logo_2018.svg.png",
    group: "Sports",
    url: "https://otte-qw.live.pv-cdn.net/lhr-nitro/live/clients/dash/enc/72sjo8hygl/out/v1/3079be34d72a4985852d299a02406a0c/cenc.mpd",
    type: "dash",
    kid: "d185684e2330de5bea436daa094a5e86",
    key: "014f0116154f5bf0050e03a6b0a23157"
  },

  {
    name: "GOLIVE - English",
    logo: "https://rtb-images.glueapi.io/320x0/live/GoLiveNew.png",
    group: "FIFA",
    url: "https://d1211whpimeups.cloudfront.net/smil:rtbgo/chunklist.m3u8",
    type: "hls"
  },
  {
    name: "Football World Cup 2026",
    logo: "https://carboncredits.com/wp-content/uploads/2025/09/shutterstock_2306088965-e1757112807302.jpg",
    group: "FIFA",
    url: "http://starhub.pro/live/farhat-3379/67897-913379/744524.ts",
    type: "ts"
  },
  {
    name: "Football World Cup 2026 4K",
    logo: "https://carboncredits.com/wp-content/uploads/2025/09/shutterstock_2306088965-e1757112807302.jpg",
    group: "FIFA",
    url: "http://starhub.pro/live/farhat-3379/67897-913379/744527.ts",
    type: "ts"
  }
];
