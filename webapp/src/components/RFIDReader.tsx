import { useState, useEffect } from 'react';
import { chainwayR6Service } from '../services/chainway-r6.service';
import { UHFTagInfo, ConnectionStatus } from '../types/rfid.types';
import './RFIDReader.css';

interface TagWithId extends UHFTagInfo {
  id: string;
}

export function RFIDReader() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isScanning, setIsScanning] = useState(false);
  const [tags, setTags] = useState<Map<string, TagWithId>>(new Map());
  const [power, setPower] = useState<number>(20);
  const [error, setError] = useState<string>('');

  // Initialize callbacks
  useEffect(() => {
    chainwayR6Service.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'disconnected' || status === 'error') {
        setIsScanning(false);
      }
    });

    chainwayR6Service.onTagRead((tag) => {
      setTags((prevTags) => {
        const newTags = new Map(prevTags);
        const existingTag = newTags.get(tag.epc);
        
        if (existingTag) {
          // Update count if tag already exists
          newTags.set(tag.epc, {
            ...tag,
            id: tag.epc,
            count: existingTag.count + 1,
          });
        } else {
          // Add new tag
          newTags.set(tag.epc, { ...tag, id: tag.epc });
        }
        
        return newTags;
      });
    });
  }, []);

  const handleConnect = async () => {
    try {
      setError('');
      await chainwayR6Service.connect();
      // Set initial power
      await chainwayR6Service.setPower(power);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    chainwayR6Service.disconnect();
    setTags(new Map());
  };

  const handleStartScan = async () => {
    try {
      setError('');
      const success = await chainwayR6Service.startInventory();
      if (success) {
        setIsScanning(true);
        setTags(new Map()); // Clear previous tags
      } else {
        setError('Failed to start scanning');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scanning');
    }
  };

  const handleStopScan = async () => {
    try {
      await chainwayR6Service.stopInventory();
      setIsScanning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop scanning');
    }
  };

  const handlePowerChange = async (newPower: number) => {
    setPower(newPower);
    if (connectionStatus === 'connected') {
      try {
        await chainwayR6Service.setPower(newPower);
      } catch (err) {
        setError('Failed to set power level');
      }
    }
  };

  const clearTags = () => {
    setTags(new Map());
  };

  const exportTags = () => {
    const tagArray = Array.from(tags.values());
    const csv = [
      'EPC,RSSI,Count,PC,Timestamp',
      ...tagArray.map(tag => 
        `${tag.epc},${tag.rssi},${tag.count},${tag.pc || ''},${new Date(tag.timestamp).toISOString()}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid-tags-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const tagsArray = Array.from(tags.values()).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="rfid-reader">
      <header className="header">
        <h1>📡 Chainway R6 RFID Reader</h1>
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
          {connectionStatus.toUpperCase()}
        </div>
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="controls">
        <div className="control-group">
          <h3>Connection</h3>
          <div className="button-group">
            {connectionStatus !== 'connected' ? (
              <button 
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Device'}
              </button>
            ) : (
              <button 
                className="btn btn-secondary"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {connectionStatus === 'connected' && (
          <>
            <div className="control-group">
              <h3>Power Level</h3>
              <div className="power-control">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={power}
                  onChange={(e) => handlePowerChange(parseInt(e.target.value))}
                  disabled={isScanning}
                />
                <span className="power-value">{power} dBm</span>
              </div>
            </div>

            <div className="control-group">
              <h3>Scanning</h3>
              <div className="button-group">
                {!isScanning ? (
                  <button 
                    className="btn btn-success"
                    onClick={handleStartScan}
                  >
                    ▶ Start Scan
                  </button>
                ) : (
                  <button 
                    className="btn btn-danger"
                    onClick={handleStopScan}
                  >
                    ⏸ Stop Scan
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={clearTags}
                  disabled={tags.size === 0}
                >
                  🗑️ Clear
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={exportTags}
                  disabled={tags.size === 0}
                >
                  💾 Export CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="tags-section">
        <div className="tags-header">
          <h2>Detected Tags ({tags.size})</h2>
          {isScanning && <div className="scanning-indicator">🔄 Scanning...</div>}
        </div>

        {tagsArray.length === 0 ? (
          <div className="empty-state">
            {connectionStatus === 'connected' 
              ? 'No tags detected. Start scanning to read RFID tags.'
              : 'Connect to the device to start reading tags.'}
          </div>
        ) : (
          <div className="tags-list">
            {tagsArray.map((tag) => (
              <div key={tag.id} className="tag-card">
                <div className="tag-header">
                  <span className="tag-epc">{tag.epc}</span>
                  <span className="tag-count">×{tag.count}</span>
                </div>
                <div className="tag-details">
                  <div className="tag-detail">
                    <span className="label">RSSI:</span>
                    <span className="value">{tag.rssi} dBm</span>
                  </div>
                  {tag.pc && (
                    <div className="tag-detail">
                      <span className="label">PC:</span>
                      <span className="value">{tag.pc}</span>
                    </div>
                  )}
                  <div className="tag-detail">
                    <span className="label">Time:</span>
                    <span className="value">{new Date(tag.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
