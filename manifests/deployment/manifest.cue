package deployment

import (
  s ".../service:service"
)

#Deployment: {
  name: "FaaSdDep"
  artifact: s.#Artifact
  config: {
    // Assign the values to the service configuration parameters
    parameter: {
      language: "en"
    }
    resource: {}
    scale: detail: {
      frontend: hsize: 1
      worker: hsize: 2
    }
    resilience: 0
  }
}