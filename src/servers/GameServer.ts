import http from "http"
import { Server } from "socket.io"

import { SocketManager } from "../data/SocketManager"

/**
 * Represents a server for a game with the given game data type and settings type.
 */
export abstract class GameServer<TServerSettings> {
    /**
     * The underlying socket IO server.
     */
    protected server: http.Server

    /**
     * The underlying socket IO server.
     */
    protected io: Server

    /**
     * Constructor.
     */
    protected constructor(
        protected serverSettings: TServerSettings,
        protected socketManager: SocketManager
    ) {
        this.server = this.createHttpServer()
        this.io = this.createSocketIOServer()
    }

    /**
     * Creates the HTTP server.
     */
    protected abstract createHttpServer(): http.Server

    /**
     * Creates the socket IO server.
     */
    protected abstract createSocketIOServer(): Server

    /**
     * Starts the server.
     */
    abstract start(): void
}
