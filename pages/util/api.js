const host = "https://9e889079.ngrok.io/"
import * as socketIO from 'socket.io-client';

const parseData = (res) => {
  return new Promise((rs, rj) => {
    let result;
    try {
      result = JSON.parse(res)
    } catch (err) {
      console.log(err, res);
      return rj(err);
    }
    if (result.err) return rj(result.err);
    rs(result)
  })
}


const Socket = function() {
  const socket = {}
  let io = socketIO(host);
  io.on('connect', () => {
    console.log('socket connect')
  });
  io.on('service', (ctx) => {
    console.log('socket message', ctx)
  });
  io.on('disconnect', (reason) => {
    console.log('socket disconnect', reason);
    io.removeAllListeners();
    io.disconnect();
    io.close();
    io = null;
  });

  io.on('error', (err) => {
    console.log('socket error', err)
    io.disconnect();
  })

  socket.io = io;
  return socket;
}

const API = {

  fetch : (path, method = 'GET', body = {}) => {
    console.log('call api fetch', method, host + path);
    let res;
    const options = method === 'GET' ? {} : 
    {
      body: JSON.stringify(body)
    }
    return fetch(host + path, {method, ...options})
    .then((res)=>res.text())
    .then((json)=>parseData(json))
    .catch(err=>console.log(err));
  },
  socket : null,
};

export {API, Socket};
