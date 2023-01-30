const kafka = require('./kafka')    
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const session = require('express-session')
const { setMaxIdleHTTPParsers } = require('http')
const consumer = kafka.consumer({
    groupId: "servers"
})
var memoryStore = new session.MemoryStore();
const producer = kafka.producer()      
const keycloak = require('./config/keycloak-config.js').initKeycloak(memoryStore)


var app = express()
app.use(session({
   secret: 'some secret',
   resave: false,
   saveUninitialized: true,
   store: memoryStore
 }));

app.use(express.urlencoded())
app.use(keycloak.middleware({
   logout: '/logout',
   admin: '/'
 }));

const user = "user1"
const jobs = new Map()
const jobsResult = new Map()
var token = ""

const main = async () => {
   await producer.connect()
   await consumer.connect()
   await consumer.subscribe({
      topic: "Salida",
      fromBeginning: true
   })

   await consumer.run({
      eachMessage: async ({ message }) => {
         const result = message.value.toString()
         const auth = message.key.toString().slice(0,10)

         jobsResult.set(auth,result)
      }
   })

   const testController = require('./test-controller.js')
   app.use('/test', testController)

   app.get('/index', function(req,res,next) {
      res.send(`
      <h2>Sistema de procesado de trabajos</h2>

      <form method= "POST" action="/test/enviar_trabajo">
         <label>Enviar trabajo</label><br>
         <input type="text" name="url" placeholder="URL del repositorio GIT">
         <input type="text" name="token" placeholder="Tu token">
         <input type="submit" value="Enviar Trabajo">
      </form>

      <br>

      <form method= "POST" action="/test/estado_trabajo">
         <label>Comprobar estado de trabajo</label><br>
         <input type="text" name="codigo" placeholder="Codigo de trabajo">
         <input type="text" name="token" placeholder="Tu token">
         <input type="submit" value="Comprobar trabajo">
      </form>

      <br>

      <form method= "POST" action="/test/lista_trabajo">
         <label>Listado de trabajos enviados</label><br>
         <input type="text" name="token" placeholder="Tu token">
         <input type="submit" value="Comprobar listado">
      </form>
      `)
   })
   
   app.listen(3000, () => {
      console.log('Escuchando')
   })
}

main().catch(async error => {
   console.error(error)
   try {
      await consumer.disconnect()
   } catch (e) {
      console.error('Fallo al intentar desconectar el consumidor', e)
   }
   process.exit(1)
})

module.exports = { producer, token }