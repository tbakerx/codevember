import badge from 'soundcloud-badge'
import desktopOnly from '../desktop-only'
import isMobile from '../is-mobile'
import createErrorPage from '../fatal-error'
import createAnalyser from 'web-audio-analyser'
import canvasLoop from 'canvas-loop'
import css from 'dom-css'
import assign from 'object-assign'

const noop = () => {}
const error = createErrorPage()
const AudioContext = window.AudioContext || window.webkitAudioContext
const id = 'b95f61a90da961736c03f659c03cb0cc'

export default function audioDemo (track, opt, render) {
  if (typeof opt === 'function') {
    render = opt
    opt = {}
  }
  opt = opt || {}
  render = render || noop

  let canvas = opt.canvas
  if (!canvas) {
    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'
    canvas = document.body.appendChild(document.createElement('canvas'))
  }

  const context = canvas.getContext('2d')
  const app = canvasLoop(canvas, assign({
    scale: window.devicePixelRatio
  }, opt))

  if (isMobile() || !AudioContext) {
    desktopOnly()
  } else {
    badge({
      client_id: id,
      song: track,
      dark: opt.dark !== false,
      getFonts: true
    }, function (err, src, data, div) {
      if (err) return error(err)
      play(src, data, div)
    })
  }

  return app

  function play (src, data, div) {
    const audio = new window.Audio()
    audio.crossOrigin = 'Anonymous'
    audio.src = src
    audio.play()

    const analyser = createAnalyser(audio, { stereo: false })
    app.emit('ready', { analyser, audio, data, div })

    if (opt.center) {
      app.once('tick', resize)
      app.on('resize', resize)
    }

    app.on('tick', tick)
    app.start()

    function tick (dt) {
      const [width, height] = app.shape

      context.save()
      context.scale(app.scale, app.scale)
      context.clearRect(0, 0, width, height)
      app.emit('render', context, analyser, dt)
      context.restore()
    }

    function resize () {
      const [width, height] = app.shape
      css(canvas, {
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2
      })
    }
  }
}
