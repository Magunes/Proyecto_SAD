const kafka = require('../server/kafka')
const download = require('download-git-repo')
const {spawn} = require('child_process')
const fs = require('fs')
const consumer = kafka.consumer({
   groupId: "workers"
})
const producer = kafka.producer()

const topic = process.env.TOPIC_COLA_SALIDA

const main = async () => {
   await producer.connect()
   await consumer.connect()
   await consumer.subscribe({
      topic: process.env.TOPIC_COLA_ENTRADA,
      fromBeginning: true
   })

   await consumer.run({
      eachMessage: async ({ message }) => {
         console.log("Trabajo recibido")
         const addr = message.value.toString().slice(1,-1)
         const auth = message.key.toString()

         const location = "./"+auth+"/"
         
         const control = new Promise(function(resolve) {
            download('direct:'+addr+'.git',location,{ clone:true },function(err){
               if(fs.existsSync(location)){
                  resolve(true)
               }
               else{
                  resolve(false)
               }
            })
         })

         if(await control){
            var process = spawn('python',[location+"index.py"])
            process.stdout.on('data',async function(data){
               await producer.send({
                  topic: topic,
                  messages: [ { key: auth, value: data.toString() } ]
               })

               fs.rmSync(location, {recursive: true, force: true})
            })
   	   }

         else{
   	      await producer.send({
   	         topic: topic,
   		      messages: [ { key: auth, value: "El repositorio no ha podido clonarse, asegurate de que es un repositorio publico" } ]
   	      })
   	   }
      }
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
