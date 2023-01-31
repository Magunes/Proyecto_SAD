package component

#Artifact: {
  ref: name:  "server"

  description: {

    srv: {
      server: {
        restapi: { protocol: "http", port: 3000 }
      }
      client: {
        evalclient: { protocol: "http" }
      }
    }

    config: {
      parameter: {
        appconfig: {
          endpoint: "http://localhost:3000/index"
        }
      }
      resource: {}
    }

    // Applies to the whole role
    size: {
      bandwidth: { size: 10, unit: "M" }
    }

    probe: frontend: {
      liveness: {
        protocol: http : { port: srv.server.restapi.port, path: "/health" }
        startupGraceWindow: { unit: "ms", duration: 30000, probe: true }
        frequency: "medium"
        timeout: 30000  // msec
      }
      readiness: {
        protocol: http : { port: srv.server.restapi.port, path: "/health" }
        frequency: "medium"
        timeout: 30000 // msec
      }
    }

    code: {

      frontend: {
        name: "frontend"

        image: {
          hub: { name: "", secret: "" }
          tag: "crimide/server"
        }

        mapping: {
          filesystem: {
            "/config/config.json": {
              data: value: config.parameter.appconfig
              format: "json"
            }
          }
          env: {
            CONFIG_FILE: value: "/config/config.json"
            HTTP_SERVER_PORT_ENV: value: "\(srv.server.restapi.port)"
            KAFKA_BROKER_SERVER: kafka:9092
            KEYCLOAK_CLIENTID: app_microservicios
            KEYCLOAK_REALM: master
            KEYCLOAK_SECRET_KEY: S2dC2206Lvv09M7CMxlQ41nM2vkcR5Xm
            KEYCLOAK_BROKER: keycloak:8080
          }
        }

        // Applies to each containr
        size: {
          memory: { size: 100, unit: "M" }
          mincpu: 100
          cpu: { size: 200, unit: "m" }
        }
      }
    }
  }
}
