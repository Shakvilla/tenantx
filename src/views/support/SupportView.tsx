'use client';

import React, { useState } from 'react';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { SupportTicket } from '@/types/support';
import TicketList from './components/TicketList';
import ConversationThread from './components/ConversationThread';

export default function SupportView() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleBack = () => {
    setSelectedTicket(null);
    setRefreshKey((prev) => prev + 1);
  };

  if (isMobile) {
    // Mobile: single panel
    if (selectedTicket) {
      return (
        <Box sx={{ p: 2, height: '100%' }}>
          <ConversationThread ticket={selectedTicket} onBack={handleBack} />
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <TicketList onSelectTicket={handleSelectTicket} refreshKey={refreshKey} />
      </Box>
    );
  }

  // Desktop: two-panel layout
  return (
    <Box display="flex" gap={2} sx={{ p: 2, height: '100%' }}>
      {/* Left panel: Ticket list */}
      <Paper
        variant="outlined"
        sx={{
          flex: selectedTicket ? '0 0 400px' : '1',
          overflow: 'auto',
          transition: 'flex 0.3s ease',
        }}
      >
        <TicketList
          onSelectTicket={handleSelectTicket}
          selectedTicketId={selectedTicket?.id}
          refreshKey={refreshKey}
        />
      </Paper>

      {/* Right panel: Conversation thread */}
      {selectedTicket && (
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ConversationThread ticket={selectedTicket} onBack={handleBack} />
        </Paper>
      )}

      {/* Empty state when no ticket selected */}
      {!selectedTicket && (
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            Select a ticket to view the conversation
          </Typography>
        </Paper>
      )}
    </Box>
  );
}