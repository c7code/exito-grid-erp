import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { SignaturePad } from '@/components/SignaturePad';
import {
  CheckCircle2, Loader2, AlertTriangle, FileSignature, Shield, Printer,
  Lock, ChevronDown, ChevronUp, Eye, PenTool, BadgeCheck,
} from 'lucide-react';

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
    const [signatureImage, setSignatureImage] = useState<string | null>(null);

    // UI state
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Review, 2=Sign, 3=Done
    const [docExpanded, setDocExpanded] = useState(true);

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
        if (!signerName.trim() || !signerDocument.trim() || !accepted || !signatureImage) return;

        try {
            setSigning(true);
            const result = await api.signProposalByToken(token!, {
                name: signerName,
                document: signerDocument,
                signatureImage,
            });
            setSigned(true);
            setVerificationCode(result.verificationCode);
            setStep(3);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Erro ao assinar proposta.');
        } finally {
            setSigning(false);
        }
    }

    function handlePrint() { window.print(); }

    // ═══ CSS variables ═══
    const accent = '#E8620A';
    const dark = '#0f172a';

    // ═══ Loading ═══
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${dark}, #1e293b)`,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '56px', height: '56px', margin: '0 auto 16px',
                        border: `3px solid ${accent}`, borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ color: '#94a3b8', fontSize: '15px' }}>Carregando documento...</p>
                </div>
            </div>
        );
    }

    // ═══ Error ═══
    if (error && !signed) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${dark}, #1e293b)`,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{
                    textAlign: 'center', background: '#fff', padding: '48px 40px',
                    borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    maxWidth: '440px', width: '90%',
                }}>
                    <AlertTriangle style={{ width: '52px', height: '52px', color: '#f59e0b', margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: dark }}>
                        Link Inválido ou Expirado
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{error}</p>
                    <div style={{
                        marginTop: '20px', padding: '12px', background: '#fef3c7',
                        borderRadius: '8px', fontSize: '12px', color: '#92400e',
                    }}>
                        Entre em contato com a empresa para solicitar um novo link de assinatura.
                    </div>
                </div>
            </div>
        );
    }

    // ═══ Signed Successfully — Step 3 ═══
    if (signed || step === 3) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, #064e3b, #065f46, #047857)`,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{
                    textAlign: 'center', background: '#fff', padding: '56px 44px',
                    borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                    maxWidth: '520px', width: '90%',
                }}>
                    {/* Animated checkmark */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 30px rgba(34,197,94,0.3)',
                    }}>
                        <CheckCircle2 style={{ width: '44px', height: '44px', color: '#fff' }} />
                    </div>

                    <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: '#16a34a' }}>
                        Documento Assinado!
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '28px' }}>
                        Sua assinatura digital foi registrada com sucesso.
                    </p>

                    {/* Signature proof card */}
                    <div style={{
                        background: '#f8fafc', borderRadius: '12px', padding: '20px',
                        textAlign: 'left', fontSize: '13px', border: '1px solid #e2e8f0',
                    }}>
                        <div style={{ fontWeight: 700, color: dark, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                            Comprovante de Assinatura
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <div><span style={{ color: '#94a3b8' }}>Proposta:</span> <strong>#{proposal?.proposalNumber}</strong></div>
                            <div><span style={{ color: '#94a3b8' }}>Assinado por:</span> <strong>{signerName}</strong></div>
                            <div><span style={{ color: '#94a3b8' }}>CPF/CNPJ:</span> <strong>{signerDocument}</strong></div>
                            <div><span style={{ color: '#94a3b8' }}>Data/Hora:</span> <strong>{new Date().toLocaleString('pt-BR')}</strong></div>
                        </div>

                        <div style={{
                            marginTop: '16px', padding: '14px', borderRadius: '8px',
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>CÓDIGO DE VERIFICAÇÃO</div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                    Guarde este código para futuras verificações
                                </div>
                            </div>
                            <span style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: '#fff', padding: '8px 16px', borderRadius: '8px',
                                fontWeight: 800, fontSize: '20px', letterSpacing: '4px',
                                fontFamily: 'monospace',
                            }}>
                                {verificationCode}
                            </span>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '20px', display: 'flex', gap: '6px',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#94a3b8', fontSize: '11px',
                    }}>
                        <Lock style={{ width: '12px', height: '12px' }} />
                        IP, data/hora e dados do navegador foram registrados para validade jurídica.
                    </div>
                </div>
            </div>
        );
    }

    // ═══ Main: Review & Sign Ceremony ═══
    const canSign = signerName.trim() && signerDocument.trim() && accepted && signatureImage;

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${dark} 0%, #1e293b 100%)`,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
            {/* ═══ HEADER ═══ */}
            <div className="no-print" style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '14px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `linear-gradient(135deg, ${accent}, #c2410c)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileSignature style={{ width: '18px', height: '18px', color: '#fff' }} />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                            EXITO GRID — Assinatura Digital
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                            Proposta #{proposal?.proposalNumber}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 10px', borderRadius: '6px',
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        <Lock style={{ width: '12px', height: '12px', color: '#22c55e' }} />
                        <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>Seguro</span>
                    </div>
                    <button
                        onClick={handlePrint}
                        style={{
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#94a3b8', padding: '6px 14px', borderRadius: '8px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px',
                        }}
                    >
                        <Printer style={{ width: '13px', height: '13px' }} /> Imprimir
                    </button>
                </div>
            </div>

            {/* ═══ STEPS INDICATOR ═══ */}
            <div className="no-print" style={{
                display: 'flex', justifyContent: 'center', padding: '20px 20px 0',
                gap: '8px',
            }}>
                {[
                    { n: 1, label: 'Revisar Documento', icon: Eye },
                    { n: 2, label: 'Assinar', icon: PenTool },
                    { n: 3, label: 'Confirmação', icon: BadgeCheck },
                ].map(({ n, label, icon: Icon }) => (
                    <div key={n} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: step >= n ? `${accent}20` : 'rgba(255,255,255,0.04)',
                        border: step >= n ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.3s ease',
                    }}>
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: step >= n ? accent : 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon style={{ width: '12px', height: '12px', color: step >= n ? '#fff' : '#475569' }} />
                        </div>
                        <span style={{
                            fontSize: '12px', fontWeight: step >= n ? 600 : 400,
                            color: step >= n ? '#fff' : '#475569',
                        }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ═══ DOCUMENT VIEWER ═══ */}
            <div style={{ maxWidth: '880px', margin: '20px auto', padding: '0 16px' }}>
                {/* Collapsible document header */}
                <button
                    className="no-print"
                    onClick={() => setDocExpanded(!docExpanded)}
                    style={{
                        width: '100%', padding: '14px 20px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: docExpanded ? '12px 12px 0 0' : '12px',
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '14px', fontWeight: 600,
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye style={{ width: '16px', height: '16px', color: accent }} />
                        Documento: {proposal?.title || `Proposta #${proposal?.proposalNumber}`}
                    </span>
                    {docExpanded
                        ? <ChevronUp style={{ width: '18px', height: '18px', color: '#64748b' }} />
                        : <ChevronDown style={{ width: '18px', height: '18px', color: '#64748b' }} />
                    }
                </button>

                {docExpanded && (
                    <div style={{
                        background: '#fff',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                        borderRadius: '0 0 12px 12px',
                        overflow: 'hidden',
                    }}>
                        <ProposalPDFTemplate proposal={proposal} client={proposal?.client} />
                    </div>
                )}
            </div>

            {/* ═══ SIGNATURE FORM — Step 2 ═══ */}
            <div className="no-print" style={{
                maxWidth: '600px', margin: '24px auto 50px', padding: '0 16px',
            }}>
                <div style={{
                    background: '#fff', borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                }}>
                    {/* Form header */}
                    <div style={{
                        background: `linear-gradient(135deg, ${dark}, #1e293b)`,
                        padding: '28px 28px 20px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: `linear-gradient(135deg, ${accent}, #c2410c)`,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '12px',
                            boxShadow: `0 8px 20px ${accent}40`,
                        }}>
                            <PenTool style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                            Assinar Documento
                        </h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                            Preencha seus dados e desenhe sua assinatura para confirmar o aceite.
                        </p>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* Name */}
                        <div>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                marginBottom: '6px', color: dark,
                            }}>
                                Nome Completo / Razão Social *
                            </label>
                            <input
                                type="text" value={signerName}
                                onChange={e => setSignerName(e.target.value)}
                                placeholder="Informe o nome completo ou razão social"
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    border: '2px solid #e2e8f0', borderRadius: '10px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = accent}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Document */}
                        <div>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                marginBottom: '6px', color: dark,
                            }}>
                                CPF / CNPJ *
                            </label>
                            <input
                                type="text" value={signerDocument}
                                onChange={e => setSignerDocument(e.target.value)}
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    border: '2px solid #e2e8f0', borderRadius: '10px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = accent}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Signature Pad */}
                        <div>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                marginBottom: '6px', color: dark,
                            }}>
                                Sua Assinatura *
                            </label>
                            <SignaturePad
                                onSignatureCapture={(base64) => { setSignatureImage(base64); setStep(2); }}
                                onSignatureClear={() => setSignatureImage(null)}
                                signerName={signerName}
                                accentColor={accent}
                            />
                            {signatureImage && (
                                <div style={{
                                    marginTop: '8px', padding: '8px 12px',
                                    background: '#f0fdf4', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '12px', color: '#16a34a', fontWeight: 500,
                                    border: '1px solid #bbf7d0',
                                }}>
                                    <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                                    Assinatura capturada com sucesso
                                </div>
                            )}
                        </div>

                        {/* Terms acceptance */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                            padding: '14px 16px', background: '#fffbeb',
                            borderRadius: '10px', border: '1px solid #fde68a',
                        }}>
                            <input
                                type="checkbox" checked={accepted}
                                onChange={e => setAccepted(e.target.checked)}
                                style={{
                                    marginTop: '2px', cursor: 'pointer',
                                    width: '18px', height: '18px',
                                    accentColor: accent,
                                }}
                            />
                            <span style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
                                Declaro que li e aceito todos os termos desta proposta comercial.
                                Confirmo que possuo autoridade legal para assinar em nome da
                                empresa/pessoa acima identificada. Estou ciente de que esta
                                assinatura eletrônica possui validade jurídica conforme Lei 14.063/2020.
                            </span>
                        </div>

                        {/* Sign button */}
                        <button
                            onClick={handleSign}
                            disabled={!canSign || signing}
                            style={{
                                width: '100%', padding: '16px',
                                background: canSign && !signing
                                    ? `linear-gradient(135deg, ${accent}, #c2410c)`
                                    : '#e2e8f0',
                                color: canSign && !signing ? '#fff' : '#94a3b8',
                                border: 'none', borderRadius: '12px',
                                fontSize: '16px', fontWeight: 700,
                                cursor: canSign && !signing ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: canSign && !signing ? `0 8px 24px ${accent}40` : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {signing ? (
                                <>
                                    <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                                    Processando assinatura...
                                </>
                            ) : (
                                <>
                                    <FileSignature style={{ width: '20px', height: '20px' }} />
                                    Assinar e Aceitar Proposta
                                </>
                            )}
                        </button>

                        {/* Legal notice */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '6px', color: '#94a3b8', fontSize: '10px', textAlign: 'center',
                        }}>
                            <Lock style={{ width: '11px', height: '11px' }} />
                            Ao assinar, seu IP, data/hora e navegador serão registrados
                            para autenticidade e validade jurídica do aceite eletrônico.
                        </div>
                    </div>
                </div>
            </div>

            {/* Print + Animation styles */}
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
