import SocketClient from '../src/nodeClient';

const client = new SocketClient({
  endpoint: 'wss://websockets.workwithpact.com/websocket?room=demo'
})
client.on('connect', () => {
  console.log('Connected!')
})
client.on('ping', (data) => {
  console.log('Received ping:', data)
})
client.on('profile', (data) => {
  console.log('Received profile:', data)
})
client.on('close', () => {
  console.log('Disonnected!')
})