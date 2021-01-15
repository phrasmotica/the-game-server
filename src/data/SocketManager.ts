import { Socket } from "socket.io"

/**
 * Represents a map of socket IDs to player names.
 */
type SocketPlayerMap = {
    [socketId: string] : string
}

/**
 * Represents a map of player names to sockets.
 */
type SocketMap = {
    [playerName: string] : Socket
}

/**
 * Class for managing sockets on the server.
 */
export class SocketManager {
    /**
     * Player names indexed by socket ID.
     */
    socketData: SocketPlayerMap = {}

    /**
     * Sockets indexed by player ID.
     */
    sockets: SocketMap = {}

    /**
     * Returns the player name for the given socket ID.
     */
    getPlayerName(socketId: string) {
        return this.socketData[socketId]
    }

    /**
     * Sets the player name for the given socket ID.
     */
    setPlayerName(socketId: string, playerName: string) {
        this.socketData[socketId] = playerName
    }

    /**
     * Removes the socket with the given ID.
     */
    removePlayerName(socketId: string) {
        delete this.socketData[socketId]
    }

    /**
     * Returns the socket for the given player.
     */
    getSocket(playerName: string) {
        return this.sockets[playerName]
    }

    /**
     * Sets the socket for the given player name.
     */
    setSocket(playerName: string, socket: Socket) {
        this.sockets[playerName] = socket
    }

    /**
     * Removes the socket for the given player.
     */
    removeSocket(playerName: string) {
        delete this.sockets[playerName]
    }
}
