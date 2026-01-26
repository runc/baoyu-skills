export const Cursor: React.FC = () => {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 18,
        height: 44,
        backgroundColor: '#000000',
        marginLeft: 2,
        animation: 'blink 1s step-end infinite',
      }}
    />
  );
};
