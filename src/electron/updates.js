// Native
import path from 'path'

// Packages
import {autoUpdater} from 'electron'
import ms from 'ms'
import exists from 'path-exists'

// Ours
import {version} from '../../package'
import {error as showError} from './dialogs'
import notify from './notify'
import * as binaryUtils from './utils/binary'

const platform = process.platform ? 'osx' : process.platform === 'darwin'
const feedURL = 'https://now-auto-updates.now.sh/update/' + platform

const updateBinary = async () => {
  const binaryDir = binaryUtils.getPath()
  const fullPath = path.join(binaryDir, 'now')

  if (!await exists(fullPath)) {
    return
  }

  const currentRemote = await binaryUtils.getURL()
  console.log(currentRemote)
}

export default () => {
  setInterval(updateBinary, ms('5s'))

  const test = true

  if (test === true) {
    return
  }

  autoUpdater.on('error', err => console.error(err))

  try {
    autoUpdater.setFeedURL(feedURL + '/' + version)
  } catch (err) {
    showError('Auto updated could not set feed URL', err)
  }

  setInterval(autoUpdater.checkForUpdates, ms('30m'))

  autoUpdater.on('update-downloaded', () => notify({
    title: 'Update downloaded',
    body: 'Restart the application to enjoy the changes!'
  }))
}
