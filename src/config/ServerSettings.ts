/**
 * Class for server settings.
 */
export class ServerSettings {
    /**
     * The default port to use.
     */
    private static readonly DEFAULT_PORT = 4001

    /**
     * The default maximum number of rooms allowed.
     */
    private static readonly DEFAULT_MAX_ROOMS = 3

    /**
     * The default maximum number of players allowed in a single room.
     */
    private static readonly DEFAULT_MAX_PLAYERS_PER_ROOM = 3

    /**
     * The default maximum number of spectators allowed in a single room.
     */
    private static readonly DEFAULT_MAX_SPECTATORS_PER_ROOM = 3

    /**
     * Constructor.
     */
    private constructor(
        public port: number,
        public maxRooms: number,
        public maxPlayersPerRoom: number,
        public maxSpectatorsPerRoom: number,
    ) { }

    /**
     * Returns a new instance of ServerSettings based on values in the environment.
     */
    static readFromEnv() {
        return new ServerSettings(
            Number(process.env.PORT || this.DEFAULT_PORT),
            Number(process.env.SERVER_MAX_ROOMS || this.DEFAULT_MAX_ROOMS),
            Number(process.env.SERVER_MAX_PLAYERS_PER_ROOM || this.DEFAULT_MAX_PLAYERS_PER_ROOM),
            Number(process.env.SERVER_MAX_SPECTATORS_PER_ROOM || this.DEFAULT_MAX_SPECTATORS_PER_ROOM),
        )
    }
}
