import {AbsoluteFill} from 'remotion';
import {TerminalContent} from './TerminalContent';

export const Terminal: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 60,
      }}
    >
      <div
        style={{
          width: 900,
          height: 600,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 40,
            backgroundColor: '#e8e8e8',
            borderBottom: '1px solid #d0d0d0',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ff5f56',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ffbd2e',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#27c93f',
            }}
          />
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 500,
              color: '#4a4a4a',
              marginRight: 50,
            }}
          >
            Terminal
          </div>
        </div>
        <TerminalContent />
      </div>
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </AbsoluteFill>
  );
};
