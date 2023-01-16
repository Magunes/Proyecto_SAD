const kafka = require('./kafka')    
const express = require('express')
const { v4: uuidv4 } = require('uuid');

var app = express()    
const producer = kafka.producer()      
app.use(express.urlencoded())

const main = async () => {
   await producer.connect()  

   app.get('/enviar_trabajo', function(req,res,next) {
      res.send(`<form method= "POST" action="/">
      <input type="text" name="url" placeholder="Aquí tu url :)">
      <input type="submit">
      </form>`)
   })

   app.post('/', function(req,res,next){
      var url = JSON.stringify(req.body.url)
      producer.send({
         topic: "topic_prueba",
         messages: [ { key: uuidv4(),value: url } ]
      })
      res.send('OK')
   })

   app.listen(3000, () => {
      console.log('Escuchando')
   })
}

main().catch(error => {
   console.error(error)
   process.exit(1)
})
