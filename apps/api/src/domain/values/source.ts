const SOURCES = ["twitter", "qiita", "zenn", "hatena", "other"] as const;
export type Source = (typeof SOURCES)[number];

const fromUrl = (url: string): Source => {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "other";
  }

  if (hostname === "twitter.com" || hostname === "x.com") {
    return "twitter";
  }
  if (hostname === "qiita.com") {
    return "qiita";
  }
  if (hostname === "zenn.dev") {
    return "zenn";
  }
  if (
    hostname.endsWith(".hateblo.jp") ||
    hostname === "hatenablog.com" ||
    hostname === "hatenablog.jp"
  ) {
    return "hatena";
  }

  return "other";
};

export const SourceVO = { values: SOURCES, fromUrl } as const;
