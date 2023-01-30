const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const jwt_decode = require('jwt-decode')
const keycloak = require('./config/keycloak-config.js').getKeycloak()
const kafka = require('./kafka')  
const {producer: producer} = require('./server.js')
const {token: token} = require('./server.js')
const groupId= 'servers'
const consumer = kafka.consumer({ groupId })
const admin = kafka.admin()

const jobs = new Map()
const jobsResult = new Map()

function conseguirToken(tokenCodificado){
   var tokenDecodificado = jwt_decode(tokenCodificado, { payload: true })
   return tokenDecodificado
}

function conseguirNickUsuario(tokenDecodificado){
    var nickUsuario = tokenDecodificado.preferred_username
    return nickUsuario
}

router.post('/enviar_trabajo', keycloak.protect(),function(req,res){
    const url = req.body.url
    const token = conseguirToken(req.body.token)
    const user = conseguirNickUsuario(token)
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

router.post('/estado_trabajo', keycloak.protect(), function(req,res){
    const token = conseguirToken(req.body.token)
    const user = conseguirNickUsuario(token)

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

router.post('/lista_trabajo', keycloak.protect(),function(req,res){
    const token = conseguirToken(req.body.token)
    const user = conseguirNickUsuario(token)
    
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

async function conectarProducer(){
   await producer.connect()
}

module.exports = router