import { defineStore } from 'pinia'

interface QsoEntry {
  callsign: string
  band: string
  freqRx: string
  freqTx: string
  mode: string
  rstr1: string
  rstr2: string
  datetime: string
  remark: string
  notes: string
}

export const useQsoStore = defineStore('qso', {
  state: () => ({
    currentSession: [] as QsoEntry[],
    allQsos: [] as QsoEntry[],
    qsoForm: {
      callsign: '',
      band: '40m',
      mode: 'CW',
      rstr: '',
      rstr2: '',
      date: '',
      utc: '',
      remark: '',
      notes: ''
    }
  }),
  actions: {
    addQso() {
      const now = new Date()
      const newQso: QsoEntry = {
        callsign: this.qsoForm.callsign,
        band: this.qsoForm.band,
        freqRx: '', // TODO: Get from rig
        freqTx: '', // TODO: Get from rig
        mode: this.qsoForm.mode,
        rstr1: this.qsoForm.rstr,
        rstr2: this.qsoForm.rstr2,
        datetime: now.toISOString(),
        remark: this.qsoForm.remark,
        notes: this.qsoForm.notes
      }
      
      this.currentSession.push(newQso)
      this.allQsos.push(newQso)
      
      // Reset form
      this.qsoForm = {
        callsign: '',
        band: '40m',
        mode: 'CW',
        rstr: '',
        rstr2: '',
        date: '',
        utc: '',
        remark: '',
        notes: ''
      }
    },
    updateQsoForm(field: keyof typeof this.qsoForm, value: string) {
      this.qsoForm[field] = value
    }
  },
  getters: {
    sessionCount: (state) => state.currentSession.length,
    totalCount: (state) => state.allQsos.length
  }
})
