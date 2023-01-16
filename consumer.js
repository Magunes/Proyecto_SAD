const kafka = require('./kafka')
const download = require('download-git-repo')
const {spawn} = require('child_process')
const consumer = kafka.consumer({
   groupId: "group-id"
})

const main = async () => {
   await consumer.connect()
   await consumer.subscribe({
      topic: "topic_prueba",
      fromBeginning: true
   })

   await consumer.run({
      eachMessage: async ({ message }) => {
	 const addr = message.value.toString().slice(1,-1)
	 //const date = Date.now() ESTO SI NO SE USA UUID EN EL SERVER
         /*download('direct:'+addr+'.git','test/',{ clone:true },function(err){
            console.log(err ? 'Exito al clonar' : 'Error al clonar')
         })*/ //EL GIT DE GONZALO NO FUNCIONA EXACTAMENTE
         var process = spawn('python',["./test/index.py"])
         process.stdout.on('data', function(data){
            console.log(data.toString())
         })
	 process.on('close', (code) => {
	    console.log('Trabajo Finalizado con codigo ${code}')
	 })
	 //Pasar ahora a cola kafka con resultados usando de key el uuid
	 //Consumir de la cola kafka el ID del usuario y ver los trabajos que ha enviado
	      //añadiendo el trabajo actual, esto es posible si existe retain
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
