import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  // ponytail: PM2 captures stdout/stderr; keep runtime logs out of release files and Git.
  transports: [new winston.transports.Console()],
});
