import { ImageResponse } from "next/og";

export const alt = "TrustForge: AI for Oracle FLEXCUBE customization and ODT development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e1f3f",
          color: "#f7f4ee",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 46, height: 46, border: "2px solid #c9ae78", transform: "rotate(45deg)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 8 }}>
            <span style={{ fontSize: 26, letterSpacing: 8, color: "#ffffff" }}>TRUSTFORGE</span>
            <span style={{ fontSize: 15, letterSpacing: 4, color: "#c9ae78" }}>TRUSTROUTE TECHNOLOGIES</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, letterSpacing: 5, color: "#c9ae78", marginBottom: 24 }}>
            AI FOR ORACLE FLEXCUBE UBS 14.6 & 14.7
          </span>
          <span style={{ fontSize: 74, lineHeight: 1.05, color: "#ffffff" }}>FLEXCUBE customizations,</span>
          <span style={{ fontSize: 74, lineHeight: 1.05, color: "#c9ae78", fontStyle: "italic" }}>forged in conversation.</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#cfd3dc", borderTop: "1px solid rgba(201,174,120,0.4)", paddingTop: 24 }}>
          radxml · CUSTOM hook packages · release JS · new screens · Silent ODT
        </div>
      </div>
    ),
    size,
  );
}
