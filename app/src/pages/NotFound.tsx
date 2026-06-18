import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: 'clamp(6rem, 15vw, 10rem)',
        fontWeight: 800,
        lineHeight: 1,
        margin: 0,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        404
      </h1>

      <p style={{
        fontSize: '1.25rem',
        color: '#94a3b8',
        marginTop: '1rem',
        marginBottom: '0.5rem',
      }}>
        Página não encontrada
      </p>

      <p style={{
        fontSize: '0.875rem',
        color: '#64748b',
        maxWidth: '24rem',
        marginBottom: '2rem',
      }}>
        O endereço que você acessou não existe ou foi movido.
      </p>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f172a',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Voltar ao início
      </button>
    </div>
  );
}
