// Types for UHF RFID Tag Information
export interface UHFTagInfo {
  epc: string;
  rssi: string;
  count: number;
  tid?: string;
  user?: string;
  pc?: string;
  ant?: string;
  timestamp: number;
}

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Bluetooth service interface
export interface BluetoothService {
  connect: () => Promise<void>;
  disconnect: () => void;
  startInventory: () => Promise<boolean>;
  stopInventory: () => Promise<boolean>;
  getPower: () => Promise<number | null>;
  setPower: (power: number) => Promise<boolean>;
  onTagRead: (callback: (tag: UHFTagInfo) => void) => void;
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => void;
}
