'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import {
  Calendar, Clock, MapPin, User, Mail, Building2, Briefcase,
  Phone, MessageSquare, Check, X, HelpCircle, Download,
  Share2, Copy, CalendarPlus, Sparkles, BookOpen, Quote,
  CheckCircle2, PartyPopper, ExternalLink, ChevronDown, Star,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

// Event Data
const EVENT_DATA = {
  title: 'Cerimónia de Lançamento Oficial da Obra',
  book: {
    title: 'Manual de Gestão e Redacção de Documentos Oficiais e Pareceres Técnicos',
    author: 'Santos Egas Moniz',
    description: 'Uma obra essencial que se propõe a ser a bússola para gestores, técnicos e profissionais que buscam a excelência na comunicação institucional e o rigor na organização do conhecimento.',
  },
  location: 'ENAPP – Escola Nacional de Administração e Políticas Públicas',
  date: '2026-03-05',
  time: '15:00',
  quote: 'A eficácia de uma instituição começa na precisão das suas palavras e na ordem dos seus registos.',
  intro: 'Num mundo onde a clareza é sinónimo de eficiência e o documento é o testemunho da transparência, convidamo-lo a ser parte de um marco na bibliografia administrativa angolana.',
  cta: 'Sua presença é fundamental para elevar o debate sobre a modernização administrativa em Angola.',
}

interface RSVPForm {
  nome: string; email: string; instituicao: string; cargo: string;
  confirmacao: 'sim' | 'nao' | 'talvez' | ''; telefone: string; mensagem: string;
}

interface RSVPStorage extends RSVPForm {
  id: string; timestamp: string; qrData: string;
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff > 0) setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [targetDate])
  return timeLeft
}

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.08 } } }

