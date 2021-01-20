import { RoomData } from "game-server-lib"
import { GameData } from "the-game-lib"

import { RoomDataManager } from "../data/RoomDataManager"

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
