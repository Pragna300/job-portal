module.exports = function (io) {
  const adminNs = io.of('/admin');
  const candidateNs = io.of('/candidate');

  // Middleware could be added here for JWT auth on sockets if needed
  // adminNs.use(...)

  adminNs.on('connection', (socket) => {
    console.log('Admin connected to proctoring namespace:', socket.id);

    // Join a specific room if we want to monitor a specific candidate closely
    socket.on('monitor-candidate', (candidateId) => {
      socket.join(`monitor-${candidateId}`);
      console.log(`Admin ${socket.id} monitoring candidate ${candidateId}`);
    });

    // WebRTC Signaling: Admin to Candidate
    socket.on('webrtc-offer', ({ candidateId, offer }) => {
      candidateNs.to(`candidate-${candidateId}`).emit('webrtc-offer', { offer, adminId: socket.id });
    });

    socket.on('webrtc-ice-candidate', ({ candidateId, candidate }) => {
      candidateNs.to(`candidate-${candidateId}`).emit('webrtc-ice-candidate', { candidate, adminId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('Admin disconnected:', socket.id);
    });
  });

  candidateNs.on('connection', (socket) => {
    console.log('Candidate connected to proctoring namespace:', socket.id);

    // Identify candidate and join their specific room
    socket.on('join-session', ({ candidateId }) => {
      socket.join(`candidate-${candidateId}`);
      console.log(`Candidate ${candidateId} joined their room (${socket.id})`);
    });

    // WebRTC Signaling: Candidate to Admin
    socket.on('webrtc-answer', ({ adminId, answer, candidateId }) => {
      adminNs.to(adminId).emit('webrtc-answer', { answer, candidateId });
    });

    socket.on('webrtc-ice-candidate', ({ adminId, candidate, candidateId }) => {
      adminNs.to(adminId).emit('webrtc-ice-candidate', { candidate, candidateId });
    });

    socket.on('disconnect', () => {
      console.log('Candidate disconnected:', socket.id);
    });
  });
};