export default function BookLaunchInvitation() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showBio, setShowBio] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<RSVPForm>({ nome: '', email: '', instituicao: '', cargo: '', confirmacao: '', telefone: '', mensagem: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RSVPForm, string>>>({})
  const [submitted, setSubmitted] = useState<RSVPStorage | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookLaunchRSVP')
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const qrRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const countdown = useCountdown(`${EVENT_DATA.date}T${EVENT_DATA.time}:00`)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const saved = localStorage.getItem('bookLaunchRSVP')
    if (saved) {
      const data = JSON.parse(saved) as RSVPStorage
      queueMicrotask(() => {
        setIsSubmitted(true)
        setForm({ ...data })
      })
    }
  }, [])

  const { scrollY } = useScroll()
  const yParallax = useTransform(scrollY, [0, 1000], [0, 400])
  const scaleParallax = useTransform(scrollY, [0, 1000], [1.1, 1.2])

  const validate = () => {
    const e: typeof errors = {}
    if (!form.nome.trim()) e.nome = 'Obrigatório'
    if (!form.email.trim()) e.email = 'Obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Inválido'
    if (!form.confirmacao) e.confirmacao = 'Obrigatório'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const qrData = JSON.stringify({
        event: EVENT_DATA.title,
        name: form.nome,
        email: form.email,
        inst: form.instituicao,
        conf: form.confirmacao
      })

      const data: RSVPStorage = {
        ...form,
        id: `RSVP-${Date.now()}`,
        timestamp: new Date().toISOString(),
        qrData
      }

      // Save via API (Secure)
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, qrData })
      })

      if (!response.ok) throw new Error('Falha ao enviar RSVP')

      // Fallback/Local cache
      localStorage.setItem('bookLaunchRSVP', JSON.stringify(data))
      setSubmitted(data)
      setIsSubmitted(true)
      setShowForm(false)
      setShowQR(true) // Show QR code immediately after success

      // Celebration!
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#1e293b']
        })
      }
    } catch (error) {
      console.error("Error submitting RSVP: ", error)
      alert("Erro ao confirmar presença. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = useCallback(() => {
    if (!qrRef.current || !submitted) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = 600
      c.height = 400
      const ctx = c.getContext('2d')!

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 400)
      grad.addColorStop(0, '#0f172a')
      grad.addColorStop(1, '#1e293b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 600, 400)

      // Decorative border
      ctx.strokeStyle = '#f59e0b33'
      ctx.lineWidth = 2
      ctx.strokeRect(20, 20, 560, 360)

      // Title
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('CONVITE OFICIAL', 40, 60)

      // Event Info
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px sans-serif'
      ctx.fillText('Evento de Lançamento', 40, 90)

      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(submitted.nome, 40, 140)

      if (submitted.instituicao) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '14px sans-serif'
        ctx.fillText(submitted.instituicao, 40, 165)
      }

      // Footer
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('05 MAR 2026 | 15:00', 40, 360)

      // QR Code Box
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      // Use manual draw if roundRect is not supported in window but it's 2026 so it is
      // @ts-ignore
      if (ctx.roundRect) ctx.roundRect(400, 100, 160, 160, 10)
      else ctx.rect(400, 100, 160, 160)
      ctx.fill()
      ctx.drawImage(img, 405, 105, 150, 150)

      const a = document.createElement('a')
      const fileName = `convite-${submitted.nome.toLowerCase().replace(/\s+/g, '-')}.png`
      const dataUrl = c.toDataURL('image/png')

      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob)
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        })
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [submitted])

  const fmtDate = (d: Date) => d.toISOString().replace(/[-:.\d{3}]/g, '')
  const addGoogleCal = () => {
    const d1 = new Date(`${EVENT_DATA.date}T${EVENT_DATA.time}`)
    const d2 = new Date(d1.getTime() + 7200000)
    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set('text', EVENT_DATA.title)
    url.searchParams.set('dates', `${fmtDate(d1)}/${fmtDate(d2)}`)
    url.searchParams.set('location', EVENT_DATA.location)
    window.open(url.toString(), '_blank')
  }

  const downloadIcal = () => {
    const d1 = new Date(`${EVENT_DATA.date}T${EVENT_DATA.time}`)
    const d2 = new Date(d1.getTime() + 7200000)
    const ical = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event//EN\nBEGIN:VEVENT\nDTSTART:${fmtDate(d1)}\nDTEND:${fmtDate(d2)}\nSUMMARY:${EVENT_DATA.title}\nLOCATION:${EVENT_DATA.location}\nEND:VEVENT\nEND:VCALENDAR`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ical], { type: 'text/calendar' }))
    a.download = 'evento.ics'
    a.click()
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTxt = `${EVENT_DATA.title} - ${EVENT_DATA.book.title} por ${EVENT_DATA.book.author}. ${EVENT_DATA.date} às ${EVENT_DATA.time}`
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* HERO */}
      <section ref={heroRef} className="relative h-screen min-h-[100dvh] overflow-hidden">
        <motion.div style={{ y: yParallax, scale: scaleParallax }} className="parallax absolute inset-0">
          <Image src="/images/Autor.png" alt="Autor" fill className="object-cover object-top" priority sizes="100vw" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-transparent to-slate-900/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-6 sm:pb-16 px-3 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="max-w-5xl mx-auto w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center sm:justify-start mb-2 sm:mb-4">
              <div className="flex items-center gap-1 bg-amber-500/20 backdrop-blur border border-amber-500/30 px-2.5 sm:px-4 py-1 rounded-full">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-amber-400 text-[9px] sm:text-xs uppercase tracking-wider">Convite Oficial</span>
              </div>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-amber-400 text-[9px] sm:text-xs uppercase tracking-wider text-center sm:text-left mb-1">
              Apresentação e Sessão de Autógrafos da Obra de
            </motion.p>
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xl sm:text-4xl md:text-6xl font-bold text-center sm:text-left mb-2 sm:mb-4">
              {EVENT_DATA.book.author}
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mb-3 sm:mb-6">
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-amber-400 text-[9px] sm:text-xs uppercase">Lançamento do Livro</span>
              </div>
              <h2 className="text-[11px] sm:text-lg md:text-2xl font-semibold text-center sm:text-left leading-snug">
                {EVENT_DATA.book.title}
              </h2>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-2 sm:px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] sm:text-sm font-medium">05 Março 2026</span>
              </div>
              <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-2 sm:px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] sm:text-sm font-medium">15:00</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-2 max-w-xs sm:max-w-none mx-auto sm:mx-0 mb-8 sm:mb-0">
              {isSubmitted ? (
                <Button onClick={() => setShowQR(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 sm:py-6 text-xs sm:text-base rounded-lg sm:rounded-2xl shadow-lg shadow-emerald-500/20 w-full sm:w-auto transition-all">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> Ver Meu Convite
                </Button>
              ) : (
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-3 sm:py-6 text-xs sm:text-base rounded-lg sm:rounded-2xl shadow-lg shadow-amber-500/20 w-full sm:w-auto transition-all">
                  <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> Confirmar Presença
                </Button>
              )}
              <Button onClick={() => setShowShare(true)} variant="outline" className="bg-white/5 border-white/20 backdrop-blur-md hover:bg-white/10 py-3 sm:py-6 text-xs sm:text-base rounded-lg sm:rounded-2xl w-full sm:w-auto transition-all">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> Partilhar
              </Button>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block">
            <button onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center text-slate-400">
              <span className="text-[8px] uppercase tracking-wider">Descobrir</span>
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ChevronDown className="w-4 h-4" /></motion.div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <section id="content" className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative z-10 py-8 sm:py-20 px-3 sm:px-8">
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="max-w-5xl mx-auto">
            <motion.p variants={fadeInUp} className="text-center text-xs sm:text-lg text-slate-300 italic mb-6 sm:mb-12 px-2">"{EVENT_DATA.intro}"</motion.p>
            <motion.div variants={fadeInUp} className="mb-8 sm:mb-16">
              <div className="text-center mb-4 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 border border-amber-500/30 px-3 sm:px-6 py-1.5 sm:py-3 rounded-full mb-2 sm:mb-4">
                  <Star className="w-3 h-3 sm:w-5 sm:h-5 text-amber-400" />
                  <span className="text-amber-400 text-[10px] sm:text-sm uppercase font-semibold">Lançamento Oficial</span>
                </div>
                <h3 className="text-lg sm:text-3xl font-bold mb-1">A Obra</h3>
                <p className="text-slate-400 text-xs sm:text-base px-4">{EVENT_DATA.book.title}</p>
              </div>
              <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-8 py-4 sm:py-8">
                <div className="absolute w-64 h-64 sm:w-[400px] sm:h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.03 }} className="relative group order-2 lg:order-1">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-black/50 blur-xl rounded-full" />
                  <div className="relative w-36 h-48 sm:w-60 sm:h-80 md:w-72 md:h-96 rounded-lg overflow-hidden shadow-2xl border-2 border-amber-500/20">
                    <Image src="/images/capa.png" alt="Capa" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px)144px,(max-width:768px)240px,288px" priority />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-[8px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-full">Capa Oficial</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative flex flex-col items-center text-center order-1 lg:order-2">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-500/40 shadow-lg mb-4 sm:mb-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowBio(true)}>
                    <Image src="/images/Autor.png" alt="Autor" fill className="object-cover object-top" sizes="(max-width:640px)64px,96px" />
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-slate-900 text-[7px] sm:text-[10px] font-bold py-0.5 text-center">AUTOR</div>
                  </div>
                  <p className="text-slate-400 text-[8px] sm:text-xs uppercase mt-1">Escrito por</p>
                  <p className="font-bold text-sm sm:text-lg cursor-pointer hover:text-amber-400 transition-colors" onClick={() => setShowBio(true)}>{EVENT_DATA.book.author}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm mt-2 max-w-xs hidden sm:block line-clamp-2">{EVENT_DATA.book.description}</p>
                  <Button variant="ghost" onClick={() => setShowBio(true)} className="text-amber-400 text-[9px] sm:text-xs h-auto p-0 mt-1 hover:bg-transparent">Ver Biografia</Button>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.03 }} className="relative group order-3">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-black/50 blur-xl rounded-full" />
                  <div className="relative w-36 h-48 sm:w-60 sm:h-80 md:w-72 md:h-96 rounded-lg overflow-hidden shadow-2xl border-2 border-slate-600/30">
                    <Image src="/images/contracapa.png" alt="Contracapa" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px)144px,(max-width:768px)240px,288px" priority />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-600 text-white text-[8px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-full">Contracapa</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative py-4 sm:py-8 px-3 mb-6 sm:mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent rounded-xl" />
              <Quote className="absolute top-2 left-2 w-6 sm:w-8 h-6 sm:h-8 text-amber-500/30" />
              <p className="relative text-center text-sm sm:text-xl italic">"{EVENT_DATA.quote}"</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-slate-800/40 backdrop-blur-xl rounded-2xl sm:rounded-[32px] border border-white/10 p-5 sm:p-12 mb-6 sm:mb-16 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <h3 className="text-base sm:text-2xl font-bold text-center mb-4 sm:mb-8">Detalhes do Evento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
                {[{ icon: MapPin, label: 'Local', value: EVENT_DATA.location }, { icon: Calendar, label: 'Data', value: '05 de Março de 2026' }, { icon: Clock, label: 'Horário', value: '15:00' }].map((item, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-700/50 hover:border-amber-500/30 transition-colors group">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20"><item.icon className="w-4 h-4 text-amber-400" /></div>
                      <span className="text-[9px] sm:text-xs uppercase text-slate-500">{item.label}</span>
                    </div>
                    <p className="text-white text-[10px] sm:text-sm font-medium leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mb-6 sm:mb-8 rounded-xl overflow-hidden h-40 sm:h-64 border border-white/10 shadow-inner">
                <iframe
                  title="Localização do Evento - ENAPP"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3442.385317666497!2d13.2381283!3d-8.8436066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1a51f38e3e4a9e5b%3A0xb3e6a6e8f4a5c6!2sENAPP%20-%20Escola%20Nacional%20de%20Administra%C3%A7%C3%A3o%20e%20Pol%C3%ADticas%20P%C3%BAblicas!5e0!3m2!1spt-PT!2sao!4v1700000000000!5m2!1spt-PT!2sao"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(1) invert(0.9) opacity(0.8)' }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <p className="text-center text-[9px] sm:text-xs uppercase text-slate-500 mb-2 sm:mb-4">Contagem Decrescente</p>
              <div className="grid grid-cols-4 gap-1 sm:gap-3 max-w-[260px] sm:max-w-md mx-auto mb-4 sm:mb-8">
                {[{ v: countdown.days, l: 'Dias' }, { v: countdown.hours, l: 'Horas' }, { v: countdown.minutes, l: 'Min' }, { v: countdown.seconds, l: 'Seg' }].map((t, i) => (
                  <div key={i} className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-lg sm:rounded-xl p-2 sm:p-3 border border-amber-500/20 text-center">
                    <p className="text-lg sm:text-3xl font-bold bg-gradient-to-b from-amber-400 to-amber-600 bg-clip-text text-transparent">{String(t.v).padStart(2, '0')}</p>
                    <p className="text-[7px] sm:text-[10px] uppercase text-slate-500 tracking-wider">{t.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button onClick={addGoogleCal} variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-xs sm:text-sm h-10 sm:h-12"><CalendarPlus className="w-4 h-4 mr-2 text-amber-400" /> Google Agenda</Button>
                <Button onClick={downloadIcal} variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-xs sm:text-sm h-10 sm:h-12"><Download className="w-4 h-4 mr-2 text-slate-400" /> Baixar .iCal</Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-white/5 py-12 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold mb-2">{EVENT_DATA.book.author}</h2>
            <p className="text-slate-500 text-sm max-w-xs">{EVENT_DATA.book.title}</p>
          </div>
          <div className="flex gap-4">
            <Button size="icon" variant="ghost" className="rounded-full bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all"><Share2 className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="rounded-full bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all"><Mail className="w-5 h-5" /></Button>
          </div>
          <p className="text-slate-600 text-xs">© 2026 Santos Egas Moniz. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* FORM DIALOG */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md w-[calc(100%-16px)] bg-slate-900 border-amber-500/20 text-white overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-xl flex items-center gap-2"><CalendarPlus className="w-4 h-4 text-amber-400" />Confirmar Presença</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-sm text-slate-400">Preencha os dados para garantir o seu lugar e gerar o convite digital.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-2 sm:space-y-4 pt-2 sm:pt-4">
            {[{ id: 'nome', label: 'Nome Completo', type: 'text', icon: User, req: true }, { id: 'email', label: 'Email', type: 'email', icon: Mail, req: true }, { id: 'instituicao', label: 'Instituição', type: 'text', icon: Building2, req: false }, { id: 'cargo', label: 'Cargo', type: 'text', icon: Briefcase, req: false }].map(f => (
              <div key={f.id}>
                <Label htmlFor={f.id} className="flex items-center gap-1 text-[10px] sm:text-sm"><f.icon className="w-3 h-3 text-amber-400" />{f.label} {!f.req && <span className="text-[9px] text-slate-500">(opcional)</span>} {f.req && '*'}</Label>
                <Input id={f.id} type={f.type} value={form[f.id as keyof RSVPForm]} onChange={e => setForm({ ...form, [f.id]: e.target.value })} className={cn("bg-slate-800 border-slate-700 h-8 sm:h-10 text-[10px] sm:text-sm", errors[f.id as keyof RSVPForm] && "border-red-500")} />
                {errors[f.id as keyof RSVPForm] && <p className="text-red-400 text-[9px]">{errors[f.id as keyof RSVPForm]}</p>}
              </div>
            ))}
            <div>
              <Label htmlFor="confirmacao" className="flex items-center gap-1 text-[10px] sm:text-sm"><Check className="w-3 h-3 text-amber-400" />Confirmação *</Label>
              <select
                id="confirmacao"
                title="Status de Confirmação"
                value={form.confirmacao}
                onChange={e => setForm({ ...form, confirmacao: e.target.value as RSVPForm['confirmacao'] })}
                className={cn("w-full bg-slate-800 border border-slate-700 h-8 sm:h-10 text-[10px] sm:text-sm rounded-md px-2 focus:ring-1 focus:ring-amber-500 outline-none appearance-none", errors.confirmacao && "border-red-500")}
              >
                <option value="" disabled className="bg-slate-900">Selecionar Opção</option>
                <option value="sim" className="bg-slate-900">Sim</option>
                <option value="talvez" className="bg-slate-900">Talvez</option>
                <option value="nao" className="bg-slate-900">Não</option>
              </select>
              {errors.confirmacao && <p className="text-red-400 text-[9px]">{errors.confirmacao}</p>}
            </div>
            <div>
              <Label htmlFor="telefone" className="flex items-center gap-1 text-[10px] sm:text-sm"><Phone className="w-3 h-3 text-slate-500" />Telefone <span className="text-[9px] text-slate-500">(opcional)</span></Label>
              <Input id="telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="bg-slate-800 border-slate-700 h-8 sm:h-10 text-[10px] sm:text-sm" />
            </div>
            <div>
              <Label htmlFor="mensagem" className="flex items-center gap-1 text-[10px] sm:text-sm"><MessageSquare className="w-3 h-3 text-slate-500" />Mensagem <span className="text-[9px] text-slate-500">(opcional)</span></Label>
              <textarea id="mensagem" value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-[10px] sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-8 sm:h-10 text-xs sm:text-sm">Cancelar</Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 h-8 sm:h-10 text-xs sm:text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR DIALOG */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs w-[calc(100%-16px)] bg-slate-900 border-amber-500/20 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-lg flex items-center justify-center gap-2"><PartyPopper className="w-4 h-4 text-amber-400" />Confirmado!</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-sm text-slate-400">Apresente este QR no evento</DialogDescription>
          </DialogHeader>
          {submitted && (
            <div className="mt-3 space-y-3">
              <div ref={qrRef} className="bg-white p-3 rounded-xl inline-block"><QRCodeSVG value={submitted.qrData} size={160} level="H" /></div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-left">
                <p className="font-semibold text-sm">{submitted.nome}</p>
                {submitted.instituicao && <p className="text-[10px] text-slate-400">{submitted.instituicao}</p>}
                <Badge variant="outline" className={cn("mt-1 text-[10px]", submitted.confirmacao === 'sim' ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400')}>
                  {submitted.confirmacao === 'sim' ? '✓ Confirmado' : '? Talvez'}
                </Badge>
              </div>
              <Button onClick={downloadQR} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-xs sm:text-sm"><Download className="w-4 h-4 mr-2" />Download QR</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SHARE DIALOG */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-xs w-[calc(100%-16px)] bg-slate-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-lg flex items-center gap-2"><Share2 className="w-4 h-4 text-amber-400" />Partilhar</DialogTitle>
            <DialogDescription className="sr-only">Opções de partilha do convite</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareTxt + ' ' + shareUrl)}`, '_blank')} variant="outline" className="w-full border-green-500/30 text-green-400 h-9 sm:h-10 text-xs sm:text-sm justify-start">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </Button>
            <Button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(EVENT_DATA.title)}&body=${encodeURIComponent(shareTxt)}`, '_blank')} variant="outline" className="w-full border-slate-600 text-slate-300 h-9 sm:h-10 text-xs sm:text-sm justify-start"><Mail className="w-4 h-4 mr-2" />Email</Button>
            <Button onClick={copyLink} variant="outline" className={cn("w-full h-9 sm:h-10 text-xs sm:text-sm justify-start", copied ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-slate-600 text-slate-300")}>
              {copied ? <><CheckCircle2 className="w-4 h-4 mr-2" />Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar Link</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BIO DIALOG */}
      <Dialog open={showBio} onOpenChange={setShowBio}>
        <DialogContent className="max-w-md w-[calc(100%-16px)] bg-slate-900 border-amber-500/20 text-white overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <User className="w-5 h-5" /> Sobre o Autor
            </DialogTitle>
            <DialogDescription className="sr-only">Biografia detalhada de Santos Egas Moniz</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-4 border-b border-slate-800 pb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500 shadow-xl">
                <Image src="/images/Autor.png" alt="Autor" fill className="object-cover object-top" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">{EVENT_DATA.book.author}</h3>
                <p className="text-amber-400 text-sm italic">Docente e Consultor</p>
              </div>
            </div>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <p>Santos Egas Moniz é um profissional dedicado à modernização administrativa e ao aperfeiçoamento da comunicação institucional em Angola.</p>
              <p>Com vasta experiência na área de gestão pública, a sua nova obra, <em>"Manual de Gestão e Redacção de Documentos Oficiais e Pareceres Técnicos"</em>, é o resultado de anos de pesquisa e prática direta na administração pública.</p>
              <p>O autor propõe-se a preencher uma lacuna fundamental na bibliografia angolana, oferecendo ferramentas pragmáticas e rigor científico para todos os profissionais que buscam excelência na redacção e organização documental.</p>
            </div>
            <div className="pt-2">
              <Button onClick={() => setShowBio(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white">Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
