import { createContext, useContext, type ReactNode } from 'react'
import type { ConnectionStatus } from './types'

interface DeviceContextValue {
  /** Arduino link state. Mocked until Web Serial is implemented. */
  status: ConnectionStatus
  /** Which input currently drives the timer. */
  activeInput: 'keyboard' | 'arduino'
}

const DeviceContext = createContext<DeviceContextValue>({ status: 'disconnected', activeInput: 'keyboard' })

export function DeviceProvider({ children }: { children: ReactNode }) {
  // TODO: replace with real Web Serial state when the Arduino link is built.
  const value: DeviceContextValue = { status: 'disconnected', activeInput: 'keyboard' }
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext)
}
