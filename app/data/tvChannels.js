// Live TV channels (HLS / .m3u8). The tokens in these URLs expire — refresh
// the `url` when the stream stops working.
export const TV_CHANNELS = [
  {
    name: "T Sports HD",
    logo: "https://s3.aynaott.com/storage/dbc585f70a60b9855b6e13a8ce4cb6f4",
    group: "Sports",
    url: "https://tvsen7.aynaott.com/tsports-hd/index.m3u8?e=1779283784&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=3b4c5a2cfa872fa7f91ffbfb4aa0f658",
  },
  {
    name: "BTV CTG",
    logo: "https://s3.aynaott.com/storage/00da8a07fb26b2fb79359ee535e4c7bc",
    group: "Bangla",
    url: "https://tvsen6.aynaott.com/btvctg/index.m3u8?e=1779283747&u=78be6644-0a65-48ec-81a4-089ac65a2619&token=9bca925fbdfe526b29d41ab7802348ec",
  },
];
