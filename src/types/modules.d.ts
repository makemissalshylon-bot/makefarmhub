/** Optional peer modules used via dynamic import */
declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: unknown);
    setFontSize(size: number): void;
    setFont(font?: string, style?: string): void;
    text(text: string, x: number, y: number): void;
    addPage(): void;
    save(filename: string): void;
  }
}

declare module 'xlsx' {
  export const utils: {
    aoa_to_sheet: (data: unknown[][]) => unknown;
    json_to_sheet: (data: unknown[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
  };
  export function writeFile(wb: unknown, filename: string): void;
}
