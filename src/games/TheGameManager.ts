import { RoomData, RoomDataManager } from "game-server-lib"
import { GameData } from "the-game-lib"

/**
 * Class for managing a game of The Game.
 */
export class TheGameManager extends RoomDataManager<GameData> {
    constructor(maxRooms: number) {
        super(maxRooms)
    }

    /**
     * Returns a new room data object for The Game.
     */
    createRoomData(roomName: string): RoomData<GameData> {
        return new RoomData(
            roomName,
            [],
            [],
            GameData.default()
        )
    }
}
