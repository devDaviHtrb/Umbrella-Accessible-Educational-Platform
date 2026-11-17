export type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

const NULL_CHAR = String.fromCharCode(0);

function unescapeHeader(value: string) {
  return value.replace(/\\(n|r|c|\\)/g, (_, code: string) => {
    if (code === 'n') return '\n';
    if (code === 'r') return '\r';
    if (code === 'c') return ':';
    return '\\';
  });
}

export function buildFrame(command: string, headers: Record<string, string> = {}, body = ''): string {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return `${[command, ...headerLines].join('\n')}\n\n${body}${NULL_CHAR}`;
}

export function parseFrames(data: string): StompFrame[] {
  const frames: StompFrame[] = [];

  data.split(NULL_CHAR).forEach((chunk) => {
    const text = chunk.replace(/^[\r\n]+/, '');
    if (!text) return;

    const separator = text.indexOf('\n\n');
    const head = separator === -1 ? text : text.slice(0, separator);
    const body = separator === -1 ? '' : text.slice(separator + 2);
    const [command, ...headerLines] = head.split('\n');

    const headers: Record<string, string> = {};
    headerLines.forEach((line) => {
      const colon = line.indexOf(':');
      if (colon === -1) return;
      const key = line.slice(0, colon).trim();
      if (key && !(key in headers)) headers[key] = unescapeHeader(line.slice(colon + 1).replace(/\r$/, ''));
    });

    frames.push({ command: command.trim(), headers, body });
  });

  return frames;
}
