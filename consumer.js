const kafka = require('./kafka')
const download = require('download-git-repo')
const {spawn} = require('child_process')
const consumer = kafka.consumer({
   groupId: "workers"
})
const producer = kafka.producer()
const fs = require('fs')


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
      const topic = "Salida"

      //hay que cambiar el directorio test en funcion del valor que venga de la peticion
      const control = new Promise(function(resolve) {
         download('direct:'+addr+'.git','test/',{ clone:true },function(err){
            if(fs.existsSync("./test/index.py")){
               resolve(true)
            }
            else{
               resolve(false)
            }
         })
      })

      if(await control){
         //console.log("Clonado correcto: "+addr)

         var process = spawn('python',["./test/index.py"])
         process.stdout.on('data',async function(data){
		      console.log(data.toString())
            await producer.send({
               topic: topic,
               messages: [ { value: data.toString() } ]
            })

		   fs.rmSync("./test/", {recursive: true, force: true})
         })

	   }else{
         //console.log("Error clonado")

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
