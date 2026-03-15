import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, Search, ShieldAlert, Webhook } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { apiFetchJson } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import './OpsPage.css';

interface OpsOverview {
  outboundQueue: { total: number; failed: number; delivered: number };
  backgroundJobs: { total: number; stuck: number };
  incidents: Array<{ id: string; title: string; severity: string; source: string; createdAt: string }>;
  replayOutcomes: Array<{ id: string; targetId: string; outcome: string; createdAt: string }>;
}

interface OpsIncident {
  id: string;
  title: string;
  severity: string;
  source: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

interface WebhookEvent {
  id: string;
  type: string;
  status: string;
  createdAt?: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export const OpsPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OpsOverview | null>(null);
  const [incidents, setIncidents] = useState<OpsIncident[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ incidents?: OpsIncident[]; annotations?: Array<{ id: string; note: string; author: string }>; replays?: Array<{ id: string; targetId: string; outcome: string }> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canAccess = ['admin', 'operator', 'support'].includes(user?.role || '');

  const loadOpsData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [overviewRes, incidentsRes, webhookRes] = await Promise.all([
        apiFetchJson<OpsOverview>('/api/v2/ops/overview'),
        apiFetchJson<{ incidents?: OpsIncident[] }>('/api/v2/ops/incidents'),
        apiFetchJson<{ events?: WebhookEvent[] }>('/api/v2/ops/webhooks'),
      ]);

      setOverview(overviewRes);
      setIncidents(incidentsRes.incidents || []);
      setWebhooks(webhookRes.events || []);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load operator data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      loadOpsData();
    } else {
      setIsLoading(false);
    }
  }, [canAccess, loadOpsData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await apiFetchJson<{ incidents?: OpsIncident[]; annotations?: Array<{ id: string; note: string; author: string }>; replays?: Array<{ id: string; targetId: string; outcome: string }> }>(
        `/api/v2/ops/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchResults(results);
    } catch {
      setSearchResults({ incidents: [], annotations: [], replays: [] });
    }
  };

  if (!canAccess) {
    return (
      <div className="ops-page">
        <ErrorState
          type="generic"
          title="Operator access required"
          message="This area is only available to admin, operator, or support accounts."
          inline
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ops-page ops-page--loading">
        <RefreshCw className="ops-spinner" size={28} />
        <p>Loading operations data...</p>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1>Operations</h1>
          <p>Incidents, queue health, webhook history, and replay outcomes.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadOpsData} disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loadError && (
        <ErrorState
          type="server"
          title="Operations unavailable"
          message={loadError}
          onRetry={loadOpsData}
          isRetrying={isRefreshing}
        />
      )}

      {overview && (
        <div className="ops-metrics">
          <Card elevated>
            <CardBody>
              <div className="ops-metric-card">
                <Webhook size={20} />
                <div>
                  <div className="ops-metric-value">{overview.outboundQueue.total}</div>
                  <div className="ops-metric-label">Outbound queue jobs</div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card elevated>
            <CardBody>
              <div className="ops-metric-card">
                <AlertTriangle size={20} />
                <div>
                  <div className="ops-metric-value">{overview.outboundQueue.failed}</div>
                  <div className="ops-metric-label">Failed deliveries</div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card elevated>
            <CardBody>
              <div className="ops-metric-card">
                <Activity size={20} />
                <div>
                  <div className="ops-metric-value">{overview.backgroundJobs.total}</div>
                  <div className="ops-metric-label">Background jobs</div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card elevated>
            <CardBody>
              <div className="ops-metric-card">
                <ShieldAlert size={20} />
                <div>
                  <div className="ops-metric-value">{overview.backgroundJobs.stuck}</div>
                  <div className="ops-metric-label">Stuck jobs</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardBody>
          <div className="ops-search">
            <div className="ops-search-input">
              <Search size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search incidents, annotations, or replays"
              />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
          {searchResults && (
            <div className="ops-search-results">
              <div>
                <h3>Incidents</h3>
                <p>{searchResults.incidents?.length || 0} matches</p>
              </div>
              <div>
                <h3>Annotations</h3>
                <p>{searchResults.annotations?.length || 0} matches</p>
              </div>
              <div>
                <h3>Replays</h3>
                <p>{searchResults.replays?.length || 0} matches</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="ops-grid">
        <Card>
          <CardBody>
            <div className="ops-section-header">
              <h2>Recent Incidents</h2>
            </div>
            <div className="ops-list">
              {incidents.length === 0 ? (
                <p className="ops-empty">No incidents recorded.</p>
              ) : (
                incidents.slice(0, 8).map((incident) => (
                  <div key={incident.id} className={`ops-list-item severity-${incident.severity}`}>
                    <div>
                      <strong>{incident.title}</strong>
                      <p>{incident.source}</p>
                    </div>
                    <span>{new Date(incident.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="ops-section-header">
              <h2>Webhook History</h2>
            </div>
            <div className="ops-list">
              {webhooks.length === 0 ? (
                <p className="ops-empty">No webhook events recorded.</p>
              ) : (
                webhooks.slice(0, 8).map((event) => (
                  <div key={event.id} className="ops-list-item">
                    <div>
                      <strong>{event.type}</strong>
                      <p>{event.id}</p>
                    </div>
                    <span>{event.status}</span>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default OpsPage;