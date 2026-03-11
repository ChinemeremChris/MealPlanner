import '../styles/LoadingScreen.css'
export const LoadingScreen = ({ leaving }) => {
    return (
        <>
            <div className={`pr-overlay${leaving ? ' leaving' : ''}`}>
            <div className="pr-dots">
                <div className="pr-dot" />
                <div className="pr-dot" />
                <div className="pr-dot" />
            </div>
            <div className="pr-wordmark">preparing your kitchen…</div>
            <div className="pr-bar-track">
                <div className="pr-bar-fill" />
            </div>
            </div>
        </>
    )
}