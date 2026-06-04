/**
 * AnimeDownloadButton
 * Calls OmniSave API directly from browser (correct TLS fingerprint)
 * Then proxies the file download through Railway via septorch
 */

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  animeTitle: string;
  episodeNumber: number;
}

type Status = "idle" | "loading" | "done" | "error";

const API_BASE = "https://h5-api.aoneroom.com";

function generateToken(): string {
  const ts = Math.floor(Date.now() / 1000);
  const reversed = String(ts).split("").reverse().join("");
  // MD5 using a simple implementation
  return `${ts},${md5(reversed)}`;
}

// Simple MD5 implementation
function md5(str: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function str2binl(s: string) {
    const bin: number[] = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < s.length * 8; i += 8) {
      bin[i >> 5] |= (s.charCodeAt(i / 8) & mask) << i % 32;
    }
    return bin;
  }
  function binl2hex(binarray: number[]) {
    const hexTab = "0123456789abcdef";
    let str = "";
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hexTab.charAt((binarray[i >> 2] >> (i % 4 * 8 + 4)) & 0xf) +
             hexTab.charAt((binarray[i >> 2] >> (i % 4 * 8)) & 0xf);
    }
    return str;
  }
  function coreMd5(x: number[], len: number) {
    x[len >> 5] |= 0x80 << len % 32;
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i+1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i+2], 17, 606105819); b = md5ff(b, c, d, a, x[i+3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i+4], 7, -176418897); d = md5ff(d, a, b, c, x[i+5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i+6], 17, -1473231341); b = md5ff(b, c, d, a, x[i+7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i+8], 7, 1770035416); d = md5ff(d, a, b, c, x[i+9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i+10], 17, -42063); b = md5ff(b, c, d, a, x[i+11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i+12], 7, 1804603682); d = md5ff(d, a, b, c, x[i+13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i+14], 17, -1502002290); b = md5ff(b, c, d, a, x[i+15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i+1], 5, -165796510); d = md5gg(d, a, b, c, x[i+6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i+11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i+5], 5, -701558691); d = md5gg(d, a, b, c, x[i+10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i+15], 14, -660478335); b = md5gg(b, c, d, a, x[i+4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i+9], 5, 568446438); d = md5gg(d, a, b, c, x[i+14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i+3], 14, -187363961); b = md5gg(b, c, d, a, x[i+8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i+13], 5, -1444681467); d = md5gg(d, a, b, c, x[i+2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i+7], 14, 1735328473); b = md5gg(b, c, d, a, x[i+12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i+5], 4, -378558); d = md5hh(d, a, b, c, x[i+8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i+11], 16, 1839030562); b = md5hh(b, c, d, a, x[i+14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i+1], 4, -1530992060); d = md5hh(d, a, b, c, x[i+4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i+7], 16, -155497632); b = md5hh(b, c, d, a, x[i+10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i+13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i+3], 16, -722521979); b = md5hh(b, c, d, a, x[i+6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i+9], 4, -640364487); d = md5hh(d, a, b, c, x[i+12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i+15], 16, 530742520); b = md5hh(b, c, d, a, x[i+2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i+7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i+14], 15, -1416354905); b = md5ii(b, c, d, a, x[i+5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i+12], 6, 1700485571); d = md5ii(d, a, b, c, x[i+3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i+10], 15, -1051523); b = md5ii(b, c, d, a, x[i+1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i+8], 6, 1873313359); d = md5ii(d, a, b, c, x[i+15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i+6], 15, -1560198380); b = md5ii(b, c, d, a, x[i+13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i+4], 6, -145523070); d = md5ii(d, a, b, c, x[i+11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i+2], 15, 718787259); b = md5ii(b, c, d, a, x[i+9], 21, -343485551);
      a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }
  const binStr = str2binl(str);
  const result = coreMd5(binStr, str.length * 8);
  return binl2hex(result);
}

async function searchOmniSave(keyword: string) {
  const token = generateToken();
  const res = await fetch(`${API_BASE}/wefeed-h5api-bff/subject/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Client-Token": token,
      "X-Client-Info": '{"timezone":"Asia/Shanghai"}',
      "X-Request-Lang": "en",
      "X-Source": "downloader",
      "authorization": "",
      "X-Site-Domain": "",
    },
    body: JSON.stringify({ keyword, page: 1, perPage: 15, subjectType: 0 }),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message || "Search error");
  return data?.data?.items ?? [];
}

async function getEpisodeUrl(subjectId: string, detailPath: string, season: number, episode: number) {
  const token = generateToken();
  const url = `${API_BASE}/wefeed-h5api-bff/subject/download?subjectId=${subjectId}&se=${season}&ep=${episode}&detailPath=${encodeURIComponent(detailPath)}`;
  const res = await fetch(url, {
    headers: {
      "X-Client-Token": token,
      "X-Client-Info": '{"timezone":"Asia/Shanghai"}',
      "X-Request-Lang": "en",
      "X-Source": "downloader",
      "authorization": "",
      "X-Site-Domain": "",
    },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return await res.json();
}

export default function AnimeDownloadButton({ animeTitle, episodeNumber }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;
    setError(null);
    setStatus("loading");

    try {
      // 1. Search from browser (correct TLS fingerprint)
      const items = await searchOmniSave(animeTitle);
      if (!items.length) throw new Error("Anime not found");
      const anime = items[0];

      // 2. Find season/episode
      let season = 1;
      for (let s = 1; s <= 10; s++) {
        const check = await getEpisodeUrl(anime.subjectId, anime.detailPath, s, 1);
        if (!check?.data?.hasResource) break;
        const epCheck = await getEpisodeUrl(anime.subjectId, anime.detailPath, s, episodeNumber);
        if (epCheck?.data?.hasResource) { season = s; break; }
      }

      // 3. Get download link
      const data = await getEpisodeUrl(anime.subjectId, anime.detailPath, season, episodeNumber);
      const downloads = data?.data?.downloads ?? [];
      if (!downloads.length) throw new Error("No download links found");

      const sorted = [...downloads].sort((a: any, b: any) => parseInt(b.resolution) - parseInt(a.resolution));
      const chosen = sorted[0];

      // 4. Proxy through server for download
      const safeTitle = animeTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeTitle}_EP${episodeNumber}.mp4`;
      const proxyUrl = `/api/download/anime/file?url=${encodeURIComponent(chosen.url)}&fn=${encodeURIComponent(filename)}`;

      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "loading": return "Preparing...";
      case "done":    return "Downloading!";
      case "error":   return "Retry";
      default:        return "Download";
    }
  };

  const btnClass = () => {
    if (status === "done")    return "bg-green-500/20 text-green-400 border-green-500/40";
    if (status === "error")   return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (status === "loading") return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className={`flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${btnClass()}`}
      >
        {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : status === "done" ? <CheckCircle className="w-3.5 h-3.5" />
          : status === "error" ? <XCircle className="w-3.5 h-3.5" />
          : <Download className="w-3.5 h-3.5" />}
        {label()}
      </button>
      {error && <p className="text-[10px] text-red-400 text-center mt-1">{error}</p>}
    </div>
  );
}
