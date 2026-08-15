'use client'

/**
 * RichTextEditor
 *
 * A zero-dependency WYSIWYG built on the browser's native contenteditable +
 * document.execCommand.  It works with any number of simultaneous instances
 * and is unaffected by React Strict Mode — unlike TipTap v3 which has a
 * module-level PluginKey singleton that causes "Adding different instances of
 * a keyed plugin" when multiple editors mount at the same time.
 *
 * `value` / `onChange` use raw HTML strings (same format the DB stores).
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'

type Props = {
  label?: string
  placeholder?: string
  value: string
  onChange: (html: string) => void
  minHeight?: number
  error?: boolean
}

const RichTextEditor = ({
  label,
  placeholder = 'Write here…',
  value,
  onChange,
  minHeight = 140,
  error
}: Props) => {
  const divRef  = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  // Set content once on mount (don't use dangerouslySetInnerHTML on a
  // contentEditable — React will fight the user's edits on every re-render)
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount only

  // Sync value when parent changes it (form reset / edit-mode load),
  // but never while the user is actively editing.
  useEffect(() => {
    const el = divRef.current
    if (!el || el === document.activeElement) return
    const current = el.innerHTML
    const next    = value || ''
    if (current !== next) el.innerHTML = next
  }, [value])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getHtml = useCallback((): string => {
    const raw = divRef.current?.innerHTML ?? ''
    return raw === '' || raw === '<br>' ? '' : raw
  }, [])

  const handleInput = useCallback(() => {
    onChange(getHtml())
  }, [onChange, getHtml])

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const exec = useCallback((cmd: string, val?: string) => {
    divRef.current?.focus()
    // execCommand is deprecated but universally supported; fine for internal tooling
    document.execCommand(cmd, false, val)
    onChange(getHtml())
  }, [onChange, getHtml])

  // ── Toolbar button ────────────────────────────────────────────────────────

  const Btn = ({
    title,
    icon,
    cmd,
    val
  }: {
    title: string
    icon: string
    cmd: string
    val?: string
  }) => (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size='small'
          onMouseDown={e => {
            e.preventDefault() // don't steal editor focus
            exec(cmd, val)
          }}
          sx={{
            borderRadius: 1,
            p: '4px',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <i className={`${icon} text-base`} />
        </IconButton>
      </span>
    </Tooltip>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const borderColor = error
    ? 'error.main'
    : focused
      ? 'primary.main'
      : 'divider'

  return (
    <Box
      sx={{
        border: theme =>
          `1px solid ${
            error
              ? theme.palette.error.main
              : focused
                ? theme.palette.primary.main
                : theme.palette.divider
          }`,
        boxShadow: focused && !error
          ? theme => `0 0 0 1px ${theme.palette.primary.main}`
          : error && focused
            ? theme => `0 0 0 1px ${theme.palette.error.main}`
            : 'none',
        borderRadius: 1,
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
    >
      {/* Label */}
      {label && (
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            px: 1.5,
            pt: 0.75,
            color: error ? 'error.main' : 'text.secondary',
            fontSize: '0.7rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {label}
        </Typography>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25, px: 0.75, py: 0.5 }}>
        <Btn title='Bold'          icon='ri-bold'              cmd='bold' />
        <Btn title='Italic'        icon='ri-italic'            cmd='italic' />
        <Btn title='Underline'     icon='ri-underline'         cmd='underline' />
        <Btn title='Strikethrough' icon='ri-strikethrough'     cmd='strikeThrough' />
        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
        <Btn title='Bullet list'   icon='ri-list-unordered'    cmd='insertUnorderedList' />
        <Btn title='Numbered list' icon='ri-list-ordered'      cmd='insertOrderedList' />
        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
        <Btn title='Heading 2'     icon='ri-h-2'               cmd='formatBlock' val='h2' />
        <Btn title='Heading 3'     icon='ri-h-3'               cmd='formatBlock' val='h3' />
        <Btn title='Normal text'   icon='ri-paragraph'         cmd='formatBlock' val='p' />
        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
        <Btn title='Undo'          icon='ri-arrow-go-back-line'    cmd='undo' />
        <Btn title='Redo'          icon='ri-arrow-go-forward-line' cmd='redo' />
      </Box>

      <Divider />

      {/* Editable area */}
      <Box
        sx={{ position: 'relative', px: 1.75, py: 1.25, minHeight, cursor: 'text' }}
        onClick={() => divRef.current?.focus()}
      >
        {/* Placeholder — shown only when empty and not focused */}
        {!value && !focused && (
          <Typography
            variant='body2'
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              px: 1.75,
              py: 1.25,
              color: 'text.disabled',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {placeholder}
          </Typography>
        )}

        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onChange(getHtml()) // final sync on blur
          }}
          style={{
            outline: 'none',
            minHeight: minHeight - 20,
            fontSize: '0.875rem',
            lineHeight: '1.6',
            wordBreak: 'break-word',
            // list indent
            paddingInlineStart: 0
          }}
        />
      </Box>
    </Box>
  )
}

export default RichTextEditor
