'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  content?: string;
}

export function ReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ reports: Report[] }>('/decision/reports');
      setReports(data.reports);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiFetch('/decision/reports/generate', { method: 'POST' });
      await fetchReports();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.common.error}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          <Plus className="h-4 w-4" />
          {generating ? zh.decision.reports.generating : zh.decision.reports.generate}
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>{zh.decision.empty.reports}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{zh.decision.reports.title}</TableHead>
              <TableHead>{zh.decision.reports.type}</TableHead>
              <TableHead>{zh.decision.reports.time}</TableHead>
              <TableHead>{zh.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{report.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{report.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(report.generatedAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    {zh.decision.reports.view}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
