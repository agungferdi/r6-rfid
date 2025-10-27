import { UHFTagInfo, ConnectionStatus, BluetoothService } from '../types/rfid.types';

/**
 * Chainway R6 UHF RFID Reader Bluetooth Service
 * 
 * This service implements Web Bluetooth API to communicate with
 * Chainway R6 handheld RFID readers via BLE (Bluetooth Low Energy)
 */
class ChainwayR6Service implements BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  private tagReadCallback: ((tag: UHFTagInfo) => void) | null = null;
  private connectionStatusCallback: ((status: ConnectionStatus) => void) | null = null;
  
  // UHF BLE Service UUID (standard for Chainway devices)
  private readonly SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  
  private isInventoryRunning = false;

  /**
   * Connect to the Chainway R6 device via Bluetooth
   */
  async connect(): Promise<void> {
    try {
      this.updateConnectionStatus('connecting');
      
      // Request Bluetooth device with UHF service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'R6' },
          { namePrefix: 'Chainway' },
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      if (!this.device.gatt) {
        throw new Error('GATT not supported');
      }

      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      
      // Get the UHF service
      const service = await this.server.getPrimaryService(this.SERVICE_UUID);
      
      // Get the characteristic for reading/writing
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
      
      // Start listening for notifications
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
      
      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
      
      this.updateConnectionStatus('connected');
      console.log('Connected to Chainway R6');
    } catch (error) {
      console.error('Connection error:', error);
      this.updateConnectionStatus('error');
      throw error;
    }
  }

  /**
   * Disconnect from the device
   */
  disconnect(): void {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Start inventory (scanning for tags)
   */
  async startInventory(): Promise<boolean> {
    if (!this.characteristic) {
      console.error('Not connected to device');
      return false;
    }

    try {
      // Command to start inventory (based on Chainway protocol)
      // Format: Header(0xA0) + Length + Command(0x27) + Checksum
      const command = new Uint8Array([0xA0, 0x04, 0x01, 0x27, 0xCC]);
      await this.characteristic.writeValue(command);
      this.isInventoryRunning = true;
      console.log('Started inventory');
      return true;
    } catch (error) {
      console.error('Error starting inventory:', error);
      return false;
    }
  }

  /**
   * Stop inventory
   */
  async stopInventory(): Promise<boolean> {
    if (!this.characteristic) {
      console.error('Not connected to device');
      return false;
    }

    try {
      // Command to stop inventory
      // Format: Header(0xA0) + Length + Command(0x28) + Checksum
      const command = new Uint8Array([0xA0, 0x04, 0x01, 0x28, 0xCD]);
      await this.characteristic.writeValue(command);
      this.isInventoryRunning = false;
      console.log('Stopped inventory');
      return true;
    } catch (error) {
      console.error('Error stopping inventory:', error);
      return false;
    }
  }

  /**
   * Get current power level
   */
  async getPower(): Promise<number | null> {
    if (!this.characteristic) {
      console.error('Not connected to device');
      return null;
    }

    try {
      // Command to get power
      const command = new Uint8Array([0xA0, 0x04, 0x01, 0xB7, 0x5C]);
      await this.characteristic.writeValue(command);
      // Power will be returned via notification
      return null; // Will be handled in notification
    } catch (error) {
      console.error('Error getting power:', error);
      return null;
    }
  }

  /**
   * Set power level (0-30 dBm)
   */
  async setPower(power: number): Promise<boolean> {
    if (!this.characteristic) {
      console.error('Not connected to device');
      return false;
    }

    if (power < 0 || power > 30) {
      console.error('Power must be between 0 and 30 dBm');
      return false;
    }

    try {
      // Command to set power
      // Format: Header + Length + Command(0xB6) + Power + Checksum
      const command = new Uint8Array([0xA0, 0x05, 0x01, 0xB6, power, 0x00]);
      command[5] = this.calculateChecksum(command.slice(0, 5));
      await this.characteristic.writeValue(command);
      console.log(`Set power to ${power} dBm`);
      return true;
    } catch (error) {
      console.error('Error setting power:', error);
      return false;
    }
  }

  /**
   * Register callback for tag reads
   */
  onTagRead(callback: (tag: UHFTagInfo) => void): void {
    this.tagReadCallback = callback;
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.connectionStatusCallback = callback;
  }

  /**
   * Handle incoming notifications from the device
   */
  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    
    if (!value) return;

    const data = new Uint8Array(value.buffer);
    
    // Parse the response based on Chainway protocol
    if (data.length > 5 && data[0] === 0xA0) {
      const command = data[3];
      
      // Tag inventory data (command 0x22 or similar)
      if (command === 0x22 || command === 0x27) {
        const tag = this.parseTagData(data);
        if (tag && this.tagReadCallback) {
          this.tagReadCallback(tag);
        }
      }
    }
  }

  /**
   * Parse tag data from raw bytes
   */
  private parseTagData(data: Uint8Array): UHFTagInfo | null {
    try {
      // Parse according to Chainway protocol
      // Simplified parsing - actual format may vary
      let offset = 5; // Skip header
      
      // RSSI (1 byte)
      const rssi = data[offset++];
      
      // PC (2 bytes)
      const pc = Array.from(data.slice(offset, offset + 2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      offset += 2;
      
      // EPC length from PC
      const epcLen = ((data[offset - 2] >> 3) & 0x1F) * 2;
      
      // EPC
      const epc = Array.from(data.slice(offset, offset + epcLen))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
      
      return {
        epc,
        rssi: rssi.toString(),
        count: 1,
        pc,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error parsing tag data:', error);
      return null;
    }
  }

  /**
   * Handle disconnect event
   */
  private handleDisconnect(): void {
    console.log('Device disconnected');
    this.cleanup();
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isInventoryRunning = false;
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(status);
    }
  }

  /**
   * Calculate checksum for command
   */
  private calculateChecksum(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum & 0xFF;
  }
}

// Export singleton instance
export const chainwayR6Service = new ChainwayR6Service();
