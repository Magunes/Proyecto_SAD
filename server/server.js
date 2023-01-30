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
//const admin = kafka.admin()
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

//Cambiar a usuario de keycloack
const user = "user1"
const jobs = new Map()
const jobsResult = new Map()
var token = ""

const main = async () => {
   /*await admin.connect()
   await admin.createTopics({
      waitForLeaders: true,
      topic: [{topic: process.env.TOPIC_COLA_SALIDA}, 
         {topic: process.env.TOPIC_COLA_ENTRADA}
      ]
   })*/
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
      //token = req.header('Authorization')
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
/*
   app.post('/enviar_trabajo', function(req,res,next){

      const url = JSON.stringify(req.body.url)
      const auth = Date.now().toString().slice(3,13)+user

      producer.send({
         topic: "Entrada",
         messages: [ { key: auth, value: url } ]
      })

      if(jobs.has(user)){
         var temp = jobs.get(user)
         temp.push(auth.slice(0,10))
         jobs.set(user,temp)
      }
      else{
         jobs.set(user,[auth.slice(0,10)])
      }

      res.send('Trabajo enviado, el codigo de trabajo es: '+auth.slice(0,10)
         +'<br>Por parte del usuario: '+auth.slice(10)
         +'<br>Con URL: '+req.body.url+
         `<br><br>
         <form method= "GET" action="/index">
         <input type="submit" value="Volver">
         </form>`)
   })

   app.post('/estado_trabajo', function(req,res,next){
      if(jobs.has(user)){
         var temp = jobs.get(user)
         if(temp.indexOf(req.body.codigo)+1 != 0){
            if(jobsResult.has(req.body.codigo)){
               var toret = "El resultado del trabajo con codigo: "+req.body.codigo+" es: <br><br>"+jobsResult.get(req.body.codigo)+
                  `<br><br>
                  <form method= "GET" action="/index">
                  <input type="submit" value="Volver">
                  </form>`
               res.send(toret)
            }
            else{
               res.send(`El trabajo con codigo: `+req.body.codigo+`, está siendo procesado 
               <br><br>
               <form method= "GET" action="/index">
               <input type="submit" value="Volver">
               </form>`)
            }
         }
         else{
            res.send(`El usuario actual (`+user+`) no tiene trabajos con el codigo: `+req.body.codigo+` 
               <br><br>
               <form method= "GET" action="/index">
               <input type="submit" value="Volver">
               </form>`)
         }
      }
      else{
         res.send(`El usuario actual (`+user+`) no ha enviado trabajos
            <br><br>
            <form method= "GET" action="/index">
            <input type="submit" value="Volver">
            </form>`)
      }
   })

   app.post('/lista_trabajo', function(req,res,next){
      if(jobs.has(user)){
         var temp = jobs.get(user)
         var toret = "Listado de trabajos del usuario "+user+":<br><br>"
         temp.forEach(function(value){
            toret += "  -"+value+"<br><br>"
         })
         toret +=
         `<form method= "GET" action="/index">
         <input type="submit" value="Volver">
         </form>`
         res.send(toret)
      }
      else{
         res.send(`El usuario actual (`+user+`) no ha enviado trabajos
            <br><br>
            <form method= "GET" action="/index">
            <input type="submit" value="Volver">
            </form>`)
      }
   })
*/
   
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