import React, { useEffect, useRef } from 'react'

const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dotsNum = 200
    let radius = 1
    let fillStyle = 'rgba(255,111,97,0.5)'
    let lineWidth = radius * 2
    let connection = 120
    let followLength = 80
    let mouseX: number | null = null
    let mouseY: number | null = null
    let dots: Dot[] = []

    canvas.width = width
    canvas.height = height

    class Dot {
      x: number
      y: number
      speedX: number
      speedY: number
      follow: boolean

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.speedX = Math.random() * 0.6 - 0.3
        this.speedY = Math.random() * 0.6 - 0.3
        this.follow = false
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      }

      move() {
        if (this.x >= width || this.x <= 0) this.speedX = -this.speedX
        if (this.y >= height || this.y <= 0) this.speedY = -this.speedY
        this.x += this.speedX
        this.y += this.speedY
        if (this.speedX >= 1) this.speedX--
        if (this.speedX <= -1) this.speedX++
        if (this.speedY >= 1) this.speedY--
        if (this.speedY <= -1) this.speedY++
        this.correct()
        this.connectMouse()
        this.draw()
      }

      correct() {
        if (mouseX === null || mouseY === null) return
        let dx = mouseX - this.x
        let dy = mouseY - this.y
        const dist = Math.sqrt(dx ** 2 + dy ** 2)
        if (dist <= followLength) {
          this.follow = true
        } else if (this.follow && dist <= followLength + 8) {
          const proportion = followLength / dist
          dx *= proportion
          dy *= proportion
          this.x = mouseX - dx
          this.y = mouseY - dy
        } else {
          this.follow = false
        }
      }

      connectMouse() {
        if (mouseX === null || mouseY === null) return
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const dist = Math.sqrt(dx ** 2 + dy ** 2)
        if (dist <= connection) {
          const opacity = (1 - dist / connection) * 0.5
          ctx.strokeStyle = `rgba(255,111,97,${opacity})`
          ctx.beginPath()
          ctx.moveTo(this.x, this.y)
          ctx.lineTo(mouseX, mouseY)
          ctx.stroke()
          ctx.closePath()
        }
      }

      elastic() {
        if (mouseX === null || mouseY === null) return
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const dist = Math.sqrt(dx ** 2 + dy ** 2)
        if (dist >= connection) return
        const rate = 1 - dist / connection
        this.speedX = 40 * rate * -dx / dist
        this.speedY = 40 * rate * -dy / dist
      }
    }

    const initDots = () => {
      ctx.fillStyle = fillStyle
      ctx.lineWidth = lineWidth
      dots = []
      for (let i = 0; i < dotsNum; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        const dot = new Dot(x, y)
        dot.draw()
        dots.push(dot)
      }
    }

    const moveDots = () => {
      ctx.clearRect(0, 0, width, height)
      dots.forEach(dot => dot.move())
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d = Math.sqrt((dots[i].x - dots[j].x) ** 2 + (dots[i].y - dots[j].y) ** 2)
          if (d <= connection) {
            const opacity = (1 - d / connection) * 0.5
            ctx.strokeStyle = `rgba(255,111,97,${opacity})`
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.stroke()
            ctx.closePath()
          }
        }
      }
      animationRef.current = requestAnimationFrame(moveDots)
    }

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      initDots()
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onMouseOut = () => {
      mouseX = null
      mouseY = null
    }

    const onClick = () => {
      dots.forEach(dot => dot.elastic())
    }

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseout', onMouseOut)
    window.addEventListener('click', onClick)

    initDots()
    moveDots()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        pointerEvents: 'none'
      }}
    />
  )
}

export default StarryBackground
