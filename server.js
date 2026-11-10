const express=require('express');
const http=require('http');
const crypto=require('crypto');
const {Server}=require('socket.io');
const {legalMoves,applyMove,snapshot}=require('./ludo-rules');
const app=express(),server=http.createServer(app);
const allowed=process.env.ALLOWED_ORIGIN||'*';
const io=new Server(server,{cors:{origin:"*"}});
app.use(express.static('public'));
app.get('/health',(req,res)=>res.json({ok:true,service:'Ludo Online International',rooms:rooms.size,waiting:queue.length}));
const rooms=new Map(),queue=[],COLORS=['red','blue','green','yellow'];
const makeCode=()=>crypto.randomBytes(3).toString('hex').toUpperCase();
function err(s,msg){s.emit('errorMsg',msg)}
function emitRoom(r){r.players.forEach(p=>io.to(p.id).emit('roomUpdate',{code:r.code,started:r.started,hostIndex:0,isHost:p.id===r.host,players:r.players.map(x=>({id:x.id,name:x.name,color:x.color}))}));}
function leave(s){
  for(const [code,r] of rooms){
    const i=r.players.findIndex(p=>p.id===s.id);if(i<0)continue;
    r.players.splice(i,1);
    if(!r.players.length)rooms.delete(code);
    else {if(r.host===s.id)r.host=r.players[0].id;if(r.turn>=r.players.length)r.turn=0;r.pendingRoll=null;r.legalMoves=[];emitRoom(r);if(r.started)broadcastState(r);}
    break;
  }
  const q=queue.indexOf(s.id);if(q>=0)queue.splice(q,1);
}
function player(s,name){return {id:s.id,name:String(name||'Player').slice(0,18),color:COLORS[0],tokens:[-1,-1,-1,-1]};}
function add(s,r,name){const p=player(s,name);p.color=COLORS[r.players.length];r.players.push(p);s.join(r.code);s.data.room=r.code;emitRoom(r);}
function broadcastState(r){const st=snapshot(r);r.players.forEach(p=>io.to(p.id).emit('gameState',st));}
function newRoom(host){let code=makeCode();while(rooms.has(code))code=makeCode();const r={code,host,players:[],started:false,turn:0,pendingRoll:null,legalMoves:[]};rooms.set(code,r);return r;}
function start(r){r.started=true;r.turn=0;r.pendingRoll=null;r.legalMoves=[];r.players.forEach(p=>p.tokens=[-1,-1,-1,-1]);broadcastState(r);}
io.on('connection',s=>{
 s.on('createRoom',d=>{leave(s);const r=newRoom(s.id);add(s,r,d?.name);});
 s.on('joinRoom',d=>{leave(s);const r=rooms.get(String(d?.code||'').toUpperCase());if(!r)return err(s,'Kode room tidak ditemukan.');if(r.started||r.players.length>=4)return err(s,'Room sudah penuh atau pertandingan dimulai.');add(s,r,d?.name);});
 s.on('quickMatch',d=>{
  leave(s);let waiting=null;
  while(queue.length&&!waiting){const id=queue.shift();const candidate=io.sockets.sockets.get(id);if(candidate)waiting=candidate;}
  if(!waiting){queue.push(s.id);s.data.quickName=String(d?.name||'Player').slice(0,18);s.emit('notice','Mencari lawan…');return;}
  const r=newRoom(waiting.id);add(waiting,r,waiting.data.quickName);add(s,r,d?.name);start(r);
 });
 s.on('startGame',()=>{const r=rooms.get(s.data.room);if(!r||r.host!==s.id)return err(s,'Hanya host yang bisa memulai.');if(r.players.length<2)return err(s,'Minimal 2 pemain.');if(r.started)return;start(r);});
 s.on('rollDice',()=>{
  const r=rooms.get(s.data.room);if(!r||!r.started)return;
  if(r.players[r.turn]?.id!==s.id)return err(s,'Belum giliran kamu.');
  if(r.pendingRoll!==null)return err(s,'Pilih pion terlebih dahulu.');
  r.pendingRoll=1+Math.floor(Math.random()*6);
  r.legalMoves=legalMoves(r.turn,r.players[r.turn].tokens,r.pendingRoll);
  r.players.forEach(p=>io.to(p.id).emit('rollResult',{value:r.pendingRoll,playerName:r.players[r.turn].name,legalMoves:r.legalMoves}));
  if(!r.legalMoves.length){const roll=r.pendingRoll;r.pendingRoll=null;r.turn=(r.turn+1)%r.players.length;if(roll===6)r.turn=(r.turn-1+r.players.length)%r.players.length;broadcastState(r);}
  else broadcastState(r);
 });
 s.on('move',d=>{
  const r=rooms.get(s.data.room);if(!r||!r.started||r.players[r.turn]?.id!==s.id||r.pendingRoll===null)return;
  const idx=Number(d?.token);if(!r.legalMoves.includes(idx))return err(s,'Pilih pion yang disorot dan gerakannya sah.');
  const roll=r.pendingRoll;
  try{
   const result=applyMove(r.players,r.turn,idx,roll);
   r.pendingRoll=null;r.legalMoves=[];
   if(result.won){r.players.forEach(p=>io.to(p.id).emit('gameOver',{winner:r.players[r.turn].name}));r.started=false;}
   else if(!result.extraTurn)r.turn=(r.turn+1)%r.players.length;
   r.players.forEach(p=>io.to(p.id).emit('notice',result.captured.length?'Pion lawan tertangkap!':result.won?'Pemenang: '+r.players[r.turn].name:''));
   broadcastState(r);
  }catch(e){err(s,e.message);}
 });
 s.on('leaveRoom',()=>{leave(s);s.data.room=null;});
 s.on('disconnect',()=>leave(s));
});
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log('Ludo server listening on '+port));
