import type { CSSProperties } from "react";

export const getBaseUrl = () => (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === "production" ? "https://www.anshkosh.com" : "http://localhost:3000")
).replace(/\/$/, "");

export const text: CSSProperties = {
  color: "#374151", fontSize: "16px", lineHeight: "26px", margin: "0 0 16px",
  overflowWrap: "anywhere",
};
export const detailsBox: CSSProperties = {
  backgroundColor: "#f7f8fa", border: "1px solid #e5e7eb",
  borderRadius: "8px", padding: "16px", margin: "20px 0",
};
export const detailText: CSSProperties = {
  ...text, fontSize: "14px", lineHeight: "23px", margin: "4px 0", whiteSpace: "pre-wrap",
};
export const notesContainer: CSSProperties = {
  ...detailsBox, backgroundColor: "#fff4ef", borderColor: "#ffd9c8",
  borderLeft: "3px solid #c84112",
};
export const notesText: CSSProperties = {
  ...detailText, color: "#852d11", margin: 0,
};
export const button: CSSProperties = {
  backgroundColor: "#c84112", borderRadius: "8px", color: "#ffffff",
  fontSize: "15px", fontWeight: 700, lineHeight: "22px", textDecoration: "none",
  textAlign: "center", display: "inline-block", padding: "13px 22px",
};
