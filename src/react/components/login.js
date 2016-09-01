// Packages
import {stringify as stringifyQuery} from 'querystring'
import React from 'react'
import autoSizeInput from 'autosize-input'
import Config from 'electron-config'
import {remote} from 'electron'

// Ours
import error from '../utils/error'

const getVerificationToken = async (url, email) => {
  const os = remote.require('os')

  const body = JSON.stringify({
    email,
    tokenName: 'Now on ' + os.hostname()
  })

  const apiURL = `${url}/now/registration`

  const res = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(body).length
    },
    body
  })

  if (res.status !== 200) {
    error('Verification error')
    return
  }

  const content = await res.json()
  return content.token
}

const verify = async (url, email, token) => {
  const query = {
    email,
    token
  }

  const apiURL = url + '/now/registration/verify?' + stringifyQuery(query)
  const res = await fetch(apiURL)

  const body = await res.json()
  return body.token
}

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default React.createClass({
  getInitialState() {
    return {
      value: '',
      focus: false,
      classes: []
    }
  },
  handleChange(event) {
    this.setState({
      value: event.target.value
    })
  },
  async tryLogin(email) {
    const apiURL = 'https://api.zeit.co'
    const verificationToken = await getVerificationToken(apiURL, email)

    if (!verificationToken) {
      return
    }

    let final

    do {
      await sleep(2500)

      try {
        final = await verify(apiURL, email, verificationToken)
      } catch (err) {}

      console.log('Waiting for token...')
    } while (!final)

    const config = new Config()

    // Save user information to consistant configuration
    config.set('now.user.email', email)
    config.set('now.user.token', final)

    const currentWindow = remote.getCurrentWindow()

    if (currentWindow) {
      currentWindow.focus()
    }
  },
  componentWillUnmount() {
    if (!this.apiRequest) {
      return
    }

    this.apiRequest.abort()
  },
  async handleKey(event) {
    this.setState({
      classes: []
    })

    const isEnter = event.keyCode === 13
    const initialValue = this.getInitialState().value

    if (initialValue === this.state.value && !isEnter) {
      this.setState({
        value: ''
      })
    }

    if (!isEnter || this.state.value === '') {
      return
    }

    const value = this.state.value

    if (!/^.+@.+\..+$/.test(value)) {
      this.setState({
        classes: [
          'error'
        ]
      })

      console.log('Not a valid email')
      return
    }

    // Don't trigger login if placeholder defined as value
    if (value === initialValue) {
      return
    }

    window.loginText.innerHTML = `We sent an email to <strong>${value}</strong>.<br>Please follow the link within it.`

    this.setState({
      classes: [
        'verifying'
      ]
    })

    try {
      await this.tryLogin(value)
    } catch (err) {
      error('Not able to retrieve verification token')
      console.error(err)
    }
  },
  toggleFocus() {
    this.setState({
      focus: !this.state.focus
    })

    // If input is empty, bring placeholder back
    if (this.state.focus && this.state.value === '') {
      this.setState({
        value: this.getInitialState().value
      })
    }
  },
  componentDidMount() {
    const input = this.loginInput

    autoSizeInput(input, {
      minWidth: false
    })
  },
  render() {
    const classes = this.state.classes

    const inputProps = {
      type: 'email',
      value: this.state.value,
      placeholder: 'you@youremail.com',
      onChange: this.handleChange,
      onKeyDown: this.handleKey,
      onFocus: this.toggleFocus,
      onBlur: this.toggleFocus,
      ref: c => {
        window.loginInputElement = c
        window.loginInput = this

        this.loginInput = c
      },
      className: classes.join(' ')
    }

    return <input {...inputProps}/>
  }
})
