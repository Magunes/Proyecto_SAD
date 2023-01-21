const kafka = require('./kafka')
const download = require('download-git-repo')
const {spawn} = require('child_process')
const consumer = kafka.consumer({
   groupId: "workers"
})
const producer = kafka.producer()
const fs = require('fs')

const topic = "Salida"

const main = async () => {
   await producer.connect()
   await consumer.connect()
   await consumer.subscribe({
      topic: "Entrada",
      fromBeginning: true
   })

   await consumer.run({
      eachMessage: async ({ message }) => {
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
   		      console.log(data.toString())
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
   		      messages: [ { value: "El repositorio no ha podido clonarse, asegurate de que es un repositorio publico" } ]
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
      console.error('Failed to gracefully disconnect consumer', e)
   }
   process.exit(1)
})
