export default function AuthShell({ heading, subheading, children, footer }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1>{heading}</h1>
          {subheading && <p>{subheading}</p>}
        </header>
        {children}
        {footer && <footer className="auth-card__footer">{footer}</footer>}
      </div>
    </div>
  );
}
