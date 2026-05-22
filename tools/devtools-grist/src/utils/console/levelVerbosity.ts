export const VERBOSITY = {
    NONE: 0,
    LOW: 1,    // -v, --verbose
    MEDIUM: 2, // -vv
    HIGH: 3,   // -vvv
} as const;

export type VerbosityLevel = typeof VERBOSITY[keyof typeof VERBOSITY];

let currentVerbosity: number = VERBOSITY.NONE;

export function setVerbosity(level: number): void {
    currentVerbosity = level;
}

export function getVerbosity(): number {
    return currentVerbosity;
}

export function getVerbosityHumanReadable(): string {
    switch (currentVerbosity) {
        case VERBOSITY.NONE:
            return "None";
        case VERBOSITY.LOW:
            return "Low (-v)";
        case VERBOSITY.MEDIUM:
            return "Medium (-vv)";
        case VERBOSITY.HIGH:
            return "High (-vvv)";
        default:
            return "Unknown";
    }
}

export const isVerbose = (): boolean => currentVerbosity >= VERBOSITY.LOW;

export function increaseVerbosity(value: string, previous: number): number {
    return previous + 1;
}