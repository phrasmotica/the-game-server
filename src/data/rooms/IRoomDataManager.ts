import { RoomData } from "the-game-lib/dist/models/RoomData"

/**
 * Interface for managing room data containing the given game data type on the server.
 */
export interface IRoomDataManager {
    /**
     * Returns the data for the given room.
     */
    getRoomData(roomName: string): RoomData

    /**
     * Returns the data for all rooms.
     */
    getAllRoomData(): RoomData[]

    /**
     * Returns the players in the given room.
     */
    getPlayers(roomName: string): string[]

    /**
     * Returns whether the given room exists.
     */
    roomExists(roomName: string): boolean

    /**
     * Creates a room with the given name.
     */
    createRoom(roomName: string): boolean

    /**
     * Creates a room with the given name.
     */
    initialise(roomName: string): boolean

    /**
     * If the given room doesn't exist then create it.
     */
    ensureRoomExists(roomName: string): boolean

    /**
     * Returns whether the maximum number of rooms has been reached.
     */
    maxRoomsReached(): boolean

    /**
     * Ends the turn in the given room.
     */
    onTurnEnd(roomName: string, autoSortHand: boolean): void

    /**
     * Clears the game data in the given room.
     */
    clear(roomName: string): boolean

    /**
     * Removes the given room.
     */
    removeRoom(roomName: string): boolean
}
