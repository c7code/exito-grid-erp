import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { CheckCircle2, Loader2, AlertTriangle, FileSignature, Shield, Printer } from 'lucide-react';

export default function ProposalSignature() {
    const { token } = useParams<{ token: string }>();
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [signed, setSigned] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [signing, setSigning] = useState(false);

    // Form fields
    const [signerName, setSignerName] = useState('');
    const [signerDocument, setSignerDocument] = useState('');
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (!token) return;
        loadProposal();
    }, [token]);

    async function loadProposal() {
        try {
            setLoading(true);
            const data = await api.getProposalByToken(token!);
            setProposal(data);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Proposta não encontrada ou link expirado.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSign() {
        if (!signerName.trim()) return;
        if (!signerDocument.trim()) return;
        if (!accepted) return;

        try {
            setSigning(true);
            const result = await api.signProposalByToken(token!, {
                name: signerName,
                document: signerDocument,
            });
            setSigned(true);
            setVerificationCode(result.verificationCode);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Erro ao assinar proposta.');
        } finally {
            setSigning(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    // ═══ Loading ═══
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                fontFamily: "'Segoe UI', sans-serif",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', color: '#E8620A' }} />
                    <p style={{ marginTop: '12px', color: '#666' }}>Carregando proposta...</p>
                </div>
            </div>
        );
    }

    // ═══ Error ═══
    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                fontFamily: "'Segoe UI', sans-serif",
            }}>
                <div style={{
                    textAlign: 'center',
                    background: '#fff',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    maxWidth: '400px',
                }}>
                    <AlertTriangle style={{ width: '48px', height: '48px', color: '#f59e0b', margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Link Inválido</h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>{error}</p>
                </div>
            </div>
        );
    }

    // ═══ Signed Successfully ═══
    if (signed) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                fontFamily: "'Segoe UI', sans-serif",
            }}>
                <div style={{
                    textAlign: 'center',
                    background: '#fff',
                    padding: '50px 40px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    maxWidth: '500px',
                    border: '2px solid #22c55e',
                }}>
                    <CheckCircle2 style={{ width: '64px', height: '64px', color: '#22c55e', margin: '0 auto 20px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#16a34a' }}>
                        Proposta Assinada!
                    </h2>
                    <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>
                        Sua assinatura foi registrada com sucesso.
                    </p>
                    <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        fontSize: '13px',
                    }}>
                        <p><strong>Proposta:</strong> #{proposal?.proposalNumber}</p>
                        <p><strong>Assinado por:</strong> {signerName}</p>
                        <p><strong>CPF/CNPJ:</strong> {signerDocument}</p>
                        <p><strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}</p>
                        <p style={{ marginTop: '12px', fontSize: '14px' }}>
                            <strong>Código de Verificação:</strong>
                            <span style={{
                                display: 'inline-block',
                                background: '#22c55e',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '18px',
                                letterSpacing: '3px',
                                marginLeft: '8px',
                            }}>
                                {verificationCode}
                            </span>
                        </p>
                    </div>
                    <p style={{ marginTop: '16px', fontSize: '11px', color: '#999' }}>
                        Guarde este código para verificação futura. IP e dados do navegador foram registrados.
                    </p>
                </div>
            </div>
        );
    }

    // ═══ Main: View Proposal + Sign ═══
    return (
        <div style={{
            minHeight: '100vh',
            background: '#e5e5e5',
            fontFamily: "'Segoe UI', sans-serif",
        }}>
            {/* Top bar */}
            <div className="no-print" style={{
                background: '#2d2d2d',
                color: '#fff',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSignature style={{ width: '20px', height: '20px', color: '#E8620A' }} />
                    <span style={{ fontWeight: 700 }}>Proposta Comercial #{proposal?.proposalNumber}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            background: 'transparent',
                            border: '1px solid #555',
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                        }}
                    >
                        <Printer style={{ width: '14px', height: '14px' }} /> Imprimir
                    </button>
                </div>
            </div>

            {/* Proposal Document */}
            <div style={{ maxWidth: '880px', margin: '20px auto', background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.1)' }}>
                <ProposalPDFTemplate proposal={proposal} client={proposal?.client} />
            </div>

            {/* Signature Form */}
            <div className="no-print" style={{
                maxWidth: '600px',
                margin: '20px auto 40px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                padding: '32px',
                border: '2px solid #E8620A',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Shield style={{ width: '32px', height: '32px', color: '#E8620A', margin: '0 auto 10px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
                        Assinar Proposta
                    </h2>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        Preencha seus dados para confirmar o aceite desta proposta comercial.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#333' }}>
                            Nome Completo / Razão Social *
                        </label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={e => setSignerName(e.target.value)}
                            placeholder="Informe o nome completo ou razão social"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#333' }}>
                            CPF / CNPJ *
                        </label>
                        <input
                            type="text"
                            value={signerDocument}
                            onChange={e => setSignerDocument(e.target.value)}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        border: '1px solid #fde68a',
                    }}>
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={e => setAccepted(e.target.checked)}
                            style={{ marginTop: '3px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                            Declaro que li e aceito todos os termos desta proposta comercial.
                            Confirmo que possuo autoridade para assinar em nome da empresa/pessoa
                            acima identificada.
                        </span>
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={signing || !signerName.trim() || !signerDocument.trim() || !accepted}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: (!signerName.trim() || !signerDocument.trim() || !accepted || signing) ? '#ccc' : '#E8620A',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: (!signerName.trim() || !signerDocument.trim() || !accepted || signing) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                        }}
                    >
                        {signing ? (
                            <>
                                <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                                Assinando...
                            </>
                        ) : (
                            <>
                                <FileSignature style={{ width: '18px', height: '18px' }} />
                                Assinar e Aceitar Proposta
                            </>
                        )}
                    </button>

                    <p style={{ fontSize: '10px', color: '#999', textAlign: 'center', lineHeight: '1.5' }}>
                        Ao assinar, seu IP, data/hora e dados do navegador serão registrados
                        para fins de autenticidade e validade jurídica do aceite eletrônico.
                    </p>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; }
                    @page { margin: 15mm; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
