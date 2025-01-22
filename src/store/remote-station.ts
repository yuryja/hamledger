import { defineStore } from 'pinia'

interface StationInfo {
  flag: string
  name: string
  weather: string
  qth: string
  localTime: string
  greetings: {
    greeting: string
    ipa: string
    label: string
  }[]
}

export const useRemoteStationStore = defineStore('remoteStation', {
  state: () => ({
    stationInfo: {
      flag: 'https://flagcdn.com/h80/hu.png',
      name: 'ZOLTAN (Zoli) JUHASZ',
      weather: '19°C, Cloudy',
      qth: 'H-5932, Gadoros',
      localTime: '22:15',
      greetings: [
        {
          label: 'Appropriate greeting',
          greeting: 'Jó estét!',
          ipa: 'joː ɛʃteːt'
        },
        {
          label: 'Thank you',
          greeting: 'Köszönöm',
          ipa: 'køsønom'
        },
        {
          label: 'Good luck',
          greeting: 'Sok szerencsét',
          ipa: 'ʃok sɛrɛnt͡ʃeːt'
        }
      ]
    } as StationInfo
  })
})
