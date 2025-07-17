import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Divider } from '@mui/material';

const PAGE_SIZE = 20;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = (pageNum = 0) => {
    setLoading(true);
    axios.get(`/admin/audit-logs?page=${pageNum + 1}&limit=${PAGE_SIZE}`)
      .then(res => {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
        setError(null);
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line
  }, [page]);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Audit Logs</Typography>
      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{log.userId?.name || 'System'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resourceType} ({log.resourceId})</TableCell>
                  <TableCell>
                    <pre style={{ margin: 0, fontSize: 12 }}>{log.details && typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : ''}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider sx={{ my: 2 }} />
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </Paper>
    </Box>
  );
};

export default AuditLogs;
