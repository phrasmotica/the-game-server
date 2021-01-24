import express from "express"
import http from "http"
import socketIo, { Server, Socket } from "socket.io"

import { GameServer, Message, RoomDataManager, RoomWith, SocketManager } from "game-server-lib"

import { Card, GameData, GameStartResult, RuleSet, VoteResult } from "the-game-lib"

import { ServerSettings } from "../config/ServerSettings"

/**
 * Represents a server for The Game.
 */
export class TheGameServer extends GameServer<ServerSettings> {
    /**
     * The underlying socket IO server.
     */
    protected server: http.Server

    /**
     * The underlying socket IO server.
     */
    protected io: Server

    /**
     * List of rooms that should persist.
     */
    private readonly roomRetentionList: string[]

    /**
     * Constructor.
     */
    constructor(
        serverSettings: ServerSettings,
        protected socketManager: SocketManager,
        private roomDataManager: RoomDataManager<GameData>
    ) {
        super(serverSettings)
        this.server = this.createHttpServer()
        this.io = this.createSocketIOServer()
        this.roomRetentionList = [...serverSettings.roomNames]
    }

    /**
     * Creates the HTTP server.
     */
    protected createHttpServer() {
        const app = express()

        app.get("/", (req, res) => {
            res.send("<h1>Welcome to the server!</h1>")
        })

        return http.createServer(app)
    }

    /**
     * Creates the socket IO server.
     */
    protected createSocketIOServer() {
        const io = socketIo(this.server)

        io.on("connection", (socket: Socket) => {
            socket.on("joinServer", (playerName: string) => this.joinServer(socket, playerName))

            socket.on("allPlayersData", (playerName: string) => this.allPlayersData(socket, playerName))

            socket.on("allRoomData", (playerName: string) => this.allRoomData(socket, playerName))

            socket.on("createRoom", (roomName: string) => this.createRoom(socket, roomName))

            socket.on("joinRoom", (req: RoomWith<string>) => this.joinRoom(socket, req))

            socket.on("spectateRoom", (req: RoomWith<string>) => this.spectateRoom(socket, req))

            socket.on("setRuleSet", (req: RoomWith<RuleSet>) => this.setRuleSet(req))

            socket.on("startGame", (roomName: string) => this.startGame(roomName))

            socket.on("addVoteForStartingPlayer", (req: RoomWith<[string, string]>) => this.addVoteForStartingPlayer(req))

            socket.on("removeVoteForStartingPlayer", (req: RoomWith<string>) => this.removeVoteForStartingPlayer(req))

            socket.on("sortHand", (req: RoomWith<string>) => this.sortHand(req))

            socket.on("setCardToPlay", (req: RoomWith<Card | undefined>) => this.setCardToPlay(req))

            socket.on("playCard", (req: RoomWith<[string, Card, number]>) => this.playCard(req))

            socket.on("mulligan", (req: RoomWith<[number, string, boolean]>) => this.mulligan(req))

            socket.on("endTurn", (req: RoomWith<[boolean, boolean]>) => this.endTurn(req))

            socket.on("leaveGame", (req: RoomWith<string>) => this.leaveGame(socket, req))

            socket.on("stopSpectating", (req: RoomWith<string>) => this.stopSpectating(socket, req))

            socket.on("leaveRoom", (req: RoomWith<string>) => this.leaveRoom(socket, req))

            socket.on("disconnect", () => this.disconnect(socket))
        })

        return io
    }

    /**
     * Starts the server.
     */
    start() {
        this.serverSettings.roomNames.forEach(n => this.roomDataManager.ensureRoomExists(n))

        const port = this.serverSettings.port
        const hostName = this.serverSettings.hostName
        this.server.listen(port, () => console.log(`Listening on ${hostName} port ${port}`))
    }

    /**
     * Sends the data for all players to the clients.
     */
    private sendAllPlayersData() {
        this.io.emit("allPlayersData", this.socketManager.getAllPlayersData())
    }

    /**
     * Creates a room data message.
     */
    private createRoomDataMessage(roomName: string) {
        return Message.info(this.roomDataManager.getRoomData(roomName))
    }

    /**
     * Sends the data for the given room to the clients.
     */
    private sendRoomData(roomName: string) {
        let message = this.createRoomDataMessage(roomName)
        this.io.in(roomName).emit("roomData", message)
        this.io.emit("roomData", message)
    }

