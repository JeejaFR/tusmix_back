module.exports = (io) => {
    io.on("connection", (socket) => {
      console.log("Nouvelle connexion utilisateur");
  
      socket.on("joinRoom", (roomCode, username, callback) => {
        const room = io.sockets.adapter.rooms.get(roomCode);
  
        if (room) {
            socket.data.username = username;
    
            socket.join(roomCode);
    
            const playersInRoom = Array.from(room).map((socketId) => {
                const clientSocket = io.sockets.sockets.get(socketId);
                return clientSocket?.data.username || "Anonyme";
            });
    
            io.to(roomCode).emit("roomPlayers", playersInRoom);

            callback({ success: true, playersInRoom });
        } else {
            callback({ success: false, message: "La room n'existe pas" });
        }
      });
  
      socket.on("createRoom", (username, callback)  => {
        const roomCode = Math.random().toString(36).substring(2, 15);
        socket.data.username = username;
        socket.join(roomCode);
        const room = io.sockets.adapter.rooms.get(roomCode);
        const playersInRoom = Array.from(room).map((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId);
            return clientSocket?.data.username || "Anonyme";
        });
        io.to(roomCode).emit("roomPlayers", playersInRoom);
        callback({ success: true, roomCode, playersInRoom });
      });
  
      socket.on("leaveRoom", (roomCode, isCreatorLeaving, callback) => {
        if(isCreatorLeaving){
            const room = io.sockets.adapter.rooms.get(roomCode);
            if(room){
                for (const socketId of room) {
                    const socketToLeave = io.sockets.sockets.get(socketId);
                    if (socketToLeave) {
                        io.emit('kickPlayer');
                        socketToLeave.leave(roomCode);
                    }
                }
                const playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
                io.to(roomCode).emit("roomPlayers", playersInRoom);
            }
        }else{
            socket.leave(roomCode);
        }
        const playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
        io.to(roomCode).emit("roomPlayers", playersInRoom);
        callback();
      });
  
      socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté");
      });
    });
  };
  