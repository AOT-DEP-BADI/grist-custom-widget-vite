export type DevtoolsErrorCode =
    | 'READ_PACKAGE_JSON_FAILED'
    | 'DOCKER_RESOLVE_PATH_FAILED'
    | 'VITE_SERVER_FAILED'
    | 'DOCKER_COMPOSE_FAILED';

export class DevtoolsError extends Error {
    constructor(
        public code: DevtoolsErrorCode,
        message: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'DevToolsError';
    }
}