import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Danesh - Learning Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
  const isRTL = params.locale === 'fa';
  const title = 'Danesh';
  const subtitle = isRTL ? 'Online Learning Platform' : 'Online Learning Platform - Learn Without Limits';

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white' }}>{title}</div>
        </div>
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }}>{subtitle}</div>
      </div>
    ),
    { ...size }
  );
}
