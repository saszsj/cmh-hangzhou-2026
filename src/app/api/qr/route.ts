import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const target = url.searchParams.get("target") ?? "/new";
  const full = new URL(target, origin).toString();

  const svg = await QRCode.toString(full, {
    type: "svg",
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

