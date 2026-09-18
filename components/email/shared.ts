export const getBaseUrl = () => {
  const isDev = process.env.NODE_ENV !== "production";
  const defaultBaseUrl = isDev
    ? "http://localhost:3000"
    : "https://anshkosh.com";
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    defaultBaseUrl
  ).replace(/\/$/, "");
};

export const main = {
  backgroundColor: "#FAFAFA",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

export const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

export const header = {
  padding: "24px",
  textAlign: "center" as const,
};

export const logoContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0",
};

export const logoImage = {
  width: "32px",
  height: "32px",
  marginRight: "8px",
  verticalAlign: "middle",
};

export const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "-0.5px",
  verticalAlign: "middle",
};

export const logoTextPrimary = {
  color: "#111827",
};

export const logoTextSecondary = {
  color: "#E8521E",
};

export const content = {
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "bold",
  color: "#111827",
  padding: "0 0 10px",
};

export const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
};

export const detailsBox = {
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "6px",
  margin: "16px 0",
};

export const detailText = {
  color: "#111827",
  fontSize: "14px",
  margin: "4px 0",
  lineHeight: "20px",
};

export const notesContainer = {
  backgroundColor: "#fef2f2",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "4px solid #ef4444",
  margin: "16px 0",
};

export const notesText = {
  color: "#991b1b",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0",
};

export const btnContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

export const button = {
  backgroundColor: "#E8521E",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

export const buttonDark = {
  ...button,
  backgroundColor: "#111827",
};

export const buttonSuccess = {
  ...button,
  backgroundColor: "#22c55e",
};

export const buttonDanger = {
  ...button,
  backgroundColor: "#ef4444",
};

export const buttonGold = {
  ...button,
  backgroundColor: "#FFC947",
  color: "#1A1A2E",
};

export const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

export const footer = {
  textAlign: "center" as const,
};

export const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
};

export const link = {
  color: "#9ca3af",
  textDecoration: "underline",
};
