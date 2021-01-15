import { ServerSettings } from "./config/ServerSettings"

import { RoomDataManager } from "./data/RoomDataManager"
import { SocketManager } from "./data/SocketManager"

import { TheGameServer } from "./servers/TheGameServer"

require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "local"}`})

const serverSettings = ServerSettings.readFromEnv()
const socketManager = new SocketManager()
const roomDataManager = new RoomDataManager(serverSettings.maxRooms)

const theGameServer = new TheGameServer(serverSettings, socketManager, roomDataManager)
theGameServer.start()
