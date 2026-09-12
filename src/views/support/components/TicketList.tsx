'use client';

import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Box, CircularProgress, TablePagination,
  Select, MenuItem, FormControl, InputLabel, SelectChangeEvent
} from '@mui/material';
import { SupportTicket } from '@/types/support';
import { supportClient } from '@/lib/api/support-client';

interface TicketListProps {
  onSelectTicket: (ticket: SupportTicket) => void;
  selectedTicketId?: string;
  refreshKey?: number;
}

const STATUS_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  WAITING_TENANT: 'warning',
  WAITING_LANDLORD: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const PRIORITY_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  MAINTENANCE: 'Maintenance',
  RENT: 'Rent',
  LEASE: 'Lease',
  ACCESS: 'Access',
  SAFETY: 'Safety',
  OTHER: 'Other',
};

export default function TicketList({ onSelectTicket, selectedTicketId, refreshKey }: TicketListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const rowsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, refreshKey]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual email from auth context
      const email = localStorage.getItem('userEmail') || '';
      const response = await supportClient.getMyTickets(email, statusFilter || undefined, page, rowsPerPage);
      setTickets(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading && tickets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">My Support Tickets</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="WAITING_TENANT">Waiting on You</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="CLOSED">Closed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell align="center">Replies</TableCell>
              <TableCell>Last Reply</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                hover
                onClick={() => onSelectTicket(ticket)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedTicketId === ticket.id ? 'action.selected' : 'inherit',
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {ticket.subject}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={CATEGORY_LABELS[ticket.category] || ticket.category}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(ticket.status)}
                    size="small"
                    color={STATUS_COLORS[ticket.status] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={ticket.priority}
                    size="small"
                    color={PRIORITY_COLORS[ticket.priority] || 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" color="text.secondary">
                    {ticket.replyCount}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(ticket.lastReplyAt)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No tickets found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
      />
    </Box>
  );
}