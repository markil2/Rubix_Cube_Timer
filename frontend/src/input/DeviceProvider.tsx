import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createLineSplitter, parseArduinoLine } from './arduinoSource'
import type { ConnectionStatus, TimerInput } from './types'
import { getSerial, isWebSerialSupported, openSerial, type OpenConnection, type SerialPort } from './webSerial'

interface DeviceContextValue {
  /** Arduino link state. */
  status: ConnectionStatus
  /** Last problem worth telling the user about, or null. */
  error: string | null
  supported: boolean
  /** Ask the browser for a serial device and open it. Must run from a click. */
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  /** Receive parsed Arduino events. Returns an unsubscribe function. */
  subscribe: (listener: (input: TimerInput) => void) => () => void
}

const DeviceContext = createContext<DeviceContextValue | null>(null)

const UNSUPPORTED = 'Web Serial is not supported in this browser. Try Chrome or Edge.'

function openErrorMessage(e: unknown): string {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'InvalidStateError') return 'That port is already open. Close it in other tabs or apps and try again.'
  if (name === 'NetworkError')
    return 'Couldn’t open the port. Close the Arduino IDE Serial Monitor (or any app using it) and try again.'
  return 'Couldn’t connect to the Arduino.'
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const supported = isWebSerialSupported()

  const listeners = useRef(new Set<(input: TimerInput) => void>())
  const connection = useRef<OpenConnection | null>(null)
  const opening = useRef(false)

  const splitter = useMemo(
    () =>
      createLineSplitter((line) => {
        const input = parseArduinoLine(line)
        if (input) listeners.current.forEach((listener) => listener(input))
        else if (line.trim()) console.debug('[arduino] ignored line:', line)
      }),
    [],
  )

  const openPort = useCallback(
    async (port: SerialPort, { quiet = false } = {}) => {
      if (connection.current || opening.current) return
      opening.current = true
      setStatus('connecting')
      setError(null)
      try {
        const conn = await openSerial(port, splitter.push)
        connection.current = conn
        setStatus('connected')
        conn.done.then(({ reason }) => {
          connection.current = null
          splitter.reset()
          setStatus('disconnected')
          if (reason === 'lost') setError('Arduino disconnected. Plug it back in or click Connect.')
        })
      } catch (e) {
        setStatus('disconnected')
        if (!quiet) setError(openErrorMessage(e))
      } finally {
        opening.current = false
      }
    },
    [splitter],
  )

  const connect = useCallback(async () => {
    const serial = getSerial()
    if (!serial) {
      setError(window.isSecureContext ? UNSUPPORTED : 'Web Serial needs the site to run on HTTPS or localhost.')
      return
    }
    if (connection.current || opening.current) return
    let port: SerialPort
    try {
      port = await serial.requestPort()
    } catch (e) {
      // NotFoundError: the user closed the picker without choosing a device.
      const cancelled = e instanceof DOMException && e.name === 'NotFoundError'
      setError(cancelled ? 'No device selected.' : 'Couldn’t access serial devices.')
      return
    }
    await openPort(port)
  }, [openPort])

  const disconnect = useCallback(async () => {
    await connection.current?.close()
  }, [])

  const subscribe = useCallback((listener: (input: TimerInput) => void) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  // Reconnect automatically to a port the user already granted: on load,
  // and when that Arduino is plugged back in.
  useEffect(() => {
    const serial = getSerial()
    if (!serial) return
    let active = true
    serial.getPorts().then((ports) => {
      if (active && ports.length > 0) openPort(ports[0], { quiet: true })
    })
    const onConnect = (event: Event) => {
      if (event.target) openPort(event.target as SerialPort)
    }
    serial.addEventListener('connect', onConnect)
    return () => {
      active = false
      serial.removeEventListener('connect', onConnect)
    }
  }, [openPort])

  // Release the port if the app unmounts.
  useEffect(() => () => void connection.current?.close(), [])

  const value = useMemo(
    () => ({ status, error, supported, connect, disconnect, subscribe }),
    [status, error, supported, connect, disconnect, subscribe],
  )
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext)
  if (!ctx) throw new Error('useDevice must be used inside <DeviceProvider>')
  return ctx
}
