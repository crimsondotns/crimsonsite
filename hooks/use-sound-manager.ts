"use client"

import { useState, useEffect, useRef } from "react"

interface SoundFile {
  id: string
  name: string
  url: string
  isDefault: boolean
  type?: string
}

export function useSoundManager() {
  const [soundFiles, setSoundFiles] = useState<SoundFile[]>([])
  const [currentVolume, setCurrentVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    loadSoundFiles()
    loadVolume()

    // Initialize AudioContext on user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    }

    document.addEventListener("click", initAudioContext, { once: true })
    document.addEventListener("touchstart", initAudioContext, { once: true })

    return () => {
      document.removeEventListener("click", initAudioContext)
      document.removeEventListener("touchstart", initAudioContext)
    }
  }, [])

  const loadSoundFiles = () => {
    // Only load default sounds, don't try to load custom sounds from localStorage
    const defaultSounds: SoundFile[] = [
      { id: "default-beep", name: "Default Beep", url: "default", isDefault: true, type: "generated" },
      { id: "default-chime", name: "Chime", url: "chime", isDefault: true, type: "generated" },
      { id: "default-bell", name: "Bell", url: "bell", isDefault: true, type: "generated" },
    ]

    setSoundFiles(defaultSounds)
  }

  const loadVolume = () => {
    const savedVolume = localStorage.getItem("crypto-alert-volume")
    if (savedVolume) {
      setCurrentVolume(Number.parseFloat(savedVolume))
    }
  }

  const saveVolume = (volume: number) => {
    setCurrentVolume(volume)
    localStorage.setItem("crypto-alert-volume", volume.toString())
  }

  const uploadSoundFile = async (file: File): Promise<SoundFile> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("audio/")) {
        reject(new Error("Please select an audio file"))
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        // Reduced to 2MB limit
        reject(new Error("File size must be less than 2MB"))
        return
      }

      // Create object URL instead of data URL for better performance
      const url = URL.createObjectURL(file)
      const newSound: SoundFile = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        url,
        isDefault: false,
        type: file.type,
      }

      // Test if the audio file can be played
      const testAudio = new Audio(url)
      testAudio.addEventListener(
        "canplaythrough",
        () => {
          const updatedSounds = [...soundFiles, newSound]
          setSoundFiles(updatedSounds)
          resolve(newSound)
        },
        { once: true },
      )

      testAudio.addEventListener(
        "error",
        () => {
          URL.revokeObjectURL(url)
          reject(new Error("Unsupported audio format"))
        },
        { once: true },
      )

      testAudio.load()
    })
  }

  const deleteSoundFile = (soundId: string) => {
    const soundToDelete = soundFiles.find((s) => s.id === soundId)
    if (soundToDelete && !soundToDelete.isDefault && soundToDelete.url.startsWith("blob:")) {
      URL.revokeObjectURL(soundToDelete.url)
    }

    const updatedSounds = soundFiles.filter((s) => s.id !== soundId || s.isDefault)
    setSoundFiles(updatedSounds)
  }

  const playSound = async (soundUrl: string, volume: number = currentVolume) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      if (soundUrl === "default") {
        await playDefaultBeep(volume)
      } else if (soundUrl === "chime") {
        await playChime(volume)
      } else if (soundUrl === "bell") {
        await playBell(volume)
      } else {
        // Custom uploaded sound
        await playCustomSound(soundUrl, volume)
      }
    } catch (error) {
      console.error("Error playing sound:", error)
      // Fallback to default beep if custom sound fails
      if (soundUrl !== "default") {
        await playDefaultBeep(volume)
      }
    }
  }

  const playCustomSound = async (soundUrl: string, volume: number) => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(soundUrl)
      audio.volume = Math.max(0, Math.min(1, volume))

      const onCanPlay = () => {
        audio.removeEventListener("canplaythrough", onCanPlay)
        audio.removeEventListener("error", onError)

        audio
          .play()
          .then(() => {
            audioRef.current = audio
            resolve()
          })
          .catch(reject)
      }

      const onError = (e: Event) => {
        audio.removeEventListener("canplaythrough", onCanPlay)
        audio.removeEventListener("error", onError)
        reject(new Error("Failed to load audio file"))
      }

      audio.addEventListener("canplaythrough", onCanPlay, { once: true })
      audio.addEventListener("error", onError, { once: true })

      // Set a timeout to prevent hanging
      setTimeout(() => {
        audio.removeEventListener("canplaythrough", onCanPlay)
        audio.removeEventListener("error", onError)
        reject(new Error("Audio loading timeout"))
      }, 5000)

      audio.load()
    })
  }

  const playDefaultBeep = async (volume: number) => {
    return new Promise<void>((resolve) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current

        // Resume context if suspended
        if (audioContext.state === "suspended") {
          audioContext.resume()
        }

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)

        setTimeout(resolve, 500)
      } catch (error) {
        console.error("Error playing default beep:", error)
        resolve()
      }
    })
  }

  const playChime = async (volume: number) => {
    return new Promise<void>((resolve) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current

        if (audioContext.state === "suspended") {
          audioContext.resume()
        }

        const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5

        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = freq
          oscillator.type = "sine"

          const startTime = audioContext.currentTime + index * 0.1
          gainNode.gain.setValueAtTime(volume * 0.2, startTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

          oscillator.start(startTime)
          oscillator.stop(startTime + 0.4)
        })

        setTimeout(resolve, 700)
      } catch (error) {
        console.error("Error playing chime:", error)
        resolve()
      }
    })
  }

  const playBell = async (volume: number) => {
    return new Promise<void>((resolve) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current

        if (audioContext.state === "suspended") {
          audioContext.resume()
        }

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 1000
        oscillator.type = "triangle"

        gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 1.0)

        setTimeout(resolve, 1000)
      } catch (error) {
        console.error("Error playing bell:", error)
        resolve()
      }
    })
  }

  return {
    soundFiles,
    currentVolume,
    uploadSoundFile,
    deleteSoundFile,
    playSound,
    saveVolume,
  }
}
