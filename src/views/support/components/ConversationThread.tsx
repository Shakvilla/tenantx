'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar, Divider,
  CircularProgress, Alert
} from '@mui/material';
import { SupportTicket, TicketReply } from '@/types/support';
import { supportClient } from '@/lib/api/support-client';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationThreadProps {
  ticket: SupportTicket;
  onBack: () => void;
}

export default function ConversationThread({ ticket, onBack }: ConversationThreadProps) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReplies();
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const data = await supportClient.getReplies(ticket.id);
      setReplies(data);
    } catch (err) {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const senderEmail = user?.email || '';
      const senderName = user?.name || senderEmail;

      const reply = await supportClient.postReply(
        ticket.id,
        senderEmail,
        senderName,
        newMessage.trim()
      );

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ color: getStatusColor() }}
              >
                {ticket.status.replace(/_/g, ' ')}
              </Typography>
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

      {/* Messages */}
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
            justifyContent={reply.senderType === 'LANDLORD' ? 'flex-end' : 'flex-start'}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                maxWidth: '75%',
                backgroundColor: reply.senderType === 'LANDLORD' ? '#e3f2fd' : '#ffffff',
                borderColor: reply.senderType === 'LANDLORD' ? '#90caf9' : '#e0e0e0',
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    bgcolor: reply.senderType === 'LANDLORD' ? '#1976d2' : '#7b1fa2',
                  }}
                >
                  {reply.senderName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle2">
                  {reply.senderName}
                </Typography>
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

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your reply..."
            disabled={sending}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            sx={{ minWidth: 100 }}
          >
            {sending ? <CircularProgress size={20} /> : 'Send'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}