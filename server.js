const kafka = require('./kafka')    
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const consumer = kafka.consumer({
    groupId: "servers"
})
const producer = kafka.producer()      

var app = express()
app.use(express.urlencoded())

//Cambiar a usuario de keycloack
const user = "UsuarioPrueba"
const jobs = new Map()
const jobsResult = new Map()

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
         //res.send('El resultado del trabajo es: <br>'+ result)
      }
   })

   app.get('/index', function(req,res,next) {
      res.send(`
      <form method= "POST" action="/enviar_trabajo">
      <input type="text" name="url" placeholder="URL de git">
      <input type="submit">
      </form>
      <br>
      <form method= "POST" action="/estado_trabajo">
      <input type="text" name="codigo" placeholder="Numero de trabajo">
      <input type="submit">
      </form>
      <br>
      <form method= "POST" action="/lista_trabajo">
      <input type="submit">
      </form>
      `)
   })

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
         <input type="submit">
         </form>`)
   })

   app.post('/estado_trabajo', function(req,res,next){
   })

   app.post('/lista_trabajo', function(req,res,next){
      if(jobs.has(user)){
         var temp = jobs.get(user)
         var toret = "Listado de trabajos del usuario "+user+":<br><br>"
         temp.forEach(function(value){
            toret += "  -"+value+"<br><br>"
         })
         res.send(toret)
      }
      else{
         res.send(`El usuario actual (`+user+`) no ha enviado trabajos
            <br><br>
            <form method= "GET" action="/index">
            <input type="submit">
            </form>`)
      }
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
