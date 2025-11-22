export type PrimaryColorConfig = {
  name?: string
  light?: string
  main: string
  dark?: string
}

// Primary color config object
const primaryColorConfig: PrimaryColorConfig[] = [
  {
    name: 'primary-1',
    light: '#7FD066',
    main: '#65BC4B',
    dark: '#4F9439'
  },
  {
    name: 'primary-2',
    light: '#4A6BA8',
    main: '#21438D',
    dark: '#1A3570'
  },
  {
    name: 'primary-3',
    light: '#FFA04D',
    main: '#F58120',
    dark: '#C4651A'
  },
  {
    name: 'primary-4',
    light: '#8E8F8F',
    main: '#6C6D6D',
    dark: '#525353'
  },
  {
    name: 'primary-5',
    light: '#F04A51',
    main: '#EB1E25',
    dark: '#B0171D'
  },
  {
    name: 'primary-6',
    light: '#C96BB8',
    main: '#B948A1',
    dark: '#8D3879'
  },
  {
    name: 'primary-7',
    light: '#4DD4F7',
    main: '#1CC2F2',
    dark: '#1595B5'
  }
]

export default primaryColorConfig
