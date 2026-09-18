import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const startup = await db.startup.findUnique({
    where: { slug: params.slug },
    select: { name: true, tagline: true, logoUrl: true, category: { select: { name: true, iconName: true } } },
  });

  return new ImageResponse(
    (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          height: '100%', 
          background: 'linear-gradient(135deg, #FF6B35 0%, #FFC947 100%)', 
          color: 'white', 
          padding: '60px', 
          fontFamily: 'sans-serif',
          position: 'relative'
        }}
      >
        {startup?.logoUrl && (
          <div style={{ display: 'flex', marginBottom: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={startup.logoUrl} 
              alt="Logo" 
              width={100} 
              height={100} 
              style={{ borderRadius: '16px', border: '4px solid white', backgroundColor: 'white', objectFit: 'cover' }} 
            />
          </div>
        )}
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 24, textAlign: 'center', lineHeight: 1.1 }}>
          {startup?.name ?? 'Anshkosh'}
        </div>
        <div style={{ fontSize: 32, opacity: 0.9, textAlign: 'center', maxWidth: 900, color: '#fef3c7' }}>
          {startup?.tagline ?? 'India\'s Startup Showcase'}
        </div>
        
        {startup?.category && (
          <div style={{ 
            position: 'absolute', 
            bottom: 60, 
            left: 60, 
            fontSize: 24, 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '12px 24px', 
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{startup.category.iconName}</span>
            <span>{startup.category.name}</span>
          </div>
        )}
        
        <div style={{ position: 'absolute', bottom: 60, right: 60, fontSize: 24, opacity: 0.8, fontWeight: 'bold' }}>
          anshkosh.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
