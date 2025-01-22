import { defineStore } from 'pinia'

interface Mode {
  value: string
  label: string
}

export const useRigStore = defineStore('rig', {
  state: () => ({
    modes: [
      { value: 'CW', label: 'CW' },
      { value: 'LSB', label: 'LSB' },
      { value: 'USB', label: 'USB' },
      { value: 'AM', label: 'AM' },
      { value: 'FM', label: 'FM' },
      { value: 'DATA', label: 'DATA' }
    ] as Mode[],
    selectedMode: 'CW',
    frequency: '7.093 kHz',
    rigModel: 'YAESU FT-450A'
  }),
  actions: {
    handleReconnect() {
      console.log('Reconnecting...')
    },
    handleDisconnect() {
      console.log('Disconnecting...')
    }
  }
})
