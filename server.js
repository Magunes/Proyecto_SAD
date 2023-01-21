const kafka = require('./kafka')    
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const consumer = kafka.consumer({
    groupId: "servers"
})
const producer = kafka.producer()      

var app = express()
app.use(express.urlencoded())

const usuario = Date.now().toString()

const main = async () => {

   await producer.connect()

   app.get('/enviar_trabajo', function(req,res,next) {
      res.send(`
      <form method= "POST" action="/">
      <input type="text" name="url" placeholder="Aquí tu url :)">
      <input type="submit">
      </form>
      <br>
      <form method= "POST" action="/get_trabajo">
      <input type="text" name="codigo" placeholder="Numero de trabajo">
      <input type="submit">
      </form>
      `)
   })

   app.post('/', function(req,res,next){

      const url = JSON.stringify(req.body.url)
      const auth = Date.now().toString().slice(3,13)+usuario

      producer.send({
         topic: "Entrada",
         messages: [ { key: auth, value: url } ]
      })

      res.send('Trabajo enviado, el codigo de trabajo es: '+auth.slice(0,10)+'<br>El usuari es: '+auth.slice(10))
   })

   app.post('/get_trabajo', async function(req,res,next){

      var code = JSON.stringify(req.body.codigo)
      code = code.toString().slice(1,-1)

      await consumer.connect()

      await consumer.subscribe({
         topic: code,
         fromBeginning: true
      })

      await consumer.run({
         eachMessage: async ({ message }) => {
            const result = message.value.toString()
            res.send('El resultado del trabajo es: <br>'+ result)
         }
      })

       //Es necesario desconectar al consumer. antes de que pase a otro codigo

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
      console.error('Failed to gracefully disconnect consumer', e)
   }
   process.exit(1)
})
