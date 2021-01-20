import { IGameData, RoomData } from "game-server-lib"

/**
 * Represents a map of room names to room data.
 */
type RoomDataMap<TGameData extends IGameData> = {
    [roomName: string] : RoomData<TGameData>
}

/**
 * Class for managing room data on the server.
 */
export abstract class RoomDataManager<TGameData extends IGameData> {
    /**
     * Room data indexed by room name.
     */
    roomGameData: RoomDataMap<TGameData> = {}

    /**
     * Constructor.
     */
    constructor(private maxRooms: number) { }

    /**
     * Returns the data for the given room.
     */
    getRoomData(roomName: string) {
        return this.roomGameData[roomName]
    }

    /**
     * Returns the data for all rooms.
     */
    getAllRoomData() {
        return Object.values(this.roomGameData)
    }

    /**
     * Returns the data for the given room.
     */
    getGameData(roomName: string) {
        return this.getRoomData(roomName).gameData
    }

    /**
     * Returns whether the given room exists.
     */
    roomExists(roomName: string) {
        return this.roomGameData[roomName] !== undefined
    }

    /**
     * Returns whether the maximum number of rooms has been reached.
     */
    maxRoomsReached() {
        return this.getAllRoomData().length >= this.maxRooms
    }

    /**
     * Creates a room with the given name.
     */
    createRoom(roomName: string) {
        console.log(`Creating new room ${roomName}`)
        this.roomGameData[roomName] = this.createRoomData(roomName)
        return true
    }

    /**
     * Returns a new room data object.
     */
    abstract createRoomData(roomName: string): RoomData<TGameData>

    /**
     * If the given room doesn't exist then create it.
     */
    ensureRoomExists(roomName: string) {
        if (!this.roomExists(roomName)) {
            return this.createRoom(roomName)
        }

        return true
    }

    /**
     * Returns the players in the given room.
     */
    getPlayers(roomName: string) {
        return this.getRoomData(roomName)?.players ?? []
    }

    /**
     * Adds the given player to the given room.
     */
    addPlayerToRoom(playerName: string, roomName: string) {
        let roomData = this.getRoomData(roomName)
        return roomData.addPlayer(playerName)
    }

    /**
     * Adds the given player to the given room as a spectator.
     */
    addSpectatorToRoom(playerName: string, roomName: string) {
        let roomData = this.getRoomData(roomName)
        return roomData.addSpectator(playerName)
    }

    /**
     * Removes the given player from the given room.
     */
    removePlayerFromRoom(playerName: string, roomName: string) {
        if (this.roomExists(roomName)) {
            let roomData = this.getRoomData(roomName)
            return roomData.removePlayer(playerName)
        }
        else {
            console.warn(`Tried to remove player ${playerName} from non-existent room ${roomName}!`)
        }

        return true
    }

    /**
     * Removes the given spectator from the given room.
     */
    removeSpectatorFromRoom(playerName: string, roomName: string) {
        if (this.roomExists(roomName)) {
            let roomData = this.getRoomData(roomName)
            return roomData.removeSpectator(playerName)
        }
        else {
            console.warn(`Tried to remove spectator ${playerName} from non-existent room ${roomName}!`)
        }

        return true
    }

    /**
     * Removes the given room.
     */
    removeRoom(roomName: string) {
        delete this.roomGameData[roomName]
        return true
    }

    /**
     * Clears the game data in the given room.
     */
    clear(roomName: string) {
        if (this.roomExists(roomName)) {
            let roomData = this.getRoomData(roomName)
            return roomData.clear()
        }

        return false
    }

    /**
     * Removes the given player from whichever rooms they're in. Returns the names of those rooms.
     */
    kickPlayer(playerName: string) {
        let rooms = []

        for (let room of this.getAllRoomData()) {
            if (room.playerIsPresent(playerName)) {
                let success = room.removePlayer(playerName)
                if (success) {
                    console.log(`Removed player ${playerName} from room ${room.name}`)
                }
                else {
                    console.warn(`Tried to remove player ${playerName} but they were not in the game!`)
                }

                rooms.push(room.name)
            }
        }

        return rooms
    }

    /**
     * Starts a new game in the given room.
     */
    startGame(roomName: string) {
        if (this.roomExists(roomName)) {
            console.log(`Starting new game in room ${roomName}`)

            this.getRoomData(roomName).startGame()
        }
    }
}
