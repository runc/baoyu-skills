import {useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Cursor} from './Cursor';

export const TerminalContent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const command = 'npx skills add remotion-dev/skills';

  // Start typing after 0.5 seconds, type at ~10 characters per second
  const startFrame = fps * 0.5;
  const charsPerSecond = 10;
  const framesPerChar = fps / charsPerSecond;

  const charsToShow = Math.floor(
    interpolate(frame, [startFrame, startFrame + command.length * framesPerChar], [0, command.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const displayedText = command.substring(0, charsToShow);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: 40,
        lineHeight: 1.6,
        color: '#000000',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center'}}>
        <span style={{color: '#0066cc', fontWeight: 600}}>user@macbook</span>
        <span style={{color: '#666666', margin: '0 8px'}}>:</span>
        <span style={{color: '#0066cc', fontWeight: 600}}>~</span>
        <span style={{color: '#666666', margin: '0 8px'}}>$</span>
        <span style={{marginLeft: 8}}>{displayedText}</span>
        <Cursor />
      </div>
    </div>
  );
};
