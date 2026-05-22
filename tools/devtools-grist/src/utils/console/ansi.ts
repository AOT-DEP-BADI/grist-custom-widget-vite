export const STYLE = {
    // Reset
    RESET: '\x1b[0m',

    // Effects
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    ITALIC: '\x1b[3m',
    UNDERLINE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    STRIKETHROUGH: '\x1b[9m',

    // Foreground
    FG_BLACK: '\x1b[30m',
    FG_RED: '\x1b[31m',
    FG_GREEN: '\x1b[32m',
    FG_YELLOW: '\x1b[33m',
    FG_BLUE: '\x1b[34m',
    FG_MAGENTA: '\x1b[35m',
    FG_CYAN: '\x1b[36m',
    FG_WHITE: '\x1b[37m',

    // Foreground bright
    FG_BRIGHT_BLACK: '\x1b[90m',
    FG_BRIGHT_RED: '\x1b[91m',
    FG_BRIGHT_GREEN: '\x1b[92m',
    FG_BRIGHT_YELLOW: '\x1b[93m',
    FG_BRIGHT_BLUE: '\x1b[94m',
    FG_BRIGHT_MAGENTA: '\x1b[95m',
    FG_BRIGHT_CYAN: '\x1b[96m',
    FG_BRIGHT_WHITE: '\x1b[97m',

    // Background
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m',
    BG_ORANGE: '\x1b[48;5;208m',

    // Background bright
    BG_BRIGHT_BLACK: '\x1b[100m',
    BG_BRIGHT_RED: '\x1b[101m',
    BG_BRIGHT_GREEN: '\x1b[102m',
    BG_BRIGHT_YELLOW: '\x1b[103m',
    BG_BRIGHT_BLUE: '\x1b[104m',
    BG_BRIGHT_MAGENTA: '\x1b[105m',
    BG_BRIGHT_CYAN: '\x1b[106m',
    BG_BRIGHT_WHITE: '\x1b[107m',

    // Extended
    FG_EXTENDED_DEEP_ORANGE: '\x1b[38;5;208m',
    FG_EXTENDED_ELECTRIC_VIOLET: '\x1b[38;5;99m',
    BG_EXTENDED_MIDNIGHT: '\x1b[48;5;17m',
    BG_EXTENDED_CHARCOAL: '\x1b[48;5;232m',

    // Methods foreground & background RGB
    // e.g. const ORANGE = STYLE.FG_RGB(255,165,0);
    FG_RGB: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
    BG_RGB: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
} as const;

// Method styles
export const BOLD = (text: string) => (STYLE.BOLD + text + STYLE.RESET);
export const ITALIC = (text: string) => (STYLE.ITALIC + text + STYLE.RESET);
export const UNDERLINE = (text: string) => (STYLE.UNDERLINE + text + STYLE.RESET);
export const STRIKETHROUGH = (text: string) => (STYLE.STRIKETHROUGH + text + STYLE.RESET);
export const DIM = (text: string) => (STYLE.DIM + text + STYLE.RESET);
export const REVERSE = (text: string) => (STYLE.REVERSE + text + STYLE.RESET);
export const HIDDEN = (text: string) => (STYLE.HIDDEN + text + STYLE.RESET);
export const BLINK = (text: string) => (STYLE.BLINK + text + STYLE.RESET);

type StyleValue = typeof STYLE[keyof typeof STYLE] | string;
export const LINK = (
    url: string,
    text?: string,
    {color = STYLE.FG_CYAN, underline = false}: { color?: StyleValue, underline?: boolean } = {}
) => {
    const stylePrefix = color + (underline ? STYLE.UNDERLINE : '');
    const content = `${stylePrefix}${text ?? url}${STYLE.RESET}`;

    // Encapsulation with OSC 8 for handle console click link
    return `\x1b]8;;${url}\x1b\\${content}\x1b]8;;\x1b\\`;
};