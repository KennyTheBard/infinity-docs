export function Alert(alert: {message: string}) {
    return (
        <div className="alert">
            <div className="alert-ribbon"></div>
            <p className="alert-message">{alert.message}</p>
        </div>
    )
}
