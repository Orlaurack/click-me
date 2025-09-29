import express from "express";
import http from "http";
import { Server } from "socket.io";
import { join, dirname } from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});
const roomUsers = {};

app.use(express.static(join(__dirname, '../dist')));

app.use((req, res) => {
  res.sendFile(join(__dirname, '../dist', 'index.html'));
});

io.on("connection", (socket) => {
	console.log("Nouvel utilisateur connecté");

	socket.on("join-room", (room) => {
		socket.join(room);
		console.log(`Utilisateur rejoint la room: ${room}`);

		roomUsers[room] = roomUsers[room] || new Set();
		roomUsers[room].add(socket.id);

		io.to(room).emit("user-count", roomUsers[room].size);
		socket.emit("system-message", { type: "success", text: "🟢 connecté" });
	});

	socket.on("button-pressed", ({ room, name, sender }) => {
		try {
			io.to(room).emit("play-event", { name, sender });
		} catch (err) {
			console.error(err);
			socket.emit("system-message", { type: "error", text: "🔴 erreur" });
		}
	});

	socket.on("disconnecting", () => {
		for (let room of socket.rooms) {
			if (room === socket.id) continue;
			if (roomUsers[room]) {
				roomUsers[room].delete(socket.id);
				io.to(room).emit("user-count", roomUsers[room].size);
			}
		}
	});

	socket.on("disconnect", () => {
		console.log(`${socket.id} déconnecté`);
	});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