    /**
     * Sends the data for removing the given room to the clients.
     */
    private sendRemoveRoomData(roomName: string) {
        this.io.emit("removeRoomData", roomName)
    }

    /**
     * Returns the players in the given room.
     */
    private getPlayersInRoom(roomName: string) {
        var roomData = this.roomDataManager.getRoomData(roomName)
        return roomData.players
    }

    /**
     * Returns the spectators in the given room.
     */
    private getSpectatorsInRoom(roomName: string) {
        var roomData = this.roomDataManager.getRoomData(roomName)
        return roomData.spectators
    }

    /**
     * Cleans up the given room.
     */
    private cleanRoom(roomName: string) {
        let clientsInRoom = this.getPlayersInRoom(roomName)
        let roomIsEmpty = clientsInRoom.length <= 0

        if (roomIsEmpty) {
            let spectatorsInRoom = this.getSpectatorsInRoom(roomName)
            for (let spectator of spectatorsInRoom) {
                console.log(`Kicking spectator ${spectator} from room ${roomName}`)
                this.socketManager.getSocket(spectator)?.emit("kick")
            }

            this.roomDataManager.clear(roomName)
            this.roomDataManager.getGameData(roomName).setRuleSet(RuleSet.default())

            let shouldRemoveRoom = !this.roomRetentionList.includes(roomName)
            if (shouldRemoveRoom) {
                let success = this.roomDataManager.removeRoom(roomName)
                if (success) {
                    console.log(`Removing room ${roomName}`)
                }
                else {
                    console.warn(`Failed to remove room ${roomName}`)
                }
            }
        }
    }

    /**
     * Handler for a player joining the server from the given socket.
     */
    private joinServer(socket: Socket, playerName: string) {
        this.socketManager.setPlayerData(socket, playerName)
        console.log(`Player ${playerName} joined the server!`)

        socket.emit("joinServerResult", true)
        this.sendAllPlayersData()
    }

    /**
     * Handler for a player requesting data for all players.
     */
    private allPlayersData(socket: Socket, playerName: string) {
        console.log(`Player ${playerName} refreshed player data.`)

        socket.emit("allPlayersData", this.socketManager.getAllPlayersData())
    }

    /**
     * Handler for a player requesting data for all rooms.
     */
    private allRoomData(socket: Socket, playerName: string) {
        console.log(`Player ${playerName} refreshed room data.`)

        socket.emit("allRoomData", this.roomDataManager.getAllRoomData())
    }

    /**
     * Handler for a player creating a room with the given name.
     */
    private createRoom(socket: Socket, roomName: string) {
        // returns whether the given room name is valid
        const roomNameIsValid = (roomName: string | undefined) => {
            return roomName !== undefined && roomName.length > 0
        }

        if (!roomNameIsValid(roomName)) {
            console.warn(`Cannot create room with invalid name '${roomName}'!`)
            return
        }

        if (this.roomDataManager.maxRoomsReached()) {
            console.warn(`Cannot create room '${roomName}' because the room limit has been reached!`)
            return
        }

        if (this.roomDataManager.roomExists(roomName)) {
            console.warn(`Cannot create room '${roomName}' because it already exists!`)
            return
        }

        let success = this.roomDataManager.createRoom(roomName)
        socket.emit("createRoomResult", success)

        if (success) {
            this.sendRoomData(roomName)
        }
        else {
            console.error(`Could not create room '${roomName}'!`)
        }
    }

    /**
     * Handler for a player joining a room.
     */
    private joinRoom(socket: Socket, req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        if (!this.roomDataManager.roomExists(roomName)) {
            console.warn(`Player ${playerName} could not join non-existent room ${roomName}!`)
            return
        }

        let roomData = this.roomDataManager.getRoomData(roomName)

        if (roomData.players.length >= this.serverSettings.maxPlayersPerRoom) {
            console.warn(`Player ${playerName} could not join room ${roomName} because it is full!`)
            return
        }

        if (roomData.isInProgress()) {
            console.warn(`Player ${playerName} could not join room ${roomName} because a game is in progress!`)
            return
        }

        socket.join(roomName)
        let success = this.roomDataManager.addPlayerToRoom(playerName, roomName)
        socket.emit("joinRoomResult", success)

        if (success) {
            console.log(`Player ${playerName} joined room ${roomName}.`)
            this.sendRoomData(roomName)
        }
        else {
            console.error(`Player ${playerName} could not join room ${roomName}!`)
        }
    }

