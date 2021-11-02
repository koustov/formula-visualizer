import React, { useState, useEffect } from 'react'
import styles from './styles.module.css'
import { parseFormula } from 'js-formula-parser'
export const FormulaVisualizer = ({
  formula,
  parameters,
  xrange = [],
  points,
  lineColor = '#787878',
  lineWidth = 2,
  graphpaper = true,
  onMouseMove,
  onLineHover,
  onProcessingStart,
  onProcessingEnd,
  onWheel,
  zoom = 100,
  gridSize = 10
}) => {
  const [finalList, setFinalList] = useState([])
  const [imgData, setImageData] = useState(false)
  let linePath = []

  let iData = false
  let xCenter = -1
  let yCenter = -1
  useEffect(() => {
    setTimeout(() => {
      if (onProcessingStart) {
        onProcessingStart()
      }
      let fList = []
      if (points) {
        fList = points
      } else if (formula) {
        fList = getLinePath()
      }
      setFinalList(fList)
      linePath = fList
      sceleCanvas(zoom || 100)
      resizeContainer()
      prepareImageData()
    }, 100)
  }, [
    zoom,
    points,
    formula,
    lineColor,
    lineWidth,
    parameters,
    xrange,
    gridSize
  ])

  const getLinePath = () => {
    linePath = []
    if (xrange && xrange.length) {
      var canvas = document.getElementById(`board`)
      var container = document.getElementById(`graph`)

      xCenter = container.clientWidth / 2
      yCenter = container.clientHeight / 2
      for (var ix = 0; ix < xrange.length; ix++) {
        var x = xrange[ix]

        let formulaExpr = formula

        const vals = { ...parameters }
        vals.x = x
        Object.keys(vals).forEach((p) => {
          var find = p
          var re = new RegExp(find, 'g')
          formulaExpr = formulaExpr.replace(re, vals[p])
        })
        var y = parseFormula(formulaExpr)
        // x = x + xCenter
        // const y = yCenter - isNaN(yv) ? 0 : yv
        const rx = x + xCenter,
          ry = yCenter - y
        if (
          rx > container.clientWidth ||
          rx < 0 ||
          ry > container.clientHeight ||
          ry < 0
        ) {
          // break;
        } else {
          linePath.push({ x: x, y: y })
        }
      }
    }
    return linePath
  }

  const prepareImageData = () => {
    if (imgData === false) {
      var canvas = document.querySelector(`#board`)
      var ctx = canvas.getContext('2d')
      iData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setImageData(iData)
    }
  }

  const draw = (obj, values) => {
    initialization()
    var canvas = document.getElementById('board')
    var ctx = canvas.getContext('2d')
    var canvas_back = document.getElementById('board_back')
    var ctx_back = canvas_back.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx_back.clearRect(0, 0, canvas_back.width, canvas_back.height)
    drawPaper(ctx_back, canvas_back)
    onRerender(ctx, canvas, obj, values)
  }

  const initialization = () => {
    var canvasO = document.querySelector(`#overlay`),
      ctxO = canvasO.getContext('2d')
    // xCenter = canvasO.width / 2
    // yCenter = canvasO.height / 2
    canvasO.addEventListener(
      'mousemove',
      (e) => {
        const x = e.offsetX
        const y = e.offsetY
        const curX = x - xCenter
        const curY = yCenter - y
        if (iData) {
          // locate index of current pixel
          let indexO = (y * iData.width + x) * 4

          let red = iData.data[indexO]
          let green = iData.data[indexO + 1]
          ctxO.clearRect(0, 0, canvasO.width, canvasO.height)
          if (red && green) {
            ctxO.strokeStyle = '#000000'
            ctxO.lineWidth = 1

            const point = getCoordinateOnPath(e.offsetX, e.offsetY)
            if (point) {
              ctxO.fillStyle = '#454545'
              ctxO.setLineDash([5, 5])
              ctxO.beginPath()
              ctxO.moveTo(point.x, point.y)
              ctxO.font = '20px Arial'
              ctxO.fillText(
                `X: ${point.x - xCenter}, Y: ${yCenter - point.y}`,
                e.offsetX + 10,
                e.offsetY - 5
              )

              ctxO.lineTo(point.x, yCenter)
              ctxO.stroke()

              ctxO.beginPath()
              ctxO.moveTo(point.x, point.y)
              ctxO.lineTo(xCenter, point.y)

              ctxO.setLineDash([1])
              ctxO.moveTo(point.x, point.y)
              ctxO.arc(point.x, point.y, 4, 0, Math.PI * 2)
              ctxO.fillStyle = 'red'
              ctxO.fill()
              ctxO.stroke()
              if (onLineHover) {
                onLineHover(e.offsetX, e.offsetY)
              }
            }
          }
        }
        if (onMouseMove) {
          onMouseMove(e)
        }
      },
      { passive: true }
    )

    canvasO.addEventListener(
      'wheel',
      (e) => {
        if (onWheel) {
          onWheel(e)
        }
      },
      { passive: true }
    )
    window.addEventListener(
      'resize',
      (e) => {
        resizeContainer()
      },
      { passive: true }
    )
  }

  const sceleCanvas = (newScale) => {
    var canvas = document.getElementById('board')
    var ctx = canvas.getContext('2d')
    ctx.scale(newScale / 100, newScale / 100)

    canvas = document.getElementById('board_back')
    if (canvas) {
      ctx = canvas.getContext('2d')
      ctx.scale(newScale / 100, newScale / 100)
    }

    canvas = document.getElementById('overlay')
    ctx = canvas.getContext('2d')
    ctx.scale(newScale / 100, newScale / 100)
  }

  const getCoordinateOnPath = (inX, inY) => {
    for (var i = 0; i < linePath.length; i++) {
      const o = linePath[i]
      if (
        o.x >= xCenter - inX - 2 &&
        o.x <= xCenter - inX - +2 &&
        o.y >= inY - yCenter - 2 &&
        o.y <= inY - yCenter + 2
      ) {
        return {
          x: xCenter - o.x,
          y: yCenter + o.y
        }
      }
    }
    return null
  }
  const drawOnCanvas = (ctx, canvas, formulaobj, values) => {
    // xCenter = canvas.width / 2
    // yCenter = canvas.height / 2
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth

    const drawline = (list) => {
      if (list.length < 1) {
        return
      }
      var pLocationX = list[0].x + xCenter
      var pLocationY = yCenter - list[0].y
      ctx.moveTo(0, 0)
      list.forEach((item) => {
        ctx.beginPath()
        ctx.moveTo(pLocationX, pLocationY)
        ctx.lineTo(item.x + xCenter, yCenter - item.y)
        console.log(
          `Prev Point : ${pLocationX},${pLocationY} | new Point${item.x},${item.y}`
        )
        pLocationX = item.x + xCenter
        pLocationY = yCenter - item.y
        ctx.stroke()
      })
    }

    drawline(linePath)
    if (onProcessingEnd) {
      onProcessingEnd()
    }
  }

  const drawPaper = (ctx, canvas) => {
    const canvas_width = canvas.width
    const canvas_height = canvas.height
    // xCenter = canvas_width / 2
    // yCenter = canvas_height / 2

    //  Other grid lines
    // X-Axis
    let yppos = yCenter
    let ynpos = yCenter
    var xlineIndex = 1
    while (yppos > 0 && ynpos < canvas_height) {
      if (xlineIndex % 5 === 0) {
        ctx.lineWidth = 2
      } else {
        ctx.lineWidth = 1
      }

      ctx.beginPath()
      ctx.strokeStyle = '#9eccaf'
      // Positive
      yppos = yppos - gridSize
      ctx.moveTo(0, yppos)
      ctx.lineTo(canvas_width, yppos)
      ctx.stroke()

      // Negative
      ctx.beginPath()
      ctx.strokeStyle = '#9eccaf'
      ynpos = ynpos + gridSize
      ctx.moveTo(0, ynpos)
      ctx.lineTo(canvas_width, ynpos)
      ctx.stroke()
      xlineIndex = xlineIndex + 1
    }

    // Y-Axis
    let xppos = xCenter
    let xnpos = xCenter
    let ylineIndex = 1
    while (xnpos > 0 && xppos < canvas_width) {
      if (ylineIndex % 5 === 0) {
        ctx.lineWidth = 2
      } else {
        ctx.lineWidth = 1
      }

      ctx.beginPath()
      ctx.strokeStyle = '#9eccaf'
      // Positive
      xppos = xppos + gridSize
      ctx.moveTo(xppos, 0)
      ctx.lineTo(xppos, canvas_width)
      ctx.stroke()

      // Negative
      ctx.beginPath()
      ctx.strokeStyle = '#9eccaf'
      xnpos = xnpos - gridSize
      ctx.moveTo(xnpos, 0)
      ctx.lineTo(xnpos, canvas_width)
      ctx.stroke()
      ylineIndex = ylineIndex + 1
    }

    // Main axis
    // X-Axis
    ctx.lineWidth = 5
    ctx.moveTo(0, yCenter)
    ctx.lineTo(canvas_width, yCenter)
    ctx.stroke()
    // Y-Axis
    ctx.moveTo(xCenter, 0)
    ctx.lineTo(xCenter, canvas_height)
    ctx.stroke()
  }

  const onRerender = (ctx, canvas, obj, values) => {
    drawOnCanvas(ctx, canvas, obj, values)
  }

  const getInnerHeight = (elm, h) => {
    var computed = getComputedStyle(elm),
      padding =
        parseInt(h ? computed.paddingTop : computed.paddingLeft) +
        parseInt(h ? computed.paddingBottom : computed.paddingRight)

    return h ? elm.clientHeight - padding : elm.clientWidth - padding
  }
  const resizeContainer = (formulaobj, values) => {
    setTimeout(() => {
      var canvas = document.getElementById('board')
      var canvas_back = document.getElementById('board_back')
      var canvas_overlay = document.getElementById('overlay')

      const container = document.getElementById('graph')
      if (container) {
        const height = getInnerHeight(container, true)
        const width = getInnerHeight(container, false)
        canvas.height = height
        canvas.width = width
        canvas_back.height = height
        canvas_back.width = width
        canvas_overlay.height = height
        canvas_overlay.width = width
        draw(formulaobj, values)
        prepareImageData()
      }
    }, 1)
  }

  return (
    <div className={styles['graph-wrapper']}>
      <div id='graph' className={styles.graph}>
        {graphpaper ? <canvas id={`board_back`} /> : null}
        <canvas id={`board`} />
        <canvas id={`overlay`} />
      </div>
    </div>
  )
}
