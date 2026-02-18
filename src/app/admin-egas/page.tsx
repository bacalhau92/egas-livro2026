'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle2, XCircle, HelpCircle, Download, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
    const [rsvps, setRsvps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [secret, setSecret] = useState('')
    const [authenticated, setAuthenticated] = useState(false)

    const fetchRsvps = async () => {
        try {
            const resp = await fetch(`/api/admin/rsvps?secret=${secret}`)
            if (resp.ok) {
                const data = await resp.json()
                setRsvps(data.rsvps)
                setAuthenticated(true)
            } else {
                alert('Chave de acesso inválida')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        total: rsvps.length,
        sim: rsvps.filter(r => r.confirmacao === 'sim').length,
        talvez: rsvps.filter(r => r.confirmacao === 'talvez').length,
        nao: rsvps.filter(r => r.confirmacao === 'nao').length,
    }

    const filtered = rsvps.filter(r =>
        r.nome.toLowerCase().includes(filter.toLowerCase()) ||
        r.instituicao.toLowerCase().includes(filter.toLowerCase())
    )

    const exportCSV = () => {
        const headers = ['Nome', 'Email', 'Instituição', 'Cargo', 'Confirmação', 'Telefone', 'Mensagem']
        const rows = rsvps.map(r => [r.nome, r.email, r.instituicao, r.cargo, r.confirmacao, r.telefone, r.mensagem])
        const content = [headers, ...rows].map(e => e.join(',')).join('\n')
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'rsvps_egas_moniz.csv'
        link.click()
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
                    <CardHeader>
                        <CardTitle>Acesso Restrito</CardTitle>
                        <CardDescription>Insira a chave mestra para ver a lista de convidados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Chave de Acesso"
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                            className="bg-slate-800 border-slate-700"
                        />
                        <Button onClick={fetchRsvps} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">Entrar</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-amber-500">Gestão de Convidados</h1>
                        <p className="text-slate-400">Manual de Gestão e Redacção - Santos Egas Moniz</p>
                    </div>
                    <Button onClick={exportCSV} variant="outline" className="border-slate-700 text-slate-300">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-400' },
                        { label: 'Confirmados', value: stats.sim, icon: CheckCircle2, color: 'text-emerald-400' },
                        { label: 'Talvez', value: stats.talvez, icon: HelpCircle, color: 'text-amber-400' },
                        { label: 'Ausentes', value: stats.nao, icon: XCircle, color: 'text-red-400' },
                    ].map((s, i) => (
                        <Card key={i} className="bg-slate-900 border-slate-800 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider">{s.label}</p>
                                        <p className="text-xl sm:text-3xl font-bold mt-1 uppercase tracking-wider">{s.value}</p>
                                    </div>
                                    <s.icon className={`w-8 h-8 ${s.color} opacity-20`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden">
                    <CardHeader className="border-b border-slate-800 pb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <CardTitle>Lista de RSVPs</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Procurar por nome ou instituição..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="pl-9 bg-slate-800 border-slate-700 h-9 text-xs"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Convidado</TableHead>
                                    <TableHead className="text-slate-400">Instituição / Cargo</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-slate-400 text-right">Contacto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r, i) => (
                                    <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <TableCell>
                                            <p className="font-semibold text-sm">{r.nome}</p>
                                            <p className="text-xs text-slate-500">{r.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{r.instituicao}</p>
                                            <p className="text-xs text-slate-500">{r.cargo}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                r.confirmacao === 'sim' ? 'border-emerald-500/30 text-emerald-400' :
                                                    r.confirmacao === 'nao' ? 'border-red-500/30 text-red-400' :
                                                        'border-amber-500/30 text-amber-400'
                                            }>
                                                {r.confirmacao === 'sim' ? 'Confirmado' : r.confirmacao === 'nao' ? 'Ausente' : 'Talvez'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-xs">{r.telefone || 'N/A'}</p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
