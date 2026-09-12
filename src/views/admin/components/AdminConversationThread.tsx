'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar, Divider,
  CircularProgress, Alert, Tabs, Tab, Chip
} from '@mui/material';
import { AdminSupportTicket } from '@/types/admin';
import { adminClient } from '@/lib/api/admin-auth-client';

interface AdminConversationThreadProps {
  ticket: AdminSupportTicket;
  onBack: () => void;
}

interface TicketReply {
  id: string;
  senderType: 'LANDLORD' | 'ADMIN';
  senderName: string;
  message: string;
  createdAt: string;
}

interface TicketInternalNote {
  id: string;
  adminName: string;
  note: string;
  createdAt: string;
}

export default function AdminConversationThread({ ticket, onBack }: AdminConversationThreadProps) {
  const [tabValue, setTabValue] = useState(0);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [notes, setNotes] = useState<TicketInternalNote[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [replies, notes, tabValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch replies and notes from API
      // For now, use empty arrays
      setReplies([]);
      setNotes([]);
    } catch (err) {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Call admin reply API
      const reply: TicketReply = {
        id: Date.now().toString(),
        senderType: 'ADMIN',
        senderName: localStorage.getItem('userName') || 'Admin',
        message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      };

      setReplies((prev) => [...prev, reply]);
      setNewMessage('');
      setSuccess('Reply sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Call admin note API
      const note: TicketInternalNote = {
        id: Date.now().toString(),
        adminName: localStorage.getItem('userName') || 'Admin',
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => [...prev, note]);
      setNewNote('');
      setSuccess('Note added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add note');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'reply' | 'note') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (type === 'reply') handleSendReply();
      else handleSendNote();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'OPEN': return '#1976d2';
      case 'IN_PROGRESS': return '#ed6c02';
      case 'WAITING_TENANT': return '#d32f2f';
      case 'RESOLVED': return '#2e7d32';
      case 'CLOSED': return '#757575';
      default: return '#1976d2';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" gutterBottom>
              {ticket.subject}
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={ticket.status.replace(/_/g, ' ')}
                size="small"
                sx={{ color: getStatusColor(), borderColor: getStatusColor() }}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Priority: {ticket.priority}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Category: {ticket.category}
              </Typography>
            </Box>
          </Box>
          <Button variant="outlined" size="small" onClick={onBack}>
            Back to List
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Conversation
                <Chip label={replies.length} size="small" />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Internal Notes
                <Chip label={notes.length} size="small" color="warning" />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', p: 2, mb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {tabValue === 0 ? (
          <>
            {/* Conversation Tab */}
            {/* Initial message */}
            <Box mb={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderColor: '#e0e0e0',
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#1976d2' }}>
                    {ticket.submitterEmail.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2">
                    {ticket.submitterEmail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {formatTime(ticket.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {ticket.body}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Replies */}
            {replies.map((reply) => (
              <Box
                key={reply.id}
                mb={2}
                display="flex"
                justifyContent={reply.senderType === 'ADMIN' ? 'flex-end' : 'flex-start'}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxWidth: '75%',
                    backgroundColor: reply.senderType === 'ADMIN' ? '#e8f5e9' : '#ffffff',
                    borderColor: reply.senderType === 'ADMIN' ? '#a5d6a7' : '#e0e0e0',
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1,
                        bgcolor: reply.senderType === 'ADMIN' ? '#2e7d32' : '#1976d2',
                      }}
                    >
                      {reply.senderName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="subtitle2">
                      {reply.senderName}
                    </Typography>
                    <Chip
                      label={reply.senderType}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {formatTime(reply.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {reply.message}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </>
        ) : (
          <>
            {/* Internal Notes Tab */}
            {notes.map((note) => (
              <Box key={note.id} mb={2}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: '#fff8e1',
                    borderColor: '#ffe082',
                    borderLeft: '4px solid #ffc107',
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#f57c00' }}>
                      {note.adminName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="subtitle2">
                      {note.adminName}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
Internal
</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {formatTime(note.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {note.note}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        {tabValue === 0 ? (
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'reply')}
              placeholder="Type your reply to the landlord..."
              disabled={sending}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendReply}
              disabled={sending || !newMessage.trim()}
              sx={{ minWidth: 100 }}
            >
              {sending ? <CircularProgress size={20} /> : 'Send Reply'}
            </Button>
          </Box>
        ) : (
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'note')}
              placeholder="Add an internal note (only visible to admins)..."
              disabled={sending}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              color="warning"
              onClick={handleSendNote}
              disabled={sending || !newNote.trim()}
              sx={{ minWidth: 100 }}
            >
              {sending ? <CircularProgress size={20} /> : 'Add Note'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}