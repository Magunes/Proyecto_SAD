const { Kafka } = require('kafkajs')
const brokers = [process.env.KAFKA_BROKER_SERVER]
const clientId = process.env.KEYCLOAK_CLIENTID
const username = ''
const password = ''

const sasl = username && password ? { username, password, mechanism: 'plain' } : null
const ssl = !!sasl

const kafka = new Kafka({ clientId, brokers })

module.exports = kafka