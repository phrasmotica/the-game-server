import { SocketManager } from "game-server-lib"

import { ServerSettings } from "./config/ServerSettings"

import { TheGameManager } from "./games/TheGameManager"

import { TheGameServer } from "./servers/TheGameServer"

require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "local"}`})

const serverSettings = ServerSettings.readFromEnv()
const socketManager = new SocketManager()
const gameManager = new TheGameManager(serverSettings.maxRooms)

const theGameServer = new TheGameServer(serverSettings, socketManager, gameManager)
theGameServer.start()
