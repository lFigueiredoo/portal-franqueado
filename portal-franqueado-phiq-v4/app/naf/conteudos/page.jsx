'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, Eye, Trash2, FileText, BookOpen, Calendar } from 'lucide-react'
import { communicationsRepository } from '@/services/communications/repository'
import { knowledgeRepository } from '@/services/knowledge/repository'

export default function NafConteudos() {
  const [activeTab, setActiveTab] = useState('comunicados')
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const session = {
    user: { $id: 'naf_user_id' },
    profile: { role: 'NAF', franchiseId: 'all' }
  }

  useEffect(() => {
    loadContent()
  }, [activeTab])

  const loadContent = async () => {
    setLoading(true)
    try {
      if (activeTab === 'comunicados') {
        const data = await communicationsRepository.listPublished()
        setItems(data)
      } else if (activeTab === 'knowledge') {
        const data = await knowledgeRepository.listPages('all')
        setItems(data)
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData.entries())

      if (editing?.$id) {
        await fetch('/api/communications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.$id, userId: session.user.$id, profile: session.profile, data })
        })
      } else {
        await fetch('/api/communications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.$id, profile: session.profile, data })
        })
      }
      setEditing(null)
      await loadContent()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <section className="screen">
      <div className="breadcrumb"><span>Gestão NAF · Conteúdos</span></div>
      <div className="section-intro">
        <h1>Gestão de <span className="dynamic-text">{activeTab === 'comunicados' ? 'Comunicados' : 'Conhecimento'}</span></h1>
        <p>Crie, edite e publique a base de informações do Portal PHIQ.</p>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'comunicados' ? 'active' : ''} onClick={() => setActiveTab('comunicados')}>
          <FileText size={18}/> Comunicados
        </button>
        <button className={activeTab === 'knowledge' ? 'active' : ''} onClick={() => setActiveTab('knowledge')}>
          <BookOpen size={18}/> Base de Conhecimento
        </button>
        <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
          <Calendar size={18}/> Eventos
        </button>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-content-grid">
        <div className="admin-list-panel">
          <div className="panel-header">
            <h3>{activeTab === 'comunicados' ? 'Comunicados Ativos' : 'Páginas da Wiki'}</h3>
            <button className="primary-btn" onClick={() => setEditing({})}><Plus size={16}/> Novo</button>
          </div>
          <div className="admin-list">
            {loading ? <div className="loading-state">Carregando...</div> :
              items.length ? items.map(item => (
                <div key={item.$id} className="admin-item-row">
                  <div className="item-info">
                    <strong>{item.title}</strong>
                    <small>{item.category}</small>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => setEditing(item)}><Eye size={14}/></button>
                    <button onClick={() => { /* delete logic */ }}><Trash2 size={14}/></button>
                  </div>
                </div>
              )) : <div className="empty-state">Nenhum item encontrado.</div>
            }
          </div>
        </div>

        {editing && (
          <div className="admin-edit-panel">
            <div className="panel-header">
              <h3>{editing.$id ? 'Editar' : 'Novo'} {activeTab === 'comunicados' ? 'Comunicado' : 'Página'}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <label>Título <input name="title" defaultValue={editing.title} required /></label>
              <label>Categoria
                <select name="category" defaultValue={editing.category} required>
                  {activeTab === 'comunicados' ?
                    [['REDE','Rede'],['TECNICO','Técnico'],['COMERCIAL','Comercial'],['EVENTOS','Eventos'],['JORNAL','Jornal'],['PODCAST','Podcast']].map(([v,l]) => <option key={v} value={v}>{l}</option>) :
                    [['Começando na PHIQ','Começando na PHIQ'],['Operação & Padrões','Operação & Padrões'],['Comercial & Crescimento','Comercial & Crescimento'],['Produtos PHIQ','Produtos PHIQ'],['Biblioteca PHIQ','Biblioteca PHIQ'],['Infraestrutura & Wiki','Infraestrutura & Wiki']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                }
              </select>
            </label>
              <label className="wide">Conteúdo <textarea name="content" defaultValue={editing.content} rows="15" required /></label>
              <div className="admin-checkboxes">
                <label><input type="checkbox" name="published" defaultChecked={editing.published ?? true} /> Publicar agora</label>
                {activeTab === 'comunicados' && (
                  <label><input type="checkbox" name="featured" defaultChecked={editing.featured ?? false} /> Destacar na Home</label>
                )}
              </div>
              <div className="admin-actions">
                <button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="primary-btn" disabled={busy}>{busy ? 'Salvando...' : 'Salvar Conteúdo'} <Save size={14}/></button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
