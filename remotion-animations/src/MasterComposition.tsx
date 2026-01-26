import {AbsoluteFill, Sequence} from 'remotion';
import {Terminal} from './Terminal';

export const MasterComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#e5e5e5',
      }}
    >
      <Sequence from={0}>
        <Terminal />
      </Sequence>
    </AbsoluteFill>
  );
};
