'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { zh } from '@/messages/zh';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
}

interface RuleSet {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
}

export function RuleList() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSets, setOpenSets] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function fetchRules() {
      try {
        setLoading(true);
        const data = await apiFetch<{ ruleSets: RuleSet[] }>('/compliance/rules');
        if (!cancelled) {
          setRuleSets(data.ruleSets);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : zh.common.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRules();
    return () => { cancelled = true; };
  }, []);

  const toggleSet = (id: string) => {
    setOpenSets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
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

  if (ruleSets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{zh.compliance.empty.rules}</p>
      </div>
    );
  }

  const severityVariant = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      case 'low': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const severityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return zh.compliance.rule.high;
      case 'medium': return zh.compliance.rule.medium;
      case 'low': return zh.compliance.rule.low;
      default: return severity;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {ruleSets.map((ruleSet) => (
        <Card key={ruleSet.id}>
          <Collapsible open={openSets.has(ruleSet.id)} onOpenChange={() => toggleSet(ruleSet.id)}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {openSets.has(ruleSet.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-base">{ruleSet.name}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {ruleSet.rules.length} {zh.compliance.rule.count}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground text-left ml-6">{ruleSet.description}</p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {ruleSet.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                      <Badge variant={severityVariant(rule.severity)}>
                        {severityLabel(rule.severity)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
