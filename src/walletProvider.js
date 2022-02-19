{Object.keys(connectorsByName).map((name) => {
  const currentConnector = connectorsByName[name];
  const activating = currentConnector === activatingConnector;
  const connected = currentConnector === connector;
  const disabled =
    !triedEager || !!activatingConnector || connected || !!error;

  return (
    <button
      style={{
        height: '3rem',
        borderRadius: '1rem',
        borderColor: activating
          ? 'orange'
          : connected
          ? 'green'
          : 'unset',
        cursor: disabled ? 'unset' : 'pointer',
        position: 'relative',
      }}
      disabled={disabled}
      key={name}
      onClick={() => {
        setActivatingConnector(currentConnector);
        activate(connectorsByName[name]);
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          color: 'black',
          margin: '0 0 0 1rem',
        }}
      >
        {activating && (
          <Spinner
            color={'black'}
            style={{ height: '25%', marginLeft: '-1rem' }}
          />
        )}
        {connected && (
          <span role="img" aria-label="check">
            ✅
          </span>
        )}
      </div>
      {name}
    </button>
  );
})}
</div>