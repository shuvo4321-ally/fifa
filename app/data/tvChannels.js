// Live TV channels (HLS / .m3u8). The aynaott tokens expire — refresh the `url`
// when a stream stops working. Only HTTPS, H.264 streams are kept (HEVC plays
// audio-only in browsers; HTTP streams are blocked as mixed-content on the
// HTTPS deploy).
export const TV_CHANNELS = [
  {
    name: "FIFA+",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/FIFA%2B_(2025).svg/960px-FIFA%2B_(2025).svg.png",
    group: "Sports",
    url: "https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8",
    tvg_id: "FIFAPlus.uk@English",
    status: "live",
    verified_at: "2026-06-04T15:14:38.748252",
    status_code: 200,
    content_type: "application/vnd.apple.mpegurl",
  },
  {
    name: "T Sports HD",
    logo: "https://s3.aynaott.com/storage/dbc585f70a60b9855b6e13a8ce4cb6f4",
    group: "Sports",
    url: "https://tvsen7.aynaott.com/tsports-hd/index.m3u8?e=1779283784&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=3b4c5a2cfa872fa7f91ffbfb4aa0f658",
  },
  {
    name: "T Sports (720p)",
    logo: "https://i.imgur.com/2JzlorD.png",
    group: "Sports",
    url: "https://tvsen7.aynaott.com/tsportsfhd/index.m3u8",
  },
  {
    name: "TSN 1",
    logo: "https://s3.aynaott.com/storage/59fe7ff434fed04ecec29b4d737ebc95",
    group: "Sports",
    url: "https://tvsen7.aynaott.com/tsn1/index.m3u8?e=1779283805&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=e5ce886378c54bd381b9833b5d57649a",
  },
  {
    name: "TSN 2",
    logo: "https://s3.aynaott.com/storage/17642cb60c2af7fc36ca1e08cc54fdae",
    group: "Sports",
    url: "https://tvsen7.aynaott.com/tsn2/index.m3u8?e=1779283793&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=636d9b8b83d4316193c2d1c9aad8951c",
  },
  {
    name: "PTV Sports",
    logo: "https://s3.aynaott.com/storage/9d9d7cbfba5a8ceea648bbd963ad1014",
    group: "Sports",
    url: "https://tvsen5.aynaott.com/PtvSports/index.m3u8?e=1779283784&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=db1789e36c278bf538489fac263e0ffb",
    status: "live",
    verified_at: "2026-06-04T15:05:55.820885",
    status_code: 200,
    content_type: "application/vnd.apple.mpegurl",
  },

  {
    name: "BTV National",
    logo: "https://images.seeklogo.com/logo-png/45/1/btv-bangladesh-television-logo-png_seeklogo-459657.png",
    group: "Bangla",
    url: "https://tvsen6.aynaott.com/btvhd/index.m3u8",
  },
  {
    name: "BTV CTG",
    logo: "https://s3.aynaott.com/storage/00da8a07fb26b2fb79359ee535e4c7bc",
    group: "Bangla",
    url: "https://tvsen6.aynaott.com/btvctg/index.m3u8?e=1779283747&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=9bca925fbdfe526b29d41ab7802348ec",
  },
  {
    name: "Somoy News TV",
    logo: "https://s3.aynaott.com/storage/ece71c1163a377fbe2d93f9d28c34f60",
    group: "News",
    url: "https://tvsen6.aynaott.com/somoytv/index.m3u8?e=1779283766&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=269246b8a31fb3a656624d71e10e447d",
  },

];
