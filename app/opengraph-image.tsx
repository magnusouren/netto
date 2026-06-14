import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Netto. Personlig økonomi og boligkjøp';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND_BLUE = '#1d2745';
const BRAND_ORANGE = '#e2a45f';
const BG = '#f4f6f8';
const MUTED = '#5b6478';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: BG,
                    padding: '72px 80px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 28,
                        fontWeight: 600,
                        color: BRAND_BLUE,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: BRAND_ORANGE,
                            color: BRAND_BLUE,
                            padding: '6px 14px',
                            borderRadius: 999,
                            fontSize: 22,
                            fontWeight: 600,
                        }}
                    >
                        Nettbasert økonomiverktøy
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            fontSize: 120,
                            fontWeight: 800,
                            letterSpacing: -3,
                            color: BRAND_BLUE,
                            lineHeight: 1,
                        }}
                    >
                        Netto<span style={{ color: BRAND_ORANGE }}>.</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 46,
                            fontWeight: 600,
                            color: BRAND_BLUE,
                            lineHeight: 1.15,
                            maxWidth: 880,
                            letterSpacing: -1,
                        }}
                    >
                        Full oversikt over din månedlige økonomi
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 26,
                            color: MUTED,
                            lineHeight: 1.35,
                            maxWidth: 880,
                        }}
                    >
                        Skatt, lån og boligkjøp samlet på ett sted. Bygget for norske forhold.
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 22,
                        color: MUTED,
                    }}
                >
                    <div style={{ display: 'flex' }}>netto.ouren.no</div>
                    <div style={{ display: 'flex', gap: 28 }}>
                        <span>Kontantstrøm</span>
                        <span style={{ color: BRAND_ORANGE }}>·</span>
                        <span>Boliglån</span>
                        <span style={{ color: BRAND_ORANGE }}>·</span>
                        <span>Skatt</span>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
