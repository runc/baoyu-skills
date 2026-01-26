import {Composition} from 'remotion';
import {MasterComposition} from './MasterComposition';
import {Terminal} from './Terminal';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Master"
        component={MasterComposition}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={700}
      />
      <Composition
        id="Terminal"
        component={Terminal}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={700}
      />
    </>
  );
};
