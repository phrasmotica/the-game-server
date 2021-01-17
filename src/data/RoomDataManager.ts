import { RuleSet } from "the-game-lib/dist/game/RuleSet"

import { GameStartResult } from "the-game-lib/dist/models/GameData"
import { RoomData } from "the-game-lib/dist/models/RoomData"

import { VoteResult } from "the-game-lib/dist/voting/Vote"

import { IRoomDataManager } from "./rooms/IRoomDataManager"

/**
 * Represents a map of room names to room data.
 */
type RoomDataMap = {
    [roomName: string] : RoomData
}

/**
 * Class for managing room data on the server.
 */
export class RoomDataManager implements IRoomDataManager {
    /**
     * Room data indexed by room name.
     */
    roomGameData: RoomDataMap = {}

    /**
     * The maximum number of rooms allowed.
     */
    maxRooms: number

    /**
     * Constructor.
     */
    constructor(maxRooms: number) {
        this.maxRooms = maxRooms
    }

    /**
     * Returns the data for the given room.
     */
    getRoomData(roomName: string) {
        return this.roomGameData[roomName]
    }

    /**
     * Returns the game data for the given room.
     */
    getGameData(roomName: string) {
        return this.roomGameData[roomName].gameData
    }

    /**
     * Returns the data for all rooms.
     */
    getAllRoomData() {
        return Object.values(this.roomGameData)
    }

    /**
     * Returns the players in the given room.
     */
    getPlayers(roomName: string) {
        return this.getGameData(roomName)?.players ?? []
    }

    /**
     * Returns whether the given room exists.
     */
    roomExists(roomName: string) {
        return this.roomGameData[roomName] !== undefined
    }

    /**
     * Creates a room with the given name.
     */
    createRoom(roomName: string) {
        console.log(`Creating new room ${roomName}`)
        return this.initialise(roomName)
    }

    /**
     * Creates a room with the given name.
     */
    initialise(roomName: string) {
        this.roomGameData[roomName] = RoomData.named(roomName)
        return true
    }

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
     * Returns whether the maximum number of rooms has been reached.
     */
    maxRoomsReached() {
        return this.getAllRoomData().length >= this.maxRooms
    }

    /**
     * Ends the turn in the given room.
     */
    onTurnEnd(roomName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            gameData.replenish()
            gameData.endTurn()
            let nextPlayer = gameData.nextPlayer()
            console.log(`It is now player ${nextPlayer}'s turn in room ${roomName}`)
        }
        else {
            console.warn(`Tried to end turn in non-existent room ${roomName}!`)
        }
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
     * Removes the given room.
     */
    removeRoom(roomName: string) {
        delete this.roomGameData[roomName]
        return true
    }

    /**
     * Removes the given player from whichever rooms they're in. Returns the names of those rooms.
     */
    removePlayer(playerName: string) {
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
     * Returns the starting player in the given room.
     */
    getStartingPlayer(roomName: string) {
        return this.getGameData(roomName)?.startingPlayer
    }

    /**
     * Adds a starting player vote from the given player in the given room.
     */
    addStartingPlayerVote(roomName: string, playerName: string, startingPlayerName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            return gameData.addStartingPlayerVote(playerName, startingPlayerName)
        }
        else {
            console.warn(`Tried to add starting player vote to non-existent room ${roomName}!`)
        }

        return VoteResult.NonExistent
    }

    /**
     * Removes a starting player vote from the given player in the given room.
     */
    removeStartingPlayerVote(roomName: string, playerName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            return gameData.removeStartingPlayerVote(playerName)
        }
        else {
            console.warn(`Tried to remove starting player vote from non-existent room ${roomName}!`)
        }

        return VoteResult.NonExistent
    }

    /**
     * Returns whether the starting player vote is complete.
     */
    isStartingPlayerVoteComplete(roomName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            return gameData.isStartingPlayerVoteComplete()
        }

        return false
    }

    /**
     * Closes the starting player vote and sets the starting player accordingly in the given room.
     */
    setStartingPlayer(roomName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            return gameData.setStartingPlayer()
        }

        return GameStartResult.NonExistent
    }

    /**
     * Sets the card to play in the given room.
     */
    setCardToPlay(roomName: string, cardToPlay: number | undefined) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            gameData.setCardToPlay(cardToPlay)
        }
        else {
            console.warn(`Tried to set card to play in non-existent room ${roomName}!`)
        }
    }

    /**
     * Sorts the given player's hand in the given room.
     */
    sortHand(roomName: string, playerName: string) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            gameData.sortHand(playerName)
        }
        else {
            console.warn(`Tried to sort hand in non-existent room ${roomName}!`)
        }
    }

    /**
     * Plays the given card on the given pile from the given player's hand in the given room.
     */
    playCard(roomName: string, player: string, card: number, pileIndex: number) {
        if (this.roomExists(roomName)) {
            let gameData = this.getGameData(roomName)
            gameData.playCard(player, card, pileIndex)

            if (gameData.isWon()) {
                console.log(`Game is won in room ${roomName}!`)
            }
            else {
                console.log(`Game is not yet won in room ${roomName}.`)
            }

            if (gameData.isLost()) {
                console.log(`Game is lost in room ${roomName}!`)
            }
            else {
                console.log(`Game is not yet lost in room ${roomName}.`)
            }
        }
        else {
            console.warn(`Tried to play card in non-existent room ${roomName}!`)
        }
    }

    /**
     * Removes the given player from the given room.
     */
    removeFromRoom(playerName: string, roomName: string) {
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
     * Sets the rule set for the game in the given room.
     */
    setRuleSet(roomName: string, ruleSet: RuleSet) {
        if (this.roomExists(roomName)) {
            this.getGameData(roomName).setRuleSet(ruleSet)
        }
        else {
            console.error(`Tried to set rule set for non-existent room "${roomName}"!`)
        }
    }
}
