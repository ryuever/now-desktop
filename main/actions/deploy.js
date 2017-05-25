// Native
const path = require('path')

// Packages
const pathExists = require('path-exists')
const pathType = require('path-type')

// Utilities
const upload = require('../utils/deployment/upload')

const determineType = async item => {
  // If it's a file, it can only be of static nature
  if (await pathType.file(item)) {
    return 'static'
  }

  const dockerfilePath = path.join(item, 'Dockerfile')

  // If a docker file exists, it can only be a docker deployment
  // A pure node deployment never needs a Dockerfile
  if (await pathExists(dockerfilePath)) {
    return 'docker'
  }

  const packagePath = path.join(item, 'package.json')

  // If it's not a docker deployment and it contains
  // a package.json file, it can only be a node deployment
  if (await pathExists(packagePath)) {
    return 'node'
  }

  // If it's not a file and doesn't contain any sort of
  // metafile, it's always of static nature
  return 'static'
}

module.exports = async item => {
  if (!await pathExists(item)) {
    throw new Error("Path doesn't exist!")
  }

  const deploymentType = await determineType(item)
  await upload(item, deploymentType === 'static')
}
