import { useEffect, useState, useRef } from 'react'
import styles from '../styles/Toast.module.css'
import { X } from 'lucide-react'
export const Toast = ({ message, type, handleClose }) => {
    const [leaving, setLeaving] = useState(false)
    const leaveRef = useRef(null)
    const closeRef = useRef(null)
    
    const startTimer = () => {
        leaveRef.current = setTimeout(() => setLeaving(true), 3500)
        closeRef.current = setTimeout(()=> handleClose(), 4000)
    }

    const clearTimer = () => {
        clearTimeout(leaveRef.current)
        clearTimeout(closeRef.current)
    }

    useEffect(() => {
        startTimer()

        return () => {
            clearTimer()
        }
    }, [])

    return (
        <div className={`${styles.notificationContainer} ${styles[type]} ${leaving ? styles.leaving : styles.entering}`} onMouseEnter={clearTimer} onMouseLeave={startTimer}>
            <div className={styles.notificationMessage}>{message}</div>
            <button type='button' className={styles.closeBtn} onClick={handleClose}><X /></button>
        </div>
    )
}