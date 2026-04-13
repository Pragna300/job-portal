const socketIo = require("socket.io");
const pool = require("../config/db");

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const adminNamespace = io.of("/admin");
  const candidateNamespace = io.of("/candidate");

  // Track active sessions in memory
  const activeSessions = new Map(); // candidateId -> { warningCount, socketId, sessionId }

  // Admin Namespace
  adminNamespace.on("connection", (socket) => {
    // RBAC check could be done via middleware on the namespace
    // For now, we assume only admins connect here

    socket.on("join-admin-panel", () => {
      socket.join("admin-room");
    });

    socket.on("send-warning", async (data) => {
      const { candidateId, message, sessionId } = data;
      const session = activeSessions.get(candidateId) || { warningCount: 0 };
      session.warningCount += 1;
      activeSessions.set(candidateId, session);

      try {
        // Log warning to DB (Feature 10)
        await pool.query(
          "INSERT INTO warnings_log (proctoring_session_id, warning_number, message) VALUES ($1, $2, $3)",
          [sessionId, session.warningCount, message]
        );
        await pool.query(
          "UPDATE proctoring_sessions SET warnings_sent = $1 WHERE id = $2",
          [session.warningCount, sessionId]
        );

        // Notify Candidate (Feature 3)
        candidateNamespace.to(`candidate-${candidateId}`).emit("receive-warning", {
          warningNumber: session.warningCount,
          message
        });

        // Broadcast update to all admins
        adminNamespace.to("admin-room").emit("integrity-score-update", {
          candidateId,
          warningsSent: session.warningCount
        });

        // Auto Termination (Feature 3)
        if (session.warningCount >= 3) {
          candidateNamespace.to(`candidate-${candidateId}`).emit("terminate-interview", {
            reason: "MAX_WARNINGS_EXCEEDED"
          });
          await pool.query(
            "UPDATE proctoring_sessions SET status = 'TERMINATED', end_time = CURRENT_TIMESTAMP, termination_reason = 'MAX_WARNINGS_EXCEEDED' WHERE id = $1",
            [sessionId]
          );
        }
      } catch (err) {
        console.error("Warning Socket Error:", err.message);
      }
    });

    socket.on("terminate-interview", async (data) => {
      // Feature 4: Admin Manual Termination
      candidateNamespace.to(`candidate-${data.candidateId}`).emit("terminate-interview", {
        reason: "ADMIN_TERMINATED"
      });
      try {
        await pool.query(
          "UPDATE proctoring_sessions SET status = 'TERMINATED', end_time = CURRENT_TIMESTAMP, termination_reason = 'ADMIN_TERMINATED' WHERE id = $1",
          [data.sessionId]
        );
      } catch (err) {
        console.error("Manual Termination Socket Error:", err.message);
      }
    });

    socket.on("signal", (data) => {
      console.log(`[Socket] Signaling from Admin to Candidate ${data.to}`);
      candidateNamespace.to(`candidate-${String(data.to)}`).emit("signal", {
        signal: data.signal,
        from: socket.id,
      });
    });

    socket.on("request-stream-handshake", (data) => {
      console.log(`[Socket] Admin Request Handshake for ${data.candidateId}`);
      candidateNamespace.to(`candidate-${String(data.candidateId)}`).emit("request-stream-handshake", {
        adminSocketId: socket.id
      });
    });
  });

  // Candidate Namespace
  candidateNamespace.on("connection", (socket) => {
    socket.on("join-session", (data) => {
      console.log(`[Socket] Candidate ${data.candidateId} joined session ${data.sessionId}`);
      socket.join(`candidate-${data.candidateId}`);
      activeSessions.set(data.candidateId, { warningCount: 0, socketId: socket.id, sessionId: data.sessionId });
      adminNamespace.to("admin-room").emit("candidate-online", { candidateId: data.candidateId });
    });

    socket.on("violation-detected", (data) => {
      adminNamespace.to("admin-room").emit("integrity-score-update", data);
    });

    socket.on("signal", (data) => {
      console.log(`[Socket] Signaling from Candidate ${data.candidateId} to Admin`);
      adminNamespace.to("admin-room").emit("signal", {
        signal: data.signal,
        from: socket.id,
        candidateId: String(data.candidateId),
      });
    });

    socket.on("candidate-ready-to-stream", (data) => {
      console.log(`[Socket] Candidate ${data.candidateId} is READY to stream`);
      adminNamespace.to("admin-room").emit("candidate-ready-to-stream", {
        candidateId: String(data.candidateId)
      });
    });

    socket.on("candidate-disqualified", (data) => {
      // Feature request: "reflect the result in the manager panel directly like he is rejected"
      adminNamespace.to("admin-room").emit("candidate-status-update", {
        candidateId: String(data.candidateId || "self"),
        status: "REJECTED",
        reason: data.reason
      });
    });

    socket.on("disconnect", () => {
      for (const [candidateId, session] of activeSessions.entries()) {
        if (session.socketId === socket.id) {
          activeSessions.delete(candidateId);
          break;
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
