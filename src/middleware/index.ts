import * as http from 'http';

export const shareSession = (app) => {
  return (socket, next) => {
    let error = null;
    try {
      const ctx = app.createContext(socket.request, new http.ServerResponse(socket.request));
      socket.session = ctx.session;
      console.log('share');
      return next();
    } catch (err) {
      error = err;
    }
    return next(error);
  }
}


export const verifySocketMessage = (socket, next) => {
  console.log('verify');
  if (!socket.session.accessToken) {
    console.log("no authorization");
    socket.emit('error', "no authorization");
    socket.disconnect();
    return next("no authorization - disconnected");
  }
  return next();
}

export const verifed = (socket, next) => {
  console.log('verifed', socket.session);
  return next();
}