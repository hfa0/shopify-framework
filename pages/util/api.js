// @ts-check

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

  let socket = socketIO({
    host,
    forceNew: false,
    autoConnect: false,
    transportOptions: {
      polling: {
        extraHeaders: {
          'x-clientid': 'client-id'
        }
      }
    }
  });

  const close = () => {
    socket.removeAllListeners();
    socket.close();
    socket = null;
    console.log('client socket closed');
  }

  socket.on('connect', () => {
    console.log('client socket connect')
  });

  socket.on('disconnect', (reason) => {
    console.log('client socket disconnect', reason);
    close();
  });

  socket.on('reconnect_failed', () => {
    console.log('client socket reconnect fail');
    close();
  });

  socket.on('error', (err) => {
    console.log('client socket error', err);
    close();
  })

  socket.on('internal_error', (err) => {
    console.log('client socket internal error', err)
  })

  socket.io.reconnectionAttempts(3);
  socket.io.reconnectionDelay(5000);

  socket.open();

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
  socket : Socket(),
};

export default API
