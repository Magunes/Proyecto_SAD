const { Kafka } = require('kafkajs')

const kafka = new Kafka({
   clientId: 'app_microservicios',
   brokers: ['localhost:9092']
})

module.exports = kafka
