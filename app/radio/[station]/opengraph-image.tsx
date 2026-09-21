import { ImageResponse } from "next/og";
import { radioStations } from "@/services/discovery-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Live radio on Zema";

export function generateStaticParams() {
  return radioStations.map((station) => ({ station: station.id }));
}

const BARS = [
  14, 26, 44, 62, 38, 70, 52, 80, 34, 58, 76, 46, 88, 30, 64, 50, 72, 40, 84, 28, 60, 48, 78, 36, 66,
  54, 82, 32, 56, 74, 42, 68, 24, 50, 38, 20
];

/**
 * Per-station share card. When a station link is pasted into WhatsApp or X,
 * this is what renders -- the station's own name rather than the generic site
 * card, which is the whole point of having a page per station.
 */
export default function StationOgImage({ params }: { params: { station: string } }) {
  const station = radioStations.find((item) => item.id === params.station);
  const name = station?.name ?? "Zema Radio";
  const meta = station ? `${station.frequency} · ${station.city}` : "Live Ethiopian and Eritrean radio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07070c",
          padding: "72px 88px",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -140,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(69,224,200,0.24), rgba(69,224,200,0) 65%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 680,
            height: 680,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(124,108,246,0.26), rgba(124,108,246,0) 65%)"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect x="2" y="2" width="60" height="60" rx="18" fill="#0e0e17" stroke="#45e0c8" strokeWidth="3" />
            <rect x="17" y="15" width="30" height="7" rx="3.5" fill="#45e0c8" />
            <path d="M43.5 22 L20.5 42" stroke="#45e0c8" strokeWidth="7" strokeLinecap="round" />
            <rect x="17" y="42" width="30" height="7" rx="3.5" fill="#45e0c8" />
          </svg>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#f2f3f7", letterSpacing: -1 }}>
            Zema
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginLeft: 20,
              padding: "8px 18px",
              borderRadius: 9999,
              background: "rgba(239,68,68,0.16)"
            }}
          >
            <div style={{ width: 11, height: 11, borderRadius: 9999, background: "#f87171" }} />
            <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "#fca5a5", letterSpacing: 2 }}>
              LIVE
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 70,
            fontSize: name.length > 18 ? 88 : 104,
            fontWeight: 800,
            color: "#f2f3f7",
            letterSpacing: -3,
            lineHeight: 1
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 32, color: "#a9adbe" }}>{meta}</div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: "auto", height: 90 }}>
          {BARS.map((height, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexGrow: 1,
                height: `${height}%`,
                borderRadius: 4,
                background: index % 5 === 0 ? "#7c6cf6" : "#45e0c8"
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );
}
