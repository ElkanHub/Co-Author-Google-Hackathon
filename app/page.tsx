'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Search, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

interface Document {
  id: string
  title: string
  updated_at: string
  last_active_at: string
  plain_text?: string
}

const ITEMS_PER_PAGE = 15

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<'updated_at' | 'last_active_at'>('updated_at')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch Documents
  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .order(sortOption, { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      setDocuments(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching documents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [page, searchQuery, sortOption])

  const handleCreateSession = async () => {
    const newId = uuidv4()
    // Optimistic redirect, DB insert happens in editor on first save usually, OR we insert a blank one now.
    // Let's insert a blank one to be safe and have it appear in list immediately if they go back.
    const { error } = await supabase.from('documents').insert({
      id: newId,
      title: 'Untitled Research',
      content: {},
      plain_text: ''
    })

    if (!error) {
      router.push(`/editor/${newId}`)
    } else {
      console.error("Failed to create session", error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error

      // Refresh list
      fetchDocuments()
    } catch (err) {
      console.error('Error deleting document:', err)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Research</h1>
            <p className="text-zinc-500 text-sm">Manage your co-authored sessions</p>
          </div>

          <button
            onClick={handleCreateSession}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </header>

        {/* Search & Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} // Reset to page 1 on search
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
          >
            <option value="updated_at">Last Edited</option>
            <option value="last_active_at">Last Opened</option>
          </select>
        </div>

        {/* Session List */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <FileText className="w-8 h-8 opacity-50" />
              <p>No research sessions found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map(doc => (
                <Link
                  key={doc.id}
                  href={`/editor/${doc.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md relative"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate pr-4 text-zinc-900 dark:text-zinc-100">{doc.title || 'Untitled'}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>Edited {new Date(doc.updated_at).toLocaleDateString()}</span>
                        
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
