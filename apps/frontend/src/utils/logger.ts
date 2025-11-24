/**
 * Classe de loggers estruturados para diferentes níveis de severidade.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private config: LogConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === "development",
      level: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || "info",
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return level === "error"; // Always log errors
    }
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case "error":
        console.error(prefix, message, data !== undefined ? data : "");
        break;
      case "warn":
        console.warn(prefix, message, data !== undefined ? data : "");
        break;
      case "info":
        console.info(prefix, message, data !== undefined ? data : "");
        break;
      case "debug":
        console.debug(prefix, message, data !== undefined ? data : "");
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.formatMessage("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.formatMessage("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.formatMessage("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.formatMessage("error", message, data);
  }
}

//Exportar uma instância singleton do logger
const logger = new Logger();
export default logger;