    /**
     * Handler for a player joining a room as a spectator.
     */
    private spectateRoom(socket: Socket, req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        if (!this.roomDataManager.roomExists(roomName)) {
            console.warn(`Player ${playerName} could not spectate non-existent room ${roomName}!`)
            return
        }

        let roomData = this.roomDataManager.getRoomData(roomName)

        if (roomData.spectators.length >= this.serverSettings.maxSpectatorsPerRoom) {
            console.warn(`Player ${playerName} could not spectate room ${roomName} because it is full!`)
            return
        }

        if (roomData.isInProgress()) {
            console.warn(`Player ${playerName} could not spectate room ${roomName} because a game is in progress!`)
            return
        }

        socket.join(roomName)
        let success = this.roomDataManager.addSpectatorToRoom(playerName, roomName)
        socket.emit("spectateRoomResult", success)

        if (success) {
            console.log(`Player ${playerName} joined room ${roomName} as a spectator.`)
            this.sendRoomData(roomName)
        }
        else {
            console.error(`Player ${playerName} could not spectate room ${roomName}!`)
        }
    }

    /**
     * Handler for a player changing the rule set in the given room.
     */
    private setRuleSet(req: RoomWith<RuleSet>) {
        let roomName = req.roomName
        let ruleSet = RuleSet.from(req.data)
        this.roomDataManager.getGameData(roomName).setRuleSet(ruleSet)

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player starting the game in the given room.
     */
    private startGame(roomName: string) {
        this.roomDataManager.startGame(roomName)

        this.io.in(roomName).emit("gameStarted", this.createRoomDataMessage(roomName))
        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player adding a vote for the starting player in the given room.
     */
    private addVoteForStartingPlayer(req: RoomWith<[string, string]>) {
        let roomName = req.roomName
        let playerName = req.data[0]
        let startingPlayerName = req.data[1]

        let gameData = this.roomDataManager.getGameData(roomName)
        let voteResult = gameData.addStartingPlayerVote(playerName, startingPlayerName)
        switch (voteResult) {
            case VoteResult.Success:
                console.log(`Player ${playerName} voted for ${startingPlayerName} to start game in room ${roomName}.`)
                break;

            case VoteResult.Denied:
                console.log(`Player ${playerName} was not allowed to vote for a starting player in room ${roomName}.`)
                break;

            case VoteResult.Closed:
                console.log(`Player ${playerName} could not cast their starting player vote in room ${roomName} because the vote is closed!`)
                break;
        }

        let voteComplete = gameData.isStartingPlayerVoteComplete()
        if (voteComplete) {
            let gameStartResult = gameData.setStartingPlayer()
            switch (gameStartResult) {
                case GameStartResult.Success:
                    let startingPlayer = gameData.startingPlayer
                    console.log(`Player ${startingPlayer} has been voted to start the game in room ${roomName}.`)
                    break;

                case GameStartResult.NoStartingPlayer:
                    console.log(`Could not set starting player in room ${roomName} as no player has won the vote!`)
                    break;
            }
        }

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player removing their vote for the starting player in the given room.
     */
    private removeVoteForStartingPlayer(req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        let gameData = this.roomDataManager.getGameData(roomName)
        let voteResult = gameData.removeStartingPlayerVote(playerName)
        switch (voteResult) {
            case VoteResult.Success:
                console.log(`Player ${playerName} removed their starting player vote in room ${roomName}.`)
                break;

            case VoteResult.Denied:
                console.log(`Player ${playerName} was not allowed to remove a vote for a starting player in room ${roomName}.`)
                break;

            case VoteResult.Closed:
                console.log(`Player ${playerName} could not remove their starting player vote in room ${roomName} because the vote is closed!`)
                break;
        }

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player sorting their hand.
     */
    private sortHand(req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        this.roomDataManager.getGameData(roomName).sortHand(playerName)

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player setting the card to play.
     */
    private setCardToPlay(res: RoomWith<Card | undefined>) {
        let roomName = res.roomName
        let cardToPlay = res.data

        this.roomDataManager.getGameData(roomName).setCardToPlay(cardToPlay)

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player playing a card from their hand.
     */
    private playCard(req: RoomWith<[string, Card, number]>) {
        let roomName = req.roomName
        let player = req.data[0]
        let card = req.data[1]
        let pileIndex = req.data[2]

        this.roomDataManager.getGameData(roomName).playCard(player, card, pileIndex)

        this.sendRoomData(roomName)
    }

    /**
     * Handler for the player returning the top card from the given pile to
     * their hand.
     */
    private mulligan(req: RoomWith<[number, string, boolean]>) {
        let roomName = req.roomName
        let pileIndex = req.data[0]
        let player = req.data[1]
        let autoSortHand = req.data[2]

        let gameData = this.roomDataManager.getGameData(roomName)

        if (gameData.canMulligan()) {
            let result = gameData.mulligan(pileIndex, player)
            if (result.success) {
                console.log(`Player ${player} mulliganed ${result.card!.value}, which they played on ${result.previousCard!.value}.`)
            }
            else {
                console.log(`Player ${player} failed to take a mulligan!`)
            }

            if (autoSortHand) {
                gameData.sortHand(player)
            }
        }
        else {
            console.log(`Player ${player} cannot mulligan in room ${roomName} because the limit has been reached!`)
        }

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player ending their turn in the given room.
     */
    private endTurn(req: RoomWith<[boolean, boolean]>) {
        let roomName = req.roomName

        let gameData = this.roomDataManager.getGameData(roomName)
        let currentPlayer = gameData.getCurrentPlayer()!

        let passTurn = req.data[0]
        if (passTurn) {
            gameData.passTurn(currentPlayer)
            console.log(`Player ${currentPlayer} passed their turn in room ${roomName}`)
        }
        else {
            gameData.clearPassedTurn(currentPlayer)
            console.log(`Player ${currentPlayer} cleared their passed turn in room ${roomName}`)
        }

        gameData.replenish()

        let autoSortHand = req.data[1]
        if (autoSortHand) {
            gameData.sortHand(currentPlayer)
        }

        gameData.endTurn()

        let nextPlayer = gameData.nextPlayer()
        console.log(`It is now ${nextPlayer}'s turn in room ${roomName}`)

        gameData.startTurn()

        this.sendRoomData(roomName)
    }

    /**
     * Handler for a player leaving a game in the given room.
     */
    private leaveGame(socket: Socket, req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        let success = this.roomDataManager.removePlayerFromRoom(playerName, roomName)
        socket.emit("leaveGameResult", success)
        socket.leave(roomName)

        this.cleanRoom(roomName)

        if (success) {
            console.log(`Player ${playerName} left game ${roomName}.`)

            if (this.roomDataManager.roomExists(roomName)) {
                this.sendRoomData(roomName)
            }
            else {
                this.sendRemoveRoomData(roomName)
            }
        }
        else {
            console.error(`Player ${playerName} could not leave game ${roomName}!`)
        }
    }

    /**
     * Handler for a spectator leaving a game in the given room.
     */
    private stopSpectating(socket: Socket, req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        let success = this.roomDataManager.removeSpectatorFromRoom(playerName, roomName)
        socket.emit("leaveRoomResult", success)
        socket.leave(roomName)

        this.cleanRoom(roomName)

        if (success) {
            console.log(`Spectator ${playerName} left room ${roomName}.`)

            if (this.roomDataManager.roomExists(roomName)) {
                this.sendRoomData(roomName)
            }
            else {
                this.sendRemoveRoomData(roomName)
            }
        }
        else {
            console.error(`Spectator ${playerName} could not leave room ${roomName}!`)
        }
    }

    /**
     * Handler for a player leaving the given room.
     */
    private leaveRoom(socket: Socket, req: RoomWith<string>) {
        let roomName = req.roomName
        let playerName = req.data

        let success = this.roomDataManager.removePlayerFromRoom(playerName, roomName)
        socket.emit("leaveRoomResult", success)
        socket.leave(roomName)

        this.cleanRoom(roomName)

        if (success) {
            console.log(`Player ${playerName} left room ${roomName}.`)

            if (this.roomDataManager.roomExists(roomName)) {
                this.sendRoomData(roomName)
            }
            else {
                this.sendRemoveRoomData(roomName)
            }
        }
        else {
            console.error(`Player ${playerName} could not leave room ${roomName}!`)
        }
    }

    /**
     * Handler for a player disconnecting from the server.
     */
    private disconnect(socket: Socket) {
        let playerName = this.socketManager.getPlayerData(socket.id)?.name
        if (playerName !== undefined) {
            let roomsEvicted = this.roomDataManager.kickPlayer(playerName)
            for (let roomName of roomsEvicted) {
                this.cleanRoom(roomName)
                this.sendRoomData(roomName)
            }

            this.socketManager.removePlayer(socket.id)
            this.sendAllPlayersData()

            console.log(`Player ${playerName} left the server.`)
        }
    }
}
